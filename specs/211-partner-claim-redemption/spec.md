# Feature Specification: Reclamo de taller por código

**Feature Branch**: `211-partner-claim-redemption`  
**Created**: 2026-11-03  
**Status**: Draft  
**Input**: User description: "Reclamo de taller por código (canje de claim code) en la landing. El dueño de un taller ya publicado en el directorio pide un código por WhatsApp, el equipo de AutoLibre lo verifica y se lo manda, y el dueño lo canjea en la landing, logueado con su cuenta de AutoLibre, para quedar como administrador del taller."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Canjear el código y quedar como dueño del taller (Priority: P1)

El dueño de un taller que ya figura en el directorio recibió un código del equipo de AutoLibre. Entra a la pantalla de canje, inicia sesión (o crea su cuenta) con la misma cuenta de AutoLibre que usa en la app, escribe el código y confirma. Si el código es válido, ve una confirmación con el nombre del taller que ahora administra.

**Why this priority**: Es el valor central: sin el canje, el código no sirve y el taller no puede tener dueño. Todo lo demás es la puerta de entrada a este paso.

**Independent Test**: Con un código válido generado por el equipo, un usuario entra directo a la pantalla de canje, inicia sesión, lo ingresa y ve "¡Listo! Ya administrás {taller}". Después, ese taller figura entre los que administra.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión iniciada y un código vigente de un taller sin dueño, **When** ingresa el código y confirma, **Then** ve la confirmación con el nombre exacto del taller y queda registrado como dueño.
2. **Given** un usuario SIN sesión iniciada, **When** entra a la pantalla de canje, **Then** se le pide iniciar sesión o crear cuenta antes de poder enviar el código, y al terminar vuelve a la misma pantalla sin perder el contexto.
3. **Given** un usuario con sesión iniciada, **When** ingresa el código con minúsculas, espacios o guiones de más (por ejemplo, "ab12-cd34 "), **Then** el canje funciona igual que si lo hubiera escrito sin errores de formato.
4. **Given** un código inexistente, mal escrito, vencido, revocado, ya usado, de un taller archivado o de un taller que ya tiene dueño, **When** el usuario lo envía, **Then** ve SIEMPRE el mismo mensaje: "El código no es válido o ya venció. Pedile uno nuevo al equipo de AutoLibre", sin ninguna pista sobre la causa.

---

### User Story 2 - Pedir el código desde el perfil del taller (Priority: P2)

Alguien que visita el perfil público de un taller y es su dueño ve la invitación "¿Es tu taller? Pedí tu código". Al tocarla se abre WhatsApp con un mensaje ya escrito para el equipo de AutoLibre que identifica de qué taller se trata.

**Why this priority**: Es la forma de que los dueños descubran que pueden reclamar su taller. Sin esta puerta, el equipo depende de contactarlos a mano, pero el canje (P1) sigue funcionando sin ella.

**Independent Test**: En el perfil de cualquier taller publicado, tocar la invitación abre WhatsApp hacia el número de AutoLibre con un mensaje que incluye el nombre del taller y su identificador en la URL.

**Acceptance Scenarios**:

1. **Given** el perfil público de un taller, **When** el visitante toca "¿Es tu taller? Pedí tu código", **Then** se abre WhatsApp hacia el número oficial de AutoLibre con un mensaje precargado que incluye el nombre del taller y su identificador.
2. **Given** el perfil público de un taller, **When** un buscador o un asistente de IA lee la página, **Then** el contenido indexable del perfil y su rendimiento no cambian por la invitación (no requiere sesión ni carga nada extra).

---

### User Story 3 - Llegar a la pantalla de canje con el código en la mano (Priority: P3)

El dueño que ya recibió el código necesita encontrar dónde canjearlo. El perfil público del taller le da un camino a la pantalla de canje ("Ya tengo mi código"), y el equipo puede mandarle el enlace directo por WhatsApp junto con el código.

**Why this priority**: Mejora la conversión del canje, pero el flujo funciona igual si el equipo comparte el enlace directo.

**Independent Test**: Desde el perfil de un taller se llega a la pantalla de canje en un toque, y el enlace directo a la pantalla de canje funciona solo, sin pasar por el perfil.

**Acceptance Scenarios**:

1. **Given** el perfil público de un taller, **When** el visitante toca "Ya tengo mi código", **Then** llega a la pantalla de canje.
2. **Given** el enlace directo a la pantalla de canje, **When** alguien lo abre, **Then** puede completar el canje sin haber visitado antes ningún perfil.

---

### Edge Cases

- **Campo vacío o código de más de 32 caracteres**: se valida antes de enviar y se muestra un mensaje que indica cómo corregirlo; no se consume un intento.
- **Demasiados intentos seguidos**: si el servicio rechaza por exceso de intentos, se muestra un mensaje que pide esperar un minuto y volver a intentar, distinto del de código inválido.
- **Sesión vencida o inválida al enviar**: se le pide al usuario volver a iniciar sesión y el código que escribió se conserva.
- **Sin conexión o servicio caído**: mensaje genérico de "No pudimos procesar el canje, probá de nuevo en un rato"; el código escrito no se pierde.
- **Doble envío** (doble clic o reintento mientras espera): solo hay un canje en curso a la vez; el botón queda deshabilitado mientras espera respuesta.
- **El canje funciona pero no se puede obtener el nombre del taller**: igual se confirma el éxito, con un mensaje sin el nombre ("¡Listo! Ya administrás tu taller").
- **El usuario ya administra otros talleres**: la confirmación muestra el taller recién reclamado (el que corresponde a ese canje), no otro.
- **Un taller cuyo identificador coincide con el nombre de la pantalla de canje**: la pantalla de canje no debe dejar inaccesible el perfil de ningún taller existente.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El perfil público de cada taller MUST mostrar la invitación "¿Es tu taller? Pedí tu código", que abre WhatsApp hacia el número oficial de AutoLibre con un mensaje precargado que incluye el nombre del taller y su identificador en la URL.
- **FR-002**: El perfil público MUST ofrecer un acceso a la pantalla de canje para quien ya tiene el código.
- **FR-003**: La invitación y el acceso del perfil MUST NOT requerir sesión, MUST NOT cargar el sistema de inicio de sesión y MUST NOT empeorar el contenido indexable ni el rendimiento del perfil.
- **FR-004**: El sistema MUST ofrecer una pantalla de canje con un enlace directo y estable, que no se indexa en buscadores y no figura en el mapa del sitio ni en el índice para asistentes de IA.
- **FR-005**: La pantalla de canje MUST exigir que el usuario inicie sesión o cree una cuenta con su cuenta de AutoLibre (la misma de la app) antes de enviar un código, y MUST devolverlo a la pantalla de canje al terminar.
- **FR-006**: El inicio de sesión MUST existir solo en las pantallas del flujo de canje; ninguna otra página del sitio carga ni depende de él.
- **FR-007**: El usuario MUST poder escribir el código tal como lo recibió; el sistema MUST enviar lo tipeado sin espacios al principio ni al final y MUST NOT exigir un formato de mayúsculas, guiones o espacios internos.
- **FR-008**: El sistema MUST rechazar antes de enviar un código vacío o de más de 32 caracteres, con un mensaje que indica cómo corregirlo.
- **FR-009**: Ante un canje exitoso, el sistema MUST mostrar "¡Listo! Ya administrás {taller}" con el nombre del taller reclamado, y un mensaje equivalente sin nombre si no puede obtenerlo.
- **FR-010**: Ante cualquier código no aceptado, el sistema MUST mostrar un único mensaje, "El código no es válido o ya venció. Pedile uno nuevo al equipo de AutoLibre", idéntico sea cual sea la causa, y MUST NOT revelar ni insinuar si el código existió, venció, se usó o pertenece a un taller con dueño.
- **FR-011**: Ante un rechazo por exceso de intentos, el sistema MUST mostrar un mensaje que pide esperar y reintentar, distinto del de código inválido.
- **FR-012**: Ante una sesión vencida o inválida, el sistema MUST pedir volver a iniciar sesión y conservar el código escrito.
- **FR-013**: Ante un error de conexión o del servicio, el sistema MUST mostrar un mensaje genérico de reintento y conservar el código escrito.
- **FR-014**: El sistema MUST impedir envíos simultáneos del mismo formulario mientras espera una respuesta.
- **FR-015**: El canje MUST originarse en el dispositivo del usuario, de modo que el límite de intentos aplique a cada persona y no se reparta entre todos los visitantes del sitio.
- **FR-016**: Todo el texto visible del flujo (invitación, pantalla de canje, mensajes de error y éxito, mensaje precargado de WhatsApp, metadatos) MUST vivir en la capa de contenido del sitio.
- **FR-017**: La pantalla de canje MUST cumplir WCAG 2.1 AA: el campo tiene etiqueta visible, los mensajes de error y éxito se anuncian a lectores de pantalla, el foco es visible y el campo tiene tamaño de texto que no dispara el zoom en iOS.

### Key Entities

- **Código de reclamo**: secreto de un solo uso que el equipo de AutoLibre genera para un taller y entrega por WhatsApp. El usuario solo lo escribe; nunca se muestra, se lista ni se valida su existencia en la landing.
- **Taller (partner)**: negocio publicado en el directorio, con nombre e identificador en la URL del perfil.
- **Membresía**: relación entre un usuario de AutoLibre y un taller con un rol (por ejemplo, dueño) y la fecha desde la que rige. Es lo que crea el canje y de donde sale el nombre que se confirma.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un dueño con su código en la mano y la cuenta ya creada completa el canje en menos de 1 minuto desde que abre la pantalla.
- **SC-002**: El 100% de los rechazos por código inválido muestran exactamente el mismo mensaje, sin importar la causa (verificable probando cada causa conocida).
- **SC-003**: Los perfiles públicos de talleres mantienen sus métricas de rendimiento y su contenido indexable sin degradación tras agregar la invitación (comparación antes/después).
- **SC-004**: Ninguna página del sitio fuera del flujo de canje carga el sistema de inicio de sesión (verificable inspeccionando las páginas públicas).
- **SC-005**: La pantalla de canje no aparece en buscadores, en el mapa del sitio ni en el índice para asistentes de IA.
- **SC-006**: Una persona que hace muchos intentos seguidos no bloquea el canje de otros usuarios al mismo tiempo.

## Assumptions

- La cuenta de AutoLibre es la misma que usan la app y el panel de administración; no se crea un sistema de cuentas nuevo.
- El canje y la consulta de talleres administrados ya existen del lado del servicio de AutoLibre, con el contrato acordado con el equipo de backend (respuesta de rechazo única por diseño, límite global de intentos por dispositivo/red).
- El servicio de AutoLibre acepta pedidos del canje solo desde orígenes conocidos, uno por entorno: producción (`autolibre.ai`), el entorno de prueba fijo (`autolibre-preview.vercel.app`, que habla con el servicio de prueba) y el desarrollo local. Cualquier otra URL de prueba no puede canjear.
- El canje depende del deploy de los endpoints y de la habilitación de orígenes del lado del backend; hasta entonces se desarrolla contra el contrato acordado.
- La verificación de identidad del dueño la hace el equipo de AutoLibre por WhatsApp; la landing no valida que quien pide el código sea el dueño real.
- El número de WhatsApp oficial es el ya configurado en el sitio.
- Fuera de alcance para esta versión: un panel para que el dueño edite su taller desde la landing, la invitación de otros miembros y el reclamo de talleres que no están en el directorio (siguen usando el registro de negocios).
- El nombre exacto de la ruta de la pantalla de canje (por ejemplo, `/proveedores/reclamar`) se define en el plan, cuidando que no coincida con el identificador de ningún taller.
