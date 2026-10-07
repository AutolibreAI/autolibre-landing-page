# Implementation Plan: Claridad y conversión del header y el hero de la landing

**Branch**: `209-public-provider-profile` (misma rama que la #209, por decisión del equipo) | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/210-header-hero-clarity/spec.md`

## Summary

Cuatro cambios sobre la landing, todos en la capa de contenido y en los componentes de `layout/` y `sections/home/`; **sin dependencias nuevas, sin backend y sin cambios de datos**:

1. **Un solo camino de presupuesto (US1)**: header y banda de la home pasan a ser `<a>` comunes hacia `/pedido` (el hero ya no tiene CTA de presupuesto; el pie conserva su link), con **una sola etiqueta** ("Pedí tu presupuesto") que sale de **una constante** en `lib/content/site.ts`. El formulario en ventana superpuesta deja de usarse en la home, lo que además saca una isla de cliente de la primera página.
2. **Menú sin links confusos (US3)**: se elimina "Compatibilidad" y su sección; la información sigue en las preguntas frecuentes (con una vía de contacto explícita) y en `llms.txt`.
3. **Header idéntico en todas las páginas (US4)**: se **eliminan los props** `showSectionLinks` y `secondary` de `SiteHeader`/`PageShell`. El conjunto de links deja de poder variar **por tipos**: lo único que una página puede cambiar es el botón de la derecha (`cta`) y la página actual (`currentPath`). Se suma un script que compara los headers de todas las páginas contra un servidor en marcha.
4. **Hero con las cuatro funciones aprobadas (US2)**: una lista corta de funciones (presupuestos, diagnóstico, mantenimiento, multas) en el hero, con texto en el HTML del servidor y sin tocar el titular ni las palabras rotativas. Es la única parte con **puerta de producto** (ver Riesgos).

El enfoque técnico y sus alternativas están en [research.md](./research.md).

## Technical Context

**Language/Version**: TypeScript 5 (strict) · Next.js 16.2.4 (App Router) · React 19.2.4
**Primary Dependencies**: ninguna nueva. Se usan `next/link`, `next/image`, las primitivas de `components/ui/` y el catálogo de analítica existente
**Storage**: N/A (sin base de datos ni datos persistentes; todo es contenido estático de `lib/content/*`)
**Testing**: no hay lógica pura nueva que justifique `node --test`. La verificación es **estática por tipos** (los props eliminados rompen la compilación si alguien los vuelve a usar) + el script `scripts/site-nav/check-header.mjs` + la lista del [quickstart](./quickstart.md)
**Target Platform**: web, mobile primero (tráfico mayoritario), desktop secundario
**Project Type**: web (sitio de marketing, Next.js)
**Performance Goals**: LCP < 2,5 s, CLS < 0,1, INP < 200 ms en la home (sin empeorar); el `JS` de la home **baja** al sacar el modal
**Constraints**: SEO/GEO primero (AGENTS.md): contenido indexable en el HTML del servidor, un solo `h1`, sin saltos de nivel, copy en `lib/content/*`, clases canónicas de Tailwind v4, íconos solo del set existente
**Scale/Scope**: ~14 archivos tocados (ver estructura), 10 páginas con header, 0 páginas nuevas

> **AGENTS.md** exige leer la guía correspondiente de `node_modules/next/dist/docs/` antes de escribir código. En este plan el único punto que depende de comportamiento del framework es **navegar a un ancla de la home (`/#faq`) desde otra página con `next/link`**; esa verificación es la tarea de la Fase 0 (spike S1).

## Constitution Check

*GATE: pasa antes de la investigación. Se revisó de nuevo después del diseño.*

| # | Principio | Antes | Después | Cómo se cumple |
|---|---|---|---|---|
| I | App Router, Server Components, islas hoja | ✅ | ✅ | `SiteHeader` sigue siendo Server Component; `MobileNav` sigue siendo la única isla. La home **pierde** la isla `QuoteRequestModal` y su chunk. La lista del hero es HTML del servidor. |
| II | Copy en la capa de contenido | ✅ | ✅ | Etiqueta del CTA, links del menú, funciones del hero y respuesta de la FAQ viven en `lib/content/*`. Contacto desde `siteConfig`. |
| III | Contratos tipados, sin `any` | ✅ | ✅ | Nuevo tipo `HeroHighlight` en `lib/content/types.ts`; props del header más chicos. |
| IV | Accesibilidad y rendimiento | ✅ | ✅ | Objetivos táctiles ≥ 44 px en todos los links nuevos; foco visible; sin animaciones nuevas; el hero **no suma imágenes**. Riesgo de pliegue en mobile → R2. |
| V | Aislamiento de secciones | ✅ | ✅ | La lista del hero vive dentro de `sections/home/hero.tsx`; ninguna sección importa a otra. |
| VI | HTML semántico y headings | ✅ | ✅ | La lista de funciones es un `<ul>` (sin encabezados nuevos); al sacar la sección de compatibilidad no se saltea ningún nivel (cada `section` conserva su `h2`). |
| VII | SEO y GEO por defecto | ✅ | ✅ | Se actualiza `lastModified` de `/` en `app/sitemap.ts` y la descripción de la home en `public/llms.txt`; `createMetadata` de la home no cambia. |
| VIII | Tailwind canónico y tokens | ✅ | ✅ | Solo clases de la escala y tokens existentes; sin hex ni valores arbitrarios. |

**Resultado**: sin violaciones. *Complexity Tracking* no aplica.

## Project Structure

### Documentación de esta feature

```text
specs/210-header-hero-clarity/
├── plan.md                         # Este archivo
├── research.md                     # Fase 0: hallazgos del relevamiento y decisiones D1–D14
├── data-model.md                   # Fase 1: modelo de contenido (tipos y constantes)
├── quickstart.md                   # Fase 1: cómo verificar
├── contracts/
│   ├── header-nav.md               # Fase 1: links, orden, visibilidad por ancho, excepciones
│   └── quote-entry-points.md       # Fase 1: puntos de entrada de presupuesto + evento de analítica
├── checklists/requirements.md
└── tasks.md                        # Lo genera /speckit-tasks (NO este comando)
```

### Código fuente (raíz del repositorio)

```text
lib/
├── content/
│   ├── site.ts                     # M — única lista del menú; `quoteLink` con la etiqueta única; sin "Compatibilidad" ni `blogLink` aparte
│   ├── home.ts                     # M — quita `hero.quoteLink` (el hero ya no tiene CTA de presupuesto) y `compatibility`; suma `hero.highlights`
│   ├── presupuesto.ts              # M — `section.ctaLabel` sale de `quoteLink`; se elimina `section.pageLink`
│   ├── faq.ts                      # M — respuesta de "autos compatibles" con vía de contacto (FR-014b)
│   └── types.ts                    # M — tipo `HeroHighlight`
├── analytics/
│   └── events.ts                   # M — evento `quote_cta_clicked` + valores cerrados de `placement`
└── seo/                            # sin cambios (el esquema de la home no menciona la sección)

components/
├── layout/
│   ├── site-header.tsx             # M — sin `showSectionLinks`/`secondary`; una sola lista; menú hasta `xl` en todas las páginas
│   ├── mobile-nav.tsx              # M — sin `hideFrom`; recibe la lista única
│   └── page-shell.tsx              # M — sin `showSectionLinks`/`secondary`
├── analytics/
│   └── analytics-events.tsx        # M — acepta `data-analytics-quote-placement` (lista cerrada)
└── sections/home/
    ├── hero.tsx                    # M — sin CTA de presupuesto; lista de funciones (Fase B)
    ├── quotes.tsx                  # M — botón a `/pedido` (Link) en lugar de `QuoteRequestModal`; sin el link redundante
    └── compatibility.tsx           # E — se elimina

app/
├── page.tsx                        # M — sin `CompatibilitySection`
├── sitemap.ts                      # M — `lastModified` de `/`
├── blog/page.tsx                   # M — quita `secondary`
├── blog/[category]/page.tsx        # M — quita `secondary`
├── blog/[category]/[slug]/page.tsx # M — quita `secondary`
└── proveedores/page.tsx            # M — quita `secondary` (conserva `cta`)

public/
├── llms.txt                        # M — la descripción de "Inicio" deja de nombrar la compatibilidad como sección
└── mockup/obd2-connector.webp      # E — solo si una búsqueda confirma que ningún otro archivo la usa (ver D8)

scripts/
└── site-nav/
    └── check-header.mjs            # A — compara los links del <header> de cada página contra un servidor en marcha
```

`M` modificado · `A` agregado · `E` eliminado. Las páginas que ya usan `PageShell` sin overrides (`sobre-nosotros`, `support`, `eliminar-cuenta`, `terminos`, `privacidad`, `pedido`) **no se tocan** salvo que su llamada pase `secondary`/`showSectionLinks`, lo que el compilador va a señalar.

**Structure Decision**: sitio único de Next.js; la lógica no vive en módulos nuevos sino en los existentes de `layout/` y `lib/content/`. No se crea ningún componente reutilizable nuevo: la lista del hero es parte de `hero.tsx` (Constitución V).

## Fases

### Fase 0 — Spike (30 minutos, antes de tocar nada)

- **S1**: confirmar en `node_modules/next/dist/docs/` y con una prueba local que `next/link` hacia `/#faq` desde `/blog` carga la home **y** baja a la sección (el `scroll-behavior` y el header `sticky` pueden tapar el título). Resultado a registrar en `research.md` D2.

### Fase A — Prioridad 1: US1 + US3 + US4 (una sola entrega)

Van juntas porque tocan los mismos archivos (`site.ts`, `site-header.tsx`, `mobile-nav.tsx`) y se verifican con la misma lista.

1. **Contenido**: `site.ts` con la lista única y la etiqueta única; `home.ts` sin `quoteLink` ni `compatibility`; `presupuesto.ts` sin `pageLink`.
2. **Header**: `SiteHeader`, `MobileNav`, `PageShell` sin los props que permitían divergir; ajustar los 4 llamadores que los usan (blog ×3, proveedores).
3. **Presupuesto**: `quotes.tsx` y el header apuntan a `/pedido`; el hero no tiene CTA de presupuesto; se miden con el evento nuevo (D6).
4. **Compatibilidad**: se quita `CompatibilitySection` de la home, se borra el componente, se reescribe la respuesta de la FAQ y la línea de `llms.txt`.
5. **SEO/GEO**: `lastModified` de `/` en el sitemap; revisar que ningún archivo mencione `#compatibilidad`.
6. **Verificación**: `scripts/site-nav/check-header.mjs` + lista del quickstart.

### Fase B — Prioridad 2: US2, hero con funciones

Se construye detrás de **la confirmación de producto sobre multas** (R1). Si no llega, se publica la Fase A sola y el hero conserva su texto actual.

1. `hero.highlights` en `home.ts` (cuatro ítems, orden por ingresos potenciales).
2. Lista en `hero.tsx` sin imágenes ni animaciones.
3. Verificar el pliegue en 375×667 (R2).

### Fase C — Limpieza (opcional, solo si la búsqueda da cero importadores)

Código que queda sin uso al sacar el modal de la home: `components/quote-modal/`, `components/quote-flow/quote-flow.tsx` y compañía, y el valor `modal` de `QUOTE_FLOWS`. **No se borra en la Fase A**: el CSS del autocompletado y las constantes de WhatsApp se comparten con `/pedido`. Detalle y criterio en D5.

## Riesgos

| # | Riesgo | Impacto | Mitigación |
|---|---|---|---|
| R1 | No se puede verificar desde el código que **multas** esté disponible para todos los usuarios de la versión publicada | Una promesa falsa en el hero (Constitución: no inventar claims) | Fase B gateada por la confirmación de producto; si no llega, esa frase se retira y la lista queda con tres ítems |
| R2 | La lista del hero empuja los botones de descarga **fuera de la primera pantalla** en mobile (la descarga es el éxito de la superficie) | Baja de instalaciones | Lista compacta (una línea por ítem); criterio de aceptación: los botones de tienda siguen visibles en 375×667. Si no entran, la lista pasa **debajo** de los botones en mobile |
| R3 | El ancho: la etiqueta más larga ("Pedí tu presupuesto") + 3 anclas + Blog + "Soy proveedor" + CTA debe entrar en 1280 px (`xl`) | Links que se parten o se pisan | Medir en 1280, 1366 y 1440; si no entra, las anclas pasan al menú hasta `2xl` (D2) |
| R4 | Se pierde la conversión del modal (un paso menos de fricción en la home) | Caída de pedidos desde la home | Evento nuevo `quote_cta_clicked` por ubicación **antes de publicar**, y el seguimiento de SC-006; el plan de vuelta atrás es revertir `quotes.tsx` |
| R5 | La comparación histórica de `quote_started` se corta: antes los pedidos de la home eran `flow: "modal"`, ahora serán `flow: "page"` | Reportes de PostHog/Meta engañosos | Documentado en [contracts/quote-entry-points.md](./contracts/quote-entry-points.md); avisar al responsable de marketing el día del cambio |
| R6 | La home pierde el camino "Consultanos por WhatsApp" que ofrecía la sección de compatibilidad | Menos consultas del escáner | La FAQ nombra el correo y el pie ya tiene WhatsApp; **alternativa** si producto la quiere más a mano: un botón en `DiagnosticsSection`. No se hace sin pedido |
| R7 | Conflicto de archivos con la #209 en la misma rama (`lib/content/site.ts` lo toca la tarea T062 de la 209; `site-header.tsx` lo usa T030) | Merge manual | La 210 va **antes** que T030/T062 de la 209; commits con prefijo propio (`feat(landing)`) |
| R8 | `/pedido` ignora los parámetros de la URL (la 209 planea `?origen=perfil&proveedor=`) | Atribución perdida en la 209 | Fuera de alcance de la 210; se anota en D12 para que la 209 lo resuelva |

## Re-evaluación de la Constitución tras el diseño

Sin cambios respecto del cuadro de arriba: no se sumó ninguna dependencia, ninguna isla de cliente ni ningún valor fuera de los tokens. El único archivo nuevo (`scripts/site-nav/check-header.mjs`) es una herramienta de verificación que no se empaqueta con la app.
