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
├─► Google Tag Manager: dataLayer.push({ event: <nombre en snake_case>, ...props })
└─► Meta Pixel: evento equivalente (Lead / Contact / custom), solo con los params permitidos
```

Hay tres formas en que se dispara un evento:

- **Click en un botón marcado:** lo detecta el listener, sin código en el botón.
- **Código explícito:** `track()` en el formulario y en el modal.
- **Server:** `/api/presupuesto` manda `quote_submitted` a PostHog y el `Lead` a la Conversions API de Meta.

Cuándo mide cada herramienta:

- **PostHog** mide solo en el deploy de **Production de Vercel** y con `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` cargado. El corte es por código: `NEXT_PUBLIC_VERCEL_ENV === "production"` en el navegador y `VERCEL_ENV === "production"` en el server. En local (aunque el token esté en el `.env`) y en los previews no se manda nada, ni desde el navegador ni el `quote_submitted` del server. Se carga después del load de la página, cuando el navegador está libre, y lo que pase antes queda en cola (hasta 50 eventos) con su hora real.
- **Meta** mide solo si existe `NEXT_PUBLIC_META_PIXEL_ID`. El stub se carga en el `<head>` y `fbevents.js` se descarga de forma diferida.
- **Google Tag Manager** mide solo si existe `NEXT_PUBLIC_GTM_ID` con formato `GTM-XXXXXXX` (mismo criterio que Meta, sin corte por entorno). El stub del `<head>` crea el `dataLayer` y `gtm.js` se descarga de forma diferida con el mismo disparador que `fbevents.js` (primera interacción o idle después del load). Recibe todos los eventos del catálogo con sus props, incluido `quote_submitted` (`flow`, `lead_source`, `tab`, `placement`). No hay pageview manual en las navegaciones: lo resuelve el trigger de History Change del contenedor. Qué etiquetas disparan se configura en el contenedor, no en el código. Ojo: el modelo de datos de GTM es persistente, un prop de un evento anterior sigue visible en uno posterior que no lo trae.
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
| "Sumá tu negocio" del submenú de "Proveedores" (desde 2026-11-27: panel del header desde `lg`, lista del menú mobile debajo) | `partner_register_started` | `placement: "nav_submenu"`      | —                     | Click  |
| "Sumá tu negocio" del menú de cuenta (o del menú mobile)         | `partner_register_started` | `placement: "account_menu"`     | —                     | Click  |
| "Sumate como proveedor" del footer                               | `partner_register_started` | `placement: "footer"`           | —                     | Click  |

"Ir a mi negocio" (proveedor) y el resto de las opciones del menú de cuenta no tienen evento propio: se ve el `$pageview` de destino. Ningún prop dice si la persona tiene sesión ni su rol.

### 🏠 Home `/`

Desde el 2026-11-24 (rediseño, fase 4a) el Home monta el módulo de pedido (`placement: "modulo_home"`, ver más abajo). Dejan de llegar `app_store_clicked` `hero` y `closing_cta` del Home, y `whatsapp_clicked` / `quote_cta_clicked` `home_quotes` (esas secciones ya no existen; `closing_cta` sigue llegando desde `/blog` y `/sobre-nosotros`).

| Botón / zona                                        | Evento PostHog             | Props                                  | Meta                  | Cuándo |
| --------------------------------------------------- | -------------------------- | -------------------------------------- | --------------------- | ------ |
| Tarjetas y links de "Todo lo que podés pedir"       | `quote_cta_clicked`        | `placement: "home_services"`           | —                     | Click (llevan a `/pedido`) |
| "Hacé tu pedido" de la barra fija (sube al módulo)  | `quote_cta_clicked`        | `placement: "mobile_bar"`              | —                     | Click  |
| Botones de tienda del panel de la app               | `app_store_clicked`        | `store`, `placement: "home_app"`       | —                     | Click  |
| WhatsApp del texto de la FAQ                        | `whatsapp_clicked`         | `placement: "home_faq"`                | `Contact {placement}` | Click  |
| "Sumate a AutoLibre" de la banda para negocios      | `partner_register_started` | `placement: "home_band"`               | —                     | Click  |

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

Desde el 2026-11-24 (rediseño, fase 4a) el formulario de `/pedido` es el módulo de pedido (`placement: "modulo_pedido"`, ver abajo). Se fueron el form viejo (`flow: "page"` sin `tab`), el hero con WhatsApp y QR y la barra fija vieja: dejan de llegar `whatsapp_clicked` `hero`, `sticky_bar` y `confirmation`.

| Botón / zona                                          | Evento PostHog      | Props                                                    | Meta     | Cuándo |
| ----------------------------------------------------- | ------------------- | -------------------------------------------------------- | -------- | ------ |
| WhatsApp de la barra fija en celular                  | `whatsapp_clicked`  | `placement: "mobile_bar"`, `lead_source: "whatsapp"`     | `Lead`   | Click  |
| "Hacé tu pedido" de la barra fija (sube al módulo)    | `quote_cta_clicked` | `placement: "mobile_bar"`                                | —        | Click  |
| WhatsApp de la banda de cierre                        | `whatsapp_clicked`  | `placement: "cta_band"`, `lead_source: "whatsapp"`       | `Lead`   | Click  |
| "Hacé tu pedido" de la banda de cierre (sube al módulo) | `quote_cta_clicked` | `placement: "pedido_cta_band"`                         | —        | Click  |
| Pedido, inicio, paso 2, envío, WhatsApp del módulo    | ver Módulo de pedido | `placement: "modulo_pedido"`                            |          |        |

> **Clave para Ads:** en `/pedido` la campaña optimiza sobre un solo `Lead`, que llega por dos caminos y se separa con `lead_source`: `whatsapp` (clicks) o `form` (pedido registrado). `PedidoPaso` (`quote_step_viewed`, `step: 2`) ahora lo manda el módulo en el Home y en `/pedido`: hay que avisarle a marketing.

### 🧩 Módulo de pedido (`components/modulo-pedido`, rediseño fase 3)

Pestañas Taller / Auxilio / Multas / Seguros / Financiación. Seguros y Financiación se sumaron el 2026-11-27 como consultas (`ModuloConsultaForm`): se envían por formulario, se registran en el backend por `/api/consulta` y su conversión es `quote_submitted` (ver la nota de abajo). La pestaña Seguro anterior se había sacado el 2026-11-24; sus eventos viejos con `tab: "seguro"` (singular) quedan en el histórico de la vista previa y ese valor no se reusa. Montado en el Home (`placement: "modulo_home"`) y en `/pedido` (`placement: "modulo_pedido"`) desde la fase 4a (2026-11-24); la vista previa `/pedido/modulo` se borró. El paso 2 tiene un checkbox de consentimiento desmarcado y obligatorio: `consent` viaja con su valor real. Valores cerrados en `QUOTE_TABS`, `QUOTE_MODULE_PLACEMENTS` y `QUOTE_CHIPS` (`lib/analytics/events.ts`). Solo Taller registra un pedido; el `flow` sigue siendo `page` (mismo body y misma route que el form de `/pedido`), y `tab` + `placement` son lo que lo separa.

| Botón / momento                                                         | Evento PostHog          | Props                                                                     | Meta                                                    | Cuándo |
| ----------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------- | ------ |
| Elige una pestaña                                                       | `quote_tab_selected`    | `tab`, `placement`                                                        | —                                                       | Click o flechas. La pestaña inicial (Taller) no cuenta |
| Primera interacción con Taller (foco en un campo o un chip)             | `quote_started`         | `flow: "page"`, `tab: "taller"`, `placement`                              | `QuoteStart` (custom, sin params)                       | Una vez por carga del módulo |
| Toca un chip de "Lo más pedido"                                         | `quote_chip_clicked`    | `chip` (id: `service`, `luz_tablero`, `alineacion_balanceo`, `frenos`, `aire_acondicionado`), `placement`, `selected` | — | Click |
| Pasa al paso 2 (WhatsApp y patente)                                     | `quote_step_viewed`     | `flow: "page"`, `step: 2`, `tab: "taller"`, `placement`                   | `PedidoPaso {step}` (custom)                            | Una vez por carga del módulo |
| Pedido registrado                                                       | `quote_submitted`       | server, ver [sección 4](#4-quote_submitted-en-el-server) (con `tab` y `placement`) | `Lead {lead_source: "form"}` + `eventID` compartido | Solo con OK del backend |
| Envío fallido                                                           | `quote_failed`          | `flow: "page"`, `tab`, `placement`, `reason`, `status?`                   | —                                                       | Error |
| "Pedilo por WhatsApp" (Taller)                                          | `whatsapp_clicked`      | `placement`, `tab: "taller"`, `lead_source: "whatsapp"` solo en `modulo_pedido` | `Lead` en `modulo_pedido`; `Contact` en `modulo_home` | Click |
| Primera interacción con el form de Seguros o de Financiación (foco en un campo) | `quote_started` | `flow: "page"`, `tab: "seguros"` / `"financiacion"`, `placement` | `QuoteStart` (custom, sin params) | Una vez por carga del módulo y por pestaña |
| "Enviar consulta" (Seguros / Financiación) registrada por el backend | `quote_submitted` | server (`/api/consulta`): `flow: "page"`, `tab: "seguros"` / `"financiacion"`, `placement`, `lead_source: "form"` solo en `modulo_pedido`. Con los ids anónimos de PostHog del navegador, como Taller | `Lead {lead_source: "form"}` en `modulo_pedido`; `Contact {placement}` en `modulo_home`. Pixel + Conversions API con `eventID` compartido (la CAPI lleva el WhatsApp hasheado, igual que Taller; el email no viaja) | Solo con OK del backend. Cero datos del form |
| "Mandarla por WhatsApp" del error de envío (Seguros / Financiación) | `whatsapp_clicked` | `placement`, `tab`, `fallback: true`, `lead_source: "whatsapp"` solo en `modulo_pedido` | `Lead` en `modulo_pedido`; `Contact` en `modulo_home` | Click en la salida por WhatsApp que aparece SOLO cuando el envío falló (lo manda la isla). `fallback` lo separa del resto |
| Falla el envío de la consulta (Seguros / Financiación) | `quote_failed` | `flow: "page"`, `tab: "seguros"` / `"financiacion"`, `placement`, `reason` (`network` / `server`), `status?` | — | Cuando `/api/consulta` no responde OK (incluye los 400 de un campo y el 429). A la persona se le muestra el error. Sin datos del form ni el texto del error (nombre, edad, código postal, patente, cobertura, CUIT, sexo, motivo, monto, WhatsApp y email nunca viajan) |
| "Pedí auxilio" (Asistir24) / "Consultá tu caso" (Sin Fotomultas)        | `quote_partner_clicked` | `tab: "auxilio"` / `"multas"`, `placement`                                | —                                                       | Click. Es el "inicio del pedido" de esas pestañas |
| Aparece el bloque "Así se ve en la app" del enviado                     | `pedido_app_promo_view` | `placement`, `app_linked` (`APP_VINCULADA`, hoy `false`)                  | —                                                       | Una vez por envío, al mostrarse |
| El QR de descarga del enviado entra en pantalla                         | `qr_view`               | `section: "pedido_enviado"`, `placement`                                  | —                                                       | Una vez por envío. Solo escritorio (el QR existe desde `lg`; en celular no se dibuja) |
| Botón de tienda del enviado (App Store / Google Play)                   | `cta_download_click` **y** `app_store_clicked` | los dos con `store`, `section: "pedido_enviado"`, `placement` | —                                              | Click. Mismo click, dos eventos (ver nota) |

Consultas de Seguros y Financiación (2026-11-27): se envían SOLO por formulario (`/api/consulta` → `POST /api/v1/inquiries/insurance|financing`) y la conversión es `quote_submitted`. No hay `whatsapp_clicked` en el camino feliz: el único WhatsApp del form es la salida del estado de error (`fallback: true`). Para no perder la señal de Meta, el `quote_submitted` de estas dos pestañas usa la semántica que tienen los botones de WhatsApp del módulo: `Lead` en `/pedido` y `Contact` en el Home (regla en `ANALYTICS_CATALOG.quote_submitted`; Taller no cambia, siempre `Lead`). Diferencia con Taller: en el Home estas pestañas mandan `quote_submitted` SIN `lead_source` (Taller manda `lead_source: "form"` en las dos ubicaciones). GTM recibe `quote_submitted` con `tab` y `placement` desde el navegador, como siempre: si en GTM hay un tag de conversión colgado de ese evento, va a contar también estas consultas. La route no loguea el body y nunca reenvía el `message` del backend. **Pendiente de decisión (marketing):** si una consulta de Financiación (y de Seguros) debe contar como `Lead` de la campaña.

Estado enviado (ajuste del 2026-11-24): "Bajar la app" se reemplazó por el bloque de la app, con el QR a `/descarga?utm_source=web&utm_medium=pedido_enviado` (los escaneos se ven como `$pageview` de `/descarga` con esos UTM) y los botones de tienda (en un iPhone solo App Store y en un Android solo Google Play, por `data-platform`). **`cta_download_click` y `app_store_clicked` salen juntos**: `cta_download_click` lo pide la especificación del ajuste (evento de descarga con `section`), y `app_store_clicked` es el conteo histórico de clicks a tienda de todo el sitio; mandar solo el nuevo cortaría esa serie. Para contar descargas del sitio, usar `app_store_clicked`; para esta superficie, cualquiera de los dos filtrado por `section`. El listener acepta varios nombres en `data-analytics-event` separados por espacio.

`lead_source`: el pedido registrado es `Lead {lead_source: "form"}` en las dos ubicaciones (igual que lo que manda la route a PostHog para todo `flow: "page"`). El WhatsApp sigue la regla de `/pedido`: en `modulo_pedido` es `Lead {lead_source: "whatsapp"}`; en `modulo_home`, un `Contact`, como el resto de los WhatsApp del Home. Ningún prop lleva lo que escribe la persona: el chip viaja por id.

### 📲 `/descarga`

| Botón             | Evento PostHog      | Props                            | Meta | Cuándo |
| ----------------- | ------------------- | -------------------------------- | ---- | ------ |
| Botones de tienda | `app_store_clicked` | `store`, `placement: "descarga"` | —    | Click  |

### 🏪 `/proveedores` y perfiles `/proveedores/[slug]`

Desde el 2026-11-24 (rediseño, fase 4b). El directorio usa la barra fija compartida (`quote_cta_clicked` / `whatsapp_clicked` `mobile_bar`, ver Layout). Los eventos del perfil (`provider_action_clicked` y el WhatsApp con `provider`) ya estaban en el catálogo desde la spec 209 pero el perfil vigente no los mandaba: desde esta fecha llegan. Ningún prop lleva lo que escribe la persona: el texto de "¿Qué le pasa?" viaja a `/pedido` por `sessionStorage`, nunca por la URL.

| Botón / zona                                                                            | Evento PostHog                  | Props                                               | Meta | Cuándo                                                                                                                                                             |
| --------------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| "Pedir propuestas" de la banda "¿No sabés a quién elegir?" (directorio)                  | `quote_cta_clicked`             | `placement: "directory_band"` (nuevo valor de `QUOTE_CTA_PLACEMENTS`) | — | Click (o Enter en el campo). Lleva a `/pedido` con el texto cargado en el módulo |
| "Sumar mi negocio" de la tarjeta para negocios (directorio)                              | `partner_register_started`      | `placement: "directory_card"`                       | —    | Click |
| "Pedir propuestas" del estado vacío (búsqueda, zona o rubro sin negocios, no un error) | `directory_empty_quote_clicked` | `has_query?`, `has_zone?`, `has_category?` (`true`) | —    | Click. Dice qué filtros había, nunca su valor: ni el texto buscado ni la zona. Sirve para medir cuántas búsquedas sin resultados se rescatan pidiendo propuestas |
| "Pedile una propuesta" de la cabecera del perfil                                         | `provider_action_clicked`       | `action: "proposal"`, `provider` (slug), `placement: "profile_head"` | — | Click. Lleva a `/pedido` |
| "Pedir propuesta" de la tarjeta del costado del perfil                                   | `provider_action_clicked`       | `action: "proposal"`, `provider`, `placement: "profile_aside"` | — | Click (o Enter). Lleva a `/pedido` con el texto cargado |
| "Pedir propuesta" de la barra fija del perfil (celular)                                  | `provider_action_clicked`       | `action: "proposal"`, `provider`, `placement: "mobile_bar"` | — | Click |
| WhatsApp del negocio (cabecera o barra fija del perfil)                                  | `whatsapp_clicked`              | `provider`, `placement: "profile_head"` / `"mobile_bar"` | `Contact` | Click. Sin `lead_source`: es el WhatsApp del negocio, no un pedido a AutoLibre. Si el negocio no tiene WhatsApp, la barra lleva el de AutoLibre (sin `provider`) |
| "Cómo llegar" (Google Maps)                                                              | `provider_action_clicked`       | `action: "directions"`, `provider`                  | —    | Click |
| "Sumate a AutoLibre" de la banda oscura del perfil                                       | `partner_register_started`      | `placement: "profile_band"`                         | —    | Click |

Ya no llegan: el "Pedir presupuesto" del estado vacío cambió de texto ("Pedir propuestas"), mismo evento. La barra fija vieja del perfil (solo WhatsApp, sin evento) se reemplazó por la compartida.

### 📰 Blog y `/sobre-nosotros` (rediseño, fase 4c)

Desde el 2026-11-24. Los `placement` de las tiendas se conservan: `closing_cta` (cierre del listado, las categorías y `/sobre-nosotros`) y `blog_article` (panel de descarga de la nota, que pasó del final del cuerpo al final de la página). La barra fija de celular del blog ("Descargar la app gratis", a `/descarga`) sigue sin evento propio: es navegación interna.

| Botón / zona                                                        | Evento PostHog             | Props                                                       | Meta | Cuándo |
| ------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------- | ---- | ------ |
| "Hacé tu pedido" del llamado dentro de la nota ("Pedí propuestas…") | `quote_cta_clicked`        | `placement: "blog_article"` (nuevo valor de `QUOTE_CTA_PLACEMENTS`) | —    | Click (lleva a `/pedido`) |
| Tiendas del panel de descarga del blog                              | `app_store_clicked`        | `store`, `placement: "closing_cta"` / `"blog_article"`      | —    | Click  |
| "Hacé tu pedido" del cierre de `/sobre-nosotros`                    | `quote_cta_clicked`        | `placement: "about_closing"` (nuevo valor)                  | —    | Click  |
| "Sumá tu negocio" del cierre de `/sobre-nosotros`                   | `partner_register_started` | `placement: "about_closing"`                                | —    | Click  |
| Links "App Store" / "Google Play" del cierre de `/sobre-nosotros`    | `app_store_clicked`        | `store`, `placement: "closing_cta"`                         | —    | Click  |

### 🧾 Talleres: registro, reclamo y contratación de planes (specs 211 y 212)

Embudo de contratación: `plan_checkout_started` → `plan_checkout_redirected` → `plan_checkout_confirmed`. Ninguno lleva datos personales: ni email, ni código de reclamo, ni taller. Hoy ninguno va a Meta; si marketing quiere optimizar sobre la suscripción, el candidato es `plan_checkout_confirmed`.

Desde el 2026-11-26 AutoLibre cobra por trabajo confirmado y `/proveedores/planes` es la página de precios: sus tarjetas van al registro (`partner_register_started`) o a WhatsApp (`whatsapp_clicked`) y ya no arrancan este embudo. La contratación online sigue viva pero sin ningún enlace (ni público ni desde `/cuenta`, que ahora ofrece el pack por WhatsApp), así que `plan_checkout_started` dejó de llegar; el resto del embudo solo puede venir de un flujo ya iniciado.

| Botón / momento                                                          | Evento PostHog             | Props                                  | Meta | Cuándo                                                                                                                                       |
| ------------------------------------------------------------------------ | -------------------------- | -------------------------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| "Quiero el plan Plus / Plus Max" en `/proveedores/planes`                | `plan_checkout_started`    | `plan: plus\|plus_max`                 | —    | Click. Hasta el 2026-11-26: desde esa fecha la página muestra precios por trabajo confirmado y ninguna tarjeta enlaza a la contratación, y `/cuenta` tampoco; este evento dejó de llegar |
| El backend creó el checkout y se manda a Mercado Pago (`/contratar`)     | `plan_checkout_redirected` | `plan`                                 | —    | Justo antes de redirigir. Si PostHog todavía no había cargado, puede perderse en la navegación                                              |
| La pantalla de resultado confirma la suscripción (`/contratar/resultado`) | `plan_checkout_confirmed`  | `plan`, `trial` (arrancó en prueba)    | —    | Estado del backend, nunca los params de MP. Una vez por checkout: solo si esa pestaña tenía un checkout pendiente (recargar no lo repite)     |
| "Cargar otro taller" en `/cuenta` ("¿Tenés otro taller?")                | `partner_register_started` | `placement: "cuenta_otro_taller_cargar"` | —  | Click. Hasta el 2026-11-05 también lo mandaba "Registrar mi taller" de `/proveedores/registro` (sin `placement`); ese botón ya no existe porque la página es el formulario. El envío del formulario no tiene evento propio. Desde el 2026-11-27 el link va a `/proveedores/registro?alta=1&otro=1` y abre el formulario directo (antes caía en la landing); mismo evento y `placement` |
| "Reclamar un taller" en `/cuenta` ("¿Tenés otro taller?")                | `partner_claim_started`    | `placement: "cuenta_otro_taller_reclamar"` | — | Click. Nunca el código                                                                                                                     |
| "Comprar el pack" en `/cuenta` (Resumen y pestaña Plan, negocio sin suscripción) | `whatsapp_clicked` | `placement: "cuenta_resumen_pack" \| "cuenta_plan_pack"` | `Contact {placement}` | Click. Desde el 2026-11-26 reemplaza a "Contratar el plan Plus": la cuenta ya no vende planes y el pack se compra por WhatsApp |
| "Contratar el plan Plus" en `/cuenta` (Resumen y pestaña Plan, plan Gratis) | `plan_checkout_started` | `plan: "plus"`, `placement: "cuenta_resumen" \| "cuenta_plan"` | — | Hasta el 2026-11-26: ese botón ya no existe y el evento dejó de llegar. Click (fase 6 del rediseño, 2026-11-24). Ahora "Cargar otro taller" y "Reclamar un taller" viven en "Cambiar de negocio", con los mismos placements |
| WhatsApp de `/cuenta`: pendientes de "Completá tu perfil", "Agregar"/"Pedir cambio" de la pestaña Perfil, "¿Necesitás una mano?" | `whatsapp_clicked` | `placement: "cuenta_completar_perfil" \| "cuenta_perfil" \| "cuenta_ayuda"` | `Contact` | Click. No hay edición del perfil desde la web: el cambio se pide por WhatsApp. Nunca viaja qué dato ni el negocio |
| Canje exitoso de un código en `/proveedores/reclamar`                    | `partner_claim_redeemed`   | `from_checkout?` (`true`)              | —    | Al recibir el OK del backend. `from_checkout`: el reclamo venía de contratar un plan                                                        |
| "Hablar con ventas" en `/proveedores/planes`                             | `whatsapp_clicked`         | `placement: "proveedores_planes_ventas"` | `Contact {placement}` | Click                                                                                                                    |
| "Comprar el pack" (tarjeta "Pack de 3 trabajos") en `/proveedores/planes` | `whatsapp_clicked`         | `placement: "proveedores_planes_pack"` | `Contact {placement}` | Click. Desde el 2026-11-26: el pack se compra por WhatsApp, no hay checkout online |
| "Registrar mi negocio" de la landing `/proveedores/registro` (hero, "Cómo es el registro", barra fija en celular) | `partner_register_started` | `placement: "registro_hero"` / `"registro_pasos"` / `"registro_barra"` | — | Click. Inicio del registro: abre el flujo (`?alta=1`). Fase 5 del rediseño (2026-11-24) |
| "Registrate gratis" (tarjeta "Primer trabajo"; hasta el 2026-11-26, tarjeta del plan Gratis), "Sumá tu negocio" (tarjeta "Trabajo suelto", desde el 2026-11-26) y "Sumá tu negocio" (banda de cierre) en `/proveedores/planes` | `partner_register_started` | `placement: "planes_gratis"` / `"planes_trabajo_suelto"` / `"planes_cierre"` | — | Click |
| "Canjealo acá" en "¿Tu negocio ya aparece?" de la landing | `partner_claim_started` | `placement: "registro_ya_aparece"` | — | Click. Nunca el código |
| El negocio pasó un paso del alta con "Continuar" (`/proveedores/registro?alta=1`) | `partner_register_step_completed` | `step` (1 = datos del negocio, 2 = atención) | — | Al pasar el paso (ya validado). Con `partner_register_started` y `partner_register_submitted` arma el embudo del alta |
| El backend aceptó la solicitud de alta (o ya existía) | `partner_register_submitted` | `already_registered?` (`true`), `from_checkout?` (`true`) | — | Fin del registro: al recibir el OK de `/api/provider`. Nunca datos del negocio. Desde la fase 5, el envío del formulario SÍ tiene evento propio |
| WhatsApp "¿Tu negocio ya aparece? Escribinos" / "¿Otra duda?" de la landing | `whatsapp_clicked` | `placement: "registro_ya_aparece"` / `"registro_faq"` | `Contact {placement}` | Click |
| "¿Dudas? Escribinos" del encabezado de foco de los flujos (alta, contratar, su resultado, reclamar) | `whatsapp_clicked` | `placement: "registro_encabezado"` / `"contratar_encabezado"` / `"contratar_resultado_encabezado"` / `"reclamar_encabezado"` | `Contact {placement}` | Click |

La pista de rol del header (`al_role`, ver `lib/auth/role-hint.ts`) ahora también la escriben el canje de un código (`partner_claim_redeemed`) y la confirmación de un plan (`plan_checkout_confirmed`): en los dos casos la persona ya es dueña de un negocio. El alta NO la escribe: la solicitud queda en revisión y el negocio todavía no es suyo. No es un evento: es solo lo que pinta el header.

### 👤 Registro: cliente o taller, y "Mi cuenta" del cliente (2026-11-24)

Al crear una cuenta en `/cuenta`, la persona elige "Soy cliente" o "Tengo un taller o negocio". La elección se guarda en Clerk (`publicMetadata.signupIntent`) desde el server de la landing (`POST /api/account/intent`). Los flujos de proveedor (alta, reclamo, contratar) fijan `partner` sin preguntar y no mandan `signup_intent_selected`. Ninguno lleva datos personales.

| Botón / momento | Evento PostHog | Props | Meta | Cuándo |
| --- | --- | --- | --- | --- |
| "Continuar" después de elegir cliente o taller, antes del registro de Clerk | `signup_intent_selected` | `intent: partner\|customer`, `placement: "cuenta_crear"` | — | Click en "Continuar" (no al mover la selección) |
| "Guardar" en la elección de una cuenta recién creada desde "Ingresar" (Google o email nuevo) | `signup_intent_selected` | `intent`, `placement: "cuenta_nueva"` | — | Click. Solo se ofrece en los primeros 30 minutos de la cuenta |
| El server respondió al guardar el intent | `signup_intent_saved` | `intent`, `result: saved\|existing\|rejected\|failed` | — | Una vez por intento. `failed` se reintenta en la próxima carga de una pantalla con Clerk; `existing` trae el intent vigente, no el pedido |
| "Hacé tu pedido" de la cuenta de cliente | `quote_cta_clicked` | `placement: "cuenta_cliente"` | — | Click |
| App Store / Google Play de la cuenta de cliente | `app_store_clicked` | `store`, `placement: "cuenta_cliente"` | — | Click |
| WhatsApp "Escribinos" de la cuenta de cliente | `whatsapp_clicked` | `placement: "cuenta_cliente_ayuda"` | `Contact {placement}` | Click |
| "Sumá tu negocio" de la cuenta de cliente | `partner_register_started` | `placement: "cuenta_cliente_sumar"` | — | Click |
| "Registrar mi negocio" / "Canjear mi código" del alta pendiente de proveedor (`/cuenta` sin taller, intent `partner`) | `partner_register_started` / `partner_claim_started` | `placement: "cuenta_onboarding_registrar"` / `"cuenta_onboarding_reclamar"` | — | Click |

La pista de rol del header (`al_role`) también dice "proveedor" si la cuenta se registró como proveedor (`signupIntent = "partner"`), aunque todavía no tenga un taller aprobado: así el header muestra "Ir a mi negocio".

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
