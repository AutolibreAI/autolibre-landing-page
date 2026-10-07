# Modelo de contenido: header y hero

**Feature**: `210-header-hero-clarity` · **Plan**: [plan.md](./plan.md)

No hay datos persistentes ni backend. Las "entidades" de la spec son **constantes tipadas en la capa de contenido** (`lib/content/*`); acá se fija su forma para que las tareas no tengan que adivinarla.

## 1. `NavLink` (existente, `lib/content/types.ts`)

```ts
type NavLink = { readonly label: string; readonly href: string };
```

Sin cambios. Se reutiliza para todos los links del menú y del pie.

## 2. Lista maestra del menú (`siteContent.nav`, `lib/content/site.ts`)

Una sola fuente. Los tres consumidores (header de escritorio, menú móvil, pie) **derivan** de ella.

```ts
const quoteLink = { label: "Pedí tu presupuesto", href: "/pedido" } as const; // FR-002
const blogLink  = { label: "Blog", href: "/blog" } as const;

siteContent.nav = {
  /** Anclas de la home + Blog. Visibles desde `xl`; en el menú móvil debajo. */
  links: [
    { label: "Producto",      href: "/#producto" },
    { label: "Cómo funciona", href: "/#como-funciona" },
    { label: "FAQ",           href: "/#faq" },
    ...(BLOG_PUBLIC ? [blogLink] : []),
  ] satisfies readonly NavLink[],
  /** Links a páginas. Visibles desde `md`. */
  quoteLink,
  providerLink: { label: "Soy proveedor", href: "/proveedores" },
  /** Botón de la derecha por defecto (descarga). Las páginas pueden pasar otro `NavCta`. */
  cta: { label: "Descargar la app", href: "/#descargar" },
  downloadTargets: { /* sin cambios */ },
};
```

Cambios respecto de hoy: se **quita** "Compatibilidad"; se **quita** `nav.blogLink` (el Blog pasa a ser parte de `links` en todas las páginas, no solo en la home); `quoteLink` cambia de etiqueta.

**Invariante**: ninguna página puede alterar `links`, `quoteLink` ni `providerLink`. El único punto de variación permitido es el `cta` (tipo `NavCta`).

## 3. `NavCta` (existente)

Sin cambios de forma. Excepciones declaradas:

| Página | `cta` |
|---|---|
| (default) | `siteContent.nav.cta` — "Descargar la app" |
| `/proveedores` | `{ label: "Sumar mi negocio", href: "#form" }` |
| `/pedido` | WhatsApp, con `tracking` (ya existe) |

## 4. Punto de entrada de presupuesto

No es un tipo nuevo: es **un uso del mismo `quoteLink`** más un `placement` de analítica.

| `placement` | Dónde | Elemento |
|---|---|---|
| `header` | header de escritorio (`md`+) | `Link` de texto |
| `header_menu` | menú móvil | `Link` de texto |
| `home_quotes` | banda de presupuesto de la home | `ButtonLink` |
| `footer` | pie | `Link` de texto |

Lista cerrada: `QUOTE_CTA_PLACEMENTS` en `lib/analytics/events.ts` (ver [contracts/quote-entry-points.md](./contracts/quote-entry-points.md)).

## 5. `HeroHighlight` (nuevo, `lib/content/types.ts`)

```ts
export type HeroHighlight = {
  readonly id: string;           // "highlight-presupuestos"
  readonly icon: IconName;       // del set existente: "receipt" | "car" | "clock" | "alert"
  readonly text: string;         // voseo, ≤ 7 palabras
};
```

Contenido en `homeContent.hero.highlights` (orden = orden de aparición):

```ts
highlights: [
  { id: "highlight-presupuestos", icon: "receipt", text: "Pedí presupuestos y compará talleres" },
  { id: "highlight-diagnostico",  icon: "car",     text: "Entendé qué le pasa a tu auto" },
  { id: "highlight-mantenimiento", icon: "clock",  text: "Mantené tu auto al día" },
  { id: "highlight-multas",       icon: "alert",   text: "Enterate si tenés multas" },   // R1: se retira si producto no confirma
] satisfies readonly HeroHighlight[],
```

Reglas (FR-010, FR-010b): ningún texto promete ahorro, reducción ni financiación; ninguno afirma cobertura nacional ni "sin multas".

## 6. Cambios en el resto de `homeContent`

| Clave | Cambio |
|---|---|
| `hero.quoteLink` | **eliminada**: el hero no tiene CTA de presupuesto (decisión del 2026-10-07) |
| `hero.highlights` | nuevo (arriba) |
| `hero.subtitle` | se acorta para no duplicar la lista (Fase B; a aprobar) |
| `compatibility` | **eliminada** |

## 7. Cambios en `presupuestoContent.section`

| Clave | Cambio |
|---|---|
| `ctaLabel` | eliminada (sale de `siteContent.nav.quoteLink`) |
| `pageLink` | eliminada (FR-006b) |
| `whatsapp` | sin cambios |
| `titleLines`, `subtitle` | sin cambios |

## 8. FAQ

`faq-autos-compatibles` (en `lib/content/faq.ts`): la respuesta termina con la vía de contacto armada con `siteConfig.contact.email`. El resto de las respuestas no cambia.
