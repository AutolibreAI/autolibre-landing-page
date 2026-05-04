# UI Contract: Coming Soon Landing

## Purpose

Definir el contrato funcional de la interfaz de la landing para asegurar consistencia entre diseño, implementación y QA.

## Route Contract

- **Route**: `/`
- **Render Type**: Página pública estática renderizable en cliente web moderno.
- **Availability**: Sin autenticación requerida.

## Section Contract

La página MUST incluir, en este orden lógico:

1. `hero`
2. `form-section` (o bloque principal de CTA equivalente aprobado)
3. `verticals`
4. `final-cta`
5. `footer`

## Content Contract

- Debe comunicar explícitamente estado "coming soon".
- Debe incluir al menos una acción principal visible.
- Debe preservar naming y tono de marca AutoLibreAI.
- Evidencia actual: copy principal y badge "COMING SOON" implementados en `app/page.tsx` y `lib/landing-content.ts`.

## Visual Contract

- Tipografía, espaciado, colores y jerarquía visual deben alinearse con la referencia aprobada.
- La CTA principal debe destacar visualmente sobre acciones secundarias.
- El layout debe mantenerse legible y sin solapamientos en mobile y desktop.
- Evidencia actual: checklist de verificación en `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`.

## Accessibility Contract

- Navegación por teclado funcional en acciones interactivas.
- Contraste de texto suficiente para lectura de contenido principal.
- Imágenes relevantes con texto alternativo descriptivo.

## Failure Handling Contract

- Si faltan assets no críticos, el contenido principal debe seguir visible.
- Fallas visuales no deben bloquear lectura del mensaje principal ni acceso a CTA.
