# Quickstart: Coming Soon Landing

## Prerequisites

- Node.js LTS instalado.
- Dependencias instaladas en el proyecto.

## Run locally

1. Instalar dependencias:
   - `npm install`
2. Iniciar entorno local:
   - `npm run dev`
3. Abrir en navegador:
   - `http://localhost:3000`

## Implementation flow

1. Revisar `AutoLibre_ComingSoon_Template.jsx` y mapear secciones a componentes de `app/page.tsx`.
2. Crear o extender componentes de marca en `components/` usando base de shadcn/ui.
3. Trasladar tokens visuales necesarios a `app/globals.css` (tipografías, colores, espaciado, efectos).
4. Montar la composición final en `app/page.tsx` respetando orden y jerarquía de la referencia.
5. Verificar comportamiento responsive en mobile y desktop.

## Assets convention

- Guardar assets de la landing en `public/landing/`.
- Usar nombres descriptivos: `app-preview.svg`, `roadmap-glow.svg`, etc.
- Mantener fallback visual en componentes para assets no críticos.

## Validation checklist

- Estructura de secciones coincide con la referencia.
- Tipografía, spacing y colores cumplen checkpoints visuales definidos.
- Mensaje "coming soon" y CTA principal son claramente visibles.
- No hay elementos superpuestos o texto ilegible en viewports objetivo.
- `npm run lint` no reporta errores nuevos.

## Final validation flow

1. `npm run dev`
2. Revisar paridad visual usando `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`
3. Probar viewports 1440x900, 1024x768, 768x1024 y 390x844
4. Ejecutar `npm run lint`

## Out of scope (current feature)

- Integración backend de waitlist.
- Automatización de visual diff.
- Localización completa multilenguaje.
