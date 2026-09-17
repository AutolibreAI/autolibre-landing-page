---
version: 1
slug: "app-descarga-page-tsx"
primary_target: "app/descarga/page.tsx"
related_targets: ["lib/content/descarga.ts","components/ui/qr-code.tsx"]
---

# /descarga

## Scope

Página dedicada en `/descarga` para invitar a bajar la app. Destino de links
compartidos (WhatsApp, redes, bio). No va en la navegación del sitio, mismo
criterio que `/pedido`.

Visitor mode: **Persuade**. El éxito es una instalación.

## Audiencia y trabajo

Dueño de auto en AMBA que recibe el link y lo abre sin haber leído nada de
AutoLibre. Acción única: instalar la app. Nada compite con eso.

## Contenido y prueba

Sin capturas, sin secciones, sin razones enumeradas: el usuario pidió
explícitamente que no las haya (2026-09-17). Las URLs de tienda salen de
`siteConfig.stores`. Sin testimonios, sin cantidad de usuarios, sin rating.

## Direction contract

**THESIS.** Una sola pantalla y una sola acción. La página no argumenta ni
enumera: nombra el producto en una línea y pone los dos botones donde el ojo
ya está. Rechaza el arreglo por defecto de la categoría —el apilado de hero,
grilla de razones, capturas y cierre— porque cada sección de más es una
oportunidad de no tocar el botón.

**OWN-WORLD.** Fondo `ink` `#1c2b1c` a página completa, un tono que el sistema
ya usa (diagnóstico, footer). Texto blanco, secundario en `white/72`. Botones
de tienda en blanco vía `StoreLinks tone="brand"`: sobre el fondo oscuro son lo
más brillante de la pantalla. Verde en dos roles y sólo esos: `--color-brand`
para la selección de texto, `--color-brand-soft` para el anillo de foco (5:1
sobre `ink`; el `brand` que hereda `globals.css` da 3.47:1, que pasa el piso de
3:1 pero es el foco más flojo del sitio). Outfit display, DM Sans texto. Sin
sombras, sin gradientes, sin glass. El verde de marca queda descartado como
fondo por contraste medido: blanco sobre `#2a8c3a` da 4.28:1, abajo del 4.5:1
que pide el texto chico. La ruta declara su propio `viewport` con
`themeColor: "#1c2b1c"`: el layout raíz manda verde de marca y el navegador
mobile pintaría una banda verde arriba de una página oscura.

**STORY.** Entiende en una línea qué es AutoLibre. Hace una sola cosa: toca el
botón de su tienda — o escanea el QR si llegó desde la compu.

**FIRST VIEWPORT.** Es la página entera: `min-h-dvh`, composición centrada.
Logo chico arriba a la izquierda (único link hacia afuera, vuelve al inicio).
Al centro vertical: titular display en dos líneas, subtítulo de una línea, los
dos botones de tienda (iOS primero) con su nota. Desde `lg`, detrás de una
regla propia, el QR en tarjeta blanca con su rótulo y la dirección escrita
debajo. Abajo, una línea con Términos, Privacidad y Soporte.

**FORM.** Dirección fijada por el usuario (2026-09-17), reemplaza la asignada
por el reparto ("La ficha del auto", seed `7f655e6c`, scope surface, mode
persuade, kind assigned). Pedido textual: "mucho mas simple", "sin la ficha del
vehiculo, sin como se ve la app y nada", "una unica pagina bien al grano", "el
QR me gusto, pero ubicalo bien". Una decisión fijada por el usuario le gana al
dado, siempre.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance

## Momento memorable

El QR: el puente del escritorio al bolsillo. Un botón de App Store abierto en la
compu no instala nada, y esa es la fuga que esta página cubre. Vive detrás de su
propia regla, sólo desde `lg`, en tarjeta blanca para que escanee, con la
dirección escrita debajo por si la cámara no coopera. Apunta a esta misma página
y no a una tienda, porque un solo código no puede servir a iOS y a Android.

**El path se genera con el paquete `qrcode` (npm), fuera del proyecto, y se
pega en `components/ui/qr-code.tsx`. No se edita a mano y no se reimplementa.**

Por qué la regla es tan dura: hubo antes un codificador propio acá que NO
escaneaba. El valor del format info era correcto, pero los 15 bits quedaban mal
ubicados en la matriz, y el format info es lo primero que lee un escáner.
Pasó cuatro verificaciones internas —round-trip, síndromes Reed-Solomon,
coincidencia de las dos copias del format info, y comparación del render contra
la matriz generada— porque todas comparaban mi salida contra mi salida. La
única prueba que lo detectó fue comparar contra una implementación
independiente: 8 módulos distintos, todos en posiciones de format info.

Si hay que regenerar el código, contrastar siempre contra la librería y
escanear con un teléfono real.

## Decisiones sin tomar

- `/#descargar` y los CTAs que apuntan ahí: el usuario pidió no tocarlos
  (2026-09-17). `/descarga` convive con el ancla del hero.
- UTMs de campaña: sin parámetros por ahora. Los links salen de
  `siteConfig.stores`; agregarlos después es un solo lugar.
