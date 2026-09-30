---
name: blog-draft
description: >
  Redacta el draft Markdown restringido de un post del blog (content-pipeline/drafts/<slug>.md)
  desde un brief aprobado y la fuente de verdad, citando cada dato con [src:ID].
  Trigger: paso 2 de /blog-post, o cuando se pide "redactar / escribir el draft" de un post con brief aprobado.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Precondiciones

- Existe `content-pipeline/briefs/<slug>.yaml` y pasó el GATE 1 (plan.yaml `status: briefed`).
  Sin brief → STOP (spec P2).
- Fuente: `$BLOG_SOURCE_OF_TRUTH` o `../autolibre-fuente-verdad-documental-amba.md`. Leé solo las entradas del brief.

## Contrato del archivo

Ejemplo completo y válido: `scripts/blog/__tests__/__fixtures__/valid-full.md`. Frontmatter:

```yaml
title: "…"                      # es el <h1>; NO va como # en el cuerpo
slug: <slug>                    # = nombre del archivo y presente en plan.yaml
metaTitle: "…"                  # ≤ 48 caracteres, sin la marca (el layout la agrega)
metaDescription: "…"            # 70–155, única
excerpt: "…"                    # obligatorio
category: <slug de plan.yaml>
tags: [<slugs de plan.yaml>]
reviewedAt: YYYY-MM-DD          # hoy
sourceIds: [..]                 # EXACTAMENTE los IDs citados con [src:ID] en el cuerpo
cover:
  file: images/<slug>-cover.webp
  alt: "…"                      # 80–125 chars, reglas en content-pipeline/style.md; blog-images puede ajustarlo
images: []                      # solo si hay ![alt](images/…) en el cuerpo
```

Subset Markdown (todo lo demás lo rechaza `validate.ts`): `##`/`###`/`####` sin saltar niveles (arranca en `##`),
párrafos, `**bold**`, `*italic*`, links `[t](/ruta)` o `https://…`, listas `-` / `1.` de un nivel, `> cita`,
tablas GFM simples (header + separador + filas, ≥2 columnas, mismo nº de celdas), `![alt](images/…)` sola en
su línea, y marcadores `[src:ID]` / `[src:ID,ID]` al final de la oración que respaldan (se borran del AST).
Nada de `#`, `#####`, HTML, código, listas anidadas, `*`/`+` como viñeta, links por referencia, `mailto:`, `#ancla`.

## Reglas de contenido

- **Solo lo que dice la fuente.** Cada dato (plazo, monto, requisito, norma) lleva `[src:ID]` de una entrada ✅.
- **⚠️/🔍 nunca como hecho.** No los cites con `[src:]` (validate falla). Explicá que las fuentes oficiales no
  coinciden o que falta confirmación, y recomendá la opción más segura para el lector (ver `caveats` del brief).
  En un ✅ mixto, afirmá solo la parte ✅.
- **Nunca uses "Notas internas"** ni bloques `rag:skip` de la fuente.
- **Montos y plazos con fecha**: "al 30/09/2026, …" y la línea "Información vigente al DD/MM/AAAA." cerca del
  inicio (fecha = la `Verificado` más vieja de las fuentes usadas). Recordá verificarlos en el sitio oficial.
- Primera oración de cada sección citable sola (respuesta directa). Jurisdicción explícita cuando CABA ≠ PBA.
- No es asesoramiento legal ni de seguros; no recomendar aseguradoras.
- CTA (1 párrafo antes de FAQ): solo lo del `cta` del brief / `PRODUCT.md`. Nada de alertas de licencia,
  métricas, testimonios ni claims inventados. Voseo, sin hype.
- ≥ 600 palabras (warning si no), al menos una tabla si el brief la pide.
- Links internos solo a posts `published` en plan.yaml.

## Cierre obligatorio (en este orden, al final)

1. `## Preguntas frecuentes` (texto exacto = `FAQ_HEADING` de `scripts/blog/lib/rules.ts`): ≥2 `###` que
   terminan en `?`, cada una con respuesta (párrafo/lista) debajo. Es lo que genera el FAQPage JSON-LD.
2. `## Fuentes oficiales`: lista `-` con `[Organismo — título](https://…)` tomados de los campos **Fuentes** de
   las entradas citadas. Solo links oficiales que figuran en la fuente; https (validate rechaza http). Si la única
   fuente de un dato es http, nombrá el organismo sin link.

## Flujo

1. Escribí `content-pipeline/drafts/<slug>.md`.
2. Pasale el control a `blog-validate` (loop ≤3). No sigas con validate en rojo.
3. `status: drafted` en plan.yaml.
