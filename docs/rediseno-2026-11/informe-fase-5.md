## Fase 5: sector proveedores

Rama del worktree (sale de `b516680`, `feat/rediseno-2026-11`), 2026-11-24. `/proveedores/registro` (landing "Sumá tu negocio" + flujo del alta), el panel "Ingresá o creá tu cuenta", `/proveedores/planes`, `/proveedores/contratar` (+ `/resultado`) y `/proveedores/reclamar` pasan al diseño nuevo (lienzos `Sumate*`, `IngresarNegocio`, `Alta*`, `Ingresar*`, `Planes*`, `Contratar*`, `Reclamar*`). Medido con build de producción local (`next start --port 3101`).

### Salvedad del entorno

- **Sin `.env` en el worktree**: copiar `.env`/`.env.local` del repo principal quedó bloqueado por una regla de permisos de la sesión. El build y las mediciones corrieron **sin backend (`AUTOLIBRE_API_URL`), sin Hygraph y sin la publishable key de Clerk**. Consecuencias: `/proveedores/registro` queda `ƒ` en el build (el catálogo no carga y `connection()` la vuelve dinámica, el comportamiento previsto con el backend caído; con backend vuelve a ser estática con ISR) y el formulario muestra el aviso "No pudimos cargar el listado de servicios"; el `<SignIn>` de Clerk no se pudo ver renderizado (sin key queda en "Cargando el inicio de sesión…").
- **Estados privados verificados con datos de prueba**: todo lo que depende de Clerk, del backend o de Mercado Pago se separó en vistas presentacionales (`checkout-views`, `checkout-result-views`, `claim-views`, `alta-layout` + `ProviderForm`) y se renderizó con datos de prueba en una ruta local temporal (`/preview-fase5`, borrada antes del commit). **Ningún pago, reclamo ni registro real.**
- Había otros agentes compilando en la misma máquina mientras corrió Lighthouse: Performance puede variar más que lo habitual.

### Cómo se sacó Clerk de la landing

`/proveedores/registro` sigue siendo la misma URL pública, con dos cosas adentro:

1. **La landing** (Server Component, sin `"use client"` salvo una isla hoja sin Clerk): es lo que está en el HTML del server y lo que se indexa.
2. **El flujo del alta** con `?alta=1` (los CTA "Registrar mi negocio") o `?next=` (viene de la contratación sin taller). La isla `RegistroFlowMount` lee la URL con `useSearchParams` (dentro de un `<Suspense>`, así la página sigue estática) y recién entonces monta `RegistroFlow` con `React.lazy`: ese módulo es el ÚNICO de la ruta que importa Clerk (`ScopedClerkProvider` + `RegisterFormGate`). Se borró `app/proveedores/registro/layout.tsx`, que envolvía toda la ruta en Clerk.

Mientras el flujo está abierto, `<html>` lleva `data-registro-alta` y la variante `in-data-[registro-alta]:hidden` esconde la landing entera (header, `<main>` y pie del sitio): el flujo trae su propia pantalla de foco. Si la URL ya viene con el parámetro (vuelta del login de Google, recarga), un script inline de una línea pone la marca antes del primer paint, así no se ve la landing un instante; el fallback del `<Suspense>` es el "Cargando el registro…" del flujo (sin landmarks, para no duplicar `<main>`). El canonical es el mismo (`/proveedores/registro`, sin query): el flujo no se indexa aparte. Atrás en el navegador vuelve a la landing.

Verificación (build de producción, red interceptada por CDP con caché deshabilitada):

- `curl` del HTML de `/proveedores/registro`: 0 menciones de Clerk, y 0 en los 13 `<script src>` que referencia. Lo mismo en `/proveedores/planes` (12 scripts).
- Al cargar la landing no se pide ningún chunk con Clerk. Al tocar "Registrar mi negocio" se piden 4 chunks (uno propio del flujo + 3 de Clerk: 422.7 KB crudos / 120.2 KB gzip). Con Clerk configurado, además baja `clerk-js` de su CDN, solo en ese momento.
- Cargar directo `?alta=1`: la marca está puesta antes de hidratar y el único `<h1>` visible es "Ingresá o creá tu cuenta".
- Header y footer: `/proveedores/registro` salió de la lista de rutas con Clerk (`CLERK_ROUTES` de `site-header.tsx`) y el footer ya no le quita el prefetch: la landing es estática y liviana.

### Qué cambió por pantalla y estado

**`/proveedores/registro`, landing (lienzo `Sumate`)**. Migas (las mismas que el `BreadcrumbList`), rótulo, `<h1>` "Sumá tu taller o servicio a AutoLibre", bajada, tres tildes, "Registrar mi negocio" + "Ver los planes", y la vista previa ILUSTRATIVA de perfil y pedido con marcadores (`[Tu negocio]`, `[Servicio que piden]`, con leyenda; no se inventa un negocio). "¿Tu negocio ya aparece?" con buscador (form GET a `/proveedores?q=`, funciona sin JS), WhatsApp para administrarlo y "Canjealo acá" al reclamo. "Qué tenés al sumarte" (4 columnas), "Cómo es el registro" (3 pasos + la línea de tiempo de la solicitud), "Empezás gratis…" sobre banda oscura con los precios de `providers-plans.ts` (no se escriben dos veces), "Antes de registrarte" (5 preguntas en `<details>`, también en el `FAQPage`) y barra fija en celular ("Registrar mi negocio" + "Planes").

**Flujo del alta, sin sesión (`IngresarNegocio`)**: pantalla de foco con los tres pasos (Tu cuenta · Tu negocio · Revisión) arriba del panel "Ingresá o creá tu cuenta" con la bajada "Para registrar tu negocio necesitás una cuenta de AutoLibre…". Vuelta forzada a `?alta=1` (y al `?next` si lo había).

**Flujo del alta, con sesión (`Alta`)**: barra de avance de 3 segmentos debajo del encabezado; columna de pasos desde `lg` (Tu cuenta ✓, Datos de tu negocio, Atención, Contacto, Revisión) con la cuenta en uso y "Usar otra cuenta"; "Paso n de 3", `<h1>` del paso y su bajada. El formulario (`components/forms/provider-form.tsx`) pasó de una sola página larga a **tres pasos dentro de un único `<form>`**: los pasos ocultos quedan montados con `hidden`, así lo escrito no se pierde al ir y volver y el envío lee todos los campos como antes. "Continuar" valida solo el paso a la vista (Enter en un campo también continúa); el envío final revalida todo y vuelve al paso que falle. Contrato con `/api/provider` intacto (mismo body, mismo token de Clerk, mismo reintento ante 401). Foco al `<h1>` en cada cambio de paso y la pantalla vuelve arriba. Acciones "Atrás"/"Continuar" fijas abajo en celular. Validación nueva: el nombre del negocio (antes solo `required` semántico, el backend lo rechazaba con un error genérico).
- Paso 1, datos del negocio: nombre, descripción (opcional), servicios (el acordeón `ServiceFamilyPicker`, con "Otro"), marcas (tarjetas "Todas" / "Solo algunas"), marcas de especialidad, vehículos y motorizaciones (chips).
- Paso 2, atención: modalidad, dirección (Google Places, cargado como antes) y horarios.
- Paso 3, contacto: WhatsApp (+54), email, logo, redes y cómo se enteraron.
- Enviado: `<h1>` "Recibimos tu solicitud" (o "Tu solicitud ya está en revisión" con el 409), la línea de tiempo y "Mientras tanto" (planes, o volver a la contratación si vino de ahí), con ayuda por WhatsApp.

**Panel "Ingresá o creá tu cuenta" (`Ingresar`)**: `PartnerSignIn` y `SignInLayout` conservan su API (`head`, `headSlot`, `context`, `redirectUrl`, `loading`) y suman dos props opcionales (`intro`, `showJoin`). Ahora es una columna centrada de 440 px: lo que venga en `context` arriba, `<h1>` "Ingresá o creá tu cuenta", bajada (la `intro` o la de `head`), el `<SignIn>` de Clerk, "Al continuar aceptás los Términos y la Política de privacidad", y "Con una sola cuenta" (pedidos + negocio) con "¿Tenés un taller o un servicio? Sumá tu negocio" (por defecto visible: es el caso de `/cuenta`; los flujos de negocios lo apagan). `lib/auth/clerk-appearance.ts`: inputs y botones en píldora de 52 px, principal en `action`, sociales en contorno `action`, y los botones sociales DEBAJO del email (`options.socialButtonsPlacement: "bottom"`, verificado en los tipos de `@clerk/react`). `PrivateFlowHead` (lo usa `/cuenta`) pasó a los tokens nuevos.

**`/proveedores/planes` (`Planes`)**: migas visibles, rótulo, `<h1>` con clases canónicas (`text-4xl md:text-5xl lg:text-display-sm`; se fueron `text-[1.75rem]` y `text-[1.0625rem]`), tarjetas con nombre, bajada, precio, botón y "qué incluye" (cada plan pago dice qué suma sobre el anterior: "Todo lo del plan Gratis, y además"), Plus resaltado con borde `action`; "¿Necesitás más volumen…?" con ventas; "Lo mismo en todos los planes" (las tres notas que estaban en letra chica); "Compará los planes" (tabla real con `<th scope>`, tildes con texto `sr-only`, solo desde `md` como el lienzo); "Preguntas sobre los planes" (3, también en `FAQPage`, nuevo en esta página) y banda oscura "¿Todavía no registraste tu negocio?". Precios y topes son los que ya estaban (alineados con `subscription_plans` el 2026-11-12), nada nuevo.

**`/proveedores/contratar` (`Contratar`, `ContratarMax`)**: pantalla de foco con los pasos Tu taller · Plan · Pago en el encabezado (el actual según el estado), "¿Dudas? Escribinos" y "Salir". Izquierda: `<h1>` "Contratá el plan X", "¿A qué taller le aplicás el plan?" con tarjetas por negocio (monograma, nombre y lo que se sabe de su plan: "Plan Gratis · Le corresponde la prueba de N días", "Ya tiene el plan Plus en prueba"…; los que ya tienen plan pago quedan deshabilitados), y el email de Mercado Pago. Derecha (en celular, entre el email y el botón): "Revisá el plan" con lo que incluye, taller, precio del BACKEND (`GET /billing/plans`) y "Hoy pagás ARS 0" solo si el backend dice `trialEligible: true`; si no lo sabe, el texto condicional de siempre. Abajo, "Pagar con Mercado Pago" y la nota del candado. Lógica sin cambios (mismo `startCheckout`, reintento por términos, `savePendingCheckout`, `plan_checkout_redirected`); lo único nuevo es que la suscripción se pide para CADA taller de la cuenta (antes, solo para el elegido) para poder mostrar su estado en la tarjeta. Si todos ya tienen plan, el aviso de plan activo con "Ir a mi negocio" y "Cambiar de plan con ventas". Sin taller: el panel compartido `NoPartnerOptions` (de la fase 6, sin tocar).

**`/proveedores/contratar/resultado`**: misma pantalla de foco; "Pago" en curso hasta que el backend confirma (después, los tres pasos completos).
- Confirmando (`ContratarConfirmando`): spinner (gira solo sin `prefers-reduced-motion`), "Estamos confirmando tu pago".
- Listo (`ContratarListo`): check, "¡Listo! Tu taller tiene el plan X", fin de la prueba si está en prueba, y "Próximos pasos": "Completá tu perfil → Ir a mi negocio" (`/cuenta`, supuesto de DECISIONES) y "¿Dudas con tu plan? → Escribinos".
- Sin confirmar (`ContratarPendiente`): las dos tarjetas ("Si completaste el pago" → Consultar de nuevo; "Si no llegaste a pagar" → Volver a intentarlo) y WhatsApp.
- Los otros finales (sin pago registrado, no confirmado, sin contratación en curso, error) con el mismo armazón.

**`/proveedores/reclamar` (`Reclamar`, `ReclamarError`, `ReclamarListo`)**: pantalla de foco. Izquierda: `<h1>` "Reclamá tu negocio", código en píldora monoespaciada con "Canjear código" al lado, ayuda, y "Lo vas a vincular a la cuenta de {email} · Usar otra cuenta" (antes, la fila `AccountBar`). Error: borde `status-alert` en el campo y caja con el mensaje, las causas posibles y "Pedir un código nuevo". Derecha: "Sobre el código de reclamo" con "Pedir mi código por WhatsApp" y "¿Tu negocio todavía no está en AutoLibre? Registralo gratis". Listo: "¡Listo! Ya administrás {negocio}" y "Próximos pasos": "Revisá tu perfil → Ir a mi negocio" y "Elegí tu plan → Ver los planes" (si vino de contratar, primero "Seguí con tu plan"). Copy: "taller" pasó a "negocio" donde el diseño lo dice.

**Pista de rol**: el canje exitoso y la confirmación de un plan escriben `al_role` con `syncRoleHint` (sin tocar `lib/auth/role-hint.ts`): el header público pasa a "Ir a mi negocio". El alta NO la escribe: la solicitud queda en revisión y el negocio todavía no es de la persona. "Salir" del encabezado de foco borra la pista y cierra la sesión (`useFlowSignOut`).

**No indexables**: contratar, resultado y reclamar siguen `noindex, nofollow`, fuera del sitemap y de `llms.txt`, sin JSON-LD. `RESERVED_PROFILE_SLUGS` sin cambios (no hay rutas nuevas hermanas de `[slug]`: el flujo del alta es la misma ruta con un parámetro).

### Inventario SEO antes / después (HTML del server)

| | `/proveedores/registro` antes | después | `/proveedores/planes` antes | después |
|---|---|---|---|---|
| title | Sumá tu taller a AutoLibre · AutoLibre | igual | Planes para proveedores · AutoLibre | igual |
| description | "Recibí consultas con la información del vehículo…" | igual | "Conocé los planes pagos…" | igual |
| canonical · robots | `/proveedores/registro` · index, follow | igual (también con `?alta=1`) | `/proveedores/planes` · index, follow | igual |
| H1 | "Registrá tu taller" (1) | "Sumá tu taller o servicio a AutoLibre" (1) | "Elegí el plan que se ajusta al volumen de tu negocio" (1, valores arbitrarios) | igual (1, clases canónicas) |
| Outline | h1 → h2 "Entrá o creá tu cuenta" | h1 → h2 "¿Tu negocio ya aparece…?" → h2 "Qué tenés al sumarte" (4 h3) → h2 "Cómo es el registro" (3 h3) → h2 "Empezás gratis…" (3 h3) → h2 "Antes de registrarte" | h1 → h2 "Planes disponibles" (h3 × 4) | h1 → h2 "Planes disponibles" (h3 × 4) → h2 "Lo mismo en todos los planes" (3 h3) → h2 "Compará los planes" (desde `md`) → h2 "Preguntas sobre los planes" → h2 del cierre |
| JSON-LD | Organization, WebPage, BreadcrumbList | + **FAQPage** (5) | Organization, WebPage, BreadcrumbList, OfferCatalog | + **FAQPage** (3) |
| Migas visibles | no | sí | no | sí |
| Clerk (HTML y chunks) | sí (16 scripts, Clerk ~395 KB de terceros) | **0** | 0 | 0 |
| Sitemap `lastModified` | 2026-11-05 | 2026-11-24 | 2026-11-12 | 2026-11-24 |

Saltos de heading: ninguno. `public/llms.txt`: entradas de registro y planes reescritas (alta en pasos, sin comisión, qué incluye cada plan).

### Lighthouse 12.8.2 antes / después

Mismo método que las fases 4a y 4b: 3 corridas por ruta y modo y la **mediana** como `<ruta>-{movil,escritorio}.json` (las tres en `despues/<ruta>-<modo>-corrida{1,2,3}.json`, en la carpeta sin trackear del repo principal). Corridas (Performance): registro móvil 60 / 62 / 60, escritorio 93 / 88 / 78; planes móvil 57 / 63 / 60, escritorio 97 / 76 / 42 (otros agentes compilando en la máquina: la dispersión de escritorio es eso, no la página).

| Ruta | Modo | Medición | Perf | A11y | BP | SEO | LCP (s) | CLS | TBT (ms) | FCP (s) | Elemento LCP | A11y que fallan | Terceros (bloqueo) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/proveedores/registro` | Móvil | Antes | 44 | 96 | 75 | 100 | 6.64 | 0.000 | 4036 | 2.16 | `p` | color-contrast | accounts.dev (Clerk) 1005 ms, Facebook 586 ms |
| `/proveedores/registro` | Móvil | Después | **60** | **100** | 96 | 100 | **3.83** | 0.000 | **2006** | **1.48** | `h1#sumate-titulo` | — | — |
| `/proveedores/registro` | Escritorio | Antes | 93 | 96 | 74 | 100 | 1.67 | 0.000 | 64 | 0.63 | `p` | color-contrast | Facebook 72 ms, accounts.dev 14 ms |
| `/proveedores/registro` | Escritorio | Después | 88 | 100 | 96 | 100 | 0.85 | 0.000 | 284 | 0.41 | `h1#sumate-titulo` | — | — |
| `/proveedores/planes` | Móvil | Antes | 64 | 96 | 75 | 100 | 3.48 | 0.000 | 1658 | 0.92 | `p` | color-contrast | Facebook 563 ms |
| `/proveedores/planes` | Móvil | Después | 60 | 100 | 96 | 100 | 3.74 | 0.000 | 1871 | 1.54 | `h1#planes-titulo` | — | — |
| `/proveedores/planes` | Escritorio | Antes | 79 | 96 | 74 | 100 | 1.42 | 0.000 | 369 | 0.37 | `h1` | color-contrast | Facebook 73 ms |
| `/proveedores/planes` | Escritorio | Después | 76 | 100 | 96 | 100 | 0.80 | 0.000 | 555 | 0.29 | `h1#planes-titulo` | — | — |

Lectura:

- **Registro móvil**: 44 → 60, TBT 4.036 → 2.006 ms, LCP 6,64 → 3,83 s, FCP 2,16 → 1,48 s. Se fue el bloqueo de Clerk (~1 s) y el bundle propio bajó de 286 a 209 KB gzip. Lo que queda de TBT es el JS compartido de la plataforma (el mismo en todas las rutas, ver fases 4a y 4b), fuera del alcance de esta fase. El LCP es el `<h1>` (texto del server).
- **Accesibilidad 96 → 100** en las dos (se fue el `color-contrast` de los textos `ink/60` y `ink/70`). Buenas prácticas 74-75 → 96 (sin las advertencias de Clerk ni del Pixel, que desde la 4a carga diferido y no entra en la traza).
- **Planes**: la página creció (tabla comparativa, reglas, FAQ y cierre; HTML 78 → 112 KB) y se mantiene en la línea de base en móvil (64 → 60, dentro del ruido de esta máquina con otros builds corriendo). En escritorio LCP 1,42 → 0,80 s.
- CLS 0 en todo.

### JS por ruta (suma de los `<script src>` del HTML, gzip local, build de producción)

| Ruta | Antes (fase 0) | Después |
|---|---|---|
| `/proveedores/registro` | 16 · 950.0 KB · 285.9 KB gzip · HTML 169.4 KB (+ Clerk de terceros, ~395 KB) | **13 · 689.6 KB · 208.8 KB gzip** · HTML 120.7 KB (19.8 KB gzip) · sin Clerk |
| `/proveedores/planes` | 13 · 700.1 KB · 213.0 KB gzip · HTML 77.7 KB | **12 · 688.3 KB · 208.0 KB gzip** · HTML 111.9 KB (17.8 KB gzip) |
| Flujo del alta (al abrirlo, diferido) | — | 4 chunks · 422.7 KB · 120.2 KB gzip (flujo + Clerk), más `clerk-js` de su CDN |

Ojo: sin backend, el HTML de registro no lleva el catálogo de servicios (en producción viaja como prop a la isla: unos KB más).

### Eventos (detalle en `analytics.md`; ningún evento existente se renombró)

| Qué | Evento | Props |
|---|---|---|
| Inicio del registro (CTA de la landing) | `partner_register_started` (existente) | `placement: "registro_hero"` / `"registro_pasos"` / `"registro_barra"`; en planes, `"planes_gratis"` / `"planes_cierre"` |
| Paso del alta completado | `partner_register_step_completed` (nuevo) | `step` (1, 2) |
| Fin del registro | `partner_register_submitted` (nuevo) | `already_registered?`, `from_checkout?` |
| Contratación iniciada | `plan_checkout_started` (click en planes) y `plan_checkout_redirected` (sale a MP) — existentes, sin cambios | `plan` |
| Contratación confirmada | `plan_checkout_confirmed` (existente, sin cambios) | `plan`, `trial` |
| Reclamo canjeado | `partner_claim_redeemed` (existente, sin cambios) | `from_checkout?` |
| "Canjealo acá" de la landing | `partner_claim_started` (existente) | `placement: "registro_ya_aparece"` |
| WhatsApp nuevos | `whatsapp_clicked` | `registro_faq`, `registro_encabezado`, `contratar_encabezado`, `contratar_resultado_encabezado`, `reclamar_encabezado` |

### Diferencias con el diseño y por qué

- **Encabezado de foco también en el login del alta**: `IngresarNegocio` muestra el header y el pie del sitio; acá todo el flujo (login incluido) usa la pantalla de foco de `Alta`, igual que contratar y reclamar. Así la landing se esconde entera con una sola marca y no hay header con Clerk.
- **Rubros**: el lienzo muestra las 16 familias como chips; se mantuvo el acordeón `ServiceFamilyPicker`, que marca RUBROS (el contrato con el backend, ver el comentario del formulario). Su estilo interno sigue siendo el anterior (componente compartido en `components/forms`).
- **Modalidad**: el lienzo propone 4 opciones ("Taller fijo", "A domicilio", "Mixto", "A distancia"); el backend acepta 3 (`en_local`, `a_domicilio`, `ambas`). Se mantuvieron las 3 reales.
- **Vehículos, motorizaciones, "cómo se enteraron" y marcas de especialidad**: no están en el lienzo, pero los pide el formulario actual (y los guarda el backend). Van en los pasos 1 y 3.
- **"El primer cobro es el 24 de diciembre"**: no se muestra una fecha de cobro. El backend da `trialDays` y `trialEligible`, no la fecha; calcularla en el cliente sería prometer algo que decide Mercado Pago. Va "Incluye N días de prueba sin cargo." En el listo sí va la fecha real (`trialEndsAt`).
- **"Ir a mi negocio"** lleva a `/cuenta` (supuesto de DECISIONES). La fase 6 decide qué pestaña abre.
- **Enviado del alta** sin "Ir a mi cuenta" (el lienzo no lo trae y la cuenta todavía no tiene negocio).
- **Tabla comparativa** solo desde `md` (`max-md:hidden`), como el lienzo.
- **WhatsApp flotante** sigue visible en las pantallas de foco (decisión de la fase 2, está en `app/layout.tsx`).
- **Ancho**: `Container size="wide"` (regla de `AGENTS.md`) en lugar de 1200 px.

### Endpoints o datos que faltan

- **Fecha del primer cobro** (o `trialEndsAt` proyectado) en `GET /partners/{id}/subscription` o en el checkout, para mostrar "El primer cobro es el …" sin calcularlo en el cliente.
- **"A distancia"** como modalidad, si producto la quiere (hoy el backend no la acepta).
- **Estado de la solicitud de alta** en la cuenta: la landing dice "seguís el estado desde tu cuenta", pero `/cuenta` no muestra solicitudes en revisión (solo negocios aprobados). Hace falta un endpoint de solicitudes del usuario (o mostrarlo en la fase 6 si ya existe).
- Precios de la página de planes siguen escritos a mano (TODO ya existente en `providers-plans.ts`).

### Dudas abiertas

- `accountContent.more.register.href` (fase 6, "Cargar otro taller" desde `/cuenta`) apunta a la landing; quizás convenga `PROVEEDORES_REGISTRO_ALTA_PATH` (exportado en `lib/proveedores/query.ts`) para abrir directo el flujo.
- La landing dice "Ya hay más de 150 negocios" (decisión "+150" para marketing); el directorio muestra el conteo real.
- "Al continuar aceptás los Términos y la Política de privacidad" viene del lienzo: confirmar con legal que aplica al login de Clerk.
- La vista previa del hero muestra marcadores entre corchetes a propósito (rotulada "Ejemplo ilustrativo"); si producto prefiere un ejemplo con datos, hay que definirlos (no se inventaron).

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes de `.agents/`, `.claude/` y `.cursor/`). `npx tsc --noEmit`: sin errores. `npm run build`: OK (sin backend: `/proveedores/registro` queda `ƒ`; `/proveedores/planes` `○`).
- Tests: `test:blog` 86 (85 pasan, 1 salteado por falta de Hygraph), `test:provider-profile` 44, `test:proveedores` 72, `test:partner-claims` 16, `test:partner-billing` 70: todos pasan. `typecheck:blog`, `typecheck:provider-profile`, `typecheck:partner-claims` y `typecheck:partner-billing`: OK. Ninguno cubre las pantallas (la lógica de checkout, reclamo y retorno que sí cubren no se tocó).
- Visual con Chrome headless (CDP) a 390 y 1440 px contra las capturas: landing, planes, panel de ingreso (general y del alta), alta en sus 3 pasos y enviado, contratar Plus y Plus Max, confirmando, listo, sin confirmar, reclamar, código inválido y listo. Sin desborde horizontal y un solo `<h1>` y un solo `<main>` visibles en cada estado.
- Alta recorrida con mouse y teclado reales por CDP (con datos de prueba, sin backend): "Continuar" vacío marca nombre y servicios y enfoca el nombre; el paso 2 sin dirección enfoca la dirección; "Atrás" conserva lo escrito; enviar sin WhatsApp enfoca el WhatsApp. **Cero POST**. En ese recorrido apareció y se corrigió un bug: al pasar al último paso, React reusaba el botón "Continuar" y le cambiaba el `type` a `submit` durante el mismo click, y el browser enviaba el formulario (ahora cada botón tiene su `key`).
- Red por CDP: la landing no pide ningún chunk con Clerk; "Registrar mi negocio" lleva a `?alta=1`, pide los chunks de Clerk y esconde la landing; "Atrás" la vuelve a mostrar. Cargar directo `?alta=1`: la marca está puesta antes de hidratar.
- `curl`: un `<h1>` por página, JSON-LD (`WebPage`, `BreadcrumbList`, `FAQPage`; `OfferCatalog` en planes), canonical sin query y cero Clerk en HTML y chunks de registro y planes.
