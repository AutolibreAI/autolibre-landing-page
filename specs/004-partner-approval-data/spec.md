# Feature Specification: Completar los datos del partner que hoy se cargan a mano después de aprobar

**Feature Branch**: `004-partner-approval-data`
**Created**: 2026-09-22
**Status**: Draft
**Input**: User description: "AUT-81 — El formulario de /proveedores ya captura casi todos los datos del taller, pero la aprobación solo copia 6 columnas a `partners`. La dirección hoy es texto libre; hay que resolverla con Google Places (como en el modal de presupuesto) para obtener geocode real, y que ese dato (y el resto de lo ya capturado) llegue a la ficha del partner al aprobar sin que nadie lo tipee a mano."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Cargar la dirección del taller con autocompletado (Priority: P1)

Un taller que se está dando de alta como partner completa el formulario público de `/proveedores`. Al llegar al campo de dirección, escribe y el sistema le sugiere direcciones puntuales reales (no zonas o barrios); al elegir una, el sistema guarda junto con la solicitud las coordenadas, la localidad y la provincia correspondientes a esa dirección.

**Why this priority**: Es la pieza que destraba todo lo demás — sin un geocode real capturado en el alta, no hay nada que transferir al aprobar ni con qué ordenar por cercanía después. Es la base del resto del ticket.

**Independent Test**: Se puede probar completando el formulario de proveedores, seleccionando una sugerencia de dirección, y verificando que la solicitud guardada incluye coordenadas, localidad y provincia — sin necesidad de que exista todavía el flujo de aprobación.

**Acceptance Scenarios**:

1. **Given** el formulario de proveedores abierto, **When** la persona escribe una dirección y selecciona una de las sugerencias ofrecidas, **Then** la solicitud guarda la dirección junto con latitud, longitud, localidad y provincia.
2. **Given** una dirección con una sugerencia ya seleccionada, **When** la persona edita manualmente el texto de la dirección, **Then** el geocode previamente capturado se descarta hasta que se seleccione una nueva sugerencia.
3. **Given** el formulario de proveedores abierto, **When** la persona escribe una dirección pero no selecciona ninguna sugerencia y envía el formulario, **Then** la solicitud se guarda igual con el texto de dirección ingresado y sin geocode, sin bloquear el envío.

---

### User Story 2 - Transferir los datos capturados al aprobar (Priority: P1)

Un operador revisa y aprueba una solicitud de partner. Todo lo que el taller ya cargó en el formulario — incluida la dirección con su geocode — pasa automáticamente a la ficha pública del partner, sin que el operador tenga que volver a tipear ningún dato.

**Why this priority**: Es el otro extremo del mismo problema: si la aprobación sigue copiando solo 6 columnas, capturar mejor los datos en el alta no sirve de nada. Ambas historias son necesarias para que el ticket resuelva el problema real.

**Independent Test**: Se puede probar aprobando una solicitud que ya tiene geocode y otros datos cargados (por ejemplo, sembrada directamente en la base para esta prueba) y verificando que la ficha del partner resultante los tiene, sin intervención manual del operador.

**Acceptance Scenarios**:

1. **Given** una solicitud aprobable con geocode capturado, **When** el operador la aprueba, **Then** la ficha del partner queda con las coordenadas, localidad y provincia de la solicitud, sin que el operador las haya ingresado.
2. **Given** una solicitud aprobable sin geocode (porque la persona no seleccionó ninguna sugerencia), **When** el operador la aprueba, **Then** la aprobación se completa igual, con la ficha del partner sin coordenadas.

---

### User Story 3 - Ordenar talleres por cercanía real (Priority: P2)

Una persona que pide un presupuesto ve los talleres candidatos ordenados por qué tan cerca están de su ubicación, incluyendo los partners que fueron aprobados con el nuevo flujo de captura de dirección.

**Why this priority**: Es el resultado visible para el usuario final, pero depende de que existan partners con geo poblada (Historias 1 y 2). El ordenamiento por cercanía en sí ya existe hoy — esta historia valida que deja de fallar por falta de datos.

**Independent Test**: Se puede probar sembrando un partner con coordenadas válidas y confirmando que aparece ordenado por distancia real en una búsqueda de presupuesto, en lugar de caer al final de la lista por falta de geo.

**Acceptance Scenarios**:

1. **Given** dos partners con coordenadas cargadas a distinta distancia del punto de búsqueda, **When** se listan candidatos para una solicitud de presupuesto, **Then** aparecen ordenados de más cercano a más lejano.
2. **Given** un partner sin coordenadas (por ejemplo, uno legacy anterior a este cambio), **When** se listan candidatos, **Then** ese partner sigue apareciendo al final de la lista, sin romper el listado.

### Edge Cases

- ¿Qué pasa si el servicio de autocompletado de direcciones no responde o no devuelve sugerencias? La persona debe poder seguir escribiendo la dirección a mano y enviar el formulario sin geocode, igual que cuando simplemente no elige ninguna sugerencia.
- ¿Qué pasa si la persona selecciona una sugerencia y después el operador rechaza (no aprueba) la solicitud? El geocode capturado no se transfiere a ningún partner; queda solo en la solicitud.
- ¿Qué pasa con los partners que ya están publicados y fueron aprobados antes de este cambio? Quedan fuera de alcance: no se les completa la geolocalización retroactivamente como parte de este trabajo.
- ¿Qué pasa si la dirección seleccionada cae fuera de la zona de cobertura habitual (otro país, ubicación ambigua)? El sistema guarda igual el geocode devuelto; no valida cobertura geográfica en esta etapa.
- ¿Qué pasa si el autocompletado no devuelve localidad o provincia para la dirección elegida (dato parcial)? La zona de cobertura no puede derivarse automáticamente; ese caso se resuelve en la fase de planificación técnica (por ejemplo, dejarla vacía y que se complete manualmente en la aprobación como excepción, en vez de bloquear el alta o la aprobación).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El formulario público de alta de partners MUST ofrecer sugerencias de direcciones puntuales (no zonas ni barrios) a medida que la persona escribe, usando un servicio de autocompletado de direcciones.
- **FR-002**: Al seleccionar una sugerencia de dirección, el sistema MUST capturar y guardar junto con la solicitud: coordenadas (latitud/longitud), localidad y provincia correspondientes a esa dirección.
- **FR-003**: El sistema MUST permitir enviar el formulario con una dirección escrita a mano y sin geocode cuando no se selecciona ninguna sugerencia (por elección de la persona o porque el servicio de sugerencias no respondió), sin bloquear el envío.
- **FR-004**: Si la persona edita el texto de la dirección después de haber seleccionado una sugerencia, el sistema MUST descartar el geocode previamente capturado hasta que se seleccione una nueva sugerencia.
- **FR-005**: Al aprobar una solicitud, el sistema MUST transferir a la ficha pública del partner todos los datos ya capturados en la solicitud que hoy se pierden en la aprobación, incluyendo como mínimo las coordenadas, localidad y provincia, sin requerir que la persona que aprueba los vuelva a ingresar.
- **FR-006**: El listado de partners candidatos para una solicitud de presupuesto MUST ordenar por cercanía real a la ubicación de búsqueda a los partners que cuenten con coordenadas, y MUST seguir mostrando al final (sin coordenadas) a los que no las tengan, sin romper el listado.
- **FR-007**: El sistema MUST dejar sin modificar a los partners aprobados antes de este cambio: no se les completa ni recalcula geolocalización ni otros datos como parte de este trabajo.
- **FR-008**: El formulario público de alta MUST pedir, además de la dirección/geocode, los horarios del taller y la modalidad de atención (a domicilio / en local / ambas — ver Assumptions sobre esta tercera opción).
- **FR-009**: El sistema MUST derivar automáticamente la zona de cobertura (`coverage_zone`) a partir de la localidad y provincia que devuelve el autocompletado de direcciones, en lugar de pedírsela a la persona que completa el alta o a quien la aprueba.
- **FR-010**: La descripción para el marketplace y el logo del taller MUST quedar fuera del formulario público de alta; se capturan en un paso de onboarding posterior, cuyo mecanismo concreto se define en la fase de planificación técnica.

### Key Entities

- **Solicitud de partner** (hoy `partner_applications`): representa el alta que completa un taller antes de ser aprobado. Incluye los datos de contacto y del negocio que ya captura el formulario, más — a partir de este trabajo — el geocode de la dirección (coordenadas, localidad, provincia).
- **Partner** (hoy `partners`): la ficha pública del taller una vez aprobado. Hoy solo recibe una porción de lo que la solicitud capturó; este trabajo amplía qué datos de la solicitud llegan a la ficha al momento de aprobar.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las solicitudes de alta en las que la persona selecciona una sugerencia de dirección quedan con coordenadas, localidad y provincia guardadas.
- **SC-002**: El 100% de los partners aprobados a partir de este cambio con geocode en su solicitud quedan con esas coordenadas en su ficha pública, sin que la persona que aprueba haya tenido que tipearlas.
- **SC-003**: La tasa de envíos completados del formulario de proveedores no empeora respecto de la actual — no seleccionar una sugerencia de dirección nunca impide enviar la solicitud.
- **SC-004**: Los partners aprobados con geocode dejan de caer al final del listado de candidatos por cercanía en las solicitudes de presupuesto; aparecen ordenados por distancia real junto con el resto.
- **SC-005**: Ninguna aprobación de partner a partir de este cambio requiere que la persona que aprueba tipee manualmente la zona de cobertura.

## Assumptions

- El servicio de autocompletado de direcciones a reusar es Google Places, ya integrado en el modal de pedido de presupuesto de este mismo repo (misma API key, restricción a Argentina); se ajusta el tipo de resultado a direcciones puntuales en vez de zonas/regiones.
- Este trabajo abarca dos sistemas: la captura pública de datos (este repo) y la lógica de aprobación que los transfiere a la ficha del partner (repo de backend). La forma exacta de dividir el trabajo entre ambos se resuelve en la fase de planificación técnica, no en este spec.
- Los 34 partners existentes cargados por vía legacy (sin pasar por el flujo de aprobación) quedan fuera de alcance; completarles la geolocalización es trabajo aparte.
- No se valida en esta etapa si la dirección seleccionada cae dentro de una zona de cobertura operativa esperada; esa validación, si hace falta, es una decisión posterior.
- La modalidad incluye una tercera opción, "ambas" (atiende en el local y a domicilio), que no estaba en el ticket original (solo mencionaba las dos binarias). Se agrega porque un taller real puede combinar las dos modalidades y forzarlo a elegir una perdería información real — queda como propuesta a confirmar con el equipo de backend antes de darla por definitiva (ver `contracts/partner-application-submission.md`).
