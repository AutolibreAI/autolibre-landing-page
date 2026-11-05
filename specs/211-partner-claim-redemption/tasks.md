---

description: "Lista de tareas de la feature 211: reclamo de taller por código"
---

# Tasks: Reclamo de taller por código

**Input**: Documentos de diseño en `/specs/211-partner-claim-redemption/`
**Prerequisites**: plan.md, spec.md, research.md (D1–D10), data-model.md, contracts/partner-claims-api.md, quickstart.md

**Tests**: Sí, pedidos en el plan (research D10): `node --test` sobre el módulo puro `lib/partner-claims/redeem.ts`. El flujo con Clerk se prueba a mano según `quickstart.md`.

**Organization**: Tareas agrupadas por historia de usuario (spec.md) para implementar y probar cada una por separado.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia a la que pertenece (US1, US2, US3)

## Path Conventions

Proyecto único (landing Next.js) en la raíz del repo: `app/`, `components/`, `lib/`, `scripts/`.

---

## Phase 1: Setup (infraestructura compartida)

**Purpose**: Dependencia nueva y su registro en la constitución

- [X] T001 Instalar `@clerk/nextjs@^7` (`npm install @clerk/nextjs@^7`) y verificar que queda en `dependencies` de `package.json`
- [X] T002 [P] Sumar `@clerk/nextjs` a la sección Technology Stack de `.specify/memory/constitution.md` con su justificación (bump MINOR 1.1.0 → 1.2.0 + bloque Sync Impact Report)

---

## Phase 2: Foundational (prerequisitos que bloquean las historias)

**Purpose**: Reservar la ruta y dejar el copy y el módulo puro listos

**⚠️ CRITICAL**: Ninguna historia arranca antes de terminar esta fase

- [X] T003 Agregar `"reclamar"` a `RESERVED_PROFILE_SLUGS` y exportar `PROVEEDORES_RECLAMAR_PATH` en `lib/proveedores/query.ts`; correr `npm run test:proveedores` (research D6)
- [X] T004 [P] Crear el copy de la pantalla de canje y sus mensajes en `lib/content/partner-claim.ts` (metadata, `<h1>`, label, botón, éxito con y sin nombre, un mensaje por cada `kind` de `RedeemResult`)

**Checkpoint**: Ruta reservada y copy disponible

---

## Phase 3: User Story 1 - Canjear el código y quedar como dueño del taller (Priority: P1) 🎯 MVP

**Goal**: En `/proveedores/reclamar` el usuario inicia sesión (o crea cuenta) con Clerk, escribe el código y ve "¡Listo! Ya administrás {taller}".

**Independent Test**: Con un código válido, entrar directo a `/proveedores/reclamar`, iniciar sesión, canjear y ver la confirmación con el nombre del taller (quickstart.md § 3).

### Tests for User Story 1

- [X] T005 [P] [US1] Tests de `validateCode` (trim, vacío, 1..32 caracteres), `parseRedeemResponse` (201/400/401/404/429/5xx/JSON inválido, `x-request-id`) y `pickPartnerName` en `scripts/partner-claims/redeem.test.ts`, con el script `test:partner-claims` en `package.json` y `scripts/partner-claims/tsconfig.json` (patrón de `test:proveedores` / `typecheck:provider-profile`)

### Implementation for User Story 1

- [X] T006 [US1] Módulo puro `lib/partner-claims/redeem.ts`: `validateCode`, `buildRedeemBody`, `parseRedeemResponse` (unión discriminada `RedeemResult`, 404 siempre `invalid-code`), `parseMemberships`, `pickPartnerName`. Autocontenido (sin alias `@/`), sintaxis TS borrable. Correr `npm run test:partner-claims` hasta que pase
- [X] T007 [US1] Cliente browser `lib/partner-claims/client.ts`: `redeemClaimCode(code, getToken)` (POST `/partner-claims/redemptions`) y `fetchPartnerName(partnerId, getToken)` (GET `/partners/me/memberships`), con `Authorization: Bearer`, `credentials: "omit"`, red/CORS ⇒ `unknown`, sin `NEXT_PUBLIC_AUTOLIBRE_API_URL` ⇒ `unknown` + `console.error`
- [X] T008 [US1] `app/proveedores/reclamar/layout.tsx`: `<ClerkProvider>` (estático, sin `dynamic`) acotado al segmento; `app/layout.tsx` NO se toca (research D3)
- [X] T009 [US1] Isla client `components/proveedores/claim/claim-form.tsx`: sin sesión ⇒ `<SignIn routing="hash" withSignUp forceRedirectUrl signUpForceRedirectUrl>`; con sesión ⇒ formulario con label visible, input ≥ 16px, botón deshabilitado mientras envía, región `aria-live`, código conservado en errores, 401 ⇒ pedir sesión de nuevo conservando el código, éxito con nombre o sin nombre
- [X] T010 [US1] Página server `app/proveedores/reclamar/page.tsx`: `createMetadata({ ..., path: "/proveedores/reclamar", index: false })`, `PageShell`, un único `<h1>`, `Section` con `aria-labelledby`, monta la isla. Sin JSON-LD, fuera de `app/sitemap.ts` y `public/llms.txt`, sin `Disallow` en `app/robots.ts` (research D8)
- [X] T011 [US1] (Resuelto por análisis del código de Clerk; la prueba con `curl` queda pendiente, ver research D4) Verificar con el dev server y `curl` si el `<ClerkProvider>` anidado funciona sin `proxy.ts`; sumar `proxy.ts` con `clerkMiddleware()` y matcher `/proveedores/reclamar(.*)` SOLO si hace falta (research D4). Registrar el resultado en `research.md` D4

**Checkpoint**: El canje funciona de punta a punta entrando por el link directo

---

## Phase 4: User Story 2 - Pedir el código desde el perfil del taller (Priority: P2)

**Goal**: El perfil público muestra "¿Es tu taller? Pedí tu código", que abre WhatsApp hacia AutoLibre con el nombre y el slug del taller.

**Independent Test**: En `/proveedores/<slug>`, "Pedí tu código" abre wa.me de AutoLibre con el texto precargado; el HTML del perfil no tiene nada de Clerk.

### Implementation for User Story 2

- [X] T012 [P] [US2] Sumar `claimCta` (heading, bajada, labels y `whatsappText(name, slug)`) a `lib/content/partner-profile.ts`
- [X] T013 [US2] Componente server `components/proveedores/profile/partner-claim-cta.tsx`: `<aside>` secundario con `<h2>` "¿Es tu taller?" y link "Pedí tu código" vía `whatsappUrl()` de `lib/whatsapp.ts`
- [X] T014 [US2] Montar `<PartnerClaimCta>` al final de la columna principal del cuerpo del perfil desde `app/proveedores/[slug]/page.tsx` (prop `children` de `components/proveedores/profile/partner-profile-body.tsx`); nunca en la sticky bar ni compitiendo con el WhatsApp del negocio

**Checkpoint**: US1 y US2 funcionan por separado

---

## Phase 5: User Story 3 - Llegar a la pantalla de canje con el código en la mano (Priority: P3)

**Goal**: Desde el perfil se llega a `/proveedores/reclamar` en un toque.

**Independent Test**: "Ya tengo mi código" en cualquier perfil lleva a `/proveedores/reclamar`; el link directo funciona sin pasar por un perfil.

### Implementation for User Story 3

- [X] T015 [US3] Agregar el link "Ya tengo mi código" (`next/link` a `PROVEEDORES_RECLAMAR_PATH`) en `components/proveedores/profile/partner-claim-cta.tsx`, con su label en `lib/content/partner-profile.ts`

**Checkpoint**: Las tres historias funcionan de forma independiente

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T016 (PENDIENTE: el dev server del usuario estaba colgado, ver research D4) Verificar con `curl` que el HTML de `/proveedores/<slug>` no tiene referencias a Clerk y que `/proveedores/reclamar` trae `noindex, nofollow` (SC-004, SC-005)
- [X] T017 [P] `npx eslint` sobre los archivos tocados y `npx tsc --noEmit` del proyecto; corregir errores propios
- [X] T018 [P] Documentar en `research.md` los desvíos del plan (props de Clerk v7, ubicación de los tests)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias
- **Foundational (Phase 2)**: depende de Setup; bloquea todas las historias
- **US1 (Phase 3)**: depende de Foundational. T006 antes de T007 y T009; T008 antes de T011
- **US2 (Phase 4)**: depende de Foundational (T003 para la ruta); independiente de US1
- **US3 (Phase 5)**: depende de T013 (mismo archivo); la pantalla destino es de US1
- **Polish (Phase 6)**: depende de las historias completas

### Parallel Opportunities

- T002 en paralelo con T001
- T004 en paralelo con T003
- T005 (tests) en paralelo con T012 (copy del perfil)

---

## Parallel Example: User Story 1

```bash
Task: "Tests del módulo puro en scripts/partner-claims/redeem.test.ts"
Task: "Copy de claimCta en lib/content/partner-profile.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational
2. US1 completa → probar el canje con el link directo (quickstart.md)
3. **STOP and VALIDATE**

### Incremental Delivery

1. US1 → canje funcionando (MVP: el equipo manda el link directo)
2. US2 → descubrimiento desde el perfil
3. US3 → acceso directo desde el perfil para quien ya tiene el código
