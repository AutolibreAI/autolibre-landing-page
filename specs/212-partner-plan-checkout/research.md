# Research: Contratar un plan de proveedor desde la landing

**Feature**: `212-partner-plan-checkout` | **Date**: 2026-11-04

Versiones: `next` 16.2.4, `react` 19.2.4, `@clerk/nextjs` 7.9.24. Backend leído en `autolibre-backend-hex` rama `redesign` (`partner-subscription.controller.ts`, `application-exception.filter.ts`, DTOs de billing).

## D1. Mismo modelo que la 211: llamadas desde el browser con Bearer

- **Decision**: Planes, membresías, checkout y estado se llaman con `fetch` desde el browser, con `Authorization: Bearer <getToken()>` (salvo `GET /billing/plans`, que es público) y `credentials: "omit"`. Se reusan `apiBaseUrl()`, `readJson()` y `parseMemberships()` de la 211 (se exportan de `lib/partner-claims/client.ts`).
- **Rationale**: El rate limit del backend es por IP (211 D1) y el CORS ya admite GET/POST con `Authorization`.
- **Alternatives considered**: Route handler de Next: comparte la IP del server (descartado en la 211).

## D2. Clerk acotado con un provider compartido

- **Decision**: `components/auth/scoped-clerk-provider.tsx` (server) envuelve `<ClerkProvider localization={esUY} afterSignOutUrl>`. Lo usan `app/proveedores/reclamar/layout.tsx` y el nuevo `app/proveedores/contratar/layout.tsx` (que cubre también `/resultado`). Sin `dynamic` y sin `proxy.ts` (211 D4).
- **Rationale**: Evita duplicar la configuración (idioma, voseo) y mantiene a Clerk fuera de `app/layout.tsx`.
- **Alternatives considered**: Route group `(cuenta)` con un layout para las dos rutas: obliga a mover `reclamar` de carpeta y no aporta más que el componente compartido.

## D3. El plan viaja en la URL y se valida en el server

- **Decision**: `?plan=plus|plus_max` (el `code` del backend). La página es server, lee `searchParams` (Promise en Next 16), valida con `parsePlanParam` y, si no es un plan pago, muestra un mensaje con link a `/proveedores/planes` sin montar la isla. Mapeo de la landing: `plan-plus` → `plus`, `plan-plus-max` → `plus_max` (`LANDING_PLAN_ID_TO_CODE`).
- **Rationale**: El plan sobrevive al login (`forceRedirectUrl` vuelve a la misma URL con `?plan`) y al desvío por el reclamo (`next`). Leerlo en el server evita un `useSearchParams` con Suspense. La página pasa a ser dinámica, lo que no importa en una pantalla privada.
- **Alternatives considered**: Guardarlo en `sessionStorage`: se pierde entre pestañas y al compartir el link.

## D4. Precio desde `GET /billing/plans`, nombre desde la landing

- **Decision**: El resumen muestra el `name` de la landing (FR-013: tiene que coincidir con la página de planes) y el precio que devuelve el backend (`priceAmount` + `currency`, formateado `es-AR` con código: "ARS 20.000"), con "por mes + IVA" si `priceIncludesVat` es `false` y "por mes, IVA incluido" si es `true`. Si el GET falla: mensaje + "Reintentar" y el botón de pago queda bloqueado.
- **Rationale**: FR-005 exige ver el precio antes de pagar, y el precio de verdad es el del backend (FR-007). Mostrar el precio hardcodeado de la landing podría no coincidir con lo que cobra MP. La landing nunca manda montos.
- **Alternatives considered**: Fallback al precio de `providers-plans.ts`: podría mostrar un precio distinto al cobrado. Descartado.

## D5. Período de prueba: redacción condicional

> **Actualizado en D15**: ahora depende de `trialEligible`; el texto condicional queda como fallback.

- **Decision**: Si `trialDays > 0`: "Si es la primera vez que tu taller contrata un plan, tenés {trialDays} días de prueba sin cargo. Si ya la usó, el cobro arranca cuando confirmás en Mercado Pago."
- **Rationale**: FR-017: el backend no informa (todavía) si la prueba aplica a ESE taller; la prueba es una sola vez por taller. No se promete. Si backend suma un `trialEligible`, se cambia en un solo lugar (`trialNote` del content).

## D6. Términos y email del pagador

> **Reemplazado en parte por D15**: el texto y la versión de los términos ya no viven en la landing.

- **Decision**: Los términos son PROVISORIOS y viven en `lib/content/partner-checkout.ts` con `TERMS_VERSION = "2026-11-draft"` (igual a `PARTNER_TERMS_CURRENT_VERSION` del backend). Se muestran en un `<details>` (el texto está en el DOM aunque esté cerrado) y un checkbox obligatorio habilita el botón. TODO: si backend expone `GET /billing/terms`, consumirlo en lugar del texto local.
- **Email**: `type="email"`, label "Email de tu cuenta de Mercado Pago", aclaración visible siempre, valor por defecto el email principal de Clerk (`useUser`). Se modela como "sin tocar ⇒ email de Clerk" para no necesitar un efecto. Validación local (no vacío, forma de email, ≤ 254) antes de llamar. Nunca se loguea (dato personal, Ley 25.326, igual que el backend).
- **409 `TERMS_VERSION_OUTDATED`**: se pide recargar la página (botón "Recargar"): la versión nueva llega con el deploy que actualice el content.

## D7. Pantalla de resultado: de dónde sale el taller

- **Decision**: Orden: `?partnerId=` (si backend lo agrega a la `back_url`; se valida como UUID) ⇒ `sessionStorage` (`autolibre:contratar:checkout`, guardado antes de redirigir) ⇒ membresías (si hay exactamente un taller como dueño). Si no se resuelve: mensaje con link a la página de planes.
- **Rationale**: MP tiene UNA `back_url` fija por entorno (contrato) y no hay que depender de sus query params. `?partnerId` no confirma nada: solo dice qué consultar, y el backend responde 404 si no es dueño.

## D8. Estado de la suscripción (polling)

- **Decision**: `GET /partners/{partnerId}/subscription` cada 2 s durante 30 s. Los conjuntos de estados viven en UN lugar (`lib/partner-billing/subscription.ts`):
  - **confirmado**: `active`, `trialing` (`VISIBLE_STATUSES` del backend: `pending`, `trialing`, `active`, `paused`).
  - **pendiente**: `pending` ⇒ se sigue consultando; al agotarse el tiempo, "Tu pago está pendiente de confirmación".
  - **gratis**: `status: null` ⇒ no hay suscripción viva (se canceló o no se pagó): "No se registró ningún pago" + reintentar.
  - **otro** (`paused` o un valor desconocido): mensaje genérico, sin confirmar.
- **Rationale**: Conservador: solo se confirma con un estado que el backend define como vivo y con acceso. Un estado nuevo o desconocido NUNCA se muestra como confirmado.
- **Desvío**: el pedido sugería "Te avisamos por WhatsApp/email"; no hay evidencia de que el backend notifique, así que el copy dice que vuelva a la página más tarde y ofrece WhatsApp de AutoLibre para dudas (no inventar, PRODUCT.md).
- 401 ⇒ volver a iniciar sesión; 404/otros/red ⇒ "No pudimos consultar el estado" + reintentar.

## D9. Errores del checkout

- **Forma del error del backend** (`ApplicationExceptionFilter`): `{ ...details, statusCode, message, code }`. OJO: los `details` van **esparcidos en el nivel superior**, así que `accessUntil` llega como `body.accessUntil`, no `body.details.accessUntil` como dice el contrato. Se leen los dos (primero el de arriba).
- **Mapeo** (unión discriminada en `parseCheckoutResponse`):

| Status | code | kind |
|---|---|---|
| 200/201 con `subscriptionId` + `initPointUrl` https | | `success` |
| 400 | `PAYER_EMAIL_REJECTED` | `payer-email-rejected` |
| 400 | otro | `invalid-input` |
| 401 | | `unauthenticated` |
| 403 | `FEATURE_DISABLED` | `disabled` (+ "Hablar con ventas") |
| 404 | `NOT_FOUND` | `not-found` (mensaje uniforme) |
| 409 | `TERMS_VERSION_OUTDATED` / `SUBSCRIPTION_ALREADY_LIVE` (+`accessUntil`) / `CHECKOUT_IN_PROGRESS` | uno por code |
| 429 | | `rate-limited` |
| 503 | | `unavailable` |
| resto, 403/404/409 con otro code, red, JSON inválido | | `unknown` |

- **Rationale**: Igual que la 211: un 404 sin el `code` del contrato (ruta inexistente, URL mal configurada) no se disfraza de "no es tu taller". El `initPointUrl` se exige `https:` antes de redirigir.

## D10. `next` en `/proveedores/reclamar`

- **Decision**: La página lee `?next`, lo valida en el server con `safeContinuePath(raw, "/proveedores/contratar")` y solo si pasa se lo da a la isla. Reglas: string, empieza con `/` pero no con `//` ni `/\`, sin `\` ni caracteres de control, se resuelve contra un origen ficticio y el resultado tiene que seguir en ese origen con `pathname` igual a `/proveedores/contratar` o debajo. Devuelve `pathname + search` normalizados (sin hash). Tras el canje exitoso aparece el botón primario "Seguir con la contratación".
- **Rationale**: Evita el open redirect (`//evil.com`, `/\evil.com`, `https://…`, `/proveedores/contratar/../../x`).
- El `forceRedirectUrl` del `<SignIn>` en `reclamar` conserva el `?next`.

## D11. CTA de la página de planes

- **Decision**: Los planes pagos usan `ButtonLink` a `/proveedores/contratar?plan=…` con `prefetch={false}` (en App Router, `false` no prefetchea ni en viewport ni en hover). Plan gratis ⇒ registro; "Hablar con ventas" ⇒ WhatsApp, sin cambios. `plans-grid.tsx` y la página de planes no importan nada de Clerk ni de `components/proveedores/checkout/*`.

## D12. Tests

- **Decision**: `node --test` sobre `lib/partner-billing/{checkout,subscription,return-path}.ts` (autocontenidos, sin `@/`), en `scripts/partner-billing/*.test.ts`, con `scripts/partner-billing/tsconfig.json` y los scripts `test:partner-billing` / `typecheck:partner-billing` (patrón de `partner-claims`, 211 D10). Los flujos con Clerk y MP se prueban a mano (`quickstart.md`).

## D13. Ruta reservada

- **Decision**: `"contratar"` se suma a `RESERVED_PROFILE_SLUGS`. `resultado` vive debajo de `contratar` (no es hermana de `[slug]`), así que no se reserva. Hay que avisarle al backend para que reserve `contratar` en `generate_partner_slug`.

## D14. Resultado de la implementación (2026-11-04)

- `/proveedores/reclamar` pasa a leer `searchParams` (por el `next`), así que deja de ser estática. No cambia nada visible: es privada y la sesión ya se resolvía en el browser.
- `ChoiceRow` (`components/ui/choice.tsx`) acepta `className` para llevar las opciones de taller a 44px (`min-h-11`) y 16px.
- Los botones de los planes pagos dejan de mandar `whatsapp_clicked` (ya no abren WhatsApp). No se agregó un evento nuevo de analytics: queda como pendiente decidir si se suma uno (`checkout_started` o similar) al catálogo de `lib/analytics/events.ts`.
- No se verificó con el dev server (el del usuario ocupa `:3000`): el recorrido de `quickstart.md` queda como T026.

## D15. Actualización del contrato del backend (2026-11-04)

1. **Términos desde `GET /billing/terms`** (público, `{ version, text }`): es la ÚNICA fuente. Se borraron `TERMS_VERSION` y el texto provisorio de `lib/content/partner-checkout.ts`; ahí queda solo la copy de la UI (resumen del `<details>`, label del checkbox, "Cargando…", error con "Reintentar"). El `text` se muestra como texto plano, nunca como HTML: se parte en párrafos por línea en blanco (`termsParagraphs`) y los saltos simples se respetan con `whitespace-pre-line`. La aceptación queda atada a la versión (`acceptedVersion === terms.version`): si cambia la versión, el checkbox se desmarca solo. En el 409 `TERMS_VERSION_OUTDATED`, se vuelven a pedir los términos y hay que aceptarlos de nuevo (ya no se pide recargar la página). Sin los términos cargados no se puede pagar.
2. **`?partnerId` en la `back_url`**: el backend la arma por suscripción. El orden de D7 ya lo priorizaba (`?partnerId` ⇒ `sessionStorage` ⇒ membresías). El código no cambia: el caso solo deja de ser hipotético.
3. **`GET /partners/{id}/subscription` antes del resumen** (commit `4dc9d96d`, suma `trialEligible: boolean`): se pide para el taller elegido apenas se conoce. `trialNoteFor` decide el texto: `true` ⇒ "Incluye {trialDays} días de prueba sin cargo"; `false` ⇒ "Tu taller ya usó su período de prueba: el plan se cobra desde el primer mes"; ausente o con el GET caído ⇒ el texto condicional de D5. El botón de pago espera esa respuesta, para no pagar con el resumen a medias. Si el taller ya tiene un plan pago con acceso (`hasActivePlan`: plan distinto de `free` y estado `active`/`trialing`), se avisa de entrada ("Tu taller ya tiene el plan …", con `accessUntil` si la baja está pedida) y no se muestran el email, los términos ni el botón. Es conservador: `paused` y `pending` no bloquean de entrada, y si el backend responde 409 igual se muestra el mensaje del checkout. Si el GET falla, el formulario sigue y el backend decide en el checkout.
4. **Cancelación** (`POST …/subscription/cancellation` ⇒ `200 { accessUntil }`): existe, pero está FUERA del alcance de la 212 y no se implementa.

## D16. Registro con dueño: dónde vive el formulario (US3, 2026-11-04)

- **Decision**: `/proveedores/registro` sigue pública, indexable y SIN Clerk: conserva metadata, JSON-LD, sitemap y `llms.txt`, y reemplaza el formulario por una sección (`id="form"`, para no romper los links viejos a `#form`) con los pasos del alta y el CTA "Registrar mi taller" (`ButtonLink`, `prefetch={false}`) a `/proveedores/registro/formulario`. Esa ruta nueva es privada (`createMetadata({ index: false })`, fuera del sitemap y de `llms.txt`, sin `Disallow`, sin JSON-LD) y su `layout.tsx` monta `ScopedClerkProvider`. Sin sesión, la isla (`register-form-gate.tsx`) muestra el mismo `<SignIn routing="hash" withSignUp>` de la contratación con vuelta a esta URL; con sesión, el formulario de siempre. El catálogo y el `connection()` se mudaron de la página de registro a la del formulario.
- **Rationale**: El alta con dueño exige sesión, y la sesión trae Clerk. Un layout de Clerk en `registro/` lo habría cargado en la página indexable (FR-011, SC-005). Anidada bajo `registro`, la ruta nueva no es hermana de `[slug]` y no hace falta reservar slug.
- **Alternativas descartadas**: (a) cargar Clerk recién al enviar, desde la página pública: mete JS de Clerk en la página indexable y complica el login a mitad de formulario; (b) login después de enviar: obliga a guardar la solicitud sin dueño y reconciliarla después.
- **Grafo de imports verificado**: nada alcanzable desde `app/proveedores/registro/page.tsx` importa `@clerk/*` (y `registro/` no tiene `layout.tsx`).

## D17. Token: browser ⇒ `/api/provider` ⇒ backend (US3)

- **Decision**: el browser manda `Authorization: Bearer <getToken()>` a `/api/provider` (`submitWithOwnerToken`, `lib/proveedores/application-auth.ts`). La ruta lo reenvía TAL CUAL (`forwardableAuthorization`) a `POST /partner-applications` vía `submitPartnerApplication(submission, { authorization })`. El 401 del backend se clasifica como `unauthenticated` (`classifyPartnerApplicationRejection`) y la ruta responde `401 { ok: false, kind: "unauthenticated", error }`. Ante un 401, el browser pide `getToken({ skipCache: true })` y reintenta UNA vez con el header nuevo; si falla otra vez (o no hay token) muestra "Tu sesión venció…" con un link para volver a entrar en otra pestaña, y el formulario no se borra. Nunca hay POST sin header. Contrato: `contracts/partner-applications.md`.
- **Rationale**: La llamada al backend sigue siendo server-side (la URL no viaja al bundle, como antes). Next no valida el token (no hay SDK de Clerk en el server): el backend es la autoridad. Reintentar sin header crearía un taller sin dueño, que es justo lo que la US3 viene a evitar.
- **Logs**: auditados. La ruta no loguea nada; el único log del alta es `describePartnerApplicationRejection` (status + `message`/`code` del body de la respuesta). Ningún header del request se loguea.
- **Sesión caída con el formulario abierto**: la isla no desmonta el formulario una vez mostrado aunque Clerk pase a "sin sesión" (desmontarlo borraría todo). Volver a entrar se hace en otra pestaña: Clerk comparte la sesión entre pestañas y el reintento toma el token nuevo.

## D18. A dónde apuntan los CTA de "registrarme" (US3)

- **Decision**: los CTA de navegación y marketing siguen yendo a la página indexable `/proveedores/registro` (header "Soy proveedor", "Sumar mi negocio" del directorio, "Registrate gratis" del plan gratis): explican el alta antes del login y no le sacan links internos a la página que rankea. El CTA del header DENTRO de registro apunta a `#form` (la sección con el botón). Solo "Todavía no lo registré" de la contratación va directo a `/proveedores/registro/formulario`, porque esa persona ya tiene sesión y viene a eso.
- **Copy**: la confirmación dice "Cuando aprobemos tu taller, vas a poder administrarlo y contratar un plan desde tu cuenta." (más el "te vamos a contactar" que ya era cierto). Ningún texto del registro pide un código por WhatsApp; el código queda solo para reclamar talleres que ya existen (211).
- **Analytics**: el formulario no tenía eventos propios; `provider_plans_cta_clicked` sigue en el banner de registro, que no cambió. No se agregó un evento para el CTA nuevo (pendiente de decisión, como en D14).
