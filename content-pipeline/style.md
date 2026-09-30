# Estilo de imágenes del blog

Base fija para generar la portada (cover) y las imágenes inline de cada post con
Nano Banana (`npm run blog:image`). La usa la skill `blog-images`. El objetivo es que todas las imágenes
del blog parezcan de la misma mano: fotos editoriales realistas, no fotos de stock.

Fuentes de esta guía (no inventar nada por fuera de ellas):

- Paleta: el bloque `@theme` de `app/globals.css` (única fuente de verdad; ver
  también el front matter de `DESIGN.md`).
- Dirección: fotografía editorial realista (decisión de producto del
  30/09/2026); del `DESIGN.md` se mantiene "nada decorativo" y el verde como
  único acento de marca.
- Límites de claims: `PRODUCT.md` (nada de prueba social ni promesas que la app
  no cumple).

## Dirección visual

Fotografía editorial realista (decidido el 30/09/2026: las ilustraciones planas
se descartaron). Tiene que parecer una foto real tomada para una nota de
servicio: luz natural suave, colores naturales, profundidad de campo leve,
nada de look "stock" artificial ni render 3D.

Un solo sujeto o escena central que se entiende de un vistazo y tiene que ver
con el post (la guantera con documentos, un auto entrando a una planta de VTV,
una mano con un celular en un control, un parquímetro, un casco de moto).

- **Realista, no publicitaria**: sin saturación exagerada, sin HDR, sin brillos
  ni reflejos de catálogo, sin efectos. Luz de día o interior cálido y creíble.
- **Toque de marca, no filtro**: un detalle verde natural en la escena (una
  planta, una carpeta, el entorno) es bienvenido; no se tiñe la foto de verde.
- **Contexto argentino creíble** cuando aplique (calle urbana de AMBA, ruta,
  estación de servicio genérica), sin carteles ni lugares reconocibles.
- **Vehículos genéricos**: autos y motos comunes, sin logos, emblemas ni
  parrilla identificable. Modelo no reconocible.
- **Encuadre para recortes**: sujeto dentro del 70 % central (el front recorta
  a 16:9 en el artículo y a otras proporciones en las cards).

## Paleta

Colores naturales de foto. Los tokens de `app/globals.css` (`--color-brand`
`#2a8c3a`, `--color-ink` `#1c2b1c`) solo guían el detalle de marca: si aparece
un acento, que sea un verde natural cercano al de marca. Nada de rojos
intensos dominantes (una portada no es una alerta).

## Reglas duras (una imagen que no las cumple se descarta)

1. **Sin texto legible**: ni palabras, ni letras, ni números, ni carteles, ni
   pantallas con texto. Documentos y pantallas se ven desenfocados, en blanco
   o de canto.
2. **Sin patentes reales**: si aparece una patente, está lisa, desenfocada o
   fuera de cuadro.
3. **Sin marcas ni logos**: ni de autos, ni de aseguradoras, ni de organismos
   (nada de escudos de CABA/PBA, Mi Argentina, AUSA, etc.). Tampoco el logo de
   AutoLibre.
4. **Sin caras identificables**: personas de espaldas, recortadas (manos,
   torso) o desenfocadas. Nunca un retrato.
5. **Sin escenas que asusten o engañen**: nada de choques gráficos, heridos,
   policías con uniforme real ni escenas que sugieran una situación legal
   distinta a la del post.
6. **Sin deformaciones de IA**: revisar manos (5 dedos), ruedas, espejos y
   perspectivas. Si algo se ve raro, se descarta.

## Prompt base

Pegar siempre este bloque, y agregar al final solo la escena del post (una
oración, en inglés, sacada de `cover.concept` del brief):

```text
Photorealistic editorial photograph for a car-ownership service article in
Argentina. Natural soft daylight, realistic natural colors, shallow depth of
field, shot on a 35mm lens, clean uncluttered composition with one clear
central subject kept within the central 70% of the frame. Believable and
understated, not an advertisement: no HDR, no oversaturation, no glossy
catalog look, no 3D render, no illustration.
Absolutely no legible text, letters, numbers, signs or screens with text
anywhere. No license plate characters (plates blank, blurred or out of frame).
No brand logos, emblems, car badges or government seals; generic vehicles
with no recognizable make or model. No identifiable human faces: people only
from behind, cropped hands or out of focus. Anatomically correct hands.
Scene: {ESCENA DEL POST}
```

Negative prompt (si el modelo lo acepta):

```text
text, letters, numbers, watermark, logo, brand, emblem, license plate
characters, face, portrait, illustration, cartoon, 3d render, cgi, hdr,
oversaturated, glow, neon, lens flare, extra fingers, deformed hands,
cluttered background
```

## Tamaños

| Uso | Generación | Entrega (`content-pipeline/images/`) | Notas |
|---|---|---|---|
| Cover | 16:9 (Nano Banana entrega ~1376×768, alcanza para 1200×630) | 1200×630 (WebP) | Es la imagen OG, la de las cards y la del artículo. El sujeto va centrado, dentro del 70 % central, porque el front recorta a 16:9 en el artículo y a otras proporciones en las cards. |
| Inline | 16:9 (o 4:3 si el objeto es vertical) | 1440×810 (16:9) o 1440×1080 (4:3) | La columna del cuerpo mide 720 px: 1440 cubre pantallas 2×. Nano Banana genera ~1376 px de ancho: para inline, entregá al ancho generado o pedí más resolución al modelo; no estires. |

- Peso objetivo: cover < 200 KB, inline < 250 KB. Si pesa más, bajar calidad
  antes que resolución.
- Nombre de archivo: `{slug}-cover.{ext}` y `{slug}-{n}.{ext}` en kebab-case,
  sin espacios ni acentos.
- Los binarios NO se commitean (`content-pipeline/images/` está en
  `.gitignore`); la copia buena vive como Asset en Hygraph.

## Texto alternativo (alt)

El alt es obligatorio: sin alt no se sube el Asset (spec P7) y `validate.ts`
rechaza la imagen (spec P4). Va en el frontmatter del draft
(`cover.alt`, `images[].alt`) y se carga en `Asset.altText`.

- En español rioplatense neutro, una sola oración, **80–125 caracteres**, sin
  punto final obligatorio.
- Describe lo que se ve y por qué importa para el post, no el estilo:
  "Cédula verde y póliza del seguro sobre la guantera de un auto" y no
  "Foto con luz natural y tonos verdes".
- No empieza con "Imagen de", "Foto de" ni "Ilustración de".
- No repite el título del post ni mete keywords de relleno.
- No nombra marcas, organismos ni datos que la imagen no muestra (ni plazos, ni
  montos, ni normas).
- Si una imagen inline es puramente decorativa, no va en el post: el pipeline
  no sube imágenes sin alt.

## Checklist antes del GATE 3

- [ ] Prompt base intacto + una sola escena al final.
- [ ] Sin texto, patentes, marcas, logos ni caras (revisar en zoom al 100 %).
- [ ] Solo colores de la paleta; un único acento verde de marca.
- [ ] Cover 1200×630 con el sujeto dentro del 70 % central.
- [ ] Alt de 80–125 caracteres que cumple las reglas de arriba.
