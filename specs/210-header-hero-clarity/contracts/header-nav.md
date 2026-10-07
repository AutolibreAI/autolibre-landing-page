# Contrato: header del sitio

**Feature**: `210-header-hero-clarity` · Cubre FR-012 a FR-022 · Complementa [data-model.md](../data-model.md)

## 1. Regla

Todas las páginas con header muestran **los mismos links, en el mismo orden y con los mismos textos**, según el ancho de pantalla. Lo único que puede cambiar es el **botón de la derecha** (`cta`) y qué link lleva `aria-current="page"`.

Esto lo hace cumplir **el tipo**: `SiteHeader` y `PageShell` no aceptan `showSectionLinks` ni `secondary`.

```ts
type SiteHeaderProps = {
  readonly cta?: NavCta;           // única variación permitida
  readonly currentPath?: string;   // marca la página actual
};
```

## 2. Links y orden

| Orden | Texto | Destino | Tipo | Visible desde | En el menú móvil |
|---|---|---|---|---|---|
| 1 | Producto | `/#producto` | ancla | `xl` | sí |
| 2 | Cómo funciona | `/#como-funciona` | ancla | `xl` | sí |
| 3 | FAQ | `/#faq` | ancla | `xl` | sí |
| 4 | Blog *(solo si `BLOG_PUBLIC`)* | `/blog` | página | `xl` | sí |
| 5 | Pedí tu presupuesto | `/pedido` | página | `md` | sí |
| 6 | Soy proveedor | `/proveedores` | página | `lg` | sí |
| — | `cta` (por defecto "Descargar la app") | `/#descargar` | botón | `sm` | sí, al pie del menú |

- **No hay** link "Compatibilidad" (FR-012). Los links 1 a 4 forman la navegación "Secciones"; el 5 y el 6, la navegación "Páginas".
- El menú móvil (botón hamburguesa) se muestra por **debajo de `xl`** en **todas** las páginas y contiene los links 1 a 6 en ese orden y el `cta`.
- El logo lleva a `/` y tiene `aria-label="AutoLibre — inicio"`.
- `aria-current="page"` se marca por coincidencia exacta de `href` con `currentPath`; el subrayado acompaña al color (WCAG 1.4.1). En `/blog/**` las páginas pasan `currentPath="/blog"`.

## 3. Excepciones (lista completa)

| Página | Qué cambia | Motivo |
|---|---|---|
| `/proveedores` | `cta` = "Sumar mi negocio" (`#form`) | es la conversión de esa página |
| `/pedido` | `cta` = WhatsApp (con seguimiento) | una sola conversión en esa página |
| `/descarga` | encabezado mínimo: solo el logo (a `/`), sobre fondo oscuro; sin links ni botón | la página existe para evitar fugas (ver `app/descarga/page.tsx`) |

Cualquier otra diferencia es un **defecto** (FR-018). Páginas nuevas (p. ej. `/proveedor/[slug]` de la 209) usan `SiteHeader` sin overrides.

## 4. Accesibilidad

- Objetivos táctiles ≥ 44 px (`min-h-11`) en todos los links y en el botón del menú.
- Foco visible; `Escape` cierra el menú; el panel bloquea el scroll del fondo (comportamiento actual de `MobileNav`, sin cambios).
- El texto de cada link se entiende sin contexto (FR-015): "Producto", "Cómo funciona", "FAQ", "Blog" y "Soy proveedor" se revisaron y **no se cambian**; el único cambio de etiqueta es el del presupuesto.

## 5. Verificación

`node scripts/site-nav/check-header.mjs http://localhost:3000` recorre las rutas y compara, por página, la lista de `href` y de textos del `<header>`. Falla si hay diferencias que no figuren en la tabla de excepciones. Ver [quickstart.md](../quickstart.md).
