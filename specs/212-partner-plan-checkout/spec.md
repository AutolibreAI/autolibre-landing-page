# Feature Specification: Contratar un plan de proveedor desde la landing

**Feature Branch**: `212-partner-plan-checkout`  
**Created**: 2026-11-04  
**Status**: Draft (el contrato del backend está pendiente)  
**Depends on**: `211-partner-claim-redemption` (cuenta de AutoLibre + reclamo de taller)  
**Input**: User description: "Que los proveedores puedan contratar un plan pago (Plus, Plus Max) directamente desde la landing y pagarlo con Mercado Pago. Para contratar hace falta una cuenta de AutoLibre que sea dueña de un taller; si no la tiene, el flujo lo guía a reclamar su taller o a registrarlo, sin perder el plan elegido. Quien registra un taller nuevo queda como dueño sin pasar por WhatsApp."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Contratar un plan siendo dueño de un taller (Priority: P1)

El dueño de un taller, ya vinculado a su cuenta, elige un plan pago en la página de planes, inicia sesión si hace falta, confirma el taller y el plan, y paga con Mercado Pago. Al volver ve el estado de su suscripción.

**Why this priority**: Es el ingreso: sin esto los planes pagos siguen dependiendo de una conversación manual por WhatsApp.

**Independent Test**: Con una cuenta que ya es dueña de un taller, tocar "Quiero el plan Plus", iniciar sesión, confirmar y completar el pago de prueba en Mercado Pago. El taller queda con el plan Plus y la pantalla de resultado lo informa.

**Acceptance Scenarios**:

1. **Given** un usuario sin sesión, **When** toca contratar un plan, **Then** se le pide iniciar sesión o crear cuenta y vuelve al mismo plan.
2. **Given** un usuario dueño de UN taller, **When** llega a contratar, **Then** ve un resumen con el plan, el precio y su taller, y un botón para pagar con Mercado Pago.
3. **Given** un usuario dueño de VARIOS talleres, **When** llega a contratar, **Then** elige primero a qué taller aplicarle el plan.
4. **Given** el usuario confirma, **When** se lo deriva a Mercado Pago y completa el pago, **Then** al volver ve "Suscripción confirmada", o "Estamos confirmando tu pago" si todavía no se acreditó.
5. **Given** el usuario cancela o el pago falla en Mercado Pago, **When** vuelve, **Then** ve que no se cobró nada y puede reintentar.

---

### User Story 2 - Contratar sin tener todavía un taller en la cuenta (Priority: P2)

Un usuario con sesión pero sin taller vinculado quiere contratar. El sistema le explica que necesita un taller y le ofrece dos caminos: reclamar un taller que ya está en AutoLibre (con código) o registrar uno nuevo. En los dos casos, al terminar vuelve al plan que había elegido.

**Why this priority**: Sin este camino, el usuario sin taller llega a un callejón sin salida.

**Independent Test**: Con una cuenta sin talleres, tocar un plan pago: aparecen las dos opciones. Después de reclamar un taller con código, se vuelve a la contratación del mismo plan con el taller ya disponible.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión y sin talleres, **When** llega a contratar, **Then** ve "Para contratar un plan necesitás un taller en tu cuenta" con las opciones "Mi taller ya está en AutoLibre" y "Todavía no lo registré".
2. **Given** que eligió reclamar, **When** canjea su código con éxito, **Then** vuelve a la contratación del plan elegido.
3. **Given** que eligió registrar, **When** completa el registro (directo en `/proveedores/registro/formulario`, con la misma sesión), **Then** la confirmación le explica que va a poder administrar el taller y contratar un plan desde su cuenta cuando lo aprueben (una solicitud pendiente no puede contratar). Ver US3.

---

### User Story 3 - Quien registra un taller queda como su dueño (Priority: P3)

> **Rediseñada (2026-11-04)**: se descartó el código de reclamo al registrar. El registro pasa a exigir la cuenta de AutoLibre y el backend (contrato `partner-onboarding-owner`, `contracts/partner-applications.md`) guarda quién pidió el alta: cuando el equipo **aprueba** la solicitud, esa cuenta queda como dueña del taller. Antes de la aprobación es una solicitud, sin taller ni dueño; por eso el vínculo llega con la aprobación y no al registrar.

Quien registra un taller nuevo lo hace con su cuenta de AutoLibre (inicia sesión o la crea antes de completar el formulario). Cuando el equipo aprueba el taller, queda como su dueño sin pedir ni canjear ningún código, y desde su cuenta lo administra y contrata un plan.

**Why this priority**: Hoy el registro deja el taller sin dueño, y el registrado no sabe que tiene que reclamarlo. Esto lo destraba tanto para administrar el taller como para contratar planes.

**Independent Test**: Con una cuenta sin talleres, entrar a `/proveedores/registro/formulario`, completar el alta y ver la confirmación; aprobar la solicitud en el backend; volver a `/proveedores/contratar?plan=plus` con la misma cuenta: el taller aparece como propio, sin ninguna intervención manual de vínculo.

**Acceptance Scenarios**:

1. **Given** un visitante en `/proveedores/registro`, **When** toca "Registrar mi taller", **Then** llega a `/proveedores/registro/formulario` y, sin sesión, se le pide entrar o crear la cuenta; al terminar vuelve al formulario.
2. **Given** un usuario con sesión, **When** envía el formulario, **Then** la solicitud viaja con su token y la confirmación dice "Cuando aprobemos tu taller, vas a poder administrarlo y contratar un plan desde tu cuenta." Nunca se le pide un código.
3. **Given** que el token venció, **When** envía, **Then** la landing renueva el token y reintenta una vez; si igual falla, le pide volver a entrar y conserva todo lo que escribió. Nunca se manda la solicitud sin la cuenta.
4. **Given** que el equipo aprueba la solicitud, **When** el usuario vuelve a contratar un plan, **Then** el taller figura entre los suyos.

---

### Edge Cases

- Taller **pendiente de aprobación**: no puede contratar. Mientras no lo aprueben es una solicitud, sin taller ni dueño. Pueden contratar los talleres activos y los pausados; los archivados no.
- El taller **ya tiene un plan pago activo** o una cancelación en curso: no se le cobra dos veces. Se le muestra su plan actual y, si corresponde, hasta cuándo tiene acceso.
- Ya hay un **pago iniciado** para ese taller: se le avisa que tiene un pago en curso.
- Los **términos cambiaron** mientras el usuario estaba en la pantalla: se le muestran los nuevos y tiene que aceptarlos de nuevo.
- La contratación está **deshabilitada temporalmente** por AutoLibre: mensaje claro, con la opción de hablar con ventas.
- El **email de Mercado Pago** no coincide con la cuenta con la que paga: Mercado Pago rechaza el pago en su propia pantalla. La landing lo previene pidiendo explícitamente "el email de tu cuenta de Mercado Pago", con la aclaración visible.
- El taller **ya usó su período de prueba**: la suscripción arranca cobrando. La prueba es una sola vez por taller en toda su vida.
- El plan de la URL **no existe**: se lo lleva a la página de planes.
- **Mercado Pago no responde** o no se puede iniciar el pago: mensaje de reintento, sin cobro.
- El usuario **vuelve de Mercado Pago** pero el pago todavía no se confirmó: estado "pendiente", nunca "confirmado" por el solo hecho de volver.
- El usuario **pierde la sesión** en medio del flujo: vuelve a iniciar sesión sin perder el plan elegido.
- La **sesión vence** mientras completa el formulario de registro: se renueva el token y se reintenta una vez; si no alcanza, se le pide volver a entrar (en otra pestaña) sin perder lo escrito. Nunca se registra el taller sin la cuenta.
- Ese **email ya tiene una solicitud abierta**: se le avisa que ya está anotado (como hoy).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Los planes pagos de la página de planes MUST llevar a la contratación de ese plan en lugar de abrir WhatsApp. El plan gratis sigue llevando al registro, y "Hablar con ventas" sigue por WhatsApp.
- **FR-002**: La contratación MUST exigir una cuenta de AutoLibre (la misma que la app) y volver al plan elegido después de iniciar sesión o crear la cuenta.
- **FR-003**: El sistema MUST mostrar solo los talleres de los que el usuario es dueño. Con uno, va directo al resumen; con varios, el usuario elige.
- **FR-004**: Sin talleres, el sistema MUST ofrecer reclamar uno existente o registrar uno nuevo, y conservar el plan elegido durante ese desvío.
- **FR-005**: El resumen previo al pago MUST mostrar el nombre del plan, el precio con su aclaración (por mes + IVA), el período de prueba si corresponde y el taller al que se aplica.
- **FR-006**: El cobro MUST hacerse en Mercado Pago. La landing nunca pide ni maneja datos de tarjeta.
- **FR-007**: El precio y las condiciones que se cobran MUST ser los que define AutoLibre del lado del servicio. La landing solo indica qué plan eligió el usuario, nunca un monto.
- **FR-008**: El estado mostrado al volver de Mercado Pago MUST salir de la confirmación del servicio de AutoLibre, no de los parámetros de la URL de retorno.
- **FR-009**: El sistema MUST impedir contratar un plan para un taller del que el usuario no es dueño, aunque se manipule la URL.
- **FR-010**: El registro de taller MUST exigir la cuenta de AutoLibre y mandar su token con la solicitud, para que el backend deje esa cuenta como dueña del taller al aprobarlo, sin código. Ante un token rechazado, la landing MUST renovarlo y reintentar una sola vez, MUST NOT mandar nunca la solicitud sin el token y MUST conservar lo escrito si pide volver a entrar.
- **FR-015**: Antes de pagar, el usuario MUST aceptar los términos comerciales para talleres (checkbox, con los términos visibles), y el sistema MUST registrar qué versión aceptó.
- **FR-016**: El sistema MUST pedir el email de la cuenta de Mercado Pago con la que va a pagar, con una aclaración visible de que tiene que coincidir. Por defecto propone el email de su cuenta de AutoLibre.
- **FR-017**: El resumen MUST anunciar el período de prueba solo cuando efectivamente aplica a ese taller (una vez en toda la vida del taller). Si no se puede saber, MUST NOT prometerlo como seguro.
- **FR-018**: Al volver de Mercado Pago, el sistema MUST consultar el estado varias veces durante unos segundos y mostrar "Estamos confirmando tu pago" hasta que se confirme, o dejarlo como pendiente si se agota el tiempo.
- **FR-011**: La página pública de registro (`/proveedores/registro`) MUST seguir siendo indexable (metadata, JSON-LD, sitemap, `llms.txt`) y MUST NOT cargar el sistema de inicio de sesión. El formulario vive en una ruta anidada privada (`/proveedores/registro/formulario`: `noindex`, fuera del sitemap y de `llms.txt`, sin JSON-LD), que es la única que carga el inicio de sesión.
- **FR-012**: Las pantallas de contratación y de resultado MUST NOT indexarse, ni figurar en el mapa del sitio ni en el índice para asistentes de IA.
- **FR-013**: Todo el copy MUST vivir en la capa de contenido. Los nombres de los planes MUST coincidir con los de la página de planes.
- **FR-014**: Las pantallas MUST cumplir WCAG 2.1 AA (como la 211).

### Key Entities

- **Plan**: identificador, nombre, precio mensual + IVA, límite de pedidos y período de prueba. Lo define el servicio de AutoLibre.
- **Suscripción**: vínculo entre un taller y un plan, con estado (pendiente, activa, cancelada, fallida) y su referencia en Mercado Pago.
- **Membresía** (de la 211): vínculo cuenta ⇄ taller con rol. Solo el rol dueño puede contratar.
- **Código de reclamo** (de la 211): sigue sirviendo para vincular talleres que ya existen. El registro nuevo NO emite código: el dueño sale de la cuenta que pidió el alta.
- **Solicitud de alta** (`partner_applications`): ahora guarda la cuenta que la pidió (si vino con token); al aprobarla, esa cuenta queda como dueña.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un dueño con su taller ya vinculado contrata un plan en menos de 3 minutos desde la página de planes, incluido el pago.
- **SC-002**: El 100% de los usuarios que llegan sin taller ven un camino para conseguirlo (ninguna pantalla sin salida).
- **SC-003**: Ningún pago se marca como confirmado sin la confirmación del servicio de AutoLibre.
- **SC-004**: Ningún usuario puede iniciar el pago de un taller del que no es dueño.
- **SC-005**: La página de planes y la de registro mantienen su contenido indexable y su rendimiento, sin cargar el sistema de inicio de sesión.
- **SC-006**: Quien registra un taller queda como dueño al aprobarse, sin contactar al equipo ni canjear un código.

## Assumptions

- La integración con Mercado Pago (suscripción, webhook, estados) la construye el backend (sesión `mp-integration-partners`). La landing solo inicia el checkout y muestra el resultado.
- La cuenta y el inicio de sesión son los de la 211 (Clerk acotado a pantallas privadas).
- Los planes pagos son Plus y Plus Max. "A medida" sigue por ventas.
- Hoy el dueño administra su taller desde la app; hay un panel nuevo en construcción que va a reemplazar ese destino.
- El contrato con backend está definido en `contracts/billing-api.md`. Quedan pendientes: la consulta de estado de la suscripción (en construcción), si el período de prueba aplica a un taller, cómo identifica la vuelta de Mercado Pago a qué taller corresponde, y el despliegue del contrato `partner-onboarding-owner` (registro con dueño, `contracts/partner-applications.md`: diseñado, todavía no desplegado).
- Los términos comerciales son PROVISORIOS (versión `2026-11-draft`). El texto definitivo lo da AutoLibre antes de salir a producción.
