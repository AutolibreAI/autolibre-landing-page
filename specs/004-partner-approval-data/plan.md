# Implementation Plan: Completar los datos del partner que hoy se cargan a mano después de aprobar

**Branch**: `004-partner-approval-data` | **Date**: 2026-09-22 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-partner-approval-data/spec.md`

**Nota de alcance**: este repo (`autolibre-landing-page`) es un cliente HTTP puro de `partner_applications` — `app/api/provider/route.ts` llama a `submitPartnerApplication()` (`lib/autolibre-api.ts`), que hace `POST ${apiBaseUrl()}/api/v1/partner-applications` contra el backend NestJS (`autolibre-backend-hex`, repo separado, no incluido en este working directory). Este repo no toca Postgres directamente. Este plan cubre lo que se implementa **acá**: captura de datos en el formulario público y el contrato que este repo empieza a mandarle al backend. La transferencia de esos datos a `partners` en `approve_partner_application()` es trabajo del otro repo — ver `contracts/partner-application-submission.md` para lo que ese repo necesita aceptar.

## Summary

El formulario de `/proveedores` (`components/forms/provider-form.tsx`) captura la dirección como texto libre y no pide horarios ni modalidad de atención. Este trabajo agrega autocompletado de Google Places (direcciones puntuales, `types: ["address"]`) para obtener geocode real, y dos campos nuevos (horarios, modalidad), reusando el patrón ya productivo de `components/quote-flow/use-quote-flow.ts` (que resuelve zonas con Places para el flujo de presupuesto). El enfoque técnico: extraer la lógica de Places hoy privada de `use-quote-flow.ts` a un módulo compartido (`lib/google-places.ts`), para que ambos formularios la reusen sin duplicar ~80 líneas de tipos y manejo de geocode; y extender `PartnerApplicationSubmission` / el body de `POST /api/provider` con los campos nuevos.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode), Next.js 16.2.4 (App Router), React 19 (Server Components por defecto, `"use client"` solo donde hay interactividad)
**Primary Dependencies**: Google Maps JavaScript API — librería `places`, cargada vía `next/script` (sin paquete npm nuevo, mismo patrón que `components/quote-flow/quote-flow.tsx`); cliente HTTP propio en `lib/autolibre-api.ts` hacia el backend NestJS
**Storage**: N/A en este repo — la persistencia de `partner_applications` vive en Postgres del backend (`autolibre-backend-hex`), fuera de este working directory
**Testing**: No hay framework de test automatizado en este repo (sin `vitest`/`jest`/`playwright` en `package.json`). Verificación vía `next build` (0 errores TS/ESLint, gate de la constitución) + QA manual del flujo en el browser
**Target Platform**: Web — navegadores de escritorio y mobile, sin distinción de plataforma nativa
**Project Type**: Web (Next.js App Router, proyecto único, sin monorepo backend/frontend en este repo)
**Performance Goals**: Core Web Vitals de la constitución (LCP < 2.5s, CLS < 0.1, INP < 200ms) en `/proveedores`; el script de Google Maps se carga con `strategy="afterInteractive"` para no bloquear el render inicial, igual que en el modal de presupuesto
**Constraints**: Sin dependencias npm nuevas (Places se carga por `<Script>`, no por paquete — no requiere actualizar la sección "Technology Stack" de la constitución); WCAG 2.1 AA en los campos nuevos; no romper el contrato existente de `/api/provider` para los campos ya soportados
**Scale/Scope**: Un formulario público (`/proveedores`), volumen bajo y proporcional a altas de talleres — sin requisitos de escala particulares

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principio | Evaluación |
|---|---|
| I. Next.js App Router First | **PASS** — cambios en `components/forms/provider-form.tsx` (ya `"use client"`) y `app/api/provider/route.ts` (ya App Router route handler). No se toca Pages Router. |
| II. Content-Driven Architecture | **PASS con condición** — todo copy nuevo (labels de horarios, modalidad, placeholder de dirección) va a `lib/content/providers.ts`, no hardcodeado en el componente. Se verifica en Phase 1. |
| III. Typed Component Contracts | **PASS con condición** — los tipos nuevos (`PlaceGeo` reusado, `PartnerHours`, `PartnerModality`) se declaran explícitamente; se extiende `PartnerApplicationSubmission` en `lib/autolibre-api.ts` sin `any`. |
| IV. Accessibility and Performance (NON-NEGOTIABLE) | **PASS con condición** — el input de dirección mantiene `<label>`/`htmlFor` (Google Autocomplete es progressive enhancement sobre un `<input>` normal); los campos de horarios/modalidad reusan los mismos primitivos accesibles (`Field`, `ChoicePill`/`Select`) que el resto del formulario. Sin `next/image` involucrado. Script `afterInteractive` no afecta LCP. |
| V. Section Isolation | **N/A** — aplica a `components/landing/*`; `provider-form.tsx` vive en `components/forms/`, fuera del alcance de este principio. |

Sin violaciones que requieran la tabla de Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/004-partner-approval-data/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── partner-application-submission.md
└── tasks.md              # Phase 2 output (/speckit-tasks — NOT created by this command)
```

### Source Code (repository root)

```text
autolibre-landing-page/
├── app/
│   └── api/
│       └── provider/
│           └── route.ts              # MODIFICAR: leer y reenviar campos nuevos
├── components/
│   ├── forms/
│   │   └── provider-form.tsx         # MODIFICAR: input de dirección con Places, campos de horarios/modalidad
│   └── quote-flow/
│       └── use-quote-flow.ts         # MODIFICAR: importar tipos/helpers desde el módulo compartido en vez de declararlos localmente
├── lib/
│   ├── autolibre-api.ts              # MODIFICAR: extender PartnerApplicationSubmission
│   ├── content/
│   │   └── providers.ts              # MODIFICAR: copy de los campos nuevos
│   └── google-places.ts              # NUEVO: módulo compartido (tipos, PlaceGeo, EMPTY_GEO, findAddressComponent, GOOGLE_MAPS_API_KEY)
```

**Structure Decision**: Un único proyecto Next.js (sin backend/frontend split en este repo). El único directorio nuevo es `lib/google-places.ts`, para no duplicar la lógica de Places entre `quote-flow` y `provider-form`. No se crean carpetas de test porque el repo no tiene framework de test automatizado (ver Technical Context).

## Complexity Tracking

*Sin violaciones de la constitución que justificar — tabla omitida.*
