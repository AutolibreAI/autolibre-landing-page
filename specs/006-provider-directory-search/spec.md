# Feature Specification: Buscar por nombre y por zona en el directorio de proveedores

**Feature Branch**: `AUT-139-search-providers-by-name-and-zone`  
**Created**: 2026-10-24  
**Status**: Draft  
**Input**: User description: "Jira AUT-139 — Que en el directorio de proveedores se pueda buscar por nombre y acotar por zona, además de filtrar por familia. Listo cuando: entro al directorio, escribo lo que busco o elijo una zona, y veo sólo los negocios que corresponden, con una URL que puedo compartir y que lleva al mismo resultado."

## Contexto

El directorio de negocios de la red vive en `/proveedores` (AUT-137). Hoy permite filtrar por rubro (familia) y paginar, pero no tiene búsqueda: en producción son 4 páginas de 24 negocios y la única forma de encontrar uno es pasarlas de a una.

Quien entra al directorio casi nunca sabe cómo se llama el taller —por eso entró—, pero sí sabe **dónde** lo necesita. Por eso la zona pesa más que el nombre: la búsqueda por texto es la mitad del pedido y el recorte por zona es la otra mitad, de igual prioridad.

Dos decisiones de diseño ya tomadas y que esta spec respeta:

- Los filtros son **links, no estado de cliente**: cada combinación de filtros es una URL que funciona sin JavaScript, se comparte y la sigue un buscador. La búsqueda y la zona entran por la URL igual que el rubro y la página.
- El recorte se hace sobre **todo el directorio**, no sobre la página que se está viendo: filtrar sólo la página visible miente en cuanto hay más de 24 negocios.

## Clarifications

### Session 2026-10-24

- Q: ¿Qué cubre la búsqueda por texto? → A: Sólo el nombre del negocio. Buscar por servicios o tareas ("correa de distribución") queda fuera de este ticket.
- Q: ¿Cómo se elige la zona? → A: Desplegable con las zonas que tienen negocios. "Cerca de mí" (geolocalización o Google Places) queda fuera de este ticket.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Acotar el directorio por zona (Priority: P1)

Una persona que necesita un taller cerca de donde está elige una zona y ve sólo los negocios que cubren esa zona.

**Why this priority**: es el dato que la persona sí tiene. Es el motivo principal del ticket y el que más acerca al pedido de presupuesto.

**Independent Test**: abrir `/proveedores`, elegir una zona del selector y verificar que el listado muestra sólo negocios de esa zona, que el contador y el paginado reflejan el total filtrado y que la URL resultante, pegada en otra pestaña, muestra el mismo resultado.

**Acceptance Scenarios**:

1. **Given** el directorio sin filtros, **When** la persona elige una zona, **Then** ve únicamente los negocios que cubren esa zona y la URL refleja la zona elegida.
2. **Given** una zona elegida con más de una página de resultados, **When** pasa de página, **Then** la zona se conserva y el total y el paginado corresponden a los negocios de esa zona, no a los del directorio entero.
3. **Given** una zona elegida, **When** elige "Todas las zonas", **Then** vuelve el listado completo.
4. **Given** una URL con zona compartida por otra persona, **When** se abre sin JavaScript, **Then** muestra el mismo resultado.

---

### User Story 2 - Buscar un negocio por texto (Priority: P1)

Una persona que sí conoce el nombre del negocio, o que busca una palabra puntual, la escribe en un buscador y ve sólo los negocios que coinciden.

**Why this priority**: es el otro pedido explícito del ticket y el atajo para quien ya sabe a quién busca.

**Independent Test**: abrir `/proveedores`, escribir el nombre (o parte del nombre) de un negocio existente, enviar la búsqueda y verificar que aparece ese negocio y sólo los que coinciden; copiar la URL y abrirla en otra pestaña con el mismo resultado.

**Acceptance Scenarios**:

1. **Given** el directorio sin filtros, **When** la persona escribe parte del nombre de un negocio y envía la búsqueda, **Then** ve los negocios cuyo nombre coincide y la URL refleja la búsqueda.
2. **Given** una búsqueda con mayúsculas, minúsculas o tildes distintas a las del nombre cargado, **When** se envía, **Then** encuentra igual al negocio (no distingue mayúsculas ni tildes).
3. **Given** una búsqueda vacía o sólo espacios, **When** se envía, **Then** se comporta como sin búsqueda y muestra el listado completo.
4. **Given** una búsqueda activa, **When** la persona la borra o usa "Limpiar", **Then** vuelve el listado sin búsqueda conservando los demás filtros.

---

### User Story 3 - Combinar búsqueda, zona y rubro (Priority: P1)

Las tres formas de acotar (texto, zona y familia) conviven: se pueden usar de a una o juntas, y el paginado funciona sobre el resultado combinado.

**Why this priority**: si al sumar un filtro se pierden los otros, la búsqueda nueva rompe el filtro por rubro que ya existe. Es parte del criterio "listo cuando" del ticket.

**Independent Test**: aplicar rubro + zona + texto a la vez, verificar que el resultado cumple los tres, cambiar uno y verificar que los otros dos se conservan, y que cualquier cambio de filtro vuelve a la primera página.

**Acceptance Scenarios**:

1. **Given** un rubro ya elegido, **When** la persona suma una zona y un texto, **Then** el resultado cumple las tres condiciones a la vez.
2. **Given** tres filtros activos, **When** cambia o quita uno, **Then** los otros dos se conservan.
3. **Given** el listado en la página 3, **When** cambia cualquier filtro, **Then** vuelve a la página 1 del nuevo resultado.
4. **Given** filtros activos, **When** la persona los ve en pantalla, **Then** queda claro cuáles están aplicados y puede quitar cada uno por separado o todos juntos.

---

### User Story 4 - Sin resultados no es un callejón sin salida (Priority: P2)

Si la combinación de filtros no devuelve negocios, la persona ve un mensaje claro y una forma de seguir: ampliar la búsqueda o pedir presupuesto igual, que es lo que el modelo concierge de AutoLibre hace de todos modos.

**Why this priority**: hoy no existe estado vacío porque no hay búsqueda. Buscar algo que no está y ver una página en blanco es peor que no tener buscador. Es lo mínimo para que la búsqueda no empeore la experiencia.

**Independent Test**: buscar un texto que no existe y verificar que se ve un mensaje de "sin resultados" con el acceso a pedir presupuesto y la forma de limpiar los filtros.

**Acceptance Scenarios**:

1. **Given** una combinación de filtros sin negocios, **When** se muestra el directorio, **Then** aparece un mensaje de sin resultados que nombra lo buscado, un acceso a limpiar los filtros y un acceso a pedir presupuesto igual.
2. **Given** ese estado vacío, **When** la persona sigue el acceso a pedir presupuesto, **Then** llega al mismo flujo de pedido de presupuesto que ya existe en el sitio.
3. **Given** un listado que no se puede cargar por una falla del servicio, **When** se muestra la página, **Then** se ve el estado de error de hoy y no el de "sin resultados" (no se confunde una falla con una búsqueda vacía).

---

### User Story 5 - Los resultados filtrados no ensucian el posicionamiento (Priority: P3)

Cada combinación de búsqueda y zona es una URL distinta, pero para los buscadores el directorio sigue siendo una sola página con un solo tema.

**Why this priority**: evita multiplicar páginas casi iguales indexables; la decisión ya está tomada para rubro y paginado y se extiende a los filtros nuevos.

**Independent Test**: abrir `/proveedores?q=...&zona=...` y verificar que su canonical apunta a `/proveedores`, igual que las variantes por rubro y por página.

**Acceptance Scenarios**:

1. **Given** cualquier combinación de búsqueda, zona, rubro y página, **When** se inspecciona la página, **Then** su canonical es `/proveedores`.
2. **Given** el sitemap, **When** se lee, **Then** no lista variantes con búsqueda ni zona.

---

### Edge Cases

- ¿Qué pasa con un texto de búsqueda muy largo, con caracteres especiales o con intento de inyección? Se recorta a un largo razonable y se trata siempre como texto literal; nunca rompe la página ni cambia el significado de la consulta.
- ¿Qué pasa con una zona en la URL que no existe (link viejo, typo, zona que dejó de tener negocios)? Se lee como "Todas las zonas" y no da error, igual que un rubro desconocido.
- ¿Qué pasa con una `pagina` fuera de rango sobre un resultado filtrado? Responde "no encontrado", igual que hoy para el directorio sin filtros; no se confunde con el estado de sin resultados (que es la página 1 vacía).
- ¿Qué pasa si hay exactamente un resultado o todos caben en una página? No se muestra paginado.
- ¿Qué pasa con una zona o un nombre con tildes, eñes o signos? Se encuentra igual escribiéndolo con o sin tildes.
- ¿Qué pasa si el selector de zonas no puede armarse (falla del servicio)? El directorio sigue funcionando con búsqueda por texto y rubro; el recorte por zona no se ofrece en vez de mostrarse vacío.
- ¿Qué pasa con quien tiene JavaScript deshabilitado o con una conexión lenta? Buscar y elegir zona funcionan igual (envío de formulario/links) y devuelven la misma URL compartible.
- ¿Qué pasa si un negocio no tiene zona cargada? Aparece sin filtro de zona y no aparece cuando se filtra por una zona concreta.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El directorio MUST ofrecer una búsqueda por texto que devuelva únicamente los negocios cuyo nombre coincide con lo escrito, sin distinguir mayúsculas ni tildes.
- **FR-002**: La búsqueda por texto MUST cubrir únicamente el nombre del negocio; no busca en rubros, servicios ni tareas.
- **FR-003**: El directorio MUST ofrecer un recorte por zona que devuelva únicamente los negocios que cubren la zona elegida.
- **FR-004**: La zona MUST elegirse de una lista desplegable que ofrece sólo las zonas que tienen al menos un negocio, más la opción "Todas las zonas"; no se pide ubicación del dispositivo ni dirección.
- **FR-005**: Búsqueda por texto, zona y rubro MUST poder usarse de a uno o combinados; el resultado MUST cumplir todos los filtros activos a la vez.
- **FR-006**: Los filtros MUST aplicarse sobre todo el directorio y no sólo sobre la página visible; el contador de resultados y el paginado MUST reflejar el total filtrado.
- **FR-007**: Cada combinación de filtros y página MUST tener una URL propia que, abierta (también sin JavaScript), muestra exactamente el mismo resultado; las URLs sin filtros MUST seguir siendo las de hoy.
- **FR-008**: Cambiar cualquier filtro MUST volver a la primera página; cambiar de página MUST conservar todos los filtros.
- **FR-009**: Los filtros activos MUST verse en pantalla y poder quitarse uno por uno o todos juntos.
- **FR-010**: Un valor de filtro inválido o desconocido (zona inexistente, texto vacío, página no numérica) MUST leerse como "sin ese filtro" y nunca producir un error de página.
- **FR-011**: Cuando una combinación de filtros no devuelve negocios, el directorio MUST mostrar un estado de sin resultados que nombre lo buscado, ofrezca limpiar filtros y ofrezca pedir presupuesto igual.
- **FR-012**: El estado de sin resultados MUST distinguirse del estado de error del servicio; una falla de carga nunca se presenta como "no hay resultados".
- **FR-013**: Las variantes con búsqueda o zona MUST declarar como dirección canónica `/proveedores` y NO MUST aparecer en el sitemap, igual que las variantes por rubro y por página.
- **FR-014**: El texto de búsqueda MUST tratarse siempre como texto literal, con largo máximo, y su valor mostrado en pantalla MUST escaparse.
- **FR-015**: El buscador y el selector de zona MUST ser operables con teclado y lector de pantalla (etiquetas visibles o accesibles, foco visible, anuncio del cambio de resultados).
- **FR-016**: El rubro existente (`?rubro=` y paginado) MUST seguir funcionando sin cambios para quien tenga links guardados.

### Key Entities *(include if feature involves data)*

- **Negocio (proveedor)**: negocio de la red con nombre, rubros/familias que ofrece, zona de cobertura (texto cargado a mano, obligatorio), dirección y coordenadas. Es lo que lista el directorio.
- **Zona**: valor por el cual se acota el directorio. Hoy sale de la zona de cobertura de cada negocio, que es texto libre; si hay muchas variantes de la misma zona el selector es inusable y primero hay que unificarlas.
- **Filtros del directorio**: combinación de texto de búsqueda, zona, rubro y página que define un resultado y se expresa completa en la URL.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Una persona encuentra un negocio conocido por nombre en menos de 15 segundos y sin pasar de página (hoy: recorrer hasta 4 páginas).
- **SC-002**: Una persona acota el directorio a su zona en 2 interacciones o menos (abrir selector, elegir zona).
- **SC-003**: El 100% de las combinaciones de búsqueda, zona, rubro y página se reproducen exactamente desde su URL, también sin JavaScript.
- **SC-004**: En el 100% de los casos con filtros activos, el total y el paginado mostrados coinciden con la cantidad real de negocios que cumplen los filtros (verificable contra el directorio completo).
- **SC-005**: Ninguna combinación de filtros, válida o inválida, termina en una página de error; los casos sin negocios muestran el estado de sin resultados con salida a pedir presupuesto.
- **SC-006**: La búsqueda y el recorte responden con la misma sensación de velocidad que hoy el cambio de rubro, sin pérdida de las métricas de rendimiento y SEO actuales de la página.
- **SC-007**: Las sesiones que terminan en el estado de sin resultados y siguen a pedir presupuesto son medibles por separado (se puede saber cuántas búsquedas fallidas se rescatan).

## Assumptions

- Es una mejora sobre el directorio ya unificado por AUT-137: rutas y nombres de archivos de `/proveedores` son los de ese ticket, y el filtro por rubro y el paginado ya existen y no se rehacen.
- El público es el dueño de auto que llega al directorio; no hay sesión ni dirección guardada en la web, así que cualquier "cerca de mí" no puede apoyarse en datos del usuario.
- La zona de cobertura de cada negocio ya existe en el sistema y es obligatoria, pero es texto libre cargado a mano: antes de ofrecerla como filtro hay que revisar cuántos valores distintos hay realmente; si son muchas variantes de pocas zonas, **normalizarlas es un prerrequisito** (se resuelve en la etapa de plan/investigación y puede abrir trabajo de datos fuera de este ticket).
- Filtrar sobre todo el directorio requiere que el servicio que lista los negocios acepte la búsqueda y la zona: este ticket incluye ese cambio (componentes backend y web) y la web y el servicio deben salir en orden compatible.
- Los nombres de los parámetros de URL van en español como los existentes: texto en `q` (definido en el ticket) y zona en `zona`, siguiendo `rubro` y `pagina`.
- Para quien no tiene resultados, "pedir presupuesto igual" reutiliza el flujo de pedido de presupuesto que ya existe en el sitio; no se crea uno nuevo.
- Fuera de alcance: buscar por servicios o tareas, "cerca de mí" y cualquier orden por cercanía/distancia (dejan abierta una segunda etapa que se cruza con el autocomplete de Google ya pedido para el formulario de pedido), mapa de negocios, guardar búsquedas, sugerencias mientras se escribe (autocompletado) y cualquier cambio al filtro por rubro.
- El ordenamiento del resultado filtrado mantiene el orden actual del directorio; al buscar sólo por nombre no se introduce un orden por relevancia.
