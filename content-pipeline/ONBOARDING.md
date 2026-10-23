# Onboarding: crear posts del blog con Claude Code

Guía para sumar a alguien que no es developer al pipeline editorial del blog. Tiene dos partes:

- **Parte A — Instalación**: la hace Ramiro en la compu del co-founder, una sola vez.
- **Parte B — Uso diario**: para el co-founder.

## Qué es esto (y qué NO hace)

El pipeline toma un post de `content-pipeline/plan.yaml` y, con Claude Code, lo lleva hasta un **DRAFT en Hygraph**:
brief → draft → validación + fact-check → cover → carga en Hygraph. En el camino frena en **4 gates** donde un humano
aprueba antes de seguir.

- **Hace**: brief (`briefs/<slug>.yaml`), draft (`drafts/<slug>.md`), validación automática, fact-check contra la fuente
  de verdad, cover con Nano Banana y la carga del Asset + Post en Hygraph **como DRAFT**.
- **NO hace**: nunca publica. Publicar es un click manual en Hygraph. Tampoco commitea si no se lo pedís.
- **NO inventa**: todo dato del post sale de la fuente de verdad (`autolibre-fuente-verdad-documental-amba.md`); lo que
  ahí está como ⚠️/🔍 no se afirma como hecho.

Las reglas completas viven en las skills (`.claude/skills/blog-*/SKILL.md`) y en `content-pipeline/style.md`. Esta guía
no las reemplaza: si algo de acá no coincide con una skill, manda la skill.

---

## Parte A — Instalación (la hace Ramiro en la compu del co-founder)

> **Regla de identidades**: todo se configura con las cuentas **del co-founder**, nunca con las de Ramiro. Git/GitHub,
> claude.ai, Hygraph y el token de Hygraph son suyos. Así cada cambio queda a su nombre y se le puede revocar el
> acceso sin tocar el de nadie más.

### A1. Antes de sentarse (cuentas y accesos)

- [ ] **GitHub**: el co-founder tiene usuario y está invitado a `AutolibreAI/autolibre-landing-page` con permiso de push a `development`.
- [ ] **claude.ai**: tiene cuenta con un plan que incluya Claude Code.
- [ ] **Hygraph**: está invitado como miembro del proyecto `cmtyo12sl01cp07w0ym4p6a5a` (environment `master`) con un rol
      que pueda **crear y actualizar Posts y Assets** y leer Categories y Tags. **No hace falta permiso de publicar**:
      si se lo das, que sea a propósito (ver B6).
- [ ] **Token de Hygraph propio** (opcional pero recomendado): un Permanent Auth Token **de solo lectura con stage DRAFT**,
      generado para él (no reutilizar el de Ramiro). Sin token el pipeline funciona igual, pero el roundtrip queda
      "no automatizado" (se compara a mano).
- [ ] **Key de Nano Banana** (`NANOBANANA_API_KEY`, API de Gemini; es gasto pago). Se pasa por gestor de contraseñas, **nunca por chat**.

### A2. Programas

| Programa | Versión | Nota |
|---|---|---|
| Git | cualquiera reciente | En Windows instalá **Git for Windows**: Claude Code lo usa para correr comandos (Git Bash). |
| Node.js | **22.18 o superior** (recomendado 24 LTS) | Los scripts del blog corren `.ts` directo con Node; versiones viejas fallan. `package.json` no fija `engines`. |
| Claude Code | última | Login con la cuenta de claude.ai **del co-founder** (`claude` → `/login`). |

Verificá: `git --version`, `node -v`, `claude --version`.

Configurá git con su identidad (no la de Ramiro):

```bash
git config --global user.name "Nombre Apellido"
git config --global user.email "su-mail@ejemplo.com"
```

### A3. Repo y dependencias

```bash
git clone https://github.com/AutolibreAI/autolibre-landing-page.git
cd autolibre-landing-page
git checkout development
npm install
```

El clone/push tiene que autenticarse con **su** GitHub (Git Credential Manager en Windows, Keychain o `gh auth login` en Mac).

### A4. La fuente de verdad (va AFUERA del repo)

El pipeline lee `autolibre-fuente-verdad-documental-amba.md` desde la carpeta **padre** del repo (no está versionado):

```
<carpeta>/
├── autolibre-fuente-verdad-documental-amba.md   ← copia de Ramiro
└── autolibre-landing-page/                       ← el repo
```

Copiá el archivo ahí. Si cambia la fuente, hay que volver a pasarle la versión nueva (ver "Riesgos" al final).

> `BLOG_SOURCE_OF_TRUTH` existe como alternativa, pero `blog:validate` **no** la lee del `.env`: solo funciona exportada
> en la terminal. Con el archivo en la carpeta padre no hace falta.

### A5. Variables de entorno (`.env.local`)

Mac / Linux:

```bash
cp .env.example .env.local
```

Windows (PowerShell):

```powershell
Copy-Item .env.example .env.local
```

Completá solo lo que usa el pipeline (el resto puede quedar vacío; el co-founder no corre el sitio):

| Variable | Para qué | Obligatoria |
|---|---|---|
| `NANOBANANA_API_KEY` | Generar covers (`npm run blog:image`) | Sí |
| `HYGRAPH_ENDPOINT` | Roundtrip (`npm run blog:roundtrip`) | Solo con token |
| `HYGRAPH_TOKEN` | Roundtrip: token propio, lectura DRAFT | No (recomendado) |

`NANOBANANA_MODEL` dejala comentada: si queda declarada vacía, pisa el modelo por defecto.
`.env.local` está en `.gitignore`: nunca se commitea.

### A6. Conector de Hygraph en claude.ai

1. En claude.ai, con la cuenta del co-founder: **Settings → Connectors** → agregá/habilitá **Hygraph MCP**.
2. Autorizalo con **su usuario de Hygraph** (el invitado en A1), no con el de Ramiro.
3. El nombre del conector tiene que ser exactamente **Hygraph MCP**: las skills y el allowlist usan la tool
   `mcp__claude_ai_Hygraph_MCP__execute_graphql`. Con otro nombre (ej. "Hygraph MCP 2") la tool cambia y el pipeline no la encuentra.
4. En Claude Code, `/mcp` tiene que mostrar el conector conectado.

### A7. Smoke test (con el co-founder al lado)

Abrí Claude Code en la carpeta del repo (`claude`) y verificá:

1. **Skills**: escribí `/blog-` y confirmá que aparecen `blog-post`, `blog-brief`, `blog-draft`, `blog-validate`,
   `blog-images` y `blog-to-hygraph`.
2. **Validador**: en la terminal,
   ```bash
   npm run blog:validate -- content-pipeline/drafts/papeles-para-circular-amba.md
   ```
   Esperado: `0 error(es)` (los warnings `src-mixed` son normales). Exit 2 = no encuentra la fuente de verdad (volvé a A4).
3. **Hygraph (solo lectura)**: pedile a Claude:
   > Con el Hygraph MCP (project `cmtyo12sl01cp07w0ym4p6a5a`, environment `master`), listame los últimos 5 posts en stage DRAFT con id, slug y título. Solo lectura.

   Tiene que devolver posts reales. Si da error de permisos, revisá el rol en Hygraph (A1) o la autorización del conector (A6).
4. **Nano Banana** (no gasta imágenes):
   ```bash
   npm run blog:image -- --list-models
   ```
   Tiene que listar modelos. "Falta NANOBANANA_API_KEY" → revisá `.env.local`.
5. **Git**: `git pull` en `development` funciona con sus credenciales.

### A8. Permisos de Claude Code ya configurados

`.claude/settings.json` (versionado) deja correr sin preguntar: `npm run blog:*`, la tool `execute_graphql` de
Hygraph, editar archivos dentro de `content-pipeline/` y leer la fuente de verdad. Bloquea `publish_entry`.
Igual van a aparecer prompts en dos pasos, y está bien que aparezcan:

- El `curl` del upload de la cover a S3 (GATE 4): sube un archivo local a una URL; se aprueba a mano.
- El `node -e "require('sharp')…"` que recorta la cover a 1200×630.

---

## Parte B — Uso diario (para el co-founder)

### B1. Arrancar

```bash
cd autolibre-landing-page
git checkout development
git pull
claude
```

Siempre `git pull` antes de empezar: `plan.yaml` lo tocan todos y así evitás conflictos.

### B2. Elegir el post

Abrí `content-pipeline/plan.yaml`. Cada post tiene `slug`, `status` y `blockedBy`.

- Elegí uno con `status: planned` y `blockedBy: null`.
- Si `blockedBy` tiene texto, el pipeline se niega a avanzar: el motivo es que falta confirmar algo en la fuente de verdad.
- Si un post quedó a medias, el pipeline retoma solo según su `status` (no rehace pasos aprobados).

### B3. Correr el pipeline

En Claude Code:

```
/blog-post <slug>
```

Por ejemplo `/blog-post patente-del-auto-pba-caba`. Claude va a frenar en cada gate y **terminar su turno**. Solo sigue
si respondés una aprobación explícita ("sí", "aprobado", "dale"). Si pedís cambios, los hace y vuelve a preguntar.

### B4. Qué revisar en cada gate

**🛑 GATE 1 — Brief** (`content-pipeline/briefs/<slug>.yaml`)

- ¿El **ángulo** responde lo que busca la gente? (`primaryQuery` sale de las "Preguntas típicas" de la fuente).
- **Outline**: secciones lógicas, cada una con sus `sourceIds`.
- **FAQ**: al menos 2 preguntas reales.
- **Caveats** (⚠️/🔍): cómo se va a tratar lo que la fuente no confirma. Nunca como hecho.
- **CTA**: solo funciones reales de la app (documentación, vencimientos de VTV/seguro/patente/service, historial,
  diagnóstico OBD2, talleres, varios autos, gratis). **Nada de alertas de licencia** ni promesas que no estén en `PRODUCT.md`.

**🛑 GATE 2 — Draft + fact-check** (`content-pipeline/drafts/<slug>.md`)

Antes de este gate Claude ya corrió el validador (hasta 3 intentos) y un fact-checker independiente (hasta 3 vueltas).
Revisá:

- El **reporte del fact-checker**: todo `no soportado` o `usa ⚠️/🔍 como hecho` que siga abierto necesita tu OK explícito
  claim por claim, o pedí sacarlo. Ante la duda, sacalo.
- Lo marcado `fuera de alcance` (la CTA): confirmá que la app hace eso.
- Warnings del validador: `src-mixed` (dato de una entrada mixta), `src-age` (fuente verificada hace más de 90 días),
  largo (< 600 palabras).
- Leé el draft entero: tono (voseo, sin hype), montos y plazos con fecha ("al DD/MM/AAAA"), y que no sea asesoramiento
  legal ni recomiende aseguradoras.

**🛑 GATE 3 — Imágenes**

Generar la cover cuesta plata (API de Gemini). La primera vez en la sesión Claude te pide el OK de gasto
("genero 2 variantes…, ¿dale?"); vale para el resto de la sesión. Después te muestra las variantes y la elegida. Revisá:

- Sin texto legible, números, patentes, marcas, logos ni caras identificables. Sin deformidades raras de IA.
- Que se vea como foto real (no ilustración ni render) y tenga que ver con el post.
- El archivo final: `content-pipeline/images/<slug>-cover.webp`, 1200×630, idealmente < 200 KB.
- El **alt**: 80–125 caracteres, describe lo que se ve, sin "Imagen de".

El checklist completo está en `content-pipeline/style.md`.

**🛑 GATE 4 — Escritura en Hygraph**

Hasta acá Claude solo leyó Hygraph e hizo pruebas en seco (dry run). Antes de escribir te muestra:

- Que el **slug está libre** (si ya existe, frena).
- La categoría y los tags resueltos. Si falta alguno en Hygraph, frena: hay que crearlo en Hygraph primero (pedíselo a Ramiro si tu rol no puede).
- Cover, alt y el resultado del dry run.

Con tu "sí": crea el Asset, sube la cover (acá Claude Code te pide permiso para el `curl`: aprobalo), crea el Post en
**DRAFT** y compara el contenido por hash (roundtrip). Al final `plan.yaml` queda en `status: hygraph-draft` con su `hygraphId`.

### B5. Revisar el DRAFT en Hygraph

Claude cierra con un resumen (post id, asset id, hashes, warnings) y un checklist. Antes de publicar:

- Previsualizá el post: un solo título principal, FAQ al final, cover y alt correctos.
- FAQPage válido en el validador de schema.org, autor = Organization.
- Si el roundtrip quedó "no automatizado", mirá que el contenido en Hygraph coincida con el draft.

### B6. Publicar (manual, en Hygraph)

El pipeline **nunca** publica. Lo hace una persona en la UI de Hygraph: publicar **el Asset de la cover y el Post**.
Si tu rol no tiene permiso de publicar, avisale a Ramiro con el slug y el `hygraphId`.

Después de publicar, actualizá `plan.yaml`: ese post pasa a `status: published` (podés pedírselo a Claude: "marcá
`<slug>` como published en plan.yaml"). Importa: los links internos de otros posts solo pueden apuntar a posts `published`.

### B7. Guardar en git

Se versionan `plan.yaml`, `briefs/<slug>.yaml` y `drafts/<slug>.md`. Las imágenes (`images/`) y los payloads (`out/`)
están en `.gitignore`: no se suben. Commits convencionales, como el resto del repo:

```bash
git status
git add content-pipeline/plan.yaml content-pipeline/briefs/<slug>.yaml content-pipeline/drafts/<slug>.md
git commit -m "chore(blog): agregar brief y draft de <slug>"
git push origin development
```

Si después de publicar solo cambiaste el status: `chore(blog): marcar <slug> como publicado`.
También le podés pedir a Claude que haga el commit; sin pedido explícito no commitea.

Si `git push` falla porque hay cambios nuevos: `git pull` y volvé a pushear. Si aparece un conflicto en `plan.yaml`, frená y avisale a Ramiro.

### B8. Proponer un post nuevo

Un post nuevo es una entrada más en `plan.yaml`. Antes de agregarla:

1. La **fuente de verdad** tiene que tener entradas `### <ID> · …` que respalden el tema, idealmente en ✅. Si no las
   tiene, primero hay que sumarlas a la fuente (es un documento aparte: coordinalo con Ramiro).
2. Agregá el registro con el mismo formato que los demás:
   ```yaml
   - slug: mi-post-nuevo              # en español, corto, con guiones
     title: "Título del post"
     category: tramites-y-documentacion # slug de una categoría que exista en Hygraph
     tags: [vtv, caba]                  # slugs; los que no existan en Hygraph hay que crearlos antes del GATE 4
     priority: P2
     batch: 2
     sourceIds: [VTV-01]                # IDs de la fuente de verdad
     status: planned
     blockedBy: null
     hygraphId: null
   ```
3. Commit (`chore(blog): sumar <slug> al plan de contenido`) y después `/blog-post <slug>`.

### B9. Problemas comunes

| Síntoma | Qué pasa | Qué hacer |
|---|---|---|
| `Falta NANOBANANA_API_KEY` / exit 2 en imágenes | No está la key en `.env.local` | Revisala (A5). Pedila a Ramiro por gestor de contraseñas. |
| Error de Gemini al generar (`Gemini <código>: …`) | Muchas veces, `NANOBANANA_MODEL` declarada vacía o con un modelo que no existe | Comentala en `.env.local` y reintentá. |
| "el modelo no devolvió imagen" | Gemini rechazó una variante | Las otras siguen; si ninguna sale, Claude ajusta la escena (máx. 2 rondas). |
| Validate sale con exit 2 / "no existe la fuente de verdad" | Falta el archivo en la carpeta padre | Ver A4. |
| Validate en rojo después de 3 intentos | El draft tiene errores que Claude no pudo resolver | Revisá los errores con Claude. **Nunca** se edita `scripts/blog/*` para que pase. |
| Fact-check con "Bloquea: sí" tras 3 vueltas | Claims que la fuente no respalda | En el GATE 2 aprobá cada uno explícitamente o pedí sacarlos. |
| Claude no encuentra la tool de Hygraph / "not connected" | Conector apagado, sin autorizar o con otro nombre | claude.ai → Settings → Connectors; en Claude Code `/mcp`. Ver A6. |
| Error de permisos en Hygraph | Tu rol no puede crear Posts/Assets o leer Categories/Tags | Avisale a Ramiro. |
| Hygraph devuelve 429 ("concurrent operations limit") | Rate limit | Esperá un momento y reintentá. El pipeline manda una mutation por vez. |
| "slug duplicado" en el GATE 4 | Ya hay un post con ese slug en Hygraph | No se sobrescribe: avisale a Ramiro. |
| Upload a S3 distinto de `204`, o la cover no completa | Venció la URL presignada o falló la subida | El pipeline frena sin crear el Post y reporta el Asset huérfano: hay que borrarlo en Hygraph. |
| Roundtrip "no automatizado" | No hay `HYGRAPH_TOKEN` | Normal sin token: compará a mano en B5. |
| Roundtrip: los hashes difieren | El contenido en Hygraph no coincide con el draft | No se arregla con update: avisale a Ramiro con el diff. |
| `/blog-post` no aparece | Claude Code no se abrió en la carpeta del repo | Cerralo y abrilo desde `autolibre-landing-page`. |

---

## Riesgos conocidos

- La fuente de verdad no está versionada: cada uno tiene su copia. Si Ramiro la actualiza, hay que pasarle la nueva al co-founder antes de seguir escribiendo.
- `execute_graphql` está permitido sin prompt y puede correr cualquier mutation de GraphQL. Las skills prohíben publicar,
  borrar y actualizar, pero la protección real es que el rol de Hygraph no tenga permisos de más.
