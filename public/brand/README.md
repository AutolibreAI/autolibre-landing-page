# Assets de marca

Cuál usar según el fondo. Los nombres `light` / `dark` se refieren al **fondo
al que están destinados**, no al color de la tinta — es la convención del set
original y se presta a confusión, así que conviene mirar esta tabla.

| Archivo             | Tinta                       | Va sobre                     | Dónde se usa hoy         |
| ------------------- | --------------------------- | ---------------------------- | ------------------------ |
| `lockup-light.png`  | negra + isotipo verde       | fondos claros                | header                   |
| `lockup-dark.png`   | blanca + **isotipo verde**  | fondos oscuros (`#1C2B1C`)   | footer                   |
| `lockup-white.png`  | blanca monocroma (knockout) | cualquier color de marca     | sección de cierre verde  |
| `isotype.png`       | verde                       | fondos claros                | favicon (`app/icon.png`) |
| `og-image.png`      | —                           | previews de redes            | metadata OG              |

## Por qué existe `lockup-white.png`

Ningún lockup del set original es monocromo: todos llevan el isotipo en verde
`#20A020`. Sobre el verde de marca `#2A8C3A` ese isotipo queda en un contraste
de **1.24** (1.0 sería el mismo color exacto), o sea que desaparece y el logo
se ve partido.

`lockup-white.png` es un knockout generado a partir de `lockup-dark.png`:
toda la tinta a blanco puro conservando el canal alpha, que es el mismo
tratamiento que ya tiene `isotype-white.png`. Contraste sobre el verde: **4.28**.

Si diseño produce un lockup blanco oficial, reemplazar este archivo y listo —
no hace falta tocar código.

## Por qué estos siguen en PNG y no en WebP

Las imágenes de `/mockup` se convirtieron a WebP, pero las de marca no:

- `og-image.png` lo leen scrapers de redes sociales, y varios todavía no
  soportan WebP. Si falla, el link se comparte sin preview.
- Los lockups son arte plano de dos colores: pesan 2–12 KB en PNG, así que
  el ahorro de convertirlos sería despreciable.
