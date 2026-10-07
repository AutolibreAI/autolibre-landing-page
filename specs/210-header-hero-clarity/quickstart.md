# Quickstart: desarrollar y verificar el header y el hero

**Feature**: `210-header-hero-clarity` · **Plan**: [plan.md](./plan.md)

No hace falta backend ni variables nuevas: todo es contenido y componentes de la landing.

## 1. Comandos

```bash
npm run dev                          # http://localhost:3000
npx tsc --noEmit                     # el compilador señala cualquier uso de props eliminados
npm run lint
npm run build && npm start           # base para el script de consistencia y Lighthouse
node scripts/site-nav/check-header.mjs http://localhost:3000
```

`npm run build` tiene que terminar con **0 errores de TypeScript y de ESLint** (Constitución).

## 2. Lista de verificación

### US1 · Presupuesto en un paso *(SC-001, FR-001 a FR-006b)*

- En la home, tocar el del **header**, el de la **banda** y el del **pie**: los tres llegan a `/pedido` con **un** clic, sin pasar por otra sección. El **hero no tiene** CTA de presupuesto.
- Las cuatro etiquetas dicen exactamente **"Pedí tu presupuesto"**.
- En 390 px: el link del **menú** (abrir menú → "Pedí tu presupuesto") llega a `/pedido` y el menú se cierra.
- En `/pedido`: en escritorio el formulario se ve al cargar; en 390 px se ven WhatsApp y "Quiero que me contacten".
- La banda de la home **no** muestra el link "Ver cómo funciona el pedido de presupuesto".
- La home **no** carga el chunk del formulario: en la pestaña *Network*, al cargar `/` no aparece `quote-flow`.

### US3 · Sin Compatibilidad *(SC-002, FR-012 a FR-014b)*

```bash
grep -rniE "compatibilidad|#compatibilidad|CompatibilitySection|obd2-connector" app components lib public PRODUCT.md
```

El resultado debe mostrar **solo** el dato de `public/llms.txt` línea 15, la respuesta de la FAQ y, opcionalmente, `PRODUCT.md` actualizado. Nada en `app/`, `components/` ni en `site.ts`.

- `/#compatibilidad` carga la home, sin error.
- La FAQ "¿Qué autos son compatibles con el adaptador?" dice **cómo** consultar (correo desde `siteConfig`) y el `FAQPage` JSON-LD la refleja.
- Outline de la home sin saltos: `h1` → `h2` por sección (extensión *HeadingsMap* o `document.querySelectorAll("h1,h2,h3")`).

### US4 · Mismo header en todas las páginas *(SC-003, FR-016 a FR-022)*

```bash
node scripts/site-nav/check-header.mjs http://localhost:3000
```

Rutas que recorre: `/`, `/pedido`, `/proveedores`, `/sobre-nosotros`, `/support`, `/eliminar-cuenta`, `/terminos`, `/privacidad`, `/blog`, una categoría y un post del blog. Debe terminar con **0 diferencias** fuera de la tabla de excepciones de [contracts/header-nav.md](./contracts/header-nav.md).

A mano, a 390, 1024, 1280 y 1440 px:

- Se ve el **mismo** conjunto de links en cada ancho en dos páginas distintas (p. ej. `/` y `/blog`).
- A 1280 px no se parte ni se pisa ningún link (R3).
- Desde `/blog`, tocar "FAQ" lleva a la home **y baja** a la sección sin que el header tape el título (spike S1).
- En `/descarga` solo está el logo.
- `aria-current="page"` en el link de la página actual, con subrayado.

### US2 · Hero con funciones *(SC-004, FR-007 a FR-011; Fase B)*

- Las cuatro funciones están en el HTML del servidor: `curl -s http://localhost:3000 | grep -c "Enterate si tenés multas"` ≥ 1.
- En **375×667** los botones de tienda siguen **visibles sin scroll** (R2). Si no, aplicar el plan B de D7.
- Un solo `<h1>`; la lista es un `<ul>`, sin encabezados nuevos.
- Ningún texto dice "ahorrá", "reducí", "financiación" ni cifras.
- Producto confirmó **multas** (P1); si no, esa línea no está.

### Analítica *(FR-026, contrato de puntos de entrada)*

- Con PostHog de prueba: cada punto de entrada genera **un** `quote_cta_clicked` con su `placement`.
- `whatsapp_clicked` y `app_store_clicked` siguen igual en header y hero.

### Rendimiento y accesibilidad *(SC-005)*

- Lighthouse **mobile** sobre el build de producción: LCP < 2,5 s, CLS < 0,1 en `/`; comparar con la medición previa al cambio.
- axe sin violaciones críticas; recorrido solo con teclado por el header y el menú; objetivos táctiles ≥ 44 px en 390 px.

### SEO/GEO

- `app/sitemap.ts`: `lastModified` de `/` = `2026-10-07`.
- `public/llms.txt` línea 22 sin "compatibilidad OBD2"; línea 15 intacta.

## 3. Puerta de publicación

1. Fase A completa y la lista de arriba en verde.
2. Aviso a marketing del **corte en `quote_started`** (modal → page) y del evento nuevo.
3. Base de SC-006 tomada (14 días previos, `modal` + `page`).
4. Fase B solo con la confirmación de producto sobre **multas**.
