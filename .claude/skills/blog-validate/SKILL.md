---
name: blog-validate
description: >
  Corre el validador determinístico del blog sobre un draft y corrige los errores en un loop de hasta 3 intentos.
  Trigger: después de escribir o editar content-pipeline/drafts/<slug>.md, o cuando se pide "validar el draft".
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Comando

```bash
npm run blog:validate -- content-pipeline/drafts/<slug>.md --json
# opcionales: --sources <fuente.md> (default $BLOG_SOURCE_OF_TRUTH o ../autolibre-fuente-verdad-documental-amba.md)
#             --plan <plan.yaml>  --today YYYY-MM-DD
```

Exit 0 = sin errores (los warnings no frenan). Exit 1 = errores. Exit 2 = falta plan/fuente o uso incorrecto → STOP y reportá.
Las reglas viven en `scripts/blog/lib/rules.ts`; no las dupliques ni las "interpretes": corregí el draft.

## Loop (máximo 3 intentos)

1. Corré el comando y leé `errors[]` (`rule`, `line`, `message`).
2. Corregí el draft en el lugar exacto. Guía rápida por `rule`:
   | rule | Arreglo |
   |---|---|
   | `subset` | Reescribí la construcción con el subset (ver `blog-draft`). |
   | `src` | ID inexistente o no ✅: sacá el `[src:]`; si el dato es ⚠️/🔍, reformulá sin afirmarlo (contradicción + opción segura). |
   | `sourceIds` | Igualá el frontmatter al set de IDs citados. |
   | `headings` | Sin saltos (`##`→`###`→`####`). |
   | `metaTitle` | ≤ 48 caracteres. |
   | `faq` | ≥2 `###` con `?` y respuesta bajo `## Preguntas frecuentes`. |
   | `links` | Internos solo a posts `published`; externos https. |
   | `alt` / `images` | Alt no vacío; toda `![](…)` declarada en `images`. |
   | `plan` / `slug` | Slug = archivo = plan; si está `blockedBy`, STOP. |
3. Re-validá. Si al 3er intento sigue en rojo → STOP y mostrale al humano los errores restantes.
   NUNCA edites `scripts/blog/*` para que pase.

## Warnings (reportar, no bloquear)

- `src-mixed`: el fact-checker tiene que confirmar que el claim cae en la parte ✅.
- `src-age`: fuente verificada hace > 90 días → mencionarlo en el GATE 2.
- `metaDescription` fuera de 70–155, `words` < 600: corregí si es razonable.

Con exit 0: `status: validated` en plan.yaml y seguí con el fact-check (`blog-fact-checker`).
