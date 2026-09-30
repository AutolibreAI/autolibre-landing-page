---
name: blog-images
description: >
  Genera la cover (y las inline opcionales) de un post del blog con Nano Banana (`npm run blog:image`) siguiendo
  content-pipeline/style.md, fija el alt y frena en el GATE 3.
  Trigger: paso de imágenes de /blog-post, o cuando se pide "generar la portada / imágenes" de un post.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "2.0"
---

## Precondiciones

- GATE 2 aprobado (plan.yaml `status: fact-checked`).
- `content-pipeline/style.md` leído completo: es el contrato (prompt base, paleta, reglas duras, tamaños, alt,
  checklist). No lo reescribas acá ni lo "mejores". El script parsea el bloque ```text``` de `## Prompt base`:
  no le cambies la estructura.
- Escena: `cover.concept` de `content-pipeline/briefs/<slug>.yaml` (1 oración en inglés).
- `NANOBANANA_API_KEY` en `.env` o `.env.local` (el script los carga solo). Si falta, exit 2 → STOP y pedísela al humano.

## Flujo (Nano Banana = Gemini image API, `scripts/blog/generate-image.ts`)

1. **Costo**: es uso pago de la API de Gemini. Si el humano no dio el OK de gasto en esta sesión, preguntá UNA vez
   ("genero 2 variantes con `gemini-3.1-flash-image`, ¿dale?") y STOP hasta el sí. Con el sí, vale para el resto de la sesión.
2. **Generar** (una request por variante; `--count` 1–4, default 2):
   ```bash
   npm run blog:image -- --scene "<cover.concept>" --out content-pipeline/images/<slug>-cover --count 2
   ```
   - Escribe `content-pipeline/images/<slug>-cover-1.jpg`, `-2.jpg`, … (16:9, ~1376×768; `.png` si el modelo devuelve PNG). Imprime las rutas.
   - Flags opcionales: `--model <id>` (o `NANOBANANA_MODEL`; default `gemini-3.1-flash-image`), `--aspect 16:9`.
     `npm run blog:image -- --list-models` lista los modelos de imagen disponibles.
   - "el modelo no devolvió imagen (<motivo>)" en una variante → las demás siguen; si no salió ninguna, ajustá solo la escena.
   - El prompt base de style.md se agrega solo: en `--scene` va SOLO la escena.
3. **Revisar**: abrí cada variante con Read (es una imagen: la ves) y chequeá las "Reglas duras" de style.md: sin texto,
   números, patentes, marcas, logos ni caras; solo paleta; un único acento verde; sujeto dentro del 70 % central.
   Descartá las que fallen. Si no queda ninguna, ajustá solo la escena y regenerá (máx. 2 rondas; cada ronda es gasto).
4. **Entrega** (`images/` está en `.gitignore`): la elegida → 1200×630 webp:
   ```bash
   node -e "require('sharp')(process.argv[1]).resize(1200,630,{fit:'cover'}).webp({quality:80}).toFile(process.argv[2]).then(i=>console.log(i))" content-pipeline/images/<slug>-cover-<n>.jpg content-pipeline/images/<slug>-cover.webp
   ```
   Peso objetivo < 200 KB (si pasa, bajá `quality`, no la resolución). El archivo final es `images/<slug>-cover.webp`.
5. **Alt**: redactalo con las reglas de style.md (80–125 chars, describe lo que se ve, sin "Imagen de", sin marcas
   ni datos). Escribilo en `cover.alt` del draft (y `images[].alt` si hay inline). Sin alt no se sube nada (P7).
6. Re-corré `blog-validate` (el alt cambió el draft).

## Fallback: Higgsfield

Solo si Nano Banana no está disponible y el humano lo pide. Requiere plan **Basic** o superior: el plan free bloquea
Recraft y GPT Image, y `generate_image` con `get_cost: true` NO revela esa restricción: confirmá el plan con
`show_plans_and_credits` antes de pedir el OK de gasto. Mismo prompt base + escena, 16:9, mismas reglas de revisión y la misma entrega local 1200×630 webp.

## 🛑 GATE 3

Mostrá: rutas de las variantes, la elegida (y por qué se descartaron las otras), modelo usado, dimensiones/peso del
webp final, alt (con su largo) y el checklist de style.md marcado. STOP. Esperá que el humano elija y apruebe
explícitamente. Con el "sí": anotá en el reporte `coverFile: content-pipeline/images/<slug>-cover.webp` y
`plan.yaml status: images-ready`.
