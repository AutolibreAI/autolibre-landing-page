## Fase 6: cuenta del taller

`/cuenta` pasa a ser "Mi negocio". Tiene una barra del negocio con iniciales, el `<h1>` con el nombre, el estado y "Cambiar de negocio", y las secciones Resumen, Perfil y Plan. Pedidos está diseñada pero apagada. Todo lo que se muestra sale de datos reales. Lo que no tiene endpoint quedó apagado con bandera en `lib/account/features.ts`: nada simulado.

### Inventario de endpoints (backend `autolibre-backend-hex`, solo lectura, 2026-11-24)

El backend es NestJS con prefijo `/api/v1`. El `AuthGuard` de Clerk es global salvo en las rutas `@Public()`. No hay un guard de rol por membresía: el caso de uso chequea que la cuenta sea owner y, si no, responde 404.

| Qué | Método y ruta | Auth | Existe | Lo usa |
|---|---|---|---|---|
| Negocios de la cuenta | `GET /partners/me/memberships` → `[{partnerId, name, role, since}]` | Clerk | Sí | Barra, "Cambiar de negocio", pista `al_role` |
| Perfil del negocio | `GET /partners/{id}` → `{id, name, description, logoUrl, whatsapp, address, hours (texto libre), modality, redirectLink, whatsappContactUrl, coverageZone, geo, tier, services, categories, serviceGroups, cover, brands, fuelTypes, links, rating, reviews}` | Público | Sí, pero **404 si el negocio está pausado o archivado** y **sin `slug` ni `status`** | Estado "Publicado"/"No visible en la red", "Completá tu perfil", pestaña Perfil, "Así te ven en la app" (es el mismo endpoint que lee la app) |
| Perfil por slug | `GET /partner-profiles/{slug}` | Público | Sí | No se usa: la cuenta no conoce el slug |
| Suscripción | `GET /partners/{id}/subscription` → `{planCode, status, trialEndsAt, currentPeriodEnd, nextChargeAt, accessUntil, cancelAtPeriodEnd, scheduledPlanCode, trialEligible}` | Clerk, solo owner | Sí | "Tu plan", pestaña Plan, aviso de pago pendiente |
| Baja | `POST /partners/{id}/subscription/cancellation` → `{accessUntil}` | Clerk, solo owner | Sí, idempotente | `CancelSubscription` (sin cambios de contrato) |
| Catálogo de planes | `GET /billing/plans` → `[{code, name, priceAmount, currency, priceIncludesVat, trialDays, monthlyWhatsappRequestLimit, hasOwnWebsite}]` | Público | Sí | Precio, tope mensual y días de prueba |
| Checkout | `POST /partners/{id}/subscription/checkouts` | Clerk, solo owner | Sí | No desde acá: "Contratar el plan Plus" lleva a `/proveedores/contratar` |
| Pedidos y propuestas del negocio | `quote_request_proposals`, `quote_request_partners`, `quote_requests.selected_proposal_id` | — | **No** (solo admin y cliente) | Pestaña Pedidos, franja de cuatro números, "Últimos pedidos", estado "Sin pedidos", contador de la pestaña |
| Envíos por WhatsApp | `partner_outreach` | — | **No** (solo admin) | Lo mismo que la fila anterior |
| Uso del mes | — | — | **No** (el tope existe en `/billing/plans`; los envíos del mes no se exponen) | Barra de uso en "Tu plan" y "Uso de este mes" |
| Código de referido y clientes que lo guardaron | `partner_referral_codes`, `preferred_partners` | — | **No** para el dueño (emitir es admin) | "Tu código para clientes" |
| Editar el perfil y subir el logo | — | — | **No** (logo solo admin: `PUT /admin/partners/{id}/logo`) | Edición desde la pestaña Perfil |
| Estado de la solicitud de alta | — | — | **No** | Estado "En revisión" |
| Reseñas del dueño | — | — | Solo públicas (en `GET /partners/{id}`) | La vista previa muestra "Todavía no tiene reseñas" o el puntaje |
| Clics y métricas del perfil | — | — | **No** (`metrics: null`) | Nada (el diseño tampoco lo pide en la cuenta) |

### Qué quedó detrás de bandera (`ACCOUNT_FEATURES`, todo en `false`)

| Bandera | Pantallas | Qué falta en el backend |
|---|---|---|
| `orders` | Pestaña Pedidos con filtros y conteo; franja "Por responder / Propuestas enviadas / Te eligieron / Pedidos de tu plan"; "Últimos pedidos"; estado `CuentaVacia`; contador de la pestaña | Lectura de los pedidos del negocio: outreach, propuesta y elección del cliente, con su número y estado. El modelo que espera la UI está en `lib/account/orders.ts` |
| `usage` | Barra "Pedidos/Propuestas por WhatsApp este mes" y "Uso de este mes" | Conteo de envíos del mes contra el tope del plan |
| `referralCode` | "Tu código para clientes" | Lectura del código vigente y de cuántos `preferred_partners` lo usaron |
| `profileEditing` | (no construido) Edición inline del perfil | PATCH del dueño y subida de logo |
| `reviewStatus` | Estado "En revisión" (`CuentaRevision`) | Lectura de la solicitud de alta pendiente (fecha y datos enviados) |
| `publicPageLink` | "Ver mi página web" | `slug` en las membresías o en `GET /partners/{id}` |

Los componentes de esas pantallas están hechos y se verificaron con datos de prueba en una vista previa local, borrada antes del commit. Para prender cada uno hay que conectar el dato en `components/cuenta/business-account.tsx` y poner la bandera en `true`.

### Lo que se ve hoy con datos reales

- **Resumen**
  - Aviso de pago pendiente, si corresponde.
  - "Completá tu perfil" (columna principal): 8 datos que se pueden saber de `GET /partners/{id}` (nombre, logo, descripción, servicios, dirección, horarios, WhatsApp, redes), con lo que falta y "Ver cómo te ven en la app".
  - "Tu plan" (al costado): plan, estado (prueba, activo, baja pedida, pago pendiente), tope mensual del catálogo, y "Ver mi plan" o "Contratar el plan Plus" con la prueba solo si el backend la confirma (`trialEligible` + `trialDays`).
  - "¿Necesitás una mano?" por WhatsApp.
- **Perfil**: una fila por dato (Nombre, Logo, Descripción, Servicios, Marcas, Cómo atendés, Dirección, Horarios, WhatsApp, Redes). Lo que falta dice "Falta".
  - No hay edición: "Agregar" y "Pedir cambio" abren WhatsApp con el pedido armado.
  - Al costado va la vista previa de la app. En celular se abre con un botón.
- **Plan**
  - Plan pago: tarjeta con precio, beneficios, "Cambiar de plan con ventas" y "Ver todos los planes"; "Cancelar suscripción" con la confirmación existente; tarjeta "Pago" con el medio y la fecha que corresponde (primer cobro, fin del período o activo hasta).
  - Gratis: tarjeta del plan y banda oscura con Plus.
- **Sin negocios**: el camino de siempre (`NoPartnerOptions`, reclamar con código).
- **Sin sesión**: el panel de ingreso existente (`PartnerSignIn`), sin tocarlo. Vuelve a la misma sección después de entrar.

### Pestañas: links con `?seccion=`, no `tablist`

Cada sección es una URL: `/cuenta`, `/cuenta?seccion=perfil`, `/cuenta?seccion=plan`, más `&negocio=<id>` si la cuenta tiene varios negocios. Son `<a>` dentro de `<nav aria-label="Secciones de tu negocio">`, con `aria-current="page"`.

Por qué links y no `tablist`:
- El menú del header y cualquier link llevan directo a una sección.
- Atrás funciona.
- Tab y Enter alcanzan, sin manejar flechas ni Home/End.
- El lector de pantalla no anuncia "pestaña 2 de 4" para algo que en realidad navega.
- Funciona sin JS.

La página lee `searchParams` (pasa a dinámica, es privada) y la isla conserva el estado entre secciones (no recarga membresías ni plan). Un proveedor con sesión cae en el Resumen. El menú de cuenta del header (proveedor) suma "Perfil del negocio" y "Plan". "Pedidos recibidos" vuelve con la bandera `orders`.

### Vista previa "Así te ven en la app"

Réplica de `TallerPerfilScreen.tsx` de autolibre-mobile con los datos de hoy y del mismo endpoint (`GET /partners/{id}`):

- **Portada**: la foto propia, o el monograma con el mismo tono por id (FNV-1a), los mismos colores (tokens nuevos `monogram-gray` y `monogram-ink-gray`) y las iniciales con la misma regla.
- **Subtítulo**: la familia principal.
- **Números**: solo el puntaje con opiniones, como la app (respuesta y trabajos están apagados en la app).
- **"Qué hacen"**: agrupado, de a una familia abierta.
- **Reseñas**: "Todavía no tiene reseñas".
- **Horarios**: no aparecen, ni "Abierto hasta…" (la app los tiene apagados hasta que haya horarios estructurados).
- **"Dónde está"**: la dirección (o la zona).
- **Barra fija**: WhatsApp (si hay contacto) y **"Pedir presupuesto"**, que es lo que la app dice HOY. **Pendiente de la app: pasar a "Pedir propuestas"** (decisión de vocabulario del 24-11).

### Logout por GET: cómo se arregló

Antes, `/cuenta?salir=1` cerraba la sesión apenas se abría el link, así que cualquiera podía mandarlo y desloguearte. Ahora:

- **Con sesión**, la página muestra "¿Cerrar sesión?" con "Sí, cerrar sesión" y "No, seguir en mi cuenta" (`components/cuenta/sign-out-confirm.tsx`). Recién el click borra la pista `al_role` y llama a `signOut` de Clerk, que vuelve al inicio.
- **Sin sesión**, solo limpia la URL y la pista.

El link del header sigue siendo `/cuenta?salir=1`. La pista `al_role` se sigue escribiendo y borrando como antes:
- Se escribe con al menos un negocio.
- Se borra con cero negocios, en "Usar otra cuenta", en "Cerrar sesión" de la fila de sesión y en la confirmación.

### Diferencias con el diseño

- **Pedidos, número de plan usado, código para clientes, "En revisión" y "Ver mi página web"**: no se ven en producción (sin endpoint, ver banderas). La pestaña Pedidos desaparece: un proveedor ve Resumen, Perfil y Plan.
- **"Completá tu perfil"**: el diseño tiene botones "Subir / Cargar / Escribir". Como no hay edición, cada pendiente dice "Mandar por WhatsApp" (con nombre accesible por ítem) y abre el chat con el pedido armado. La pestaña Perfil usa "Agregar" y "Pedir cambio". La nota de abajo lo explica.
- **"Ver cómo te ven en la app"**: no lleva el selector "Hoy / Completo", porque "Completo" era un ejemplo con datos inventados (logo, horarios, "25 min suele responder", "3 trabajos"). Se muestra solo lo de hoy. La vista previa tampoco muestra la distancia ("2,4 km"), porque depende de quien mira.
- **Estado del negocio**: "Publicado" cuando `GET /partners/{id}` responde. Con 404 (pausado o archivado) dice "No visible en la red" y la pestaña Perfil lo explica. El backend no distingue más.
- **"Cambiar de negocio"**: lista los negocios sin el plan de cada uno (haría falta una consulta de suscripción por negocio). Siempre está visible porque aloja "Cargar otro taller" y "Reclamar un taller".
- **"Pago"**: sin "Cuenta que paga" (el GET no trae el email del pagador). La fecha es "Primer cobro" en prueba, "Período actual hasta" activo y "Activo hasta" con la baja pedida. `nextChargeAt` no se usa porque `lib/partner-billing/subscription.ts` (compartido con la contratación) no lo parsea, y no se tocó.
- **Prueba de Plus**: el diseño dice "los primeros 30 días son sin cargo". Acá se muestra solo si el backend confirma que le corresponde (`trialEligible`), con los días del catálogo. Si no lo sabe, va el texto condicional. Si ya la usó, nada.
- **Filtros de Pedidos (apagados)**: usan el `Chip` del sistema (seleccionado = `brand-50` + borde `action`), no la píldora oscura del prototipo.
- **"Falta"**: en `status-pending` (#78350f) y no #92400e.
- **Ancho**: `Container size="wide"` como el resto del sitio, no los 1200 px del prototipo.
- **Fila de sesión**: la fila "Sesión iniciada como…" (`AccountBar`, con "Usar otra cuenta" y "Cerrar sesión") queda al pie de la página. El diseño no la dibuja, pero es la única forma de cambiar de cuenta desde acá.
- **`CancelSubscription`**: botones restilizados (`outline`/`primary` 44). En la confirmación, "No, mantener el plan" es el principal, como pide el diseño. Mismo contrato y mismos eventos.

### Pendientes

**Backend**
- Lectura de pedidos del negocio: outreach, propuesta, elegido, número, estado y vencimiento.
- Uso del mes.
- Código de referido y cuántos clientes guardaron el taller.
- PATCH del perfil del dueño y subida de logo.
- Estado de la solicitud de alta.
- `slug` en `GET /partners/me/memberships` o en `GET /partners/{id}`.
- Una lectura del perfil para el dueño que no dé 404 si está pausado, y que exponga `status`.

**App**
- "Pedir presupuesto" → "Pedir propuestas" en `taller-action-bar.tsx`.

**Landing**
- Prender cada bandera cuando llegue su endpoint.
- `nextChargeAt` en `SubscriptionView` para mostrar "Próximo cobro".

### Archivos

- **Nuevos**
  - `components/cuenta/` (`business-account`, `business-dashboard`, `business-header`, `profile`, `plan`, `orders`, `extras`, `app-preview`, `sign-out-confirm`).
  - `lib/account/` (`sections`, `features`, `partner-profile`, `plan-state`, `orders`, `client`).
  - `scripts/partner-billing/account.test.ts`.
- **Modificados**
  - `app/cuenta/page.tsx`.
  - `components/proveedores/account/{account-panel,account-bar,cancel-subscription}.tsx`.
  - `lib/account/paths.ts` (comentario).
  - `lib/content/account.ts`.
- **Compartidos (solo agregando)**
  - `app/globals.css` (2 tokens).
  - `analytics.md` (2 filas).
  - `lib/content/site.ts` (2 links del menú de cuenta del proveedor).
- Sin tocar: `partner-sign-in.tsx`, `private-flow.tsx`, flujos de `/proveedores`.

### Eventos

No hay eventos nuevos. Hay placements nuevos con el listener delegado:
- `plan_checkout_started` con `cuenta_resumen` y `cuenta_plan`.
- `whatsapp_clicked` con `cuenta_completar_perfil`, `cuenta_perfil` y `cuenta_ayuda`.

### Verificación

- `npm run lint`: 0 errores (282 warnings preexistentes de `.agents/`, `.claude/` y `.cursor/`).
- `npx tsc --noEmit`: OK.
- `npm run build`: OK (`/cuenta` pasa a `ƒ`).
- Todos los `test:*` y `typecheck:*` de `package.json`: OK. Se suman 14 pruebas de `lib/account/*` en `test:partner-billing`.
- Capturas con Chrome headless del build (`next start --port 3102`) de una vista previa local con datos de prueba (borrada), a 1440 y 390:
  - Resumen en Plus en prueba, Gratis, pago pendiente y sin pedidos.
  - Pedidos.
  - Perfil (con la vista previa abierta en celular).
  - Plan en Plus (con la confirmación de baja abierta) y en Gratis.
  - En revisión.
  - "Cambiar de negocio" abierto.
  - Las mismas pantallas con las banderas apagadas (lo que se ve hoy).
- Con el build final se comprobó:
  - `/cuenta` y `/cuenta?salir=1` sin sesión pintan el login con `noindex`.
  - `/cuenta` no está en el sitemap.
  - La ruta de vista previa no existe (404).
- No se cancelaron suscripciones ni se escribió nada en el backend.
- Limitación: el worktree no tiene `.env` (copiarlo estaba bloqueado por permisos), así que no se probó contra el backend real con una cuenta de taller.
