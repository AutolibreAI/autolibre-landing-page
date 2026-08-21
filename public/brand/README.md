# Assets de marca

Cuál usar según el fondo. Los nombres `light` / `dark` se refieren al **fondo
al que están destinados**, no al color de la tinta — es la convención del set
original y se presta a confusión, así que conviene mirar esta tabla.

| Archivo             | Tinta                       | Va sobre                     | Dónde se usa hoy         |
| ------------------- | --------------------------- | ---------------------------- | ------------------------ |
| `lockup-light.png`  | negra + isotipo verde       | fondos claros                | header                   |
| `lockup-dark.png`   | blanca + **isotipo verde**  | fondos oscuros (`#1C2B1C`)   | footer                   |
| `lockup-white.png`  | blanca monocroma (knockout) | cualquier color de marca     | sección de cierre verde  |
| `isotype.png`       | verde                       | fondos claros                | fuente de los íconos     |
| `og-image.png`      | —                           | previews de redes            | metadata OG              |

## Los íconos cuadrados

`isotype.png` es de 450x407, o sea **no cuadrado**, y ese fue el motivo por el
que Google no mostraba el favicon en los resultados: el requisito es una imagen
cuadrada y de lado múltiplo de 48px. Los derivados salen de recortar el alpha
del isotipo y recentrarlo en un lienzo cuadrado:

| Archivo                        | Tamaño  | Para qué                                  |
| ------------------------------ | ------- | ----------------------------------------- |
| `app/favicon.ico`              | 16/32/48| favicon clásico en `/favicon.ico`          |
| `app/icon.png`                 | 480x480 | favicon de alta resolución (10 x 48px)     |
| `app/apple-icon.png`           | 180x180 | pantalla de inicio de iOS — **fondo blanco**, iOS no respeta el alpha |
| `logo-square.png`              | 512x512 | `Organization.logo` de schema.org          |
| `icon-192.png`, `icon-512.png` | —       | íconos `any` del manifest                  |
| `icon-maskable-512.png`        | 512x512 | ícono `maskable`: fondo sólido y la marca al 58% para sobrevivir el recorte circular del SO |

Los de `app/` son convención de archivo de Next: alcanza con reemplazarlos para
que cambien los `<link>` del `<head>`. Los de `/public` los referencian el
manifest y el JSON-LD por URL fija, así que ahí el nombre no se puede cambiar
sin tocar `app/manifest.ts` y `lib/seo/config.ts`.

Si el isotipo cambia, regenerar **todos** con el mismo recorte; que el favicon
y el `Organization.logo` no coincidan le da a Google dos marcas distintas.

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
