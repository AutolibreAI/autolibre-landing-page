# Feature Specification: Claridad y conversión del header y el hero de la landing

**Feature Branch**: `209-public-provider-profile` *(misma rama que la tarea #209, por decisión del equipo: ver Assumptions)*
**Created**: 2026-10-07
**Status**: Draft
**Input**: Feedback en video (`feedback.mov`) sobre la landing, detectado durante la tarea Trello #209. Es independiente del perfil público de proveedor (spec `209-public-provider-profile`), salvo por la decisión de header del Requisito FR-020.

## Contexto

Una persona que llega a la landing sin haber visto ninguna publicidad en redes **no tiene contexto**: no sabe qué es AutoLibre, qué significan los links del menú ni cuál es el siguiente paso. El video marcó cuatro problemas concretos, que acá se tratan como cuatro historias independientes.

**Estado actual relevado en el código (2026-10-07)**, para que nadie parta de memoria:

| Tema | Hoy |
|---|---|
| CTA de presupuesto en el header | "Pedir presupuesto" → **lleva a la página `/pedido`** (landing de pedido con paso a paso y FAQ). En pantallas angostas solo está dentro del menú. |
| CTA de presupuesto en el hero | *(estado inicial)* texto "¿Necesitás algún servicio? **¡Pedí tu presupuesto!**" → baja por la misma página a la sección de presupuesto. **Se eliminó el 2026-10-07** (ver US1). |
| CTA de presupuesto en la sección de la home | Botón "**Pedí tu presupuesto**" → **abre un formulario en una ventana superpuesta**, y debajo un link "Ver cómo funciona el pedido de presupuesto" → `/pedido`. |
| Link "Compatibilidad" | Ancla en la home hacia la sección cuyo título es "¿Tu auto es compatible?" y que habla del conector de diagnóstico OBD2 del auto. Solo se ve en pantallas anchas o en el menú. |
| Hero | Titular "Todo tu auto, en un solo lugar." + palabras rotativas (VTV, Multas, Seguros, Registro, Mantenimientos, Services, Talleres, Documentación) + descarga de la app. El pedido de presupuesto es solo el link de texto chico. |
| Header por página | **Home**: anclas (Producto, Cómo funciona, Compatibilidad, FAQ, Blog) + "Pedir presupuesto" + "Soy proveedor" + "Descargar la app". **Páginas internas** (sobre nosotros, soporte, eliminar cuenta, términos, privacidad): sin anclas, con "Blog" + "Pedir presupuesto" + "Soy proveedor" + "Descargar la app". **Blog**: igual pero el link secundario pasa a "Soy dueño de auto". **Proveedores**: link secundario "Soy dueño de auto" y el botón pasa a "Sumar mi negocio". **Pedido**: botón propio. **Descarga**: encabezado propio, distinto. |

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un solo camino para pedir presupuesto (Priority: P1)

Quien quiere pedir un presupuesto lo puede hacer desde el header o desde la banda de presupuesto de la home, y **cada uno de esos puntos lo lleva directo a la página `/pedido`** (decisión de producto del 2026-10-07), sin pasar por una sección intermedia que le repite el mismo botón. **El hero ya no tiene CTA de presupuesto** (decisión del 2026-10-07: el hero se enfoca en descargar la app y en las funciones destacadas); el pie conserva su link de navegación.

**Why this priority**: es el paso de conversión principal del sitio y hoy cuesta un clic de más (hero → sección → botón) y deja tres recorridos distintos para la misma acción.

**Independent Test**: desde la home, tocar cada punto de entrada de presupuesto y contar clics y destino hasta ver el formulario de pedido.

**Acceptance Scenarios**:

1. **Given** una persona en la home, **When** mira el hero, **Then** no hay un CTA de presupuesto repetido: el hero muestra la descarga y las funciones, y el pedido está en el header y en la banda de presupuesto.
2. **Given** una persona en la home, **When** toca el CTA de presupuesto del header, **Then** llega a `/pedido`.
3. **Given** una persona en la home, **When** toca el botón de la sección de presupuesto, **Then** llega al mismo destino y **no** se abre un formulario distinto en una ventana superpuesta.
4. **Given** una persona en cualquier página interna, **When** toca el CTA de presupuesto del header, **Then** llega al mismo destino que desde la home.
5. **Given** los puntos de entrada, **When** se comparan, **Then** usan **la misma etiqueta** (no "Pedir presupuesto" en uno y "Pedí tu presupuesto" en otro).
6. **Given** una persona que llegó a `/pedido` en escritorio, **When** carga la página, **Then** ve el formulario de pedido sin tocar nada más; **y en pantallas angostas** ve los dos caminos de la página (WhatsApp o que la contacten) sin otra sección intermedia que repita el CTA.
7. **Given** quien llegó a `/pedido`, **When** necesita entender cómo funciona el pedido, **Then** tiene a mano la explicación paso a paso y la FAQ en la misma página.

---

### User Story 2 - El hero muestra lo que más conviene vender (Priority: P2)

El hero comunica, desde la primera pantalla, las funciones de la app que más ingresos pueden generar al negocio, además de qué es AutoLibre. Producto aportó cuatro ejemplos el 2026-10-07 ("Encontrá y reducí multas", "Ahorrá en tu presupuesto", "Buscá el mantenimiento de tu auto y compará proveedores", "Encontrá financiación para la reparación de tu vehículo"); esta spec los contrasta con lo que la app hace hoy y propone una versión que se puede afirmar sin faltar a la verdad (ver *Funciones candidatas del hero*).

**Why this priority**: es lo primero que ve quien llega sin contexto. Va después de las historias 1, 3 y 4 porque el texto final necesita aprobación de producto.

**Independent Test**: mostrar el hero a alguien que no conoce AutoLibre durante 5 segundos y preguntarle qué ofrece y qué puede hacer ahora.

**Acceptance Scenarios**:

1. **Given** una persona que abre la home por primera vez, **When** ve la primera pantalla sin hacer scroll, **Then** puede nombrar al menos una de las funciones destacadas y ve una acción clara para usarla.
2. **Given** el hero actualizado, **When** se lo compara con el actual, **Then** sigue diciendo qué es AutoLibre en general (no se pierde el mensaje de "todo tu auto en un solo lugar").
3. **Given** el hero, **When** se lee el texto, **Then** no contiene cifras, ahorros, resultados ni funciones que la app no tenga hoy.
4. **Given** cada función destacada, **When** se la compara con la app, **Then** existe una pantalla o flujo real que la respalda (la tabla de funciones candidatas lo documenta).

### Funciones candidatas del hero *(insumo de producto, relevado el 2026-10-07)*

Las columnas "Hoy en la app" salen del código y de los contratos de la app y del backend; "Propuesta" es el texto sugerido para que producto lo apruebe o ajuste. Las cuatro tienen el mismo verbo de acción y evitan prometer resultados que no se pueden garantizar.

| # | Ejemplo de producto | Hoy en la app | Qué no se puede afirmar | Propuesta (voseo, ≤ 7 palabras) |
|---|---|---|---|---|
| 1 | "Ahorrá en tu presupuesto" | Un pedido llega a varios talleres cerca y se reciben respuestas para comparar (solapa Servicios, talleres aliados). Es la función que genera los pedidos a proveedores. | **"Ahorrar"**: no hay dato que pruebe un ahorro. | **"Pedí presupuestos y compará talleres"** |
| 2 | "Buscá el mantenimiento de tu auto y compará proveedores" | Historial de mantenimiento, vencimientos (VTV, seguro, patente, service) y pedido de servicio a talleres. | Nada: es verificable. El ejemplo mezcla dos funciones. | **"Mantené tu auto al día"** (historial + vencimientos); la comparación de talleres queda en la #1 |
| 3 | "Encontrá y reducí multas" | La app consulta las multas del vehículo en **nueve jurisdicciones**, con acta, monto, motivo y si el acta admite pago voluntario. Una consulta por vehículo cada 30 días. | **"Reducir"**: solo indica si el organismo admite **pago voluntario** (sin monto ni porcentaje). Tampoco cubre todo el país ni equivale a "no tenés multas" si no se consultó. | **"Enterate si tenés multas"** |
| 4 | "Encontrá financiación para la reparación" | **No es una función.** "Financiación" existe solo como una familia más del catálogo de proveedores, sin evidencia de que haya proveedores que la ofrezcan ni de que se pueda pedir. | Todo: no hay producto financiero ni comparador. | **No incluir** hasta que producto confirme proveedores activos de esa categoría |
| 5 | *(no estaba en los ejemplos)* | Diagnóstico con IA sobre síntomas y, con un adaptador OBD2 de AR$10.000, lectura del motor explicada. Es la función que vende el escáner. | Que reemplace al mecánico. | **"Entendé qué le pasa a tu auto"** |

**Decisión de producto (2026-10-07)**: se aprueban **cuatro** funciones con los textos propuestos —#1 "Pedí presupuestos y compará talleres", #2 "Mantené tu auto al día", #3 "Enterate si tenés multas" y #5 "Entendé qué le pasa a tu auto"— y **se excluye "financiación"** (#4).

Recomendación de orden por ingresos potenciales (a validar con datos de producto, que no están en el repositorio): 1) presupuestos y talleres, 5) diagnóstico y escáner, 2) mantenimiento, 3) multas. Para mantener la primera pantalla legible se sugiere destacar **tres o cuatro**, no cinco.

---

### User Story 3 - El menú no tiene links que confundan (Priority: P1)

El link "Compatibilidad" **se elimina del menú junto con su sección de la home** *(decisión de producto del 2026-10-07)*, porque quien llega sin contexto lo lee como "¿mi celular es compatible con la app?" y no como "¿mi auto funciona con el escáner?". El menú queda con links que se entienden solos.

**Why this priority**: es la forma más barata de eliminar la confusión que reportó el video y deja más lugar en el header. La información de compatibilidad del auto no se pierde: sigue en las preguntas frecuentes.

**Independent Test**: mostrar el menú a personas que no conocen AutoLibre y preguntarles qué creen que encuentran detrás de cada link; ninguno debería asociarse con algo distinto de lo que es. Después, buscar en el sitio cualquier referencia a la sección eliminada.

**Acceptance Scenarios**:

1. **Given** una persona que ve el header en cualquier página y ancho, **When** lee los links, **Then** no hay ninguno llamado "Compatibilidad" ni que lleve a la sección eliminada.
2. **Given** la home, **When** se recorre, **Then** ya no existe la sección "¿Tu auto es compatible?" y el resto de las secciones conserva su orden y su jerarquía de títulos sin saltos.
3. **Given** una persona que busca si su auto sirve para el escáner, **When** lee las preguntas frecuentes, **Then** encuentra la respuesta (hoy "¿Qué autos son compatibles con el adaptador?") y sabe cómo consultar su caso.
4. **Given** alguien que entra con un enlace antiguo a la sección eliminada (`/#compatibilidad`), **When** carga la home, **Then** ve la home normalmente, sin error ni quedar en un punto vacío.
5. **Given** los demás links del menú (Producto, Cómo funciona, FAQ, Blog, Soy proveedor), **When** se revisan, **Then** ninguno es ambiguo para alguien sin contexto, o queda anotado cuál se cambió y por qué.

---

### User Story 4 - El header es el mismo en todas las páginas (Priority: P1)

Al navegar de una página a otra, el header **conserva los mismos links y el mismo orden**. Las diferencias que queden entre páginas son pocas, están decididas a propósito y son previsibles.

**Why this priority**: un menú que cambia al navegar desorienta, y el video lo marcó como un problema explícito. Además condiciona qué links quedan (historia 3) y a dónde lleva el de presupuesto (historia 1).

**Independent Test**: recorrer todas las páginas del sitio y registrar, en cada una, los links visibles del header en escritorio y en el menú de pantallas angostas; las diferencias tienen que coincidir con la lista de excepciones aprobada.

**Acceptance Scenarios**:

1. **Given** cualquier par de páginas del sitio que tengan header, **When** se comparan sus links, **Then** son los mismos salvo las excepciones listadas en esta spec.
2. **Given** una persona en una página interna (por ejemplo, el blog), **When** busca los links que veía en la home (Producto, Cómo funciona, FAQ), **Then** los encuentra también, llevando a la sección correspondiente de la home.
3. **Given** el link secundario de la derecha, **When** se navega entre la home, el blog y proveedores, **Then** no cambia de texto según la página (hoy alterna entre "Soy proveedor" y "Soy dueño de auto").
4. **Given** la página de descarga y la de proveedores, **When** se compara su encabezado con el de la home, **Then** cualquier diferencia figura como excepción justificada.
5. **Given** el header en la página actual, **When** se lo mira, **Then** marca cuál es la página donde se está, sin ocultar ni mover links.

---

### Edge Cases

- **Pantallas angostas**: el CTA de presupuesto hoy solo está dentro del menú desplegable; la unificación tiene que mantenerlo alcanzable con un toque en cualquier ancho.
- **Persona sin JavaScript o con conexión lenta**: los CTA de presupuesto (header y banda) tienen que seguir llevando a un destino válido (son links normales, no botones que dependan de JavaScript).
- **Quien llega directo a una página interna desde un buscador**: tiene que ver el mismo menú que vería en la home.
- **Anclas de la home desde otra página**: al tocar "Cómo funciona" desde el blog, tiene que llevar a la sección de la home y no quedarse en la misma página sin efecto.
- **Páginas con CTA propio por contexto** (proveedores: "Sumar mi negocio", pedido): la regla de consistencia tiene que decir si ese botón es una excepción permitida.
- **Una sección que se elimina**: no pueden quedar textos, descripciones, `llms.txt`, datos estructurados ni anclas que la nombren o apunten a ella; la imagen y el copy exclusivos de esa sección tampoco deben quedar huérfanos en el repositorio.
- **Quien quería saber si su auto sirve para el escáner**: sin la sección ni el link, tiene que poder resolverlo desde las preguntas frecuentes (y, desde el diagnóstico, saber cómo consultar su caso).
- **Quien ya tiene la app**: el CTA "Descargar la app" no tiene que desplazar al de presupuesto como acción principal del header.

## Requirements *(mandatory)*

### Functional Requirements

**CTA de presupuesto (US1)**

- **FR-001**: Cada punto de entrada de "pedir presupuesto" (header y banda de la home; el pie como link de navegación) MUST llevar **directo** al mismo destino final, sin una parada intermedia que repita el CTA.
- **FR-002**: Todos los puntos de entrada MUST usar **la misma etiqueta**.
- **FR-003**: El destino final de **todos** los puntos de entrada MUST ser la página `/pedido` *(decisión de producto del 2026-10-07)*. Ningún punto de entrada abre un formulario de presupuesto distinto en una ventana superpuesta.
- **FR-004**: Una persona MUST poder pasar de "tocar el CTA" a ver las opciones de pedido en **un solo paso** desde cualquier punto de entrada; en `/pedido`, esas opciones están visibles al cargar (en escritorio, el formulario; en pantallas angostas, los dos caminos de la página).
- **FR-005**: La explicación del pedido (paso a paso y FAQ) MUST seguir en `/pedido`, que además es la página que se indexa y se comparte para "presupuesto para mi auto".
- **FR-006**: El CTA de presupuesto MUST seguir siendo alcanzable en pantallas angostas.
- **FR-006b**: La sección de presupuesto de la home MUST dejar de duplicar el formulario: puede quedar como resumen con un único botón a `/pedido` o eliminarse, pero sin repetir un CTA que lleve a otra parada intermedia ni dejar un link redundante a `/pedido` al lado del botón.

**Hero (US2)**

- **FR-007**: El hero MUST destacar entre tres y cuatro funciones de la app, elegidas por su potencial de ingresos, a partir de la tabla *Funciones candidatas del hero*. El texto final lo aprueba producto; hasta entonces esta historia no se implementa y el hero actual se mantiene, salvo el CTA de la historia 1.
- **FR-007b**: Cada función destacada MUST tener una pantalla o flujo real en la app que la respalde. Quedan **fuera** del hero las que no cumplan eso (hoy, "financiación") hasta que producto confirme que existen.
- **FR-008**: El hero MUST mantener el mensaje general de qué es AutoLibre.
- **FR-009**: El hero MUST tener una acción principal clara: descargar la app (botones de tienda). **No** repite el CTA de presupuesto, que vive en el header y en la banda de la home.
- **FR-010**: El hero MUST NOT afirmar cifras, resultados, ahorros ni funciones que no existan hoy en la app. En particular, no prometer que la app "ahorra" ni "reduce" dinero o multas, ni que "encuentra financiación"; sí puede decir que permite comparar presupuestos y consultar multas.
- **FR-010b**: Lo que el hero diga sobre multas MUST respetar los límites de la función: cubre las jurisdicciones que la app consulta, y "sin multas" solo se afirma si se consultó. Si no puede decirse sin matices, la frase no habla de cobertura.
- **FR-011**: El texto del hero MUST estar presente en la respuesta inicial del servidor (indexable) y conservar un único título principal por página.

**Menú sin links confusos (US3)**

- **FR-012**: El link "Compatibilidad" MUST eliminarse del header, del menú de pantallas angostas y de cualquier otro lugar del sitio que lo ofrezca *(decisión de producto del 2026-10-07)*.
- **FR-013**: La sección "¿Tu auto es compatible?" de la home MUST eliminarse junto con el link, sin dejar vacío, título huérfano ni salto de niveles de encabezado.
- **FR-014**: El sitio MUST NOT conservar referencias al **ancla** eliminada ni a la **sección** como lugar de la home (menús, pie, la descripción de la home en `public/llms.txt`, datos estructurados o textos que la nombren). La información sobre compatibilidad con el adaptador es contenido distinto y se conserva (FR-014b). Un enlace externo viejo a `/#compatibilidad` MUST seguir cargando la home sin error.
- **FR-014b**: La información de compatibilidad del auto con el adaptador MUST seguir disponible en las preguntas frecuentes y en `public/llms.txt`, con una indicación clara de cómo consultar un caso particular, porque la sección eliminada era el único lugar de la home con ese camino por WhatsApp.
- **FR-015**: Cada link restante del menú MUST revisarse y quedar anotado si se entiende sin contexto; los que no, se renombran en esta misma entrega.

**Consistencia del header (US4)**

- **FR-016**: Todas las páginas con header MUST mostrar el **mismo conjunto de links en el mismo orden**, salvo las excepciones de FR-018.
- **FR-017**: El link secundario de la derecha MUST NOT cambiar de texto entre páginas.
- **FR-018**: Las excepciones permitidas MUST estar listadas explícitamente en la spec o en el plan, con su motivo; cualquier diferencia no listada es un defecto.
- **FR-019**: Los links a secciones de la home MUST estar disponibles desde las páginas internas y llevar a la sección correcta de la home.
- **FR-020**: El perfil público de proveedor (spec 209, `/proveedor/[slug]`) MUST usar **el header global**, igual que el resto de las páginas *(decisión de producto del 2026-10-07)*. Ya se reflejó en la spec 209: se revisó D21, se eliminó el encabezado propio (T030) y la grilla de la página pasa al ancho del header. El pie propio de esa página **no** cambia.
- **FR-021**: El header MUST seguir marcando cuál es la página actual de forma que no dependa solo del color.
- **FR-022**: Los cambios del header MUST valer también para la página de descarga o dejar explícito por qué es una excepción.

**Transversales**

- **FR-023**: Todo el texto visible nuevo o modificado MUST vivir en la capa de contenido del sitio y no escrito dentro de componentes.
- **FR-024**: Los cambios MUST cumplir las reglas del sitio: SEO primero, contenido indexable en la respuesta inicial, un solo `h1`, jerarquía de headings sin saltos, foco visible, objetivos táctiles de 44 px, contraste AA y respeto de `prefers-reduced-motion`.
- **FR-025**: Si cambian títulos o anclas, MUST mantenerse consistentes los datos estructurados, `public/llms.txt` y el sitemap cuando corresponda.
- **FR-026**: Los eventos de analítica existentes de los CTA (descarga, presupuesto, WhatsApp) MUST seguir registrándose con el mismo significado; si un CTA cambia de ubicación, el cambio queda documentado para no romper los reportes.

### Key Entities *(include if feature involves data)*

- **Punto de entrada de presupuesto**: cada lugar desde donde se puede iniciar un pedido (header, banda de presupuesto de la home, menú de pantallas angostas y link del pie). Atributos: etiqueta, destino, página donde aparece.
- **Link del menú**: etiqueta, destino y páginas donde aparece; hay una única lista maestra de la que sale cada header.
- **Excepción de header**: página (o familia de páginas) que se aparta de la regla común, con su motivo y qué cambia.
- **Función destacada del hero**: función de la app que producto decide promover, con su mensaje y su acción asociada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Desde cualquier punto de entrada, la cantidad de clics hasta llegar a `/pedido` es **uno**, y es la misma en todos (antes eran dos desde el hero: bajaba a la sección y después abría otra ventana).
- **SC-002**: En el sitio publicado hay **0 referencias** al link y a la sección de compatibilidad eliminados (menús, pie, `llms.txt`, textos), y **0 anclas rotas**; la respuesta sobre compatibilidad del auto con el adaptador sigue en las preguntas frecuentes.
- **SC-003**: Recorriendo todas las páginas con header, **0 diferencias** de links u orden fuera de la lista de excepciones aprobada.
- **SC-004**: Al ver la primera pantalla de la home durante 5 segundos, al menos **4 de 5** personas ajenas al producto pueden decir qué ofrece AutoLibre y nombrar una de las funciones destacadas. *(Se mide recién cuando producto apruebe el texto final: ver Assumptions.)*
- **SC-005**: No empeoran los objetivos de rendimiento del sitio: LCP < 2,5 s, CLS < 0,1 e INP < 200 ms en la home.
- **SC-006**: Los pedidos de presupuesto iniciados desde la home no bajan respecto de la base previa durante las dos semanas posteriores al cambio, y el flujo hasta el envío no pierde pasos. *(La base se toma de los eventos de analítica actuales antes de publicar.)*

## Assumptions

- **Rama**: todo el trabajo (esta spec y la #209) se hace en la misma rama, `209-public-provider-profile`; no se crea una rama aparte. Consecuencia: los commits de esta entrega y los del perfil de proveedor conviven en un solo historial, así que conviene commitearlos por separado (prefijos distintos) para poder revisarlos o revertirlos de forma independiente. El número `210` es solo el nombre de la carpeta en `specs/` (el siguiente libre) y no corresponde a una rama ni a una tarjeta de Trello.
- **Alcance**: se cambian etiquetas, destinos, orden de links, copy del hero y se elimina la sección y el link de compatibilidad. **No** se rediseña el hero completo ni se toca el flujo interno del formulario de presupuesto.
- **Lista maestra del menú**: se asume que existe (o se crea) una sola fuente para los links del header, el menú de pantallas angostas y el pie, para que no vuelvan a divergir.
- **Compatibilidad**: producto decidió **eliminar el link y su sección** (2026-10-07), en lugar de renombrarlos. Se aceptan dos costos, que el plan debe compensar: (a) la home pierde el botón "Consultanos por WhatsApp" de esa sección, un camino de consulta ligado a la venta del adaptador; (b) quien dudaba de si su auto sirve ya no lo ve a un clic. La respuesta sigue en las preguntas frecuentes (FR-014b).
- **Excepciones de header propuestas** (a validar): la página de descarga puede conservar un encabezado mínimo por ser una página de destino con QR; el botón de la derecha puede cambiar de acción en `/proveedores` ("Sumar mi negocio") y `/pedido` (WhatsApp) mientras los **links** sigan siendo los mismos. Todo lo demás debe ser idéntico, incluido `/proveedor/[slug]` (FR-020).
- **Funciones del hero (US2) aprobadas**: producto aprobó las cuatro funciones y sus textos (2026-10-07) y excluyó "financiación". Queda por confirmar solo una cosa que no se verifica desde el código: que la consulta de multas está disponible para todos los usuarios de la versión publicada; si no lo estuviera, esa frase se retira antes de publicar. El **orden** de las cuatro dentro del hero lo propone el plan (por potencial de ingresos) y producto lo ajusta.
- **Sección de presupuesto de la home y su formulario**: con el destino único en `/pedido`, si el formulario en ventana superpuesta deja de usarse en algún lugar, el plan decide si se elimina o se conserva por fuera de los CTA. Esta spec solo exige que ningún punto de entrada lo abra.
- **Pie de `/proveedor/[slug]`**: el feedback fue solo sobre el header; el pie propio de la página de perfil se mantiene hasta que producto diga lo contrario.
- **Home vs. internas**: las anclas de secciones de la home se muestran en todas las páginas, apuntando a la home, en lugar de omitirse en las internas.
- **Qué rinde más**: no hay datos de ingresos por función en el repositorio. El orden sugerido en la tabla (presupuestos y talleres, diagnóstico y escáner, mantenimiento, multas) sale del modelo de negocio descripto en el producto (comisión por pedidos a proveedores y venta del adaptador), no de números; producto lo valida.
- **Dependencia con la spec 209**: la decisión de FR-020 ya está tomada y aplicada en la 209 (D21 revisada, T030 sin componente propio, T039 con `SiteHeader` global y grilla `wide`). La tarea T030 de la 209 depende de que esta entrega deje definitivo el header (anclas disponibles en páginas internas).
- **Fuera de alcance**: rediseño completo del hero, cambios en los pasos del formulario de presupuesto, cambios en el perfil público de proveedor más allá de la decisión del header, nuevos canales de contacto y copy de las secciones que no se mencionan acá.
