# Data Model: Contratar un plan de proveedor

La landing no persiste nada salvo un dato chico en `sessionStorage`. Estos son los tipos del lado del cliente (`lib/partner-billing/*`).

## PaidPlanCode

`"plus" | "plus_max"`. Sale de `?plan=` (`parsePlanParam`). `free` y cualquier otro valor ⇒ `null` ⇒ link a `/proveedores/planes`.

Mapeo con los ids de la landing (`LANDING_PLAN_ID_TO_CODE`): `plan-plus` → `plus`, `plan-plus-max` → `plus_max`.

## BillingPlan (de `GET /billing/plans`)

- `code: string`, `name: string`, `priceAmount: number` (neto salvo `priceIncludesVat`), `currency: string` (ISO 4217), `priceIncludesVat: boolean`, `trialDays: number`.
- Lo que no tiene esa forma se descarta (`parsePlans`). Plan no encontrado en la lista ⇒ "no disponible".

## PartnerTerms (de `GET /billing/terms`)

`{ version, text }` (`parseTerms`; sin versión o sin texto ⇒ error con reintento). Única fuente: el `text` se muestra y la `version` viaja como `termsVersion`. La aceptación se guarda como la versión aceptada.

## OwnerPartner

De `GET /partners/me/memberships` (211): solo las membresías con `role === "owner"` (`ownerMemberships`). 0 ⇒ sin taller; 1 ⇒ preseleccionado; >1 ⇒ elección con radios.

## CheckoutInput ⇒ body

`{ planCode, termsVersion, payerEmail }` (`buildCheckoutBody`), sin campos extra y nunca un monto. `payerEmail` validado (`validatePayerEmail`: trim, no vacío, forma de email, ≤ 254).

## CheckoutResult (unión discriminada)

| kind | Origen | Mensaje |
|---|---|---|
| `success` + `subscriptionId`, `initPointUrl` | 200/201 con forma válida y `https:` | redirige a MP |
| `payer-email-rejected` | 400 `PAYER_EMAIL_REJECTED` | revisar el email de MP |
| `invalid-input` | otro 400 | genérico de validación |
| `unauthenticated` | 401 | volver a iniciar sesión |
| `disabled` | 403 `FEATURE_DISABLED` | no disponible + "Hablar con ventas" |
| `not-found` | 404 `NOT_FOUND` | "No encontramos ese taller en tu cuenta" |
| `terms-outdated` | 409 `TERMS_VERSION_OUTDATED` | recargar |
| `already-live` + `accessUntil: string \| null` | 409 `SUBSCRIPTION_ALREADY_LIVE` | "Tu taller ya tiene un plan activo" (+ fecha) |
| `in-progress` | 409 `CHECKOUT_IN_PROGRESS` | esperar y reintentar |
| `rate-limited` | 429 | esperar un minuto |
| `unavailable` | 503 | MP no disponible, reintentar |
| `unknown` | resto | genérico |

Todos los que no son `success` llevan `requestId?` (header `x-request-id`), solo para `console.error`.

## PendingCheckout (`sessionStorage`, clave `autolibre:contratar:checkout`)

`{ partnerId, planCode, subscriptionId }`. Se guarda justo antes de `window.location.assign(initPointUrl)`; se lee en `/resultado` (`parsePendingCheckout` descarta lo que no tenga forma); se borra cuando el estado queda confirmado. Lecturas y escrituras con `try/catch`.

## SubscriptionView (de `GET /partners/{partnerId}/subscription`)

`{ planCode, status: string | null, trialEndsAt: string | null, accessUntil: string | null, cancelAtPeriodEnd: boolean, trialEligible: boolean | null }` (`trialEligible` es `null` si el backend no lo manda). También se pide ANTES del resumen, para el taller elegido: `trialNoteFor` decide el texto de la prueba y `hasActivePlan` dice si ya tiene un plan.

`classifySubscription(view)`:

| status | Clase | Pantalla |
|---|---|---|
| `active`, `trialing` | `confirmed` | "¡Listo! Tu taller tiene el plan {nombre}" (+ fin de la prueba si hay `trialEndsAt`) |
| `pending` | `pending` | "Estamos confirmando tu pago" y se sigue consultando |
| `null` | `free` | "No se registró ningún pago" + reintentar |
| otro (`paused`, desconocido) | `unconfirmed` | genérico, sin confirmar |

`SubscriptionResult`: `ok` + view | `unauthenticated` (401) | `not-found` (404) | `unknown`.

## Estados de las pantallas

```
/contratar:
loading ─▶ signed-out ─login─▶ loading-data ─▶ no-partner
                                     │
                                     ├──▶ data-error (reintentar)
                                     └──▶ form ─submit─▶ submitting ─success─▶ redirecting (MP)
                                                  ▲           │
                                                  └─ error ◀──┘ (401 ⇒ reauth)

/contratar/resultado:
resolve-partner ─▶ no-partner
      │
      └▶ polling (cada 2 s) ─▶ confirmed | free | unconfirmed | error
               │
               └─ 30 s ─▶ pending-timeout
```
