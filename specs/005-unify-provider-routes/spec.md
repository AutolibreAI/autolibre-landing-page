# Feature Specification: Unificar las rutas de proveedores

**Feature Branch**: `AUT-137-unify-provider-routes-directory-and-registration`  
**Created**: 2026-10-23  
**Status**: Draft  
**Input**: User description: "Jira AUT-137 — Que las dos páginas de proveedores vivan bajo la misma ruta y en el orden que espera quien llega: `/proveedores` el directorio de negocios, `/proveedores/registro` el formulario para sumarse. Dejar 301 de los links viejos."

## Contexto

Hoy en producción conviven dos URLs que se diferencian en una letra y le hablan a públicos opuestos: `/proveedor` es el directorio de negocios (para el dueño de auto) y `/proveedores` es el formulario de alta (para el taller que quiere sumarse). Quien busca "proveedores de autolibre" cae en el formulario de alta en lugar de en el directorio.

El trabajo local ya reorganizó las páginas, pero nombró al directorio `/aliados`, nombre que se descartó. La decisión tomada es `/proveedores` para el directorio y `/proveedores/registro` para el alta. Ese trabajo se **renombra**, no se rehace. Este ticket bloquea los otros tickets web de la tanda (búsqueda del directorio y botón del perfil), que se implementan sobre las rutas nuevas.

## Clarifications

### Session 2026-10-23

- Q: ¿Dónde vive el formulario de alta? → A: Anidado en `/proveedores/registro` (no en `/sumar-mi-negocio`).
- Q: ¿Cómo sale a producción? → A: Un solo release: directorio nuevo, alta y 301 juntos.
- Q: ¿Qué pasa con la medición del formulario? → A: Se mide desde la fecha de salida sobre la ruta nueva; la serie vieja de `/proveedores` no se une.
- Q: ¿Cómo queda el menú del header? → A: Dos entradas: "Proveedores" al directorio y "Para negocios" al alta.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - El dueño de auto llega al directorio de negocios (Priority: P1)

Una persona que busca proveedores de AutoLibre, o que entra a `/proveedores` desde el menú del sitio, ve el directorio de negocios de la red: filtra por rubro, pagina y abre el perfil de cada negocio.

**Why this priority**: es el público más grande y el motivo del cambio. Hoy esa persona cae en un formulario pensado para otro público.

**Independent Test**: entrar a `/proveedores` y verificar que muestra el directorio con filtro por rubro y paginado, y que cada tarjeta lleva al perfil bajo `/proveedores/<slug>`.

**Acceptance Scenarios**:

1. **Given** una persona en cualquier página del sitio, **When** abre `/proveedores`, **Then** ve el directorio de negocios y no el formulario de alta.
2. **Given** el directorio abierto, **When** elige un rubro o pasa de página, **Then** la URL refleja el filtro bajo `/proveedores` y se puede compartir.
3. **Given** el directorio abierto, **When** abre la tarjeta de un negocio, **Then** llega a su perfil en `/proveedores/<slug>`.

---

### User Story 2 - Los links viejos siguen funcionando (Priority: P1)

Cualquier link existente a la sección vieja (el directorio en `/proveedor`, los perfiles en `/proveedor/<slug>`, incluidos los que un negocio compartió de su propio perfil) lleva a la página equivalente nueva en vez de dar error, y el posicionamiento que ya tiene la sección se conserva.

**Why this priority**: `/proveedor` y los perfiles están indexados y figuran en el sitemap. Sin redirect se pierde el posicionamiento y se rompen los links que los negocios ya compartieron.

**Independent Test**: pedir `/proveedor` y `/proveedor/<slug>` de un negocio existente y verificar que cada una responde con una redirección permanente a `/proveedores` y `/proveedores/<slug>` respectivamente.

**Acceptance Scenarios**:

1. **Given** un link guardado a `/proveedor`, **When** una persona o un buscador lo abre, **Then** recibe una redirección permanente a `/proveedores` y termina en el directorio.
2. **Given** un link compartido a `/proveedor/<slug>`, **When** se abre, **Then** recibe una redirección permanente a `/proveedores/<slug>` y termina en el perfil de ese negocio.
3. **Given** un link a `/proveedor` con filtros en la URL, **When** se abre, **Then** los filtros se conservan en el destino.

---

### User Story 3 - El taller encuentra cómo sumar su negocio (Priority: P2)

Un taller o negocio que quiere sumarse llega al formulario de alta en `/proveedores/registro`, desde el directorio, desde el menú y desde los llamados a la acción del sitio dirigidos a negocios.

**Why this priority**: es la conversión del lado de la oferta. Debe seguir alcanzable al cambiar de lugar.

**Independent Test**: desde el directorio, seguir el acceso a "sumar mi negocio" y verificar que lleva al formulario en `/proveedores/registro`; enviar un alta de prueba y verificar que se completa igual que antes.

**Acceptance Scenarios**:

1. **Given** el directorio en `/proveedores`, **When** la persona busca cómo sumar su negocio, **Then** encuentra a la vista un acceso a "sumar mi negocio" que lleva a `/proveedores/registro`.
2. **Given** el menú del sitio y los llamados a la acción para negocios (home, "Para negocios", pie), **When** se siguen, **Then** todos llevan a `/proveedores/registro`.
3. **Given** el formulario en `/proveedores/registro`, **When** se completa y se envía, **Then** el alta funciona igual que hoy.

---

### User Story 4 - Quien tenía el formulario guardado no se pierde (Priority: P3)

Un taller que guardó `/proveedores` como acceso al formulario cae ahora en el directorio. Esa ruta sigue existiendo con otro contenido, por lo que no puede llevar redirect; en su lugar, el directorio tiene visible el acceso al alta.

**Why this priority**: es un caso acotado a quienes tienen el favorito viejo, pero evita que se pierdan justo en la conversión de oferta.

**Independent Test**: abrir `/proveedores` como lo haría quien tenía el formulario guardado y verificar que el acceso a "sumar mi negocio" se ve sin buscarlo (sin scroll en desktop y mobile).

**Acceptance Scenarios**:

1. **Given** una persona que esperaba el formulario, **When** abre `/proveedores`, **Then** ve de inmediato, sin tener que recorrer el listado, un acceso a "sumar mi negocio".

---

### User Story 5 - Los buscadores y compartidos entienden la nueva estructura (Priority: P2)

El perfil de cada negocio declara la jerarquía Inicio → Proveedores → el negocio, y su dirección canónica es la nueva. Sitemap, datos estructurados y el texto para asistentes de IA apuntan a las rutas nuevas y no a las viejas ni a `/aliados`.

**Why this priority**: breadcrumb y canonical son dos señales de SEO que tienen que cambiar juntas o no cambiar; si quedan desalineadas se diluye el posicionamiento que la redirección intenta conservar.

**Independent Test**: abrir el perfil de un negocio y verificar que breadcrumb visible, datos estructurados y canonical dicen lo mismo y usan `/proveedores/<slug>`; verificar que el sitemap lista solo rutas nuevas.

**Acceptance Scenarios**:

1. **Given** el perfil de un negocio, **When** se inspecciona, **Then** el breadcrumb es Inicio → Proveedores → nombre del negocio y el canonical es `/proveedores/<slug>`.
2. **Given** el sitemap publicado, **When** se lee, **Then** lista `/proveedores`, `/proveedores/registro` y los perfiles bajo `/proveedores/<slug>`, y no lista `/proveedor`, `/proveedor/<slug>` ni `/aliados`.
3. **Given** el archivo de descripción del sitio para asistentes de IA, **When** se lee, **Then** describe directorio, registro y perfiles con las rutas nuevas.

---

### Edge Cases

- ¿Qué pasa con `/proveedor/<slug>` de un negocio que ya no existe? Se redirige igual a `/proveedores/<slug>` y ahí se muestra el mismo "no encontrado" que cualquier perfil inexistente; no hay una cadena de redirects.
- ¿Qué pasa con un slug con caracteres especiales o codificados? El redirect lo conserva intacto.
- ¿Qué pasa con `/proveedor/` con barra final o mayúsculas? Se trata como `/proveedor`.
- ¿Qué pasa si alguien entra a `/aliados` (la ruta descartada)? Como nunca se publicó no hay links a conservar; se asume que no existe en producción.
- ¿Qué pasa si el listado de negocios no puede cargarse? El directorio y el acceso a "sumar mi negocio" siguen mostrándose con un mensaje de error razonable, igual que hoy.
- ¿Qué pasa con la analítica de la ruta del formulario? Los pageviews de `/proveedores` anteriores a la salida son del formulario y los posteriores del directorio; la lectura histórica se corta en la fecha de salida.
- ¿Qué pasa si un negocio tiene un slug igual a `registro`? Colisionaría con la ruta del formulario; debe reservarse esa palabra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Entrar a `/proveedores` MUST mostrar el directorio de negocios, con filtro por rubro y paginado.
- **FR-002**: Entrar a `/proveedores/registro` MUST mostrar el formulario de alta, con el mismo comportamiento y contenido que hoy.
- **FR-003**: Cada negocio MUST tener su perfil público en `/proveedores/<slug>`.
- **FR-004**: `/proveedor` MUST redirigir de forma permanente (301) a `/proveedores`, conservando los parámetros de la URL.
- **FR-005**: `/proveedor/<slug>` MUST redirigir de forma permanente (301) a `/proveedores/<slug>`.
- **FR-006**: Los redirects MUST resolver en un solo salto, sin cadenas.
- **FR-007**: `/proveedores` MUST NOT redirigir: sigue existiendo, ahora con el directorio.
- **FR-008**: El directorio MUST mostrar, visible sin recorrer el listado, un acceso a "sumar mi negocio" hacia `/proveedores/registro`.
- **FR-009**: Todos los llamados a la acción y links dirigidos a negocios (menú "Para negocios", pie, home, sobre nosotros) MUST apuntar a `/proveedores/registro`. El menú principal y el mobile MUST mantener además una entrada "Proveedores" hacia el directorio.
- **FR-010**: Todos los links del sitio al directorio y a los perfiles MUST usar las rutas nuevas; el sitio no debe emitir links a `/proveedor` ni a `/aliados`.
- **FR-011**: El breadcrumb del perfil MUST ser Inicio → Proveedores → nombre del negocio, y el canonical del perfil MUST ser su ruta nueva. Ambos cambian en la misma entrega.
- **FR-012**: El breadcrumb y los datos estructurados del directorio MUST reflejar Inicio → Proveedores y las rutas nuevas.
- **FR-013**: El sitemap MUST listar `/proveedores`, `/proveedores/registro` y los perfiles bajo la ruta nueva, y MUST dejar de listar `/proveedor`, sus perfiles y `/aliados`.
- **FR-014**: Los textos que el sitio publica para asistentes de IA MUST describir directorio, registro y perfiles con las rutas nuevas.
- **FR-015**: El botón de compartir perfil MUST generar y compartir la URL nueva del perfil.
- **FR-016**: La palabra `registro` MUST reservarse para que ningún perfil de negocio pueda ocupar esa ruta.
- **FR-017**: La medición de analítica del formulario de alta y del directorio MUST funcionar con las rutas nuevas. La serie del formulario arranca en la fecha de salida; no se reconstruye la historia de la ruta vieja, y la fecha de salida se deja anotada en `analytics.md`.
- **FR-018**: Todo el copy, los nombres visibles y los textos de la sección MUST hablar de "proveedores" y no de "aliados".

### Key Entities *(include if feature involves data)*

- **Directorio de proveedores**: la lista pública de negocios de la red, filtrable por rubro y paginada. Vive en `/proveedores`.
- **Perfil de proveedor**: la página pública de un negocio, identificada por su slug. Vive en `/proveedores/<slug>`.
- **Registro de proveedor**: el formulario por el que un negocio pide sumarse a la red. Vive en `/proveedores/registro`.
- **Ruta vieja**: `/proveedor` y `/proveedor/<slug>`, que solo existen para redirigir.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las URLs bajo `/proveedor` y `/proveedor/<slug>` que hoy están en el sitemap de producción responden con una redirección permanente a su equivalente nuevo, en un solo salto, y ninguna da error.
- **SC-002**: Desde cualquier página del sitio, una persona llega al formulario de alta en como máximo 2 clics, y desde el directorio en 1 clic.
- **SC-003**: Después del cambio, el 0% de los links internos del sitio y el 0% de las entradas del sitemap apuntan a `/proveedor`, `/proveedor/<slug>` o `/aliados`.
- **SC-004**: En el 100% de los perfiles, breadcrumb, datos estructurados y canonical coinciden y usan la ruta nueva.
- **SC-005**: Los altas enviados desde el formulario no bajan respecto del período previo al cambio (comparación semanal durante el mes posterior a la salida).
- **SC-006**: Las visitas orgánicas a la sección no caen más de lo esperable por la reindexación (se vigila durante las 4 semanas posteriores a la salida).

## Assumptions

- Las decisiones de ruta están tomadas: directorio en `/proveedores`, alta en `/proveedores/registro` y perfiles en `/proveedores/<slug>`. El alta anidada se confirmó en la sesión de clarificación; `/sumar-mi-negocio` queda descartada. Esto se aparta a propósito de la convención de rutas planas del repo (`AGENTS.md`): el alta es parte de la sección proveedores.
- El directorio y los perfiles se renombran a partir del trabajo local ya hecho bajo `/aliados`, que se mueve y no se rehace; el contenido y el comportamiento funcional del directorio, los filtros, el paginado y los perfiles no cambian, salvo el texto "Aliados" que pasa a "Proveedores".
- `/aliados` nunca se desplegó a producción, así que no necesita redirect. Si se llegara a desplegar antes, se agregaría un redirect equivalente.
- Directorio nuevo, alta y redirects salen en un solo release (confirmado en clarify). Alternativa descartada: publicar `/aliados` y renombrar después, porque indexaría una ruta que ya se sabe que desaparece.
- El header y el menú mobile mantienen dos entradas de la misma rama, confirmado en clarify: "Proveedores" (directorio, antes "Aliados") y "Para negocios" (alta). Cómo se presentan visualmente se resuelve en el plan.
- Los slugs de los negocios los define el backend y se mantienen; no hay ningún negocio con slug `registro` hoy.
- Fuera de alcance: la búsqueda del directorio y la decisión sobre el botón del perfil (tickets web hermanos que se apoyan en estas rutas), y cualquier cambio de diseño visual del directorio o del formulario.
