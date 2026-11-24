# Mapa de medición de la landing

## 1. Cómo funciona

```
Botón en un Server Component (sin JS propio)
└─ tiene data-analytics-event="whatsapp_clicked" + data-analytics-placement="hero" …
        │
        ▼
AnalyticsEvents (única isla client, en el layout)
└─ UN listener de click en todo el documento, en fase de captura
        │
        ▼
track(evento, props)  ← catálogo único: lib/analytics/events.ts
├─► PostHog: evento en snake_case con todas las props + app: "landing"
└─► Meta Pixel: evento equivalente (Lead / Contact / custom), solo con los params permitidos
```

Hay tres formas en que se dispara un evento:

- **Click en un botón marcado:** lo detecta el listener, sin código en el botón.
- **Código explícito:** `track()` en el formulario y en el modal.
- **Server:** `/api/presupuesto` manda `quote_submitted` a PostHog y el `Lead` a la Conversions API de Meta.

Cuándo mide cada herramienta:

- **PostHog** mide solo en el deploy de **Production de Vercel** y con `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` cargado. El corte es por código: `NEXT_PUBLIC_VERCEL_ENV === "production"` en el navegador y `VERCEL_ENV === "production"` en el server. En local (aunque el token esté en el `.env`) y en los previews no se manda nada, ni desde el navegador ni el `quote_submitted` del server. Se carga después del load de la página, cuando el navegador está libre, y lo que pase antes queda en cola (hasta 50 eventos) con su hora real.
- **Meta** mide solo si existe `NEXT_PUBLIC_META_PIXEL_ID`. El stub se carga en el `<head>` y `fbevents.js` se descarga de forma diferida.
- **Todo es anónimo:** nunca se llama a `identify` y nunca viajan nombre, WhatsApp, correo, patente, zona ni lo que la persona escribe.

---

## 2. Lo que se captura solo (sin código de eventos)

| Qué                       | Herramienta             | Cuándo                                                                                                                                                |
| ------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `$pageview`               | PostHog                 | Carga inicial y cada cambio de ruta del router                                                                                                        |
| `$pageleave`              | PostHog                 | Al salir de una página (sirve para el tiempo en página y el scroll)                                                                                   |
| `PageView`                | Meta                    | Carga inicial (stub del layout) y cada navegación                                                                                                     |
| Session replay            | PostHog (config remota) | Grabación de la visita, con inputs enmascarados. Las sugerencias de Google Places y el resumen de la confirmación de `/pedido` también quedan ocultos |
| Heatmaps y dead clicks    | PostHog (remota)        | Dónde clickean, y los clicks sobre cosas que no hacen nada                                                                                            |
| Web vitals                | PostHog (remota)        | LCP, INP y CLS de usuarios reales                                                                                                                     |
| Errores JS y console logs | PostHog (remota)        | Excepciones no capturadas                                                                                                                             |
| Autocapture y rageclick   | Apagados                | Solo cuentan los eventos explícitos del catálogo                                                                                                      |

Todos los eventos de PostHog llevan `app: "landing"`, y los de la sesión incluyen UTMs, referrer, dispositivo y país, que agrega PostHog solo.

---

## 3. Eventos explícitos, página por página

### 🌐 Header, menú de cuenta, barra fija, footer y botón flotante (layout compartido)

Desde la fase 2 del rediseño (2026-11-24) el header ya no tiene "Descargar la app": los `app_store_clicked` con `placement: "header"` y `"header_menu"` dejan de llegar desde esa fecha. Su acción principal es "Hacé tu pedido" (salvo en `/pedido`, `/proveedores/planes` y `/proveedores/registro`, que la piden sin ella). Los placements del layout están en `LAYOUT_PLACEMENTS` y `QUOTE_CTA_PLACEMENTS` (`lib/analytics/events.ts`).

| Botón                                                            | Evento PostHog             | Props                           | Meta                  | Cuándo |
| ---------------------------------------------------------------- | -------------------------- | ------------------------------- | --------------------- | ------ |
| "Hacé tu pedido" del header (desde `lg`)                         | `quote_cta_clicked`        | `placement: "header"`           | —                     | Click  |
| "Hacé tu pedido" del menú mobile                                 | `quote_cta_clicked`        | `placement: "header_menu"`      | —                     | Click  |
| "Hacé tu pedido" de la barra fija en celular (home, directorio)  | `quote_cta_clicked`        | `placement: "mobile_bar"`       | —                     | Click  |
| "Hacé tu pedido" del footer                                      | `quote_cta_clicked`        | `placement: "footer"`           | —                     | Click  |
| WhatsApp de la barra fija en celular                             | `whatsapp_clicked`         | `placement: "mobile_bar"`       | `Contact {placement}` | Click  |
| WhatsApp del footer                                              | `whatsapp_clicked`         | `placement: "footer"`           | `Contact {placement}` | Click  |
| Botón flotante de WhatsApp                                       | `whatsapp_clicked`         | `placement: "fab"`              | `Contact {placement}` | Click  |
| "Sumá tu negocio" del header (desde `lg`, sin sesión o cliente)  | `partner_register_started` | `placement: "header"`           | —                     | Click  |
| "Sumá tu negocio" del menú de cuenta (o del menú mobile)         | `partner_register_started` | `placement: "account_menu"`     | —                     | Click  |
| "Sumate como proveedor" del footer                               | `partner_register_started` | `placement: "footer"`           | —                     | Click  |

"Ir a mi negocio" (proveedor) y el resto de las opciones del menú de cuenta no tienen evento propio: se ve el `$pageview` de destino. Ningún prop dice si la persona tiene sesión ni su rol.

### 🏠 Home `/`

| Botón / zona                           | Evento PostHog                  | Props                               | Meta                  | Cuándo |
| -------------------------------------- | ------------------------------- | ----------------------------------- | --------------------- | ------ |
| Botones de tienda del hero             | `app_store_clicked`             | `store`, `placement: "hero"`        | —                     | Click  |
| Botones de tienda del CTA de cierre    | `app_store_clicked`             | `store`, `placement: "closing_cta"` | —                     | Click  |
| WhatsApp en la sección de presupuestos | `whatsapp_clicked`              | `placement: "home_quotes"`          | `Contact {placement}` | Click  |
| "Pedir presupuesto" (abre el modal)    | (sin evento propio) → ver modal |                                     |                       |        |

### 🪟 Modal de presupuesto (se abre desde la home), 4 pasos

| Momento                                                                  | Evento PostHog      | Props                                                    | Meta                                                         | Cuándo                                                                                                  |
| ------------------------------------------------------------------------ | ------------------- | -------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| Ve cada paso: 1 patente, 2 contacto/zona, 3 qué necesita, 4 confirmación | `quote_step_viewed` | `flow: "modal"`, `step: 1-4`                             | `PedidoPaso {step}` (custom)                                 | Una vez por paso por apertura. El paso 1 sale al abrir el modal, así que funciona como "abrió el modal" |
| Termina el paso 1 (confirma el auto o sigue sin él)                      | `quote_started`     | `flow: "modal"`                                          | `QuoteStart` (custom)                                        | Una vez por instancia                                                                                   |
| El pedido se registró en el backend                                      | `quote_submitted`   | server, ver [sección 4](#4-quote_submitted-en-el-server) | `Lead` sin params + el mismo `eventID` en la Conversions API | Solo si el backend responde OK                                                                          |
| El envío falló                                                           | `quote_failed`      | `flow: "modal"`, `reason: network\|server`, `status?`    | —                                                            | Error de red o respuesta de error                                                                       |
| Pantalla de éxito: botones de tienda                                     | `app_store_clicked` | `store`, `placement: "quote_success"`                    | —                                                            | Click                                                                                                   |
| Pantalla de éxito: WhatsApp                                              | `whatsapp_clicked`  | `placement: "quote_success"`, `pedido: true`             | `Contact {placement, pedido}`                                | Click. No es un segundo Lead, porque esa persona ya contó                                               |

### 📝 `/pedido`, la página de la campaña

Hasta el 2026-11-05 el header de `/pedido` tenía un botón de WhatsApp (`placement: "header"` y `"header_menu"`, con `lead_source: "whatsapp"`). Ya no existe, así que esos placements de `whatsapp_clicked` (con `lead_source`) dejan de llegar desde esa fecha. Desde el 2026-11-24 el header de `/pedido` va sin acción principal (la página ES el pedido).

| Botón / zona                                                               | Evento PostHog     | Props                                                    | Meta                                                                       | Cuándo                           |
| -------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| WhatsApp del hero                                                          | `whatsapp_clicked` | `placement: "hero"`, `lead_source: "whatsapp"`           | `Lead`                                                                     | Click                            |
| WhatsApp de la barra fija (sticky)                                         | `whatsapp_clicked` | `placement: "sticky_bar"`, `lead_source: "whatsapp"`     | `Lead`                                                                     | Click                            |
| WhatsApp de la banda CTA                                                   | `whatsapp_clicked` | `placement: "cta_band"`, `lead_source: "whatsapp"`       | `Lead`                                                                     | Click                            |
| Primera interacción con el formulario (foco en un campo o un atajo rápido) | `quote_started`    | `flow: "page"`                                           | `QuoteStart` (custom)                                                      | Una vez por carga del formulario |
| Pedido registrado                                                          | `quote_submitted`  | server, ver [sección 4](#4-quote_submitted-en-el-server) | `Lead {lead_source: "form"}` + `eventID` compartido con la Conversions API | Solo con OK del backend          |
| Envío fallido                                                              | `quote_failed`     | `flow: "page"`, `reason`, `status?`                      | —                                                                          | Error                            |
| WhatsApp de la confirmación                                                | `whatsapp_clicked` | `placement: "confirmation"`, `pedido: true`              | `Contact` (no Lead)                                                        | Click después de pedir           |

> **Clave para Ads:** en `/pedido` la campaña optimiza sobre un solo `Lead`, que llega por dos caminos y se separa con `lead_source`: `whatsapp` (clicks) o `form` (pedido registrado).

### 🧩 Módulo de pedido (`components/modulo-pedido`, rediseño fase 3)

Pestañas Taller / Auxilio / Multas / Seguro. Lo van a montar el Home (`placement: "modulo_home"`) y `/pedido` (`placement: "modulo_pedido"`) en la fase 4; desde el 2026-11-24 vive en la vista previa `/pedido/modulo` (noindex, mide como `modulo_pedido`). Valores cerrados en `QUOTE_TABS`, `QUOTE_MODULE_PLACEMENTS` y `QUOTE_CHIPS` (`lib/analytics/events.ts`). Solo Taller registra un pedido; el `flow` sigue siendo `page` (mismo body y misma route que el form de `/pedido`), y `tab` + `placement` son lo que lo separa.

| Botón / momento                                                         | Evento PostHog          | Props                                                                     | Meta                                                    | Cuándo |
| ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| Elige una pestaña                                                       | `quote_tab_selected`    | `tab`, `placement`                                                        | —                                                       | Click o flechas. La pestaña inicial (Taller) no cuenta |
| Primera interacción con Taller (foco en un campo o un chip)             | `quote_started`         | `flow: "page"`, `tab: "taller"`, `placement`                              | `QuoteStart` (custom, sin params)                       | Una vez por carga del módulo |
| Toca un chip de "Lo más pedido"                                         | `quote_chip_clicked`    | `chip` (id: `service`, `luz_tablero`, `alineacion_balanceo`, `frenos`, `aire_acondicionado`), `placement`, `selected` | — | Click |
| Pasa al paso 2 (WhatsApp y patente)                                     | `quote_step_viewed`     | `flow: "page"`, `step: 2`, `tab: "taller"`, `placement`                   | `PedidoPaso {step}` (custom)                            | Una vez por carga del módulo |
| Pedido registrado                                                       | `quote_submitted`       | server, ver [sección 4](#4-quote_submitted-en-el-server) (con `tab` y `placement`) | `Lead {lead_source: "form"}` + `eventID` compartido | Solo con OK del backend |
| Envío fallido                                                           | `quote_failed`          | `flow: "page"`, `tab`, `placement`, `reason`, `status?`                   | —                                                       | Error |
| "Pedilo por WhatsApp" (Taller)                                          | `whatsapp_clicked`      | `placement`, `tab: "taller"`, `lead_source: "whatsapp"` solo en `modulo_pedido` | `Lead` en `modulo_pedido`; `Contact` en `modulo_home` | Click |
| "Cotizá por WhatsApp" (Seguro: no hay endpoint de seguros)              | `whatsapp_clicked`      | `placement`, `tab: "seguro"`, `lead_source` igual que arriba              | Igual que arriba                                        | Click |
| "Pedí auxilio" (Asistir24) / "Consultá tu caso" (Sin Fotomultas)        | `quote_partner_clicked` | `tab: "auxilio"` / `"multas"`, `placement`                                | —                                                       | Click. Es el "inicio del pedido" de esas pestañas |
| "Bajar la app" del enviado                                              | (sin evento propio)     |                                                                           |                                                         | Se ve el `$pageview` de `/descarga` |

`lead_source`: el pedido registrado es `Lead {lead_source: "form"}` en las dos ubicaciones (igual que lo que manda la route a PostHog para todo `flow: "page"`). El WhatsApp sigue la regla de `/pedido`: en `modulo_pedido` es `Lead {lead_source: "whatsapp"}`; en `modulo_home`, un `Contact`, como el resto de los WhatsApp del Home. Ningún prop lleva lo que escribe la persona: el chip viaja por id.

### 📲 `/descarga`

| Botón             | Evento PostHog      | Props                            | Meta | Cuándo |
| ----------------- | ------------------- | -------------------------------- | ---- | ------ |
| Botones de tienda | `app_store_clicked` | `store`, `placement: "descarga"` | —    | Click  |

### 🏪 `/proveedores`

| Botón / zona                                                                            | Evento PostHog                  | Props                                               | Meta | Cuándo                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Pedir presupuesto" del estado vacío (búsqueda, zona o rubro sin negocios, no un error) | `directory_empty_quote_clicked` | `has_query?`, `has_zone?`, `has_category?` (`true`) | —    | Click. Dice qué filtros había, nunca su valor: ni el texto buscado ni la zona. Sirve para medir cuántas búsquedas sin resultados se rescatan pidiendo presupuesto |

### 🧾 Talleres: registro, reclamo y contratación de planes (specs 211 y 212)

Embudo de contratación: `plan_checkout_started` → `plan_checkout_redirected` → `plan_checkout_confirmed`. Ninguno lleva datos personales: ni email, ni código de reclamo, ni taller. Hoy ninguno va a Meta; si marketing quiere optimizar sobre la suscripción, el candidato es `plan_checkout_confirmed`.

| Botón / momento                                                          | Evento PostHog             | Props                                  | Meta | Cuándo                                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------- | -------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "Quiero el plan Plus / Plus Max" en `/proveedores/planes`                | `plan_checkout_started`    | `plan: plus\|plus_max`                 | —    | Click                                                                                                                                        |
| El backend creó el checkout y se manda a Mercado Pago (`/contratar`)     | `plan_checkout_redirected` | `plan`                                 | —    | Justo antes de redirigir. Si PostHog todavía no había cargado, puede perderse en la navegación                                              |
| La pantalla de resultado confirma la suscripción (`/contratar/resultado`) | `plan_checkout_confirmed`  | `plan`, `trial` (arrancó en prueba)    | —    | Estado del backend, nunca los params de MP. Una vez por checkout: solo si esa pestaña tenía un checkout pendiente (recargar no lo repite)     |
| "Cargar otro taller" en `/cuenta` ("¿Tenés otro taller?")                | `partner_register_started` | `placement: "cuenta_otro_taller_cargar"` | —  | Click. Hasta el 2026-11-05 también lo mandaba "Registrar mi taller" de `/proveedores/registro` (sin `placement`); ese botón ya no existe porque la página es el formulario. El envío del formulario no tiene evento propio |
| "Reclamar un taller" en `/cuenta` ("¿Tenés otro taller?")                | `partner_claim_started`    | `placement: "cuenta_otro_taller_reclamar"` | — | Click. Nunca el código                                                                                                                     |
| Canje exitoso de un código en `/proveedores/reclamar`                    | `partner_claim_redeemed`   | `from_checkout?` (`true`)              | —    | Al recibir el OK del backend. `from_checkout`: el reclamo venía de contratar un plan                                                        |
| "Hablar con ventas" en `/proveedores/planes`                             | `whatsapp_clicked`         | `placement: "proveedores_planes_ventas"` | `Contact {placement}` | Click                                                                                                                    |

---

## 4. `quote_submitted` en el server

**Cuándo:** en `/api/presupuesto`, solo después de que el backend confirma el pedido. Corre en `after()`, así que la respuesta a la persona no espera a PostHog. Tiene 5 s de timeout y 1 reintento, y si falla se loguea y el pedido no se entera.

**Cómo se une a la sesión:** el navegador manda su `distinct_id` y su `session_id` junto con el pedido. El server envía el evento con esos ids, y así queda en la misma persona y sesión que el resto, incluida la grabación. Si PostHog estaba bloqueado, sale con un id al azar y sin perfil: cuenta en los totales pero no entra en el funnel por persona.

**Props:**

| Prop                                              | Qué es                                         |
| ------------------------------------------------- | ---------------------------------------------- |
| `flow`                                            | `modal` o `page`                               |
| `tab`                                             | Solo desde el módulo de pedido: pestaña (`taller`) |
| `placement`                                       | Solo desde el módulo de pedido: `modulo_home` o `modulo_pedido` |
| `lead_source`                                     | `form` solo en `/pedido`; el modal va sin él (igual que el `Lead` del Pixel) |
| `has_plate`                                       | Si puso patente                                |
| `vehicle_identified`                              | Si se identificó el auto                       |
| `vehicle_make` / `vehicle_model` / `vehicle_year` | Solo con el auto identificado                  |
| `has_email`                                       | Si dejó correo                                 |
| `location_from_suggestion`                        | Si eligió la zona de las sugerencias de Google |
| `app`                                             | `landing`                                      |

La Conversions API de Meta sale en paralelo con el mismo `eventID` que el Pixel, así que Meta cuenta un solo Lead. El teléfono viaja hasheado con SHA-256.

---

## 5. Lo que no se mide hoy

- **Abrir el modal** no tiene evento propio: se aproxima con `quote_step_viewed step: 1`.
- **Envío del formulario de proveedores (`/proveedores/registro`):** no tiene evento propio; se aproxima con el `$pageview` de la página. Desde el 2026-11-05 el formulario vive otra vez en `/proveedores/registro` (la página ES el formulario); entre la spec 212 y esa fecha vivió en `/proveedores/registro/formulario`, que hoy redirige (301) a `/proveedores/registro`. Hasta el release de AUT-137 el formulario vivía en `/proveedores`: los `$pageview` de esa ruta anteriores a la fecha de salida (completar al deployar: ____) son del formulario y los posteriores son del directorio; la serie nueva arranca en `/proveedores/registro`.
- **Links de navegación** (los links de página del header y del menú, y las opciones del menú de cuenta salvo "Sumá tu negocio"): solo se ve el `$pageview` de destino.
- **UTMs dentro del pedido:** hay un TODO porque el DTO del backend rechaza campos desconocidos. Igual, PostHog guarda los UTMs de la sesión, así que el funnel sí se puede cortar por campaña.
