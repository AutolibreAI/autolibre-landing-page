# Contrato: puntos de entrada de presupuesto

**Feature**: `210-header-hero-clarity` · Cubre FR-001 a FR-006b y FR-026

## 1. Regla

El **hero no tiene** CTA de presupuesto (decisión del 2026-10-07). Todo punto de entrada de "pedir presupuesto" (header, menú, banda de la home y pie) es un **`<a href="/pedido">`** con la etiqueta **"Pedí tu presupuesto"**, que sale de `siteContent.nav.quoteLink`. Ninguno abre un formulario en una ventana superpuesta ni baja a otra sección de la home.

## 2. Puntos de entrada

| `placement` | Dónde | Elemento | Notas |
|---|---|---|---|
| `header` | header de escritorio (`md`+) | `Link` de texto | |
| `header_menu` | menú móvil | `Link` de texto | cierra el menú al tocarlo |
| `home_quotes` | banda de presupuesto de la home | `ButtonLink` | junto al botón de WhatsApp; **sin** el link de texto redundante |
| `footer` | grupo "Servicios" del pie | `Link` de texto | |

En `/pedido` el link del header lleva `aria-current="page"`; no es un punto de entrada medido.

## 3. Qué recibe la persona al llegar a `/pedido`

Sin cambios en `/pedido`: en escritorio, el formulario está visible en el hero; en pantallas angostas, el hero ofrece WhatsApp y "Quiero que me contacten", que abre el formulario. Los pasos, el ejemplo y la FAQ siguen en la misma página (FR-005).

## 4. Analítica

### Evento nuevo en el catálogo (`lib/analytics/events.ts`)

```ts
ANALYTICS_EVENTS.quoteCtaClicked = "quote_cta_clicked"; // Click en un CTA de presupuesto. Solo PostHog.

export const QUOTE_CTA_PLACEMENTS = {
  header: "header",
  headerMenu: "header_menu",
  homeQuotes: "home_quotes",
  footer: "footer",
} as const;
export type QuoteCtaPlacement = (typeof QUOTE_CTA_PLACEMENTS)[keyof typeof QUOTE_CTA_PLACEMENTS];

// AnalyticsEventProps
quote_cta_clicked: { placement: QuoteCtaPlacement };

// ANALYTICS_CATALOG
quote_cta_clicked: { posthog: "client", meta: () => null, clickable: true },
```

### Atributos en el HTML

`data-analytics-event="quote_cta_clicked"` + `data-analytics-quote-placement="<placement>"`. El listener delegado de `components/analytics/analytics-events.tsx` lee `data-analytics-quote-placement`, lo valida contra `QUOTE_CTA_PLACEMENTS` y lo manda como `placement`; **cualquier otro valor se descarta** (el evento sale sin prop, igual que con `lead_source` y `store`). Nunca datos personales.

### Qué NO cambia

- `whatsapp_clicked`, `app_store_clicked`, `quote_started`, `quote_step_viewed`, `quote_submitted`, `quote_failed` y sus mapeos a Meta.
- La optimización de campañas sobre `Lead`: `quote_cta_clicked` **no** va a Meta (`meta: () => null`).

### Corte en las series históricas (R5)

| Antes | Después |
|---|---|
| Un pedido iniciado desde la home generaba `quote_started { flow: "modal" }` | Genera `quote_started { flow: "page" }` en `/pedido` (el modal ya no se abre desde ningún lado) |
| `quote_submitted { flow: "modal" }` para los de la home | `quote_submitted { flow: "page", lead_source: "form" }` |

Los reportes que comparen `flow: "modal"` con `flow: "page"` pasan a mostrar solo `page` desde el día del cambio. Hay que avisar a quien los mire. La base de comparación para SC-006 se toma de los **14 días anteriores** al cambio, sumando `modal` + `page`.

## 5. Verificación

1. Cada punto de entrada de la tabla genera **un** `quote_cta_clicked` con el `placement` correcto (consola de PostHog de prueba).
2. Un `data-analytics-quote-placement="inventado"` no agrega el prop pero el evento sale igual.
3. `grep -rn "QuoteRequestModal" app components` no devuelve usos en páginas.
