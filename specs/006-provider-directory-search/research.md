# Phase 0 Research: Buscar por nombre y por zona en el directorio de proveedores

No quedan `NEEDS CLARIFICATION` en el Technical Context. Este documento registra lo que se verificó en el código de `autolibre-landing-page` y `autolibre-backend-hex` (ambos en `development`, 2026-10-24) y las decisiones que salen de ahí.

## Hallazgos que condicionan el diseño

| # | Hallazgo | Dónde |
|---|----------|-------|
| H1 | La web no usa `GET /partners`: el directorio pega a **`GET /api/v1/partner-profiles`** (controller `partner-profile.controller.ts`). Ese endpoint ya acepta `category`, `page`, `pageSize` (máx. 100) y un parámetro **`locality` que hoy no matchea nada** (`criteria.locality ? sql\`false\``). | `lib/autolibre-api.ts:fetchPartners`, `drizzle-partner-profile.reader.ts:list` |
| H2 | El backend decidió, y lo dejó escrito, **no inferir localidades desde `coverage_zone`**: _"Localities are not inferred from free-text coverage; when structured locality is added…"_. El resumen del perfil devuelve `locality: null`, y la web mapea `coverageZone` desde `raw.locality`, o sea siempre vacío. | `autolibre-ddl-ddd.md:4561`, `drizzle-partner-profile.reader.ts` |
| H3 | `partners.coverage_zone` es `TEXT NOT NULL`, libre, cargado a mano (o derivado en la aprobación de una postulación). No hay tabla ni enum de zonas. | `partners.schema.ts:96`, spec 004 decisión 4 |
| H4 | No hay extensión `unaccent` ni `pg_trgm` en las migraciones (sólo `vector`). Buscar sin distinguir tildes exige normalizar a mano o sumar una extensión. | `drizzle/*.sql` |
| H5 | El directorio de la web ya tiene `EmptyState` (sólo para "rubro sin negocios"), `ErrorState` separado, paginado con `rubro` y canonical estático `/proveedores` para todas las variantes. | `components/proveedores/proveedores-directory.tsx`, `app/proveedores/page.tsx` |
| H6 | `fetchPartners` cachea cada URL 1 h en el Data Cache de Next. Con texto libre en la URL, cada búsqueda distinta crearía una entrada de caché. | `lib/autolibre-api.ts` |
| H7 | El backend ya filtra por familia con `exists(...)`, orden `tier, name, slug` y total con `count()` aparte; `q` y `zone` entran como un `AND` más en el mismo `where`, sin romper paginado ni total. | `drizzle-partner-profile.reader.ts:list` |
| H8 | La landing no tiene test runner de componentes; sólo `node --test` para `scripts/blog`. El reader en memoria de perfiles (`InMemoryPartnerProfileReader`) es un stub que siempre devuelve vacío: no sirve de referencia de comportamiento. | `package.json`, `partner/infrastructure/adapters` |

## Decisiones

### D1 — El filtro vive en el backend, en el endpoint que ya usa la web

- **Decision**: agregar `q` y `zone` a `GET /partner-profiles` (mismo `where` que `category`), y un endpoint de apoyo `GET /partner-profiles/facets/zones` con las zonas disponibles.
- **Rationale**: FR-006 pide filtrar sobre todo el directorio; hacerlo en el cliente sólo filtra la página visible (el propio ticket y el código del backend lo documentan). El endpoint ya pagina, ordena y cuenta.
- **Alternatives**: filtrar en Next sobre `fetchAllPartners()` (decenas de negocios hoy) — rechazado: mentiría apenas crezca, duplica el orden/paginado y no reutiliza el índice. Endpoint nuevo `GET /partners/search` — rechazado: dos listados públicos con reglas distintas.
- **Ruta de la faceta**: `facets/zones` (con barra) y no `zones` a secas, porque `GET /partner-profiles/:slug` acepta cualquier `^[a-z0-9-]+$` y un negocio llamado "zones" quedaría inalcanzable (mismo problema que `registro` en la web).

### D2 — `q` busca sólo en el nombre, sin distinguir mayúsculas ni tildes, por subcadena

- **Decision**: se normaliza `q` en la app (minúsculas, sin tildes, espacios colapsados, recortado a 80 caracteres) y se compara contra el nombre normalizado con `LIKE '%…%' ESCAPE '\'`. Los `%`, `_` y `\` del usuario se escapan. La normalización SQL es `lower(translate(x, <tabla de tildes en minúscula y mayúscula>))` (la tabla única está en `normalize-search-text.ts`; mayúsculas incluidas para no depender del collation).
- **Rationale**: H4 — resuelve FR-001/FR-014 sin migración ni extensión. Es inmutable y sirve igual para la zona (D3). Con decenas o pocos cientos de negocios un scan es trivial; el `ORDER BY` existente se mantiene (no se introduce relevancia, ver Assumptions de la spec).
- **Alternatives**: extensión `unaccent` — rechazada por ahora: migración + permisos de la base para un caso que `translate` cubre en español. `pg_trgm`/full-text — rechazado: sobredimensionado y cambia el orden. Subcadena vs. prefijo de palabra — se elige subcadena ("Taller Pérez" se encuentra con "rez").
- **Riesgo**: dos implementaciones de la misma normalización (TS para normalizar `q` antes de enviarlo; SQL para normalizar las columnas). Mitigación: una sola función TS `normalizeSearchText` y una tabla de casos compartida que se corre como unit (TS) y como e2e contra Postgres (SQL).

### D3 — La zona es una faceta derivada de `coverage_zone`, con parámetro propio (`zone`) y **no** reutiliza `locality`

> **Revisada tras el Gate G1 (2026-10-27):** la auditoría mostró que usar la celda entera no sirve (ver _Resultado de la auditoría_). La decisión vigente, aprobada por el usuario, es **separar cada celda en zonas sueltas**: coma, barra, punto y coma o " y " (sin importar mayúsculas), cada trozo normalizado como clave. Un negocio aparece en cada zona que declara; "Nacional" y "Todo el país" lo hacen aparecer en TODAS las zonas (y suman a todos los conteos, para que el número del desplegable sea el del listado) y no son una opción por sí mismos; "A confirmar" no es zona y no matchea nunca. No se infiere jerarquía ("Tigre" y "Zona Norte" son opciones distintas). Implementación: `normalize-zone.ts` (TypeScript, oráculo de tests) y `drizzle-partner-profile.reader.ts` (SQL, `regexp_split_to_table`). La redacción original de abajo queda como historia.

- **Decision (original)**: la clave de zona es `coverage_zone` normalizado (D2) con todo lo no alfanumérico convertido en `-` (ej. `"Zona Norte "` → `zona-norte`). El endpoint de faceta devuelve `{ slug, name, count }` agrupando por esa clave; `name` es la variante cruda más frecuente (desempate alfabético). `zone=<slug>` filtra por igualdad. Quedan fuera las zonas vacías.
- **Rationale**: respeta H2 — el parámetro `locality` y el campo `locality: null` del perfil **no se tocan** (siguen significando "localidad estructurada, todavía inexistente"). La zona de cobertura es otra cosa (a dónde llega el negocio) y se expone como faceta explícita de lo que es: texto normalizado. Colapsa las variantes triviales (mayúsculas, tildes, espacios) sin inventar una taxonomía.
- **Alternatives**: (a) reusar `locality` — rechazado por H2, contradice una decisión escrita del equipo de backend. (b) tabla/enum de zonas con backfill — es la normalización "real", pero es trabajo de datos y de producto fuera de este ticket; queda como camino de escape (ver Gate G1). (c) matching por distancia con latitud/longitud — descartado por la clarificación (sin "cerca de mí").

### D4 — Gate G1: auditar `coverage_zone` antes de construir el desplegable

- **Decision**: antes de implementar la historia de zona, alguien con lectura sobre la base ejecuta la consulta de auditoría de `quickstart.md` § Auditoría y se registra el resultado en este documento (sección _Resultado de la auditoría_, hoy vacía). Criterios para seguir con D3 tal cual: ≤ 25 zonas normalizadas distintas, ninguna celda con varias zonas ("CABA y GBA", "Norte, Oeste"), y al menos una zona con 2+ negocios. Si falla, la historia de zona se corta a un ticket de normalización de datos y este ticket entrega sólo búsqueda por nombre.
- **Rationale**: el ticket lo pide explícitamente ("antes de ponerlo como filtro hay que ver cuántos valores distintos hay") y desde esta sesión no hay acceso a los datos reales. Construir el desplegable sin ver los datos arriesga entregar algo inusable.
- **Consecuencia de orden**: la búsqueda por nombre (US2) no depende del gate y se entrega primero.

### D5 — La web: formulario GET sin JavaScript, links para quitar filtros

- **Decision**: un único `<form method="get" action="/proveedores#red" role="search">` server-rendered con el input `q`, el `<select name="zona">` y un botón "Buscar"; `rubro` viaja como `<input type="hidden">` cuando hay uno. Los filtros activos se muestran como links "quitar" (`proveedoresHref` sin ese filtro). El envío nunca incluye `pagina` ⇒ cambiar un filtro vuelve a la página 1 (FR-008); el paginado arma sus links con todos los filtros.
- **Rationale**: Constitución I (no convertir la sección en cliente) y la decisión de diseño del ticket (filtros = links/URL, sin estado local). Funciona sin JS (FR-007) y da SC-002 (elegir zona + Buscar = 2 interacciones).
- **Alternatives**: auto-submit al cambiar el `<select>` con una isla cliente — pospuesto: suma JS por una conveniencia; se puede agregar después sin cambiar el contrato. Búsqueda en vivo/autocompletado — fuera de alcance (spec).

### D6 — Caché: las búsquedas con `q` no pasan por el Data Cache

- **Decision**: `fetchPartners` mantiene `revalidate: 3600` sin `q`; con `q` usa `cache: "no-store"`. La faceta de zonas se cachea 1 h como el catálogo.
- **Rationale**: H6 — texto libre crea claves de caché sin límite. El backend ya responde con `Cache-Control: public, max-age=60, stale-while-revalidate=300` y el volumen es chico. La página ya es dinámica (`await searchParams`).
- **Riesgo**: si el backend cae, una búsqueda con `q` no tiene respuesta "stale" que la tape y muestra el estado de error (correcto: FR-012 no la confunde con "sin resultados"). Con zona/rubro sin `q` sigue valiendo el stale.

### D7 — Estado vacío: se generaliza el que ya existe

- **Decision**: `EmptyState` pasa a mostrarse con cualquier combinación de filtros activos y 0 resultados (no sólo con rubro). Título con lo buscado (`q`, zona, rubro), CTA primaria "Pedir presupuesto" (`/pedido`, el flujo que ya existe) y secundaria "Quitar filtros". `result === null` sigue siendo `ErrorState` (FR-012).
- **Alternatives**: banner arriba de la grilla vacía — rechazado: el estado vacío del repo ya resolvió la UX y la accesibilidad.

### D8 — SEO sin cambios de estructura

- **Decision**: no se toca `metadata` (canonical estático `/proveedores` para todas las variantes, indexable a propósito — comentario ya documentado en `page.tsx`), ni el sitemap (se arma desde `fetchAllPartners`, sin filtros). Sí se cuida que `ItemList` del JSON-LD use el `total` filtrado y `startPosition` correcto.
- **Rationale**: FR-013 ya está cubierto por la decisión previa para `?rubro=`/`?pagina=`; sólo hay que no romperla.

### D9 — Orden de despliegue

- **Decision**: backend primero (los parámetros nuevos son aditivos, la web actual los ignora), web después. No hay migración de base en este ticket (D2/D3 usan expresiones, no columnas).
- **Rationale**: si la web saliera antes, enviaría `q`/`zone` a un backend que podría rechazarlos como no-whitelisted.

### D10 — Medición (SC-007)

- **Decision (implementada, T031)**: evento nuevo `directory_empty_quote_clicked` en el catálogo (`lib/analytics/events.ts`, `clickable`, sólo PostHog) y atributos `data-analytics-has-query` / `-has-zone` / `-has-category` en el CTA del estado vacío; el listener delegado los convierte en props booleanas `true`. El catálogo prohíbe datos personales en los props ("ni zona, ni lo que la persona escribe"), así que viaja sólo la presencia de cada filtro, nunca su valor. Documentado en `analytics.md`. PostHog no está configurado en local: se verificaron los atributos del DOM y el tipado, no el envío real.
- **Rationale**: sin texto de búsqueda en eventos (privacidad) alcanza para "cuántas búsquedas fallidas se rescatan".

## Resultado de la auditoría (Gate G1)

Ejecutada el 2026-10-27, **sólo lectura, contra la base de desarrollo** del `.env` del backend (no producción; conviene repetirla en producción antes de publicar la zona):

| Medida | Valor |
|--------|-------|
| Negocios activos | 37 |
| Valores crudos distintos | 28 |
| Zonas normalizadas distintas (celda entera) | **28** (normalizar mayúsculas/tildes no colapsó ninguna) |
| Sin zona útil | 0 |
| Celdas con varias zonas (`,` `/` ` y `) | **12 de 37** |
| Zonas con 2+ negocios | 5 (Tigre 5, "A confirmar" 2, "Boulogne / Villa Adelina" 2, "CABA, Zona Norte" 2, "GBA NORTE" 2, "Nacional" 2) |

Hallazgos: el mismo conjunto aparece con distinto orden ("Zona Oeste / Zona Norte" y "Zona Norte, Zona Oeste"); hay valores que no son una zona ("A confirmar", 2 negocios) y alcances nacionales ("Nacional" 2, "Todo el país" 1); y mezclas de localidad + provincia ("General Rodríguez, Buenos Aires").

**El gate (≤ 25 zonas, sin celdas multizona) no pasó.** Decisión del usuario (2026-10-27): separar en zonas sueltas (D3 revisada). Resultado con esa regla sobre los mismos datos: **22 zonas** (AMBA, Benavidez, Boulogne, Buenos Aires, CABA, GBA NORTE, General Pacheco, General Rodríguez, Hurlingham, Mar del Plata, Munro, Olivos, Pilar, Quilmes, San Isidro, Tigre, Troncos del Talar, Villa Adelina, Villa Ballester, Zona Norte, Zona Oeste, Zona Sur).

Consecuencias a tener presentes:
- Los 3 negocios nacionales suman a **todos** los conteos: ninguna zona muestra menos de 4 aunque tenga un solo negocio local. Es coherente con el listado, pero el número del desplegable no es "negocios de la zona" a secas.
- "Buenos Aires" (provincia) queda como una zona más, mezclada con localidades.
- "Tigre" y "Zona Norte" son opciones separadas: quien elige "Zona Norte" no ve a quien declaró sólo "Tigre". Resolverlo pide una tabla de zonas estructurada (otro ticket).
- Repetir la auditoría en producción antes de publicar: los datos de desarrollo pueden diferir.
