# Contrato: Billing de partners (consumido desde el browser)

**Proveedor**: autolibre backend, rama `redesign` (checkout `5ff4eb6c`; estado en construcción, tarea 7.1)
**Consumidor**: `autolibre-landing-page`
**Base**: `NEXT_PUBLIC_AUTOLIBRE_API_URL` (incluye `/api/v1`). CORS: GET y POST (igual que la 211).

## GET /billing/plans (público, sin token)

`200` `[{ code, name, priceAmount, currency, priceIncludesVat, trialDays, monthlyWhatsappRequestLimit, hasOwnWebsite }]`

- Códigos: `free`, `plus`, `plus_max`. El identificador es SIEMPRE el `code`.
- Mapeo con la landing: `plan-plus` → `plus`, `plan-plus-max` → `plus_max`, `plan-gratis` → `free` (este no se compra).
- Valores hoy: plus 20000, plus_max 30000, `trialDays` 30.

## GET /billing/terms (público, sin token) — actualización 2026-11-04

`200` `{ version, text }`: los términos comerciales para talleres vigentes. Es la ÚNICA fuente del texto y de la versión: la landing muestra ese `text` y manda esa misma `version` como `termsVersion` en el checkout. No hay copia local.

## POST /partners/{partnerId}/subscription/checkouts (Bearer)

Body: `{ planCode: "plus" | "plus_max", termsVersion: string, payerEmail: string }`. Nunca se manda un monto.

- `termsVersion`: la `version` de `GET /billing/terms` que el usuario aceptó con el checkbox. Ante un 409 `TERMS_VERSION_OUTDATED`, la landing vuelve a pedir los términos y hay que aceptarlos de nuevo.
- `payerEmail`: el email de la cuenta de **Mercado Pago** con la que va a pagar. Si no coincide, MP rechaza el pago en su propia pantalla y el backend no tiene cómo saberlo antes.

| Status | Body / code | Significado |
|---|---|---|
| 201 | `{ subscriptionId, status: "pending", initPointUrl }` | Redirigir a `initPointUrl` |
| 400 | validación, plan no comprable, `PAYER_EMAIL_REJECTED` | |
| 401 | | Sin token o token inválido |
| 403 | `FEATURE_DISABLED` | Kill switch `BILLING_CHECKOUT_ENABLED` |
| 404 | uniforme | No es owner, el partner no existe o está archivado |
| 409 | `TERMS_VERSION_OUTDATED` | Hay que recargar los términos y volver a aceptarlos |
| 409 | `SUBSCRIPTION_ALREADY_LIVE` (+ `accessUntil` si hay una cancelación en curso) | Ya tiene un plan |
| 409 | `CHECKOUT_IN_PROGRESS` | Ya hay un pago en curso |
| 503 | | MP no disponible |

**Forma real de los errores** (`ApplicationExceptionFilter` del backend): `{ ...details, statusCode, message, code }`, con los `details` esparcidos en el nivel superior. O sea, `accessUntil` llega como `body.accessUntil`. **Oficial (backend lo confirmó el 2026-11-04): la raíz**, y es la convención de todo el backend: `statusCode`, `message` y `code` siempre pisan a los `details`. La landing también acepta `body.details.accessUntil`, pero solo como tolerancia.

Idempotencia: con el mismo plan y el mismo email dentro de las 24 h devuelve el mismo link. Si cambia el email, genera uno nuevo.

## GET /partners/{partnerId}/subscription (Bearer, solo owner)

Commiteado en el backend (`4dc9d96d`). `{ planCode, status, trialEndsAt, currentPeriodEnd, nextChargeAt, cancelAtPeriodEnd, accessUntil, scheduledPlanCode, trialEligible }`. `status`: `pending` | `trialing` | `active` | `paused` | `null` (sin suscripción viva: `planCode: "free"`). 404 uniforme si no es owner.

- `trialEligible: boolean` (por sumarse): si al taller todavía le corresponde la prueba. La landing pide este GET para el taller elegido ANTES del resumen: `true` ⇒ "Incluye {trialDays} días de prueba sin cargo"; `false` ⇒ "Tu taller ya usó su período de prueba: el plan se cobra desde el primer mes"; sin el campo ⇒ el texto condicional. También sirve para avisar de entrada si ya tiene un plan activo.

## POST /partners/{partnerId}/subscription/cancellation (Bearer)

`200` `{ accessUntil }`. Existe, pero está FUERA del alcance de la 212: la landing no la usa.

## Retorno de Mercado Pago

- MP tiene UNA sola `back_url` por suscripción. El backend la toma de `BILLING_CHECKOUT_BACK_URL` (https), una por entorno:
  - prod: `https://autolibre.ai/proveedores/contratar/resultado`
  - preview: `https://autolibre-preview.vercel.app/proveedores/contratar/resultado`
- La `back_url` llega con `?partnerId=<uuid>`, armada por suscripción. La landing lo usa primero; `sessionStorage` y las membresías quedan como fallback.
- No hay que depender de los otros query params que agregue MP, ni confirmar nada con ellos. Después de volver, hacer polling del estado cada 2 s durante 30 s.

## Elegibilidad

- Pueden pagar los partners `active` y `paused`; los `archived` no. Una solicitud pendiente todavía no es un partner.
- Período de prueba: lo decide el backend, una sola vez por taller en toda su vida. La landing lo anticipa con `trialEligible` del GET de la suscripción.
