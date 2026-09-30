---
name: blog-to-hygraph
description: >
  Sube un post validado y fact-checkeado del blog a Hygraph como DRAFT: resuelve IDs, crea el Asset de la cover
  (upload presignado a S3), arma el payload con build-payload, dry_run → escritura real con el mismo payload y
  roundtrip por hash. Nunca publica. Trigger: último paso de /blog-post, o cuando se pide "subir / cargar el post a Hygraph".
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Constantes

- Tool: `mcp__claude_ai_Hygraph_MCP__execute_graphql` con `project: "cmtyo12sl01cp07w0ym4p6a5a"`, `environment: "master"` en CADA llamada.
- Payload: `content-pipeline/out/<slug>.json` (`mutation`, `variables`, `hash`, `contentHash`, `faqCount`), lo genera `scripts/blog/build-payload.ts`.
- Cover: el archivo local `content-pipeline/images/<slug>-cover.webp` (1200×630) aprobado en el GATE 3. No hace falta URL pública.

## Prohibido (sin excepción)

- `publish_entry`, `publishPost`, `publishAsset` o cualquier mutation `publish*`. Publica el humano, en Hygraph.
- `update_entry`/`update*` sobre posts existentes, `delete*`, `create_entry` (usamos `execute_graphql` para paridad dry_run/real).
- Sobrescribir un slug existente. Varias mutations o aliases en una misma llamada (Hygraph devuelve 429
  "concurrent operations limit exceeded"): **una mutation por llamada, de a una**.
- Editar el JSON de `out/` a mano. Si algo está mal, se corrige el draft y se regenera.

## Flujo

**A. Lecturas (sin escribir nada)**

1. Precondiciones: plan.yaml `status: images-ready`, sin `blockedBy`; `npm run blog:validate -- content-pipeline/drafts/<slug>.md` en exit 0;
   existe `content-pipeline/images/<slug>-cover.webp` y hay `cover.alt`.
2. Slug duplicado + relaciones, en UNA query:
   ```graphql
   query Pre($slug: String!, $cat: String!, $tags: [String!]) {
     posts(where: {slug: $slug}, stage: DRAFT) { id stage }
     categories(where: {slug: $cat}, stage: DRAFT) { id slug }
     tags(where: {slug_in: $tags}, stage: DRAFT) { id slug }
   }
   ```
   - `posts` no vacío → **STOP** (slug duplicado, informá el id).
   - Categoría ausente o tags con menos resultados que el frontmatter → STOP e informá cuáles faltan (los crea el humano).
   - **Hygraph devuelve los tags en otro orden**: armá `tagIds` en el orden de `tags` del frontmatter.
     Los IDs de engram (`sdd/blog-content-pipeline/decisions-2`) son solo referencia: manda la query.
3. Dry run del Asset (valida input y selección; no persiste nada ni devuelve datos de upload útiles):
   ```graphql
   mutation CreateAsset($data: AssetCreateInput!) {
     createAsset(data: $data) {
       id altText
       upload {
         status expiresAt
         requestPostData { url date key signature algorithm policy credential securityToken }
         error { code message }
       }
     }
   }
   ```
   `variables: {data: {fileName: "<slug>-cover.webp", altText: "<cover.alt>"}}` (sin `uploadUrl`), `dry_run: true`.
   `altText` vacío → STOP (P7).

**B. 🛑 GATE 4** — Mostrá: slug libre, categoryId, tagIds (en orden), archivo de la cover (dimensiones/peso), altText,
resultado del dry run del Asset, y que el Post va a quedar en DRAFT. STOP. Sin un "sí" explícito no se escribe NADA en Hygraph.

**C. Escritura (después del sí)**

4. `createAsset` real con la misma mutation y variables. Guardá `id` y `upload.requestPostData`.
5. **Upload presignado, ENSEGUIDA** (los datos vencen en `upload.expiresAt`; si vencieron, el Asset queda huérfano → reportalo):
   ```bash
   curl -sS -o /dev/null -w "%{http_code}\n" -X POST "<requestPostData.url>" \
     -F "X-Amz-Date=<date>" -F "key=<key>" -F "X-Amz-Signature=<signature>" \
     -F "X-Amz-Algorithm=<algorithm>" -F "policy=<policy>" -F "X-Amz-Credential=<credential>" \
     -F "X-Amz-Security-Token=<securityToken>" \
     -F "file=@content-pipeline/images/<slug>-cover.webp"
   ```
   - Los campos van con esos nombres exactos y `file` **último** (S3 ignora lo que venga después del archivo).
   - Esperado: `204`. Otro código → STOP sin crear el Post; mostrá el body de S3 (sacá `-o /dev/null`) y reportá el Asset huérfano.
6. Poll: `query A($id: ID!) { asset(where: {id: $id}, stage: DRAFT) { id url width height altText upload { status error { code message } } } }`
   hasta `upload.status = ASSET_UPLOAD_COMPLETE` (máx. ~10 consultas espaciadas). `upload.error` o timeout → STOP
   sin crear el Post (`coverImage` es requerido) y reportá el Asset huérfano para que el humano lo borre.
7. Escribí `cover.assetId: <id>` en el frontmatter del draft y generá el payload:
   ```bash
   npm run blog:payload -- content-pipeline/drafts/<slug>.md --category-id <categoryId> --tag-ids <id1,id2,...>
   ```
   Exit ≠ 0 → STOP con los errores. Anotá `hash`, `contentHash` y `faq` que imprime.
8. `execute_graphql` con `query = out.mutation`, `variables = out.variables`, `dry_run: true`. Error → STOP y mostrá el error GraphQL.
9. La MISMA llamada (mismo `query` y `variables`, leídos del mismo archivo) con `dry_run: false`. Si falla, un único
   reintento solo si el error es transitorio (429/5xx) y después de verificar con la query del paso 2 que el slug sigue libre.
   Confirmá `stage: "DRAFT"` en la respuesta y guardá el `id`.
10. **Roundtrip**:
    - Con `HYGRAPH_TOKEN` (Permanent Auth Token con lectura en DRAFT) y `HYGRAPH_ENDPOINT` en `.env`/`.env.local`:
      ```bash
      npm run blog:roundtrip -- <slug> --id <postId>
      ```
      Lee `post(where:{id}, stage: DRAFT){ content { raw } }` por la Content API, guarda `out/<slug>.roundtrip.json`
      y compara el sha256 con `contentHash`. Exit 0 = coinciden · 1 = difieren (o error de la API) · 2 = falta token/uso.
    - Exit 2 (sin token): fallback = comparación visual del `content.raw` que devolvió el createPost contra el payload
      (headings, párrafos, listas, tablas, FAQ). Reportalo explícitamente como **"roundtrip no automatizado"**.
    - Difieren → avisá con el diff relevante y dejá el DRAFT sin tocar (no se "arregla" con update).
11. plan.yaml: `status: hygraph-draft`, `hygraphId: <post id>` (solo esos campos).

## Reporte final

Post id + stage DRAFT, asset id (+ código del upload y status final), hashes (payload/contentHash/roundtrip o
"roundtrip no automatizado"), faqCount, warnings de validate. Recordale al humano: previsualizar (1 `<h1>`, FAQPage
en el validator de schema.org, author Organization, LCP), y **publicar él** el Asset y el Post en Hygraph.
