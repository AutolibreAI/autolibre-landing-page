# Feature Specification: Perfil público de proveedor (web + app)

**Feature Branch**: `209-public-provider-profile`
**Created**: 2026-10-07
**Status**: Draft
**Input**: User description: "Trello #209 — Perfil público de proveedor (web + app), spec para devs. Una página por proveedor tan buena que el proveedor la use como su propia web: que la mande a sus clientes, la ponga como sitio web en su perfil de Google Maps, y que Google y los LLMs la indexen. La misma información se ve en la app. Diseño (borrador, datos ficticios): https://claude.ai/artifact/6fWW6HgWw1rCXE9zxzFteU. Texto completo de la tarjeta: `source/trello-209.md`."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver el perfil de un proveedor y contactarlo (Priority: P1)

Una persona (cliente final) llega al perfil de un proveedor —desde un link que le mandaron, desde Google o desde la app— y quiere decidir rápido si confía. Ve quién es, a qué se dedica, si está abierto ahora, dónde queda, qué servicios hace y cómo escribirle, y lo contacta con un toque: WhatsApp (la acción principal), llamar, cómo llegar o pedir una propuesta.

**Why this priority**: Es el núcleo de la feature: sin una página que informe y habilite el contacto, nada de lo demás (compartir, indexar, medir) tiene sentido. Entrega valor por sí sola, incluso sin reseñas, trabajos ni métricas.

**Independent Test**: Se prueba abriendo la URL de un proveedor con los datos básicos completos (nombre, rubro, descripción, servicios, horarios, ubicación, teléfono y WhatsApp) y verificando que se ven todos los bloques base, que el estado en vivo es correcto para la hora actual y que cada botón de contacto dispara la acción que promete.

**Acceptance Scenarios**:

1. **Given** un proveedor aprobado con los datos básicos completos, **When** una persona abre su perfil, **Then** ve el encabezado, "Sobre el proveedor", "Servicios y especialidades", "Horarios", "Ubicación" y "Contacto y redes" (en desktop, "Horarios", "Ubicación", "Contacto y redes" y "Pedir propuesta" van en una columna derecha; en mobile esa columna pasa debajo).
2. **Given** un proveedor que hoy abre de 8:00 a 18:00, **When** una persona abre el perfil a las 10:00 hora de Buenos Aires, **Then** el estado en vivo dice "Abierto · cierra 18:00".
3. **Given** el mismo proveedor, **When** una persona abre el perfil a las 20:00 hora de Buenos Aires, **Then** el estado dice "Cerrado · abre mañana 8:00" (o el próximo día y horario en que abre, si mañana no atiende).
4. **Given** el perfil abierto, **When** la persona toca "WhatsApp", "Llamar" o "Cómo llegar", **Then** se abre, respectivamente, una conversación de WhatsApp con el proveedor, el discado de su teléfono y el mapa con su dirección.
5. **Given** el perfil abierto en un teléfono, **When** la persona mira la primera pantalla sin desplazarse, **Then** ya ve el nombre, el rubro, el estado en vivo y el botón de WhatsApp (y la puntuación, si el proveedor tiene reseñas).
6. **Given** el perfil abierto, **When** la persona elige "Pedir propuesta", **Then** inicia un pedido de propuesta que llega a ese proveedor.

---

### User Story 2 - Compartir el perfil con una URL estable y una vista previa propia (Priority: P1)

Un proveedor quiere usar su perfil como si fuera su propia web: mandar el link por WhatsApp a sus clientes y ponerlo como "Sitio web" en su perfil de Google Maps. Necesita que la dirección sea estable (que no se rompa si cambia el nombre) y que al compartirla por mensajería se vea una tarjeta de vista previa que lo represente bien.

**Why this priority**: Es lo que convierte al perfil en "la web del proveedor" y le da a AutoLibre un link entrante por cada proveedor. El link se comparte sobre todo por WhatsApp, así que la vista previa es parte central de la feature, no un detalle.

**Independent Test**: Se prueba publicando un proveedor, abriendo su URL, pegándola en una conversación de mensajería para ver la vista previa, y renombrando al proveedor para confirmar que la URL vieja redirige a la nueva.

**Acceptance Scenarios**:

1. **Given** un proveedor aprobado llamado "Mecánica Barrancas" en San Isidro, **When** su perfil se publica, **Then** queda accesible en `autolibre.ai/p/mecanica-barrancas-san-isidro`.
2. **Given** un proveedor que cambia su nombre comercial, **When** alguien abre la URL anterior, **Then** es redirigido de forma permanente a la URL nueva, y la página declara la nueva como su dirección canónica.
3. **Given** el link del perfil pegado en una conversación de mensajería, **When** la plataforma genera la vista previa, **Then** muestra título, descripción y una imagen de 1200×630 con el logo, el nombre, el rubro y la localidad, la puntuación con su cantidad de reseñas, el sello "Aliado de AutoLibre", el logo de AutoLibre y la foto de portada a la derecha.
4. **Given** un proveedor sin foto de portada o sin logo, **When** se comparte su link, **Then** la vista previa se genera igual, legible y sin imágenes rotas.
5. **Given** un proveedor que ve su perfil, **When** busca cómo usarlo, **Then** encuentra su URL y la instrucción de ponerla como "Sitio web" en su Perfil de Empresa de Google.

---

### User Story 3 - Ser encontrado por buscadores y asistentes de IA (Priority: P1)

Google y los asistentes basados en LLM leen la página del proveedor para entender qué es, dónde está, cuándo abre y qué dicen de él, y poder mostrarlo o citarlo cuando alguien pregunta por un taller, una gomería o una gestoría.

**Why this priority**: La tarjeta lo marca como crítico. Si el contenido no está disponible como texto en la primera respuesta de la página, o no hay datos estructurados, la página no cumple su objetivo de ser "la web del proveedor" en los buscadores.

**Independent Test**: Se prueba pidiendo la página sin ejecutar scripts (como lo hace un rastreador), confirmando que todo el contenido está ahí como texto, y pasando la página por los validadores públicos de datos estructurados.

**Acceptance Scenarios**:

1. **Given** un perfil publicado, **When** un rastreador pide la página sin ejecutar scripts, **Then** recibe todo el contenido de los bloques (nombre, descripción, servicios, horarios, ubicación, reseñas visibles y preguntas frecuentes) como texto real, no como imágenes.
2. **Given** un perfil publicado, **When** se inspecciona su cabecera, **Then** el título es "<Nombre> — <rubro principal> en <localidad> | AutoLibre", la meta descripción sale de la descripción del proveedor (recortada) y la dirección canónica es la URL de su slug.
3. **Given** un perfil publicado, **When** se valida su información estructurada, **Then** declara un negocio del tipo que corresponde a su rubro (taller mecánico, gomería, lavadero, chapa y pintura, repuestos, o genérico automotor) y no arroja errores.
4. **Given** un proveedor con reseñas, **When** se lee la información estructurada, **Then** incluye la puntuación agregada y las reseñas, y coinciden con lo que se ve en la página.
5. **Given** perfiles publicados y uno que no lo está, **When** se consulta el mapa del sitio, **Then** aparecen todos los publicados y el no publicado no figura.
6. **Given** cualquier perfil, **When** se lo abre, **Then** la ruta "Proveedores › <Localidad> › <Rubro> › <Nombre>" se ve en la página y está declarada también como dato estructurado.

---

### User Story 4 - Evaluar la confianza: trabajos, reseñas y métricas (Priority: P2)

Antes de contactar, el cliente quiere pruebas: ver trabajos reales que el proveedor hizo, leer qué dicen otros clientes de AutoLibre y, si el proveedor las tiene, ver cifras de su desempeño en la red.

**Why this priority**: Es lo que más pesa en la decisión de confiar, pero depende de datos que generan otros procesos (pedidos, reseñas, métricas). La página ya sirve sin esto (Historia 1), por eso va después.

**Independent Test**: Se prueba con un proveedor sembrado con trabajos de ambos orígenes, reseñas con y sin respuesta, y métricas por encima y por debajo del umbral, y con otro proveedor sin nada de eso.

**Acceptance Scenarios**:

1. **Given** un proveedor con trabajos registrados en AutoLibre y trabajos cargados por él, **When** se abre el perfil, **Then** cada trabajo muestra foto(s) antes/después, servicio, vehículo (marca, modelo, año) y fecha (mes y año), con un badge distinto según su origen ("Registrado en AutoLibre" o "Cargado por el taller"), y se ve el contador "N registrados en AutoLibre · M en total".
2. **Given** un proveedor con más de tres trabajos, **When** se abre el perfil en la web, **Then** se ven tres y un enlace "Ver los M trabajos"; en la app se ven en un carrusel horizontal.
3. **Given** un proveedor con reseñas de AutoLibre, **When** se abre el perfil, **Then** se ve la puntuación promedio con la cantidad de reseñas, y cada reseña muestra nombre e inicial del apellido, vehículo, fecha, estrellas, texto y, si existe, la respuesta pública del proveedor.
4. **Given** un proveedor que además tiene reseñas en Google, **When** se abre su perfil, **Then** esas reseñas no se muestran ni se importan.
5. **Given** un proveedor que supera el umbral en solo algunas métricas, **When** se abre el perfil, **Then** el bloque "Medido por AutoLibre" muestra únicamente esas métricas, con la bajada fija "Solo se muestran los datos que superan nuestro estándar."
6. **Given** un proveedor que no supera el umbral en ninguna métrica, **When** se abre el perfil, **Then** el bloque "Medido por AutoLibre" no aparece.
7. **Given** un proveedor sin trabajos o sin reseñas, **When** se abre el perfil, **Then** esos bloques no aparecen y no se muestra ningún dato inventado ni vacío.

---

### User Story 5 - Preguntas frecuentes generadas solas (Priority: P2)

El cliente (y el buscador) encuentra respuestas a las dudas típicas —"¿atienden mi marca?", "¿abren los sábados?"— sin que el proveedor haya tenido que escribir nada.

**Why this priority**: Aporta contenido citable por asistentes de IA y ahorra mensajes al proveedor, pero se apoya en que los datos estructurados de servicios, marcas, vehículos y horarios ya estén resueltos.

**Independent Test**: Se prueba con un proveedor cuyos datos estructurados se conocen y verificando que las preguntas y respuestas generadas corresponden exactamente a esos datos, y que cambian cuando los datos cambian.

**Acceptance Scenarios**:

1. **Given** un proveedor que atiende, entre otras, la marca Peugeot, **When** se abre su perfil, **Then** hay una pregunta "¿Atienden autos Peugeot?" con una respuesta afirmativa que lista las marcas que atiende.
2. **Given** un proveedor que los sábados abre de 9:00 a 13:00, **When** se abre su perfil, **Then** la pregunta "¿Abren los sábados?" se responde con ese horario; y si los sábados cierra, se responde que no abre.
3. **Given** un proveedor sin marcas cargadas, **When** se abre su perfil, **Then** no aparece ninguna pregunta que dependa de las marcas.
4. **Given** un proveedor que modifica sus datos (por ejemplo, agrega GNC a los tipos de vehículo), **When** se vuelve a abrir su perfil, **Then** las preguntas y respuestas reflejan el cambio sin intervención del proveedor.
5. **Given** un perfil con preguntas frecuentes, **When** se lo abre, **Then** se presentan como acordeón, y su texto está presente en la página aunque estén cerradas; las mismas preguntas y respuestas están declaradas como dato estructurado.

---

### User Story 6 - Perfil de un proveedor sin local a la calle (Priority: P2)

Una gestoría o un servicio a domicilio no recibe gente en un local. Su perfil tiene que mostrar dónde trabaja (su zona de cobertura) en lugar de una dirección, para no parecer un negocio con local que no tiene.

**Why this priority**: La feature tiene que servir para cualquier rubro, no solo talleres. La variante es una propuesta de diseño todavía por validar con proveedores reales, así que va después del perfil con local.

**Independent Test**: Se prueba con un proveedor marcado como sin local y verificando que no aparece ninguna dirección ni botón "Cómo llegar", y que sí aparece la zona de cobertura.

**Acceptance Scenarios**:

1. **Given** un proveedor sin local, **When** se abre su perfil, **Then** el encabezado dice "A domicilio y online · <zona>" en lugar de una dirección, y no hay botón "Cómo llegar".
2. **Given** el mismo proveedor, **When** se mira el bloque de ubicación, **Then** se llama "Zona de cobertura", muestra un mapa con el área y la lista de partidos o localidades que cubre, y dice "No atiende en un local a la calle. Coordiná por WhatsApp dónde y cuándo."
3. **Given** el mismo proveedor, **When** se lee su información estructurada, **Then** declara un área de servicio y no declara dirección ni coordenadas.

---

### User Story 7 - Ver el perfil dentro de la app (Priority: P2)

Una persona que usa la app abre el perfil de un proveedor desde la app y ve la misma información que en la web, adaptada a la pantalla del teléfono, con dos agregados propios de la app: la distancia al proveedor y, si tiene sesión, la opción de hacerlo su taller de cabecera.

**Why this priority**: La app ya tiene a sus usuarios, pero el perfil web (Historias 1 a 3) es el que habilita compartir y ser encontrado; la pantalla de la app reutiliza ese contenido.

**Independent Test**: Se prueba abriendo el perfil de un mismo proveedor en la web y en la app, comparando que la información coincide, y repitiendo con y sin sesión y con y sin permiso de ubicación.

**Acceptance Scenarios**:

1. **Given** un usuario de la app, **When** abre el perfil de un proveedor, **Then** ve los mismos bloques que en la web, adaptados al teléfono (rubro principal con "+N rubros", dos reseñas visibles y los trabajos en carrusel).
2. **Given** un usuario con sesión iniciada, **When** abre el perfil, **Then** ve el botón "Hacerlo mi taller de cabecera"; **Given** un usuario sin sesión, **Then** no lo ve.
3. **Given** un usuario que dio permiso de ubicación, **When** abre el perfil, **Then** junto a la localidad ve la distancia al proveedor; **Given** un usuario que no dio permiso, **Then** ve solo la localidad.
4. **Given** el perfil abierto en la app, **When** el usuario toca "Compartir perfil", **Then** puede compartir la URL pública del perfil, que también se ve en pantalla.

---

### Edge Cases

- ¿Qué pasa si dos proveedores generan el mismo slug (mismo nombre y misma localidad)? Los slugs son únicos: el segundo recibe una variante estable y determinística (por ejemplo, un sufijo), que no cambia después. El criterio exacto se define en el plan.
- ¿Qué pasa si el proveedor renombra su negocio más de una vez? Todos los slugs anteriores redirigen directo al vigente, sin cadenas de redirecciones.
- ¿Qué pasa con un proveedor que deja de estar aprobado o activo? Su perfil deja de mostrarse (responde como página no disponible), no se indexa y sale del mapa del sitio.
- ¿Qué pasa si faltan datos del proveedor (sin portada, sin logo, sin descripción, sin quién atiende, sin redes)? Cada bloque o dato sin información se omite en lugar de mostrar huecos; la portada y el logo usan un marcador neutro; nunca se inventa contenido.
- ¿Qué pasa si el proveedor no cargó horarios? No se muestra el estado en vivo ni el bloque "Horarios", y no se genera la pregunta frecuente de horarios.
- ¿Qué pasa si un proveedor tiene horario cortado (por ejemplo, 8:00 a 12:00 y 14:00 a 18:00) o más de una franja por día? El estado en vivo considera todas las franjas ("Cerrado · abre 14:00" durante el descanso).
- ¿Qué pasa si hoy es el último día de atención antes de un cierre largo (sábado a la tarde, domingo cerrado)? El estado indica el próximo día y horario real de apertura ("Cerrado · abre el lunes 8:00"), no "mañana".
- ¿Qué pasa con los feriados? No se calculan: el bloque muestra el texto fijo "Feriados: consultar por WhatsApp".
- ¿Qué pasa con la privacidad de los clientes en trabajos y reseñas? Los trabajos muestran marca, modelo y año del vehículo, nunca la patente ni datos del cliente; las reseñas muestran nombre e inicial del apellido, nunca el apellido completo ni contactos.
- ¿Qué pasa si el rubro principal no tiene un tipo específico de negocio asignado? Se usa el tipo genérico de negocio automotor.
- ¿Qué pasa si el nombre o la localidad tienen tildes, ñ, símbolos o son muy largos? El slug se normaliza a caracteres simples y la imagen de vista previa recorta el texto largo sin romper el diseño.
- ¿Qué pasa si la información estructurada y el contenido visible dejan de coincidir (por ejemplo, un dato oculto en la página)? No debe ocurrir: ambos salen de los mismos datos y, si un dato no se muestra, tampoco se declara.
- ¿Qué pasa si un proveedor atiende tanto en local como a domicilio (modalidad "ambas" en el alta)? La tarjeta solo define las variantes "con local" y "sin local"; este caso queda pendiente de validar con proveedores reales (ver Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

**Publicación y URL**

- **FR-001**: Todo proveedor aprobado en AutoLibre MUST tener una página pública accesible sin iniciar sesión en `autolibre.ai/p/<slug>`.
- **FR-002**: El slug MUST formarse con el nombre comercial y la localidad, en minúsculas, sin tildes ni caracteres especiales y separado por guiones; los slugs MUST ser únicos, con una regla estable y determinística para resolver colisiones.
- **FR-003**: Cuando el slug de un proveedor cambie, todos sus slugs anteriores MUST redirigir de forma permanente y directa al slug vigente.
- **FR-004**: Un proveedor que deje de estar aprobado o activo MUST dejar de mostrar su perfil, no ser indexable y salir del mapa del sitio.
- **FR-005**: El sistema SHOULD ofrecer un link corto opcional por proveedor que lleve a su URL canónica.

**Contenido del perfil** *(numerados en el orden de la tarjeta, que es el orden de la app; en la web de escritorio, "Pedir propuesta", "Horarios", "Ubicación" y "Contacto y redes" van en la columna derecha — ver FR-051)*

- **FR-010**: El encabezado MUST mostrar foto de portada, logo cuadrado superpuesto a la portada, nombre comercial, sello "Aliado de AutoLibre" con el isotipo (único sello existente), rubro principal y rubros secundarios, puntuación promedio con cantidad de reseñas (enlazada a la sección de reseñas), estado en vivo y localidad.
- **FR-011**: El estado en vivo MUST calcularse a partir de los horarios del proveedor en la zona horaria `America/Argentina/Buenos_Aires`, soportar más de una franja por día e indicar el próximo horario de apertura cuando está cerrado.
- **FR-012**: El encabezado MUST ofrecer los botones WhatsApp (acción principal), Llamar, Cómo llegar (solo si el proveedor tiene local) y Compartir.
- **FR-013**: "Pedir propuesta" MUST iniciar un pedido de propuesta que llegue al proveedor; en la web vive en una tarjeta de la columna derecha y en la app es un botón más del encabezado.
- **FR-014**: "Sobre el proveedor" MUST mostrar la descripción libre, quién atiende (nombre, rol y foto opcional), los años en el rubro y "En AutoLibre desde <mes año>".
- **FR-015**: "Servicios y especialidades" MUST mostrar los servicios agrupados por categoría (sin precio ni duración), las marcas que atiende, los tipos de vehículo y el equipamiento relevante, sin nombrar modelos de escáner. Estos datos MUST ser estructurados y no texto libre, porque alimentan el matcheo de pedidos y las preguntas frecuentes.
- **FR-016**: "Trabajos hechos" MUST mostrar, por trabajo, foto(s) antes/después, servicio, vehículo (marca, modelo, año) y fecha (mes y año), con un badge distinto según el origen ("Registrado en AutoLibre" proviene de un pedido real o del historial; "Cargado por el taller" es portfolio propio) y un contador "N registrados en AutoLibre · M en total".
- **FR-017**: Los trabajos MUST NO exponer la patente ni datos personales del cliente.
- **FR-018**: "Reseñas" MUST mostrar solo reseñas hechas en AutoLibre (nunca importadas ni mostradas de otras fuentes como Google), con una puntuación general sin desglose por dimensión. Cada reseña MUST mostrar nombre e inicial del apellido, vehículo, fecha, estrellas, texto y, si existe, la respuesta pública del proveedor.
- **FR-019**: La web MUST mostrar tres trabajos y tres reseñas con enlaces "Ver los M trabajos" y "Ver las N reseñas"; la app MUST mostrar los trabajos en un carrusel horizontal y dos reseñas.
- **FR-020**: "Medido por AutoLibre" MUST mostrar el tiempo de respuesta promedio, la tasa de pedidos respondidos y las propuestas enviadas, y cada una solo si supera su umbral, calculado con una regla determinística sin intervención de un LLM. Si ninguna métrica supera su umbral, el bloque MUST NO aparecer. La bajada fija MUST ser "Solo se muestran los datos que superan nuestro estándar."
- **FR-021**: "Horarios" MUST mostrar el horario semanal con el día de hoy resaltado y el texto fijo "Feriados: consultar por WhatsApp".
- **FR-022**: Para un proveedor con local, "Ubicación" MUST mostrar un mapa con pin, la dirección completa y "Cómo llegar".
- **FR-023**: Para un proveedor sin local, el encabezado MUST decir "A domicilio y online · <zona>" en lugar de la dirección, MUST NO ofrecer "Cómo llegar", y el bloque de ubicación MUST llamarse "Zona de cobertura": mapa con el área, lista de partidos o localidades y el texto "No atiende en un local a la calle. Coordiná por WhatsApp dónde y cuándo."
- **FR-024**: "Preguntas frecuentes" MUST generarse a partir de los datos estructurados con plantillas, sin que el proveedor escriba nada. La lógica que decide qué preguntas existen y qué contiene cada respuesta MUST ser determinística; un LLM, si se usa, SOLO puede redactar la respuesta y MUST NOT decidir su contenido. Una pregunta MUST generarse únicamente si existe el dato del que depende. Se presentan como acordeón.
- **FR-025**: "Contacto, redes y pie" MUST mostrar teléfono, Instagram y web propia (cuando existan). En la web, una banda de AutoLibre al pie con "Descargá AutoLibre", "Sumá tu negocio" y la URL del perfil; en la app, la URL del perfil y el botón "Compartir perfil".
- **FR-026**: Todo bloque sin datos MUST omitirse en lugar de mostrarse vacío, y el sistema MUST NOT mostrar datos inventados.

**Descubrimiento (SEO y respuestas de IA)**

- **FR-030**: Todo el contenido del perfil MUST llegar en la primera respuesta de la página, como texto real y no como imágenes.
- **FR-031**: El título MUST ser "<Nombre> — <rubro principal> en <localidad> | AutoLibre"; la meta descripción MUST salir de la descripción del proveedor, recortada; la dirección canónica MUST ser la URL del slug vigente.
- **FR-032**: La página MUST declarar datos estructurados de negocio local con el tipo según el rubro (taller mecánico, gomería, lavadero, chapa y pintura, repuestos, o genérico automotor), incluyendo nombre, logo, imagen, descripción, teléfono, URL, dirección y coordenadas (con local) o área de servicio (sin local), horarios, puntuación agregada, reseñas y redes.
- **FR-033**: La página MUST declarar sus preguntas frecuentes como dato estructurado de preguntas y respuestas, idénticas a las visibles.
- **FR-034**: La ruta "Proveedores › <Localidad> › <Rubro> › <Nombre>" MUST verse en la página y declararse como dato estructurado.
- **FR-035**: Todo perfil publicado MUST figurar en el mapa del sitio.
- **FR-036**: Los datos estructurados MUST corresponder a lo que se ve en la página; un dato que no se muestra MUST NOT declararse.
- **FR-037**: El sistema MUST darle al proveedor su URL y la instrucción de ponerla como "Sitio web" en su Perfil de Empresa de Google.

**Vista previa al compartir**

- **FR-040**: La página MUST declarar título, descripción, imagen, URL y formato de tarjeta grande para las vistas previas de redes y mensajería.
- **FR-041**: La imagen de vista previa MUST generarse dinámicamente por proveedor, a 1200×630, con logo, nombre, rubro y localidad, puntuación con cantidad de reseñas, sello "Aliado de AutoLibre", logo de AutoLibre y foto de portada a la derecha.
- **FR-042**: La imagen de vista previa MUST generarse de forma legible aunque falten la portada, el logo o las reseñas, y recortar textos largos sin romper el diseño.

**Diseño y accesibilidad**

- **FR-050**: El perfil MUST seguir el sistema de diseño "AutoLibre AI" (fondo de página `#F1F2F0`; tarjetas `#FEFEFD` con borde de 1px `#E4EAE4` y sin sombras; CTA principal oscuro `#1C2B1C` con texto blanco; verde de marca `#2A8C3A` solo como acento; estado OK en verde de estado; tipografías Outfit para títulos y datos y DM Sans para el cuerpo; radios de 8 en botones, 12 en íconos, 16 en tarjetas y 20 en pills; íconos Phosphor *(desvío documentado: la implementación usa los íconos de línea 24×24 del diseño; ver plan, desvío 8)) y MUST mostrar el logo de AutoLibre siempre como imagen, nunca como texto.
- **FR-051**: La web MUST ser responsive: dos columnas en desktop y, en mobile, la columna derecha pasa debajo de la principal.
- **FR-052**: El perfil MUST cumplir el estándar de accesibilidad del sitio (WCAG 2.1 AA), incluyendo navegación completa por teclado, objetivos táctiles de al menos 44px en mobile, texto alternativo significativo en imágenes con contenido, y una estructura de títulos coherente cuyo único título principal sea el nombre comercial.

**App**

- **FR-060**: La app MUST mostrar la misma información que la web, con los bloques en el orden de la tarjeta, en una pantalla pensada para el teléfono.
- **FR-061**: La app MUST mostrar la distancia al proveedor junto a la localidad solo si el usuario dio permiso de ubicación.
- **FR-062**: La app MUST mostrar el botón "Hacerlo mi taller de cabecera" solo a usuarios con sesión iniciada, conectado con la función de taller de cabecera.
- **FR-063**: En la app, el rubro principal MUST mostrarse junto a "+N rubros" en lugar de la lista completa de secundarios.

**Datos**

- **FR-070**: El perfil MUST poder construirse con los datos que carga el proveedor (nombre, logo, portada, rubros, descripción, quién atiende, año de inicio, servicios por categoría, marcas, tipos de vehículo, equipamiento, trabajos, dirección con coordenadas o zona de cobertura, horarios, teléfono, WhatsApp, redes y web propia) y con los que aporta AutoLibre (sello, fecha de alta, reseñas y respuestas, trabajos registrados vía pedidos, métricas y slug).
- **FR-071**: Los datos que aporta AutoLibre MUST NOT ser editables por el proveedor.

### Key Entities *(include if feature involves data)*

- **Proveedor / Perfil**: el negocio y su página pública. Identidad (nombre comercial, logo, portada, rubro principal y secundarios, descripción, quién atiende, año de inicio), contacto (teléfono, WhatsApp, redes, web propia) y estado de publicación. Se relaciona con todo lo demás.
- **Slug**: identificador público del perfil en la URL (nombre + localidad). Conserva el historial de slugs anteriores para poder redirigirlos.
- **Servicio / Categoría de servicio**: lo que el proveedor hace, agrupado por categoría. Sin precio ni duración.
- **Marca, Tipo de vehículo y Equipamiento**: especialidades estructuradas del proveedor. Alimentan el matcheo de pedidos y las preguntas frecuentes.
- **Horario semanal**: franjas de atención por día (puede haber más de una por día). Es la fuente del estado en vivo y de la pregunta frecuente de horarios.
- **Ubicación**: o bien un local (dirección completa y coordenadas), o bien una zona de cobertura (partidos y localidades con su área); define la variante "con local" o "sin local".
- **Trabajo**: una realización del proveedor (fotos antes/después, servicio, vehículo, fecha) con su origen: registrado en AutoLibre o cargado por el taller.
- **Reseña**: opinión de un cliente de AutoLibre (nombre e inicial, vehículo, fecha, estrellas, texto) con respuesta pública opcional del proveedor.
- **Métrica de desempeño**: tiempo de respuesta promedio, tasa de pedidos respondidos y propuestas enviadas, cada una con su umbral de publicación.
- **Pregunta frecuente generada**: pregunta y respuesta derivadas de los datos estructurados por una plantilla fija.
- **Sello**: distintivo del proveedor; hoy existe uno solo, "Aliado de AutoLibre".

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: En un teléfono de pantalla estándar, sin desplazarse, una persona identifica el nombre, el rubro, si el proveedor está abierto y cómo escribirle por WhatsApp en la primera pantalla del perfil (verificable en una revisión visual de 5 perfiles de rubros distintos).
- **SC-002**: El 100% del contenido de los perfiles publicados está presente como texto en la primera respuesta de la página, sin ejecutar scripts (verificable pidiendo la página como lo hace un rastreador).
- **SC-003**: El 100% de los perfiles publicados pasa sin errores la validación pública de datos estructurados para su tipo de negocio y para las preguntas frecuentes, y lo declarado coincide con lo visible.
- **SC-004**: El 100% de los perfiles publicados muestra una vista previa completa (título, descripción e imagen) al pegar su link en WhatsApp, y la imagen se entrega en menos de 3 segundos.
- **SC-005**: El 95% de las visitas desde teléfono carga el contenido principal en menos de 2,5 segundos y sin saltos visibles de diseño (los objetivos de Core Web Vitals del sitio: LCP menor a 2,5 s y CLS menor a 0,1).
- **SC-006**: Una auditoría automática de accesibilidad no encuentra violaciones críticas de WCAG 2.1 AA, y todo el perfil se recorre y se usa solo con teclado.
- **SC-007**: Cuando un proveedor cambia sus datos, la información pública y su información estructurada se actualizan en menos de 10 minutos, sin acción manual del equipo de AutoLibre.
- **SC-008**: Cada acción de contacto del perfil (WhatsApp, Llamar, Cómo llegar, Pedir propuesta, Compartir) queda medida por proveedor, de modo que el equipo de producto pueda calcular conversión por perfil; las metas numéricas se fijan una vez que exista una línea base.

## Assumptions

- **Alcance entre repositorios**: la feature se reparte entre tres piezas: la página web pública (este repositorio), la pantalla de la app (repositorio de la app móvil) y los datos y su API (backend). Esta spec define el comportamiento común; la división por repositorio se resuelve en el plan.
- **Qué datos existen hoy no se da por sentado**: el alta de proveedores (`/proveedores`) ya captura nombre, WhatsApp, dirección, servicios, marcas, tipos de vehículo, horarios y modalidad (ver `specs/004-partner-approval-data`). Pero esa spec guarda los **horarios como texto libre sin formato validado**, y no hay evidencia en este repositorio de que existan hoy reseñas, trabajos registrados, métricas, portada, logo, descripción, quién atiende o año de inicio. El plan debe inventariar lo que falta; en particular, el estado en vivo y las preguntas frecuentes de horarios exigen horarios estructurados.
- **Modalidad**: el alta distingue "en local", "a domicilio" y "ambas" (propuesta de la spec 004, a confirmar con el backend). Se asume "en local" = variante con local y "a domicilio" = variante sin local; el tratamiento de "ambas" queda abierto y se resuelve al validar con proveedores reales, como pide la tarjeta.
- **Quién tiene perfil**: solo los proveedores aprobados. Los proveedores se registran solos; AutoLibre no carga perfiles ni ofrece "Reclamar perfil".
- **"Pedir propuesta"**: se asume que reutiliza el flujo de pedido de presupuesto existente (en la app, "Pedir cotización"). Que el pedido quede dirigido a un proveedor puntual puede requerir adaptar ese flujo; se verifica en el plan.
- **Mapas**: se asume un proveedor de mapas ya usado por AutoLibre (el sitio ya usa Google Places para direcciones); el plan elige cómo mostrar el pin y el área de cobertura.
- **Idioma y zona horaria**: todo el contenido propio de AutoLibre está en español rioplatense (es-AR) y los horarios se interpretan siempre en `America/Argentina/Buenos_Aires`, sin importar desde dónde se mire.
- **Imagen de vista previa**: se asume que la generación dinámica tiene que ser lo bastante rápida como para que las plataformas de mensajería no descarten la tarjeta; los tiempos de SC-004 son propuestos y se confirman en el plan.
- **Valores de los criterios de éxito**: los tiempos y porcentajes de Success Criteria son propuestas razonables (los de rendimiento coinciden con los objetivos del sitio); producto puede ajustarlos.
- **Diseño**: el canvas vinculado es un borrador con datos ficticios ("Mecánica Barrancas", "Gestoría Norte") y fotos y logos como marcadores; los textos de interfaz de esta spec salen de ese borrador.
- **Link corto**: el link corto vía Cloudflare es opcional y no bloquea el resto de la feature.
- **Sugerencia no vinculante**: completar el perfil de a poco (indicador tipo "perfil completo al 70%") sin alargar el alta de 2 minutos. No es un requisito de esta versión.

### Decisiones abiertas (heredadas de la tarjeta, no bloquean el plan)

- **Umbrales de las métricas**: los valores todavía no están definidos. Mientras no se definan, el bloque "Medido por AutoLibre" no se muestra para ningún proveedor (el valor por defecto seguro). La regla es determinística y los valores deben poder ajustarse sin cambiar la lógica.
- **Perfil gratis vs. suscripción**: no está definido qué incluye cada uno. En esta versión todos los perfiles son iguales.
- **Variante sin local**: es una propuesta de diseño que falta validar con proveedores reales antes de darla por definitiva.

### Fuera de alcance de esta versión

- Condiciones del servicio (medios de pago, factura, garantía, turno, retiro y entrega): no están relevadas.
- Precios y duración de los servicios.
- Desglose de la puntuación por dimensión.
- Reseñas externas (Google).
- "Reclamar perfil".
- Sellos distintos de "Aliado de AutoLibre".
- Diferencias entre perfil gratis y pago.
