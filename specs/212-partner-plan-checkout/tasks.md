---

description: "Lista de tareas de la feature 212: contratar un plan de proveedor desde la landing"
---

# Tasks: Contratar un plan de proveedor desde la landing

**Input**: Documentos de diseño en `/specs/212-partner-plan-checkout/`
**Prerequisites**: plan.md, spec.md, research.md (D1–D13), data-model.md, contracts/billing-api.md, quickstart.md

**Tests**: Sí (research D12): `node --test` sobre los módulos puros de `lib/partner-billing/`. Los flujos con Clerk y Mercado Pago se prueban a mano según `quickstart.md`.

**Organization**: Tareas agrupadas por historia de usuario. US3 se rediseñó el 2026-11-04 (registro con dueño, research D16–D18) y sus tareas están en la Phase 4c.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: Historia a la que pertenece (US1, US2)

## Path Conventions

Proyecto único (landing Next.js) en la raíz del repo: `app/`, `components/`, `lib/`, `scripts/`.

---

## Phase 1: Setup

- [X] T001 Scripts `test:partner-billing` y `typecheck:partner-billing` en `package.json` y `scripts/partner-billing/tsconfig.json` (patrón de `partner-claims`)
- [X] T002 [P] Apuntar el bloque SPECKIT de `.cursor/rules/specify-rules.mdc` a `specs/212-partner-plan-checkout/plan.md`
- [X] T003 [P] Ampliar la entrada de `@clerk/nextjs` de `.specify/memory/constitution.md` a `/proveedores/contratar` (PATCH 1.2.0 → 1.2.1)

---

## Phase 2: Foundational

**⚠️ CRITICAL**: Ninguna historia arranca antes de terminar esta fase

- [X] T004 `PROVEEDORES_CONTRATAR_PATH` y `PROVEEDORES_CONTRATAR_RESULTADO_PATH` en `lib/proveedores/query.ts`; `"contratar"` en `RESERVED_PROFILE_SLUGS`; actualizar la lista de reservados en `AGENTS.md`; correr `npm run test:proveedores` (research D13)
- [X] T005 [P] `components/auth/scoped-clerk-provider.tsx` (ClerkProvider + `esUY`) y pasar `app/proveedores/reclamar/layout.tsx` a usarlo (research D2)
- [X] T006 [P] Exportar `apiBaseUrl` y `readJson` de `lib/partner-claims/client.ts` para reusarlos (research D1)
- [X] T007 [P] Copy de las pantallas y mensajes por `kind` en `lib/content/partner-checkout.ts` (research D5, D6; los términos salen del backend, D15)

---

## Phase 3: User Story 1 - Contratar un plan siendo dueño de un taller (P1) 🎯 MVP

**Goal**: Desde la página de planes, el dueño inicia sesión, confirma taller y plan, paga en MP y al volver ve el estado real.

**Independent Test**: quickstart.md § 3, pasos 1, 3, 5–8.

### Tests for User Story 1

- [X] T008 [P] [US1] Tests de `parsePlanParam`, `parsePlans`/`findPlan`, `formatPlanPrice`, `validatePayerEmail`, `buildCheckoutBody`, `parseCheckoutResponse` (cada status/code, `accessUntil` arriba y en `details`, 404 sin `NOT_FOUND`, `initPointUrl` no https), `ownerMemberships`, `formatDate` en `scripts/partner-billing/checkout.test.ts`
- [X] T009 [P] [US1] Tests de `parseSubscriptionResponse`, `classifySubscription`, `shouldKeepPolling`, `parsePendingCheckout`, `parsePartnerIdParam` en `scripts/partner-billing/subscription.test.ts`

### Implementation for User Story 1

- [X] T010 [US1] Módulo puro `lib/partner-billing/checkout.ts` (research D3, D4, D6, D9)
- [X] T011 [US1] Módulo puro `lib/partner-billing/subscription.ts` con los conjuntos de estados en un solo lugar (research D8)
- [X] T012 [US1] Cliente browser `lib/partner-billing/client.ts`: `fetchBillingPlans`, `fetchOwnerPartners`, `startCheckout`, `fetchSubscription`, `savePendingCheckout`/`readPendingCheckout`/`clearPendingCheckout`
- [X] T013 [US1] `app/proveedores/contratar/layout.tsx` con `<ScopedClerkProvider>`
- [X] T014 [US1] Isla `components/proveedores/checkout/checkout-flow.tsx`: login (`<SignIn routing="hash" withSignUp>` que vuelve a la misma URL), talleres (1 preseleccionado, >1 radios), resumen, email de MP, términos + checkbox, checkout, errores, `aria-live` siempre montado y foco
- [X] T015 [US1] Página `app/proveedores/contratar/page.tsx`: `createMetadata({ index: false })`, un `<h1>`, valida `?plan` (inválido ⇒ link a planes), monta la isla
- [X] T016 [US1] Isla `components/proveedores/checkout/checkout-result.tsx`: resuelve el taller (`?partnerId` ⇒ sessionStorage ⇒ membresías), polling 2 s / 30 s, nunca confirma desde la URL
- [X] T017 [US1] Página `app/proveedores/contratar/resultado/page.tsx`: `index: false`, un `<h1>`, monta la isla
- [X] T018 [US1] Página de planes: CTA de los planes pagos ⇒ `ButtonLink` a `/proveedores/contratar?plan=…` con `prefetch={false}` en `lib/content/providers-plans.ts` y `components/sections/providers/plans-grid.tsx` (research D11)

**Checkpoint**: Un dueño con taller vinculado contrata de punta a punta

---

## Phase 4: User Story 2 - Contratar sin tener todavía un taller (P2)

**Goal**: Sin taller, el usuario ve dos caminos y, si reclama, vuelve al plan elegido.

**Independent Test**: quickstart.md § 3, paso 4 y paso 10.

### Tests for User Story 2

- [X] T019 [P] [US2] Tests de `safeContinuePath` (válidos, `//`, `/\`, absolutos, `..`, control chars, otro prefijo, prefijo parcial) y de los hrefs en `scripts/partner-billing/return-path.test.ts`

### Implementation for User Story 2

- [X] T020 [US2] Módulo puro `lib/partner-billing/return-path.ts` (research D10)
- [X] T021 [US2] Panel "sin taller" en `checkout-flow.tsx`: "Mi taller ya está en AutoLibre" ⇒ `/proveedores/reclamar?next=…`, "Todavía no lo registré" ⇒ registro, con el copy de la aprobación
- [X] T022 [US2] `/proveedores/reclamar` honra `?next`: la página lo valida y `claim-form.tsx` muestra "Seguir con la contratación" tras el canje y conserva `next` en el login

**Checkpoint**: US1 y US2 funcionan por separado

---

## Phase 4b: Actualización del contrato (research D15)

- [X] T027 [US1] `parseTerms` + `termsParagraphs` (checkout.ts) y `fetchBillingTerms` (client.ts); sacar el texto y `TERMS_VERSION` del content; aceptación atada a la versión; 409 `TERMS_VERSION_OUTDATED` ⇒ volver a pedir los términos. Tests en `scripts/partner-billing/checkout.test.ts`
- [X] T028 [US1] `trialEligible`, `cancelAtPeriodEnd`, `hasActivePlan` y `trialNoteFor` (subscription.ts) con tests; pedir la suscripción del taller elegido antes del resumen y avisar de entrada si ya tiene plan
- [X] T029 Registrar los cambios en `contracts/billing-api.md` y `research.md` (D15); la cancelación queda fuera de alcance

---

## Phase 4c: User Story 3 - Registro con dueño (P3, research D16–D18)

**Goal**: El registro exige la cuenta de AutoLibre y manda su token; el backend deja esa cuenta como dueña al aprobar. `/proveedores/registro` sigue indexable y sin Clerk.

**Independent Test**: quickstart.md § 5.

- [X] T030 [US3] `PROVEEDORES_REGISTRO_FORMULARIO_PATH` en `lib/proveedores/query.ts` (anidada bajo `registro`: no se reserva slug)
- [X] T031 [P] [US3] Módulo puro `lib/proveedores/application-auth.ts`: `submitWithOwnerToken` (Bearer siempre; 401 ⇒ `getToken({ skipCache: true })` y un solo reintento con header; sin token ⇒ no hay POST) y `forwardableAuthorization`. Tests en `scripts/proveedores/application-auth.test.ts`
- [X] T032 [US3] `submitPartnerApplication(submission, { authorization })` reenvía el header tal cual y `classifyPartnerApplicationRejection` mapea 401 ⇒ `unauthenticated` (`lib/autolibre-api.ts`); tests en `scripts/proveedores/rejection.test.ts`. Auditoría de logs: ni la ruta ni el logger de rechazos tocan headers
- [X] T033 [US3] `app/api/provider/route.ts`: lee `Authorization`, lo reenvía y devuelve `{ ok: false, kind: "unauthenticated", error }` con HTTP 401
- [X] T034 [US3] `/proveedores/registro/formulario` (`layout.tsx` con `ScopedClerkProvider`; `page.tsx` `noindex`, sin JSON-LD, con el catálogo y el `connection()` que antes tenía registro) e isla `components/proveedores/registro/register-form-gate.tsx` (`<SignIn>` de la contratación; el formulario no se desmonta si la sesión se cae)
- [X] T035 [US3] `components/forms/provider-form.tsx`: recibe `getToken` y `reauthHref`, envía con `submitWithOwnerToken` y, ante `unauthenticated`, muestra el mensaje y el link para volver a entrar sin borrar nada; copy de éxito en `lib/content/providers.ts`
- [X] T036 [US3] `/proveedores/registro`: sin formulario ni Clerk; sección `#form` con pasos y CTA "Registrar mi taller" (`prefetch={false}`); sitemap (`lastModified`) y `public/llms.txt` actualizados
- [X] T037 [US3] "Todavía no lo registré" de la contratación ⇒ `/proveedores/registro/formulario`, con copy de la aprobación (`lib/content/partner-checkout.ts`)
- [X] T038 [US3] Verificar con el grafo de imports que nada alcanzable desde `app/proveedores/registro/page.tsx` importa `@clerk/*`
- [X] T039 Spec (US3, FR-010, FR-011), `contracts/partner-applications.md`, research D16–D18, quickstart § 5 y constitución (PATCH 1.2.2)
- [ ] T040 (manual, del usuario) quickstart § 5 contra el backend con `partner-onboarding-owner` desplegado

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T023 Verificar que `/proveedores/planes` no alcanza ningún import de Clerk (grep de imports de `plans-grid.tsx` y la página)
- [X] T024 [P] `npm run test:partner-billing`, `typecheck:partner-billing`, `test:partner-claims`, `typecheck:partner-claims`, `test:proveedores`
- [X] T025 [P] `npx eslint` sobre los archivos tocados y `npx tsc --noEmit`; corregir errores propios
- [ ] T026 (manual, del usuario) Recorrido de `quickstart.md` contra el backend local con MP sandbox

---

## Dependencies & Execution Order

- **Setup (1)** y **Foundational (2)** antes de las historias
- **US1**: T010 antes de T012 y T014; T011 antes de T016; T013 antes de T014–T017
- **US2**: T020 antes de T021 y T022; T021 depende de T014 (mismo archivo)
- **Polish**: al final

## Implementation Strategy

1. Setup + Foundational
2. US1 → probar con una cuenta dueña (MVP)
3. US2 → camino sin taller y vuelta desde el reclamo
