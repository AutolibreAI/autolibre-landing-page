# Implementation Plan: Contratar un plan de proveedor desde la landing

**Branch**: `212-partner-plan-checkout` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/212-partner-plan-checkout/spec.md`
**Depende de**: `211-partner-claim-redemption` (Clerk acotado, llamadas al backend desde el browser con Bearer)

## Summary

Los botones de los planes pagos de `/proveedores/planes` dejan de abrir WhatsApp y llevan a `/proveedores/contratar?plan=plus|plus_max`. Esa pantalla privada (Clerk acotado con un layout anidado, igual que `/proveedores/reclamar`) pide iniciar sesión, lee los talleres de los que la cuenta es dueña (`GET /partners/me/memberships`), muestra el resumen con el precio que da el backend (`GET /billing/plans`), pide el email de Mercado Pago y la aceptación de los términos, e inicia el checkout (`POST /partners/{partnerId}/subscription/checkouts`). El backend devuelve el link de Mercado Pago y la landing redirige. Al volver, `/proveedores/contratar/resultado` consulta el estado (`GET /partners/{partnerId}/subscription`) cada 2 s durante 30 s, sin creerle nunca a la URL de retorno. Quien no tiene taller ve dos salidas: reclamarlo (`/proveedores/reclamar?next=…`, que ahora sabe volver a la contratación) o registrarlo.

US3 (registro con dueño, rediseñada el 2026-11-04): `/proveedores/registro` queda pública, indexable y sin Clerk, con un CTA a `/proveedores/registro/formulario` (privada, `noindex`, Clerk en su layout anidado). El formulario manda el token de Clerk a `/api/provider`, que lo reenvía tal cual a `POST /partner-applications`; el backend deja esa cuenta como dueña del taller al aprobar la solicitud (research D16–D18, `contracts/partner-applications.md`).

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2.4, Next.js 16.2.4 (App Router)
**Primary Dependencies**: `@clerk/nextjs` 7.x y `@clerk/localizations` (ya instaladas por la 211). Sin dependencias nuevas.
**Storage**: `sessionStorage` (solo `{ partnerId, planCode, subscriptionId }` del checkout iniciado, para la pantalla de resultado). Todo lo demás vive en el backend.
**Testing**: `node --test` sobre módulos puros (`scripts/partner-billing/*.test.ts`, patrón de `partner-claims`); recorrido manual según `quickstart.md`
**Target Platform**: Web (Vercel). Orígenes: `autolibre.ai`, `autolibre-preview.vercel.app`, `localhost:3000`
**Project Type**: Web app (landing Next.js) que consume una API externa desde el browser
**Performance Goals**: `/proveedores/planes` y `/proveedores/registro` sin cambios de CWV y con 0 bytes de Clerk (SC-005)
**Constraints**: CORS del backend (GET/POST, `Authorization` + `Content-Type`, sin cookies); 404 uniforme; la landing nunca manda montos (FR-007); el estado confirmado sale solo del backend (FR-008)
**Scale/Scope**: 2 rutas nuevas, 2 islas client, 3 módulos puros con tests, 1 cambio en la 211 (`next`)

## Constitution Check

| Principio | Estado | Nota |
|---|---|---|
| I. App Router / RSC por defecto | ✅ | `page.tsx` y `layout.tsx` server. Islas client: `checkout-flow.tsx` y `checkout-result.tsx` (sesión, fetch con token, formulario). El plan se valida en el server. |
| II. Copy en la capa de contenido | ✅ | `lib/content/partner-checkout.ts` (pantallas y mensajes; el texto y la versión de los términos salen de `GET /billing/terms`, research D15). Nombres de planes desde `providers-plans.ts`. |
| III. Contratos tipados | ✅ | Uniones discriminadas `CheckoutResult`, `SubscriptionResult`; sin `any`. |
| IV. A11y y performance | ✅ | Labels visibles, `fieldset`/`legend` para el taller, `aria-live` siempre montado, foco al cambiar de estado, objetivos de 44px, input de 16px. Clerk fuera de las páginas indexables (los links a `contratar` van con `prefetch={false}`). |
| V. Aislamiento de secciones | ✅ | `components/proveedores/checkout/*`; reusa `components/auth/scoped-clerk-provider.tsx` (compartido con `reclamar`). |
| VI. HTML semántico | ✅ | Un `<h1>` por página (server), `h2` por paso en la isla, `<details>` con los términos en el DOM. |
| VII. SEO & GEO | ⚠️ justificado | Pantallas privadas: `index: false`, fuera del sitemap y de `llms.txt`, sin `Disallow`, sin JSON-LD (como la 211, D8). |
| VIII. Tailwind canónico | ✅ | Primitivas de `components/ui/*` y tokens existentes. |
| Technology Stack | ⚠️ acción | La entrada de `@clerk/nextjs` se amplía a `/proveedores/contratar` (PATCH 1.2.0 → 1.2.1). |

**Post-design re-check**: sin violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/212-partner-plan-checkout/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/billing-api.md
├── checklists/requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
app/proveedores/contratar/
├── layout.tsx                    # <ScopedClerkProvider> (server)
├── page.tsx                      # valida ?plan, <h1>, monta <CheckoutFlow>
└── resultado/page.tsx            # valida ?partnerId, <h1>, monta <CheckoutResult>
app/proveedores/reclamar/
├── layout.tsx                    # pasa a usar <ScopedClerkProvider>
└── page.tsx                      # lee ?next (validado) y se lo pasa a <ClaimForm>
components/auth/scoped-clerk-provider.tsx   # ClerkProvider + esUY, compartido
components/proveedores/checkout/
├── checkout-flow.tsx             # "use client": login, talleres, resumen, términos, email, checkout
└── checkout-result.tsx           # "use client": polling del estado
components/proveedores/claim/claim-form.tsx # + botón "Seguir con la contratación"
components/sections/providers/plans-grid.tsx # planes pagos ⇒ link a /proveedores/contratar (sin prefetch)
lib/partner-billing/
├── checkout.ts                   # puro: planes, precio, email, body, respuesta del checkout, dueños
├── subscription.ts               # puro: respuesta del estado, clasificación, polling, sessionStorage
├── return-path.ts                # puro: `next` seguro, hrefs de contratar/reclamar
└── client.ts                     # fetch browser (Bearer, credentials omit) + sessionStorage
lib/partner-claims/client.ts      # exporta apiBaseUrl/readJson para reusarlos
lib/content/partner-checkout.ts   # copy de la UI (los términos vienen de GET /billing/terms)
lib/content/partner-claim.ts      # + "Seguir con la contratación"
lib/content/providers-plans.ts    # CTA de planes pagos ⇒ href de contratar
lib/proveedores/query.ts          # + PROVEEDORES_CONTRATAR_PATH(_RESULTADO), reservado "contratar"
scripts/partner-billing/          # tests node --test + tsconfig
package.json                      # + test:partner-billing, typecheck:partner-billing
```

**Structure Decision**: Se sigue la estructura de la 211: rutas estáticas hermanas de `[slug]`, islas en `components/proveedores/*`, lógica pura autocontenida en `lib/` con tests en `scripts/`. `app/sitemap.ts`, `public/llms.txt` y `app/robots.ts` NO cambian.

## Riesgos y dependencias

- **Backend**: checkout y estado existen en la rama `redesign`, detrás de `BILLING_CHECKOUT_ENABLED` (hoy `false` ⇒ 403 `FEATURE_DISABLED`, que la UI ya maneja).
- **Términos**: salen de `GET /billing/terms` (texto + versión; research D15). El texto definitivo lo carga el backend y es bloqueante para producción. La landing no cambia cuando cambia la versión.
- **`trialEligible`**: el backend lo va a sumar al GET de la suscripción. Hasta entonces el resumen muestra el texto condicional.
- **Slug `contratar`**: backend tiene que reservarlo (AGENTS.md).
- **Retorno de MP**: una sola `back_url` sin `partnerId`; la pantalla de resultado depende de `sessionStorage` o de que la cuenta tenga un único taller (research D7).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Pantallas sin JSON-LD | Privadas, noindex, sin contenido citable | Un schema en una página noindex no aporta y suma bytes |
| `sessionStorage` para el checkout en curso | MP vuelve a una URL fija sin `partnerId` | Leer las membresías solo resuelve el caso de un taller |
