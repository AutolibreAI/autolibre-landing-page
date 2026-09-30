---
name: blog-post
description: >
  Orquesta el pipeline completo de un post del blog de AutoLibre, de plan.yaml a Hygraph DRAFT, con 4 gates humanos
  (brief, draft+fact-check, imágenes, escritura en Hygraph). Nunca publica.
  Trigger: /blog-post <slug>, o cuando se pide "hacer / armar / sacar el post <slug>" del plan de contenido.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Regla de oro

En cada 🛑 GATE: mostrás el entregable, preguntás y **TERMINÁS el turno**. Seguís solo con una aprobación explícita
del humano ("sí", "aprobado", "dale"). Silencio, ambigüedad o "después vemos" = no. Cambios pedidos → corregir y volver a preguntar.
Nunca `publish_entry` ni ninguna mutation `publish*`: el post termina en DRAFT y publica el humano.

## Preflight (antes de todo)

1. `content-pipeline/plan.yaml`: el `slug` existe. Con `blockedBy` → STOP y mostrá el motivo textual.
2. La fuente de verdad existe: `$BLOG_SOURCE_OF_TRUTH` o `../autolibre-fuente-verdad-documental-amba.md` (resolvé el path absoluto).
3. Retomá según `status` (no rehagas pasos ya aprobados):

| status | Siguiente paso |
|---|---|
| `planned` | 1. brief |
| `briefed` | 2. draft |
| `drafted` / `validated` | 3. validate + fact-check |
| `fact-checked` | 4. imágenes |
| `images-ready` | 5. Hygraph |
| `hygraph-draft` / `published` | Nada: informá el `hygraphId` y terminá. |

## Pasos

1. **Brief** → skill `blog-brief` → `content-pipeline/briefs/<slug>.yaml`. **🛑 GATE 1** (ángulo, outline, FAQ, tablas, caveats ⚠️/🔍, CTA).
2. **Draft** → skill `blog-draft` → `content-pipeline/drafts/<slug>.md`.
3. **Validate + fact-check**
   - Skill `blog-validate`: loop ≤ 3 intentos; si sigue en rojo, STOP y reportá.
   - Agente `blog-fact-checker` (Agent tool, `subagent_type: "blog-fact-checker"`), contexto aislado. Pasale SOLO
     el path absoluto del draft y el de la fuente de verdad; nada del brief ni de esta conversación.
   - Reporte con `Bloquea: sí` → corregí el draft (reformulá o sacá el claim; ⚠️/🔍 = contradicción + opción segura),
     re-validá y volvé a correr el fact-checker. Máx. 3 vueltas. Contá con usarlas todas: en el piloto hicieron falta
     las 3 (agarra sobre-afirmaciones como "no te pueden exigir" donde la fuente dice "no es obligatorio", normas
     citadas de memoria y contradicciones mal leídas).
   - Vueltas agotadas con ítems abiertos → NO sigas corrigiendo: llevá al GATE 2 la lista de lo que queda (claim,
     src, veredicto) para que el humano apruebe explícitamente cada uno o pida sacarlo.
   - **🛑 GATE 2**: mostrá el draft (o su ruta + resumen de secciones), el reporte del fact-checker completo, los warnings
     de validate (`src-mixed`, `src-age`, largo) y lo marcado `fuera de alcance` (CTA). Un no-ok solo avanza con aprobación
     humana explícita de ese claim. Con el sí → `status: fact-checked`.
4. **Imágenes** → skill `blog-images` (Nano Banana vía `npm run blog:image` + `content-pipeline/style.md`; es gasto
   de API: OK del humano una vez por sesión). **🛑 GATE 3** (variante, `images/<slug>-cover.webp` 1200×630, alt).
   Con el sí → `status: images-ready`.
5. **Hygraph** → skill `blog-to-hygraph`. Hace lecturas y dry runs, y frena en **🛑 GATE 4** antes de la PRIMERA escritura
   (createAsset → upload presignado a S3 del webp local). Termina en DRAFT, roundtrip por hash (`npm run blog:roundtrip`
   si hay `HYGRAPH_TOKEN` con lectura DRAFT; si no, visual y reportado como "roundtrip no automatizado") y `status: hygraph-draft`.

## Estado

- plan.yaml es el checkpoint: actualizá `status` (y `hygraphId`) solo al pasar cada gate, tocando únicamente ese post.
- Salidas: `briefs/<slug>.yaml`, `drafts/<slug>.md` (versionados); `images/` y `out/` están en `.gitignore`.
- No commitees salvo que el humano lo pida (commits convencionales).

## Cierre

Resumen: post id (DRAFT), asset id, hashes, warnings abiertos y checklist para el humano: previsualizar,
1 `<h1>`, FAQPage en el validator de schema.org, author Organization, Lighthouse LCP < 2.5 s, y publicar él en Hygraph.
