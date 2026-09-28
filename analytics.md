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

### 🌐 Header (todas las páginas excepto `/pedido`)

| Botón                                             | Evento PostHog      | Props                               | Meta | Cuándo                                                      |
| ------------------------------------------------- | ------------------- | ----------------------------------- | ---- | ----------------------------------------------------------- |
| "Descargar" en el header, desktop (`DownloadCta`) | `app_store_clicked` | `store`, `placement: "header"`      | —    | Click. Muestra App Store o Google Play según el dispositivo |
| "Descargar" en el menú mobile                     | `app_store_clicked` | `store`, `placement: "header_menu"` | —    | Click                                                       |

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

| Botón / zona                                                               | Evento PostHog     | Props                                                    | Meta                                                                       | Cuándo                           |
| -------------------------------------------------------------------------- | ------------------ | -------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------- |
| WhatsApp del header (desktop)                                              | `whatsapp_clicked` | `placement: "header"`, `lead_source: "whatsapp"`         | `Lead {placement, lead_source}`                                            | Click                            |
| WhatsApp del menú mobile                                                   | `whatsapp_clicked` | `placement: "header_menu"`, `lead_source: "whatsapp"`    | `Lead`                                                                     | Click                            |
| WhatsApp del hero                                                          | `whatsapp_clicked` | `placement: "hero"`, `lead_source: "whatsapp"`           | `Lead`                                                                     | Click                            |
| WhatsApp de la barra fija (sticky)                                         | `whatsapp_clicked` | `placement: "sticky_bar"`, `lead_source: "whatsapp"`     | `Lead`                                                                     | Click                            |
| WhatsApp de la banda CTA                                                   | `whatsapp_clicked` | `placement: "cta_band"`, `lead_source: "whatsapp"`       | `Lead`                                                                     | Click                            |
| Primera interacción con el formulario (foco en un campo o un atajo rápido) | `quote_started`    | `flow: "page"`                                           | `QuoteStart` (custom)                                                      | Una vez por carga del formulario |
| Pedido registrado                                                          | `quote_submitted`  | server, ver [sección 4](#4-quote_submitted-en-el-server) | `Lead {lead_source: "form"}` + `eventID` compartido con la Conversions API | Solo con OK del backend          |
| Envío fallido                                                              | `quote_failed`     | `flow: "page"`, `reason`, `status?`                      | —                                                                          | Error                            |
| WhatsApp de la confirmación                                                | `whatsapp_clicked` | `placement: "confirmation"`, `pedido: true`              | `Contact` (no Lead)                                                        | Click después de pedir           |

> **Clave para Ads:** en `/pedido` la campaña optimiza sobre un solo `Lead`, que llega por dos caminos y se separa con `lead_source`: `whatsapp` (clicks) o `form` (pedido registrado).

### 📲 `/descarga`

| Botón             | Evento PostHog      | Props                            | Meta | Cuándo |
| ----------------- | ------------------- | -------------------------------- | ---- | ------ |
| Botones de tienda | `app_store_clicked` | `store`, `placement: "descarga"` | —    | Click  |

---

## 4. `quote_submitted` en el server

**Cuándo:** en `/api/presupuesto`, solo después de que el backend confirma el pedido. Corre en `after()`, así que la respuesta a la persona no espera a PostHog. Tiene 5 s de timeout y 1 reintento, y si falla se loguea y el pedido no se entera.

**Cómo se une a la sesión:** el navegador manda su `distinct_id` y su `session_id` junto con el pedido. El server envía el evento con esos ids, y así queda en la misma persona y sesión que el resto, incluida la grabación. Si PostHog estaba bloqueado, sale con un id al azar y sin perfil: cuenta en los totales pero no entra en el funnel por persona.

**Props:**

| Prop                                              | Qué es                                         |
| ------------------------------------------------- | ---------------------------------------------- |
| `flow`                                            | `modal` o `page`                               |
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
- **Formulario de proveedores (`/proveedores`):** no tiene eventos, solo `$pageview` y la grabación.
- **Links de navegación** (el menú y el link de texto "Pedir presupuesto" a `/pedido`): solo se ve el `$pageview` de destino.
- **UTMs dentro del pedido:** hay un TODO porque el DTO del backend rechaza campos desconocidos. Igual, PostHog guarda los UTMs de la sesión, así que el funnel sí se puede cortar por campaña.
