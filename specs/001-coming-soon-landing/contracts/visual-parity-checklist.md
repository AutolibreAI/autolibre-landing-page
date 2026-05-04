# Visual Parity Checklist: Coming Soon Landing

## Section Order

- [x] Hero renderiza primero
- [x] Form section renderiza segundo
- [x] Verticals renderiza tercero
- [x] Final CTA renderiza cuarto
- [x] Footer renderiza al final

## Typography and Color

- [x] Titulo principal con highlight cian en hero
- [x] Copy principal con color de texto secundario consistente
- [x] CTA primaria con mayor contraste visual que CTA secundaria
- [x] Estado de verticales con chips de alto contraste

## Responsive Matrix

| Viewport | Hero | Form | Verticals | Footer | Status |
|---|---|---|---|---|---|
| 1440x900 | Sin overlap | Grid 2 columnas | Grid 2 columnas | Links visibles | PASS |
| 1024x768 | Sin clipping | Grid 2 columnas | Grid 2 columnas | Wrap correcto | PASS |
| 768x1024 | Stack vertical | Stack vertical | Stack vertical | Wrap correcto | PASS |
| 390x844 | Stack vertical | Inputs legibles | Cards legibles | Legal legible | PASS |

## Assets and Fallbacks

- [x] `public/landing/app-preview.svg` visible en hero
- [x] `public/landing/roadmap-glow.svg` visible en verticals
- [x] Fallback visual activo si no carga preview de hero
- [x] Fallback visual activo si no carga decorativo de verticales
