---

description: "Task list for AUT-139 — búsqueda por nombre y por zona en el directorio de proveedores"
---

# Tasks: Buscar por nombre y por zona en el directorio de proveedores

**Input**: Design documents from `/specs/006-provider-directory-search/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/partner-profiles-search.md, quickstart.md

**Tests**: incluidos. La spec no pide TDD, pero el plan los exige donde hay riesgo real: la normalización existe en dos lugares (TS y SQL) y el backend es una API pública anónima. En el backend se escriben primero y deben fallar; en la web son unit tests de `lib/proveedores` (no hay runner de componentes) más el recorrido manual de `quickstart.md`.

**Organization**: por historia de usuario. Las tres historias P1 (US1 zona, US2 nombre, US3 combinar) se ordenan según el orden de release del plan: **nombre primero** (no depende de datos), **zona después** del Gate G1.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencias pendientes)
- **[Story]**: historia de `spec.md` (US1…US5)

## Path Conventions

Dos repos hermanos bajo `C:\Users\User\Desktop\`, ambos en el branch `AUT-139-search-providers-by-name-and-zone`:

- Rutas sin prefijo → `autolibre-landing-page/` (este repo).
- Rutas con prefijo `backend-hex/` → `autolibre-backend-hex/` (p. ej. `backend-hex/src/marketplace/partner/…`).
- En el backend las rutas son relativas a `src/marketplace/partner/` salvo `test/`. Abreviado abajo como `partner/`.

---

## Phase 1: Setup

**Purpose**: dejar listo el entorno de prueba de ambos repos.

- [x] T001 Verificar que `autolibre-landing-page` y `autolibre-backend-hex` están en el branch `AUT-139-search-providers-by-name-and-zone` con el árbol limpio (salvo `specs/006-…`), que `npm install` está al día en ambos y que `npm run test:e2e -- partner-profiles` corre en `backend-hex/` (necesita Postgres de test según `backend-hex/test/setup-e2e-env.ts`); si el e2e no corre, anotar en `quickstart.md` cómo levantarlo antes de seguir.
- [x] T002 [P] Agregar el script `"test:proveedores": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test \"scripts/proveedores/**/*.test.ts\""` en `package.json` (mismo mecanismo que `test:blog`; `lib/proveedores/query.ts` no tiene imports, así que corre sin alias `@/`).

---

## Phase 2: Foundational (bloquea todas las historias)

**Purpose**: la normalización compartida del backend, el modelo de filtros de la web y los textos. Sin esto ninguna historia puede empezar.

**⚠️ CRITICAL**: terminar antes de las fases de historia.

- [x] T003 [P] Crear `backend-hex/src/marketplace/partner/domain/services/normalize-search-text.ts` con `normalizeSearchText(raw)` (minúsculas, sin tildes vía el mismo mapeo `áàäâéèëêíìïîóòöôúùüûñ → aaaaeeeeiiiioooouuuun` que usará SQL, espacios colapsados, recortado a `SEARCH_TEXT_MAX_LENGTH = 80`), `escapeLike(text)` (escapa `\`, `%`, `_`) y las constantes `SQL_ACCENT_FROM` / `SQL_ACCENT_TO`; más `normalize-search-text.spec.ts` y un archivo `normalize-search-text.fixtures.ts` con la tabla de casos compartida (mayúsculas, tildes, ñ, espacios dobles, `100%`, `a_b`, `\`, vacío, sólo espacios) que luego reutiliza el e2e.
- [x] T004 [P] Extender `lib/proveedores/query.ts` según `data-model.md`: `ProveedoresFilters` con `q` y `zona`; `parseProveedoresFilters(searchParams, knownRubros, knownZonas)` (`q`: primer valor, trim, espacios colapsados, máx. `PROVEEDORES_Q_MAX_LENGTH = 80`; `zona`: sólo si está en `knownZonas`, que puede ser `null` ⇒ se ignora; nunca tira); `proveedoresHref` con orden estable `rubro`, `zona`, `q`, `pagina` y sin `pagina=1`; `hasActiveFilters(filters)`; actualizar el comentario de cabecera ("filtros = links").
- [x] T005 [P] Crear `scripts/proveedores/query.test.ts` (node:test; vive en `scripts/` como los tests del blog porque el `tsconfig` raíz typechequea `lib/` y no admite imports con extensión `.ts`) con casos de `parseProveedoresFilters` (q vacío / sólo espacios / 81 caracteres / array de valores; zona desconocida / lista nula; pagina inválida) y `proveedoresHref` (orden, omisión de vacíos, `pagina=1`, hash, codificación de `q` con `&`, `#`, tildes y espacios). Correr con `npm run test:proveedores`; debe pasar junto con T004.
- [x] T006 [P] Agregar a `lib/content/providers-directory.ts` todos los textos nuevos dentro de `directory` (Constitución II): `search` (label, placeholder, botón "Buscar", label del input), `zone` (label, opción "Todas las zonas"), `activeFilters` (label del grupo, `remove(label)` = "Quitar …", "Quitar todos los filtros", etiquetas por tipo) y el estado vacío con filtros (`empty.titleFor({q, zone, category})`, cuerpo, CTA primaria `Pedir presupuesto` → `/pedido`, CTA secundaria `Quitar filtros` → `PROVEEDORES_PATH`); sin hardcodear cadenas en componentes.

**Checkpoint**: `npm run test:proveedores` en verde y `npm test -- normalize-search-text` en `backend-hex/` en verde.

---

## Phase 3: User Story 2 - Buscar un negocio por texto (Priority: P1) 🎯 MVP / Release 1

**Goal**: escribir parte del nombre y ver sólo los negocios que coinciden, en una URL compartible, sobre todo el directorio.

**Independent Test**: `quickstart.md` pasos 1, 2 y 7 (sin zona): buscar parte del nombre con otra capitalización y sin tildes ⇒ aparece el negocio; la URL pegada en otra pestaña (y sin JS) da lo mismo; búsqueda vacía ⇒ listado completo; `GET /partner-profiles?q=100%25` busca el texto literal.

### Tests for User Story 2 ⚠️ (escribir primero y ver fallar)

- [x] T007 [P] [US2] En `backend-hex/test/marketplace/partner-profiles.e2e-spec.ts` agregar casos de `q`: coincidencia por subcadena, sin distinguir mayúsculas/tildes/ñ (recorriendo la tabla de `normalize-search-text.fixtures.ts`), `%` y `_` como texto literal, `q=` y `q=%20%20` ⇒ sin filtro, `q` de 81 caracteres ⇒ 400, `total`/`totalPages` del resultado filtrado, combinación `q` + `category`, y que el orden (`tier`, `name`, `slug`) no cambia.

### Implementation for User Story 2

- [x] T008 [P] [US2] En `backend-hex/src/marketplace/partner/presentation/dtos/list-partner-profiles-query.dto.ts` agregar `q?: string` (`@IsOptional @IsString @MaxLength(SEARCH_TEXT_MAX_LENGTH)` y `@Transform` que hace `trim` y convierte vacío en `undefined`), con comentario de por qué (ausente = vacío = sin filtro, igual que `category`). Depende de T003.
- [x] T009 [US2] En `backend-hex/src/marketplace/partner/application/port/partner-profile.reader.port.ts` sumar `q?: string` a `ProfileCriteria`, y en `partner/infrastructure/adapters/drizzle-partner-profile.reader.ts` (`list`) agregar al `where` un `AND` sobre `translate(lower(partners.name), SQL_ACCENT_FROM, SQL_ACCENT_TO) LIKE '%' || :escaped || '%' ESCAPE '\'` con `q` pasado por `normalizeSearchText` + `escapeLike` y enlazado como parámetro (nunca concatenado); dejar intacto el placeholder `locality`. Depende de T003, T008; hace pasar T007.
- [x] T010 [P] [US2] Actualizar la descripción del `@ApiOperation` de `list` en `backend-hex/src/marketplace/partner/presentation/partner-profile.controller.ts` (filtro por nombre, literal, sin tildes) y confirmar si algún test del documento OpenAPI aserta la lista de parámetros (si lo hace, actualizarlo).
- [x] T011 [US2] En `lib/autolibre-api.ts` extender `fetchPartners` con `q?: string`: se agrega a la query string sólo si no está vacío, y con `q` la petición usa `cache: "no-store"` en lugar de `next: { revalidate: PARTNERS_REVALIDATE_SECONDS }` (decisión D6); documentar el porqué en el comentario de la función.
- [x] T012 [P] [US2] Crear `components/proveedores/proveedores-search.tsx` (Server Component): `<form method="get" action={`${PROVEEDORES_PATH}#${directory.id}`} role="search">` con `<label>` visible + `<input type="search" name="q" maxLength={PROVEEDORES_Q_MAX_LENGTH}>` (valor actual escapado por React), `<input type="hidden" name="rubro">` sólo si hay rubro, botón "Buscar" con `min-h-11` y las clases/tokens de `pill`/`pageLink` ya usadas; sin `pagina` en el envío. Textos de `directory.search`. Sin `"use client"`.
- [x] T013 [US2] En `components/proveedores/proveedores-directory.tsx` renderizar `<ProveedoresSearch>` entre el encabezado y los filtros de rubro, y cambiar `Pagination` para recibir `filters: ProveedoresFilters` (en vez de `rubro`) y armar cada link con `proveedoresHref({ ...filters, pagina })` ⇒ el paginado conserva `q`. Depende de T012, T004.
- [x] T014 [US2] En `app/proveedores/page.tsx` pasar `filters.q` a `loadPartners` → `fetchPartners({ category, q, page, pageSize })`, sin tocar el `notFound()` por página fuera de rango ni el `catch` que devuelve `null` (error ≠ vacío). Depende de T011, T004.

**Checkpoint**: `npm run test:e2e -- partner-profiles` (backend) y `npm run lint && npm run build` (web) en verde; el recorrido de la nota de arriba pasa. **Se puede publicar** (backend primero, web después).

---

## Phase 4: Gate G1 — auditoría de zonas (bloquea US1 y la parte de zona de US3)

**Purpose**: decidir con datos reales si `coverage_zone` sirve como filtro (`research.md` D4). No es código.

- [ ] T015 Ejecutar la consulta de `quickstart.md` § Auditoría (solo lectura, producción o copia) — requiere a alguien con acceso a la base — y pegar el resultado en `research.md` § _Resultado de la auditoría_: valores crudos, zonas normalizadas, sin zona útil, posibles multizona y las 10 zonas más grandes.
- [ ] T016 Decidir con el equipo según el criterio de D4 (≤ 25 zonas normalizadas, sin celdas multizona, alguna zona con 2+ negocios) y dejarlo escrito en `research.md`. Además, confirmar con backend que exponer `coverage_zone` normalizado como `zone` (sin tocar `locality`) no contradice su decisión (H2). **Si no pasa**: tachar T017–T025 y T029 (y la parte de zona de T026–T028 y T030), abrir un ticket de normalización de datos y cerrar este ticket con US2, US4 (sólo texto/rubro) y US5.

**Checkpoint**: decisión registrada ⇒ seguir con US1.

---

## Phase 5: User Story 1 - Acotar el directorio por zona (Priority: P1) — Release 2

**Goal**: elegir una zona del desplegable y ver sólo los negocios que la cubren, con total y paginado del resultado filtrado.

**Independent Test**: `quickstart.md` paso 3 y 7: elegir una zona + Buscar ⇒ sólo esa zona, contador y paginado filtrados, URL `?zona=…` reproducible sin JS; `?zona=inexistente` ⇒ "Todas las zonas" sin error; si la faceta falla, el selector no se muestra y el resto del directorio funciona.

### Tests for User Story 1 ⚠️ (escribir primero y ver fallar)

- [ ] T017 [P] [US1] En `backend-hex/test/marketplace/partner-profiles.e2e-spec.ts` agregar casos de `zone`: igualdad por slug, variantes que colapsan (`"Zona Norte"`, `" zona  norte "`, `"ZONA NORTE"`, con tildes), zona desconocida ⇒ lista vacía (200), zona con formato inválido ⇒ 400, `zone` + `category` + `q` combinados, `total` correcto; y de `GET /partner-profiles/facets/zones`: agrupa variantes, etiqueta = variante más frecuente (desempate alfabético), cuentas sólo de negocios `active` con slug vigente, excluye zonas vacías o sólo símbolos, orden por nombre sin tildes, y que un perfil con slug `zones` sigue resolviendo por `GET /partner-profiles/zones`.

### Implementation for User Story 1

- [ ] T018 [P] [US1] En `backend-hex/src/marketplace/partner/presentation/dtos/list-partner-profiles-query.dto.ts` agregar `zone?: string` con la misma validación que `category` (`^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 120, opcional).
- [ ] T019 [US1] En `partner/application/port/partner-profile.reader.port.ts` sumar `zone?: string` a `ProfileCriteria`, el tipo `PartnerZoneFacet { slug; name; count }` y `listZones(): Promise<PartnerZoneFacet[]>` a `IPartnerProfileReader`; en `partner/infrastructure/adapters/drizzle-partner-profile.reader.ts` implementar la expresión `zoneKey` (data-model.md) como constante SQL reutilizada por el `where` (`AND zoneKey = :zone`, `''` nunca matchea) y por `listZones` (`GROUP BY zoneKey`, etiqueta = variante cruda más frecuente, `count` de activos con slug vigente, `ORDER BY` nombre normalizado). Depende de T018; hace pasar T017.
- [ ] T020 [P] [US1] En `partner/infrastructure/adapters/in-memory-partner-profile.reader.ts` agregar `listZones()` devolviendo `[]` (el adapter es un stub; sólo se mantiene la firma).
- [ ] T021 [US1] En `partner/application/use-cases/partner-profiles/partner-profiles.handler.ts` agregar `ListPartnerZonesQuery` + `ListPartnerZonesHandler`, registrarlo en `partner/partner.module.ts`, y en `partner/presentation/dtos/partner-profile-response.dto.ts` el `PartnerZonesResponseDto` (`{ data: { slug, name, count }[] }`) con `@ApiProperty`.
- [ ] T022 [US1] En `partner/presentation/partner-profile.controller.ts` agregar `@Get('facets/zones')` con el mismo `@Header('Cache-Control', …)` y `@ApiOkResponse`, **declarado antes de `@Get(':slug')`**. Depende de T021.
- [ ] T023 [P] [US1] En `lib/autolibre-api.ts` agregar `export interface PartnerZone { slug; name; count }`, `fetchPartnerZones()` contra `/api/v1/partner-profiles/facets/zones` (parseo defensivo como `parsePartnersPage`: descarta entradas sin `slug`/`name`, `count` numérico; `revalidate` 1 h; tira si falla) y `zone?: string` en `fetchPartners` (se agrega a la query string si no está vacío).
- [ ] T024 [US1] En `app/proveedores/page.tsx` pedir las zonas en el `Promise.all` inicial envueltas en `try/catch` (fallo ⇒ `null`, con `console.error` como el resto), pasar `new Set(slugs)` o `null` a `parseProveedoresFilters`, pasar `filters.zona` a `loadPartners` y pasar `zones` a `ProveedoresDirectory`. Depende de T023, T004.
- [ ] T025 [US1] En `components/proveedores/proveedores-search.tsx` y `components/proveedores/proveedores-directory.tsx` sumar el `<select name="zona">` con `<label>` visible, opción "Todas las zonas" (valor vacío), una `<option>` por zona con su cuenta, preseleccionada la activa; se oculta cuando `zones` es `null` o vacío (FR: la faceta caída no rompe el resto). Depende de T024.

**Checkpoint**: `npm run test:e2e -- partner-profiles`, `npm run lint && npm run build`; `quickstart.md` pasos 3 y 7.

---

## Phase 6: User Story 3 - Combinar búsqueda, zona y rubro (Priority: P1)

**Goal**: texto, zona y rubro conviven; quitar o cambiar uno conserva los otros; cambiar cualquier filtro vuelve a la página 1.

**Independent Test**: `quickstart.md` paso 4: rubro + zona + texto cumplen los tres; quitar uno con su link conserva los otros dos; estando en `?pagina=3` un filtro nuevo lleva a la página 1.

- [ ] T026 [P] [US3] Ampliar `scripts/proveedores/query.test.ts` con combinaciones de los tres filtros: `proveedoresHref` quitando uno cada vez conserva los otros dos, cambiar un filtro desde `pagina=3` produce un href sin `pagina`, y `parse` ∘ `href` es idempotente (round-trip).
- [ ] T027 [US3] Crear el bloque de filtros activos: función `ActiveFilters` en `components/proveedores/proveedores-search.tsx` que, si `hasActiveFilters(filters)`, lista un link "Quitar …" por cada filtro activo (rubro con su nombre, zona con su nombre, texto entre comillas) usando `proveedoresHref` sin ese filtro y con el hash de la sección, más "Quitar todos los filtros"; `<ul>` dentro de un `<nav aria-label>`; reemplaza el link provisional de quitar `q` de T012. Depende de T006, T025.
- [x] T028 [US3] Verificar en `components/proveedores/proveedores-directory.tsx` que `CategoryFilter` conserve `zona` y `q` en cada pill (hoy arma `proveedoresHref({ rubro })` y los descarta): pasar `filters` y construir `proveedoresHref({ ...filters, rubro, pagina: 1 })`; "Todos" quita sólo el rubro.
- [ ] T029 [US3] En `backend-hex/test/marketplace/partner-profiles.e2e-spec.ts` agregar un caso con los tres filtros a la vez y paginado (`total` y `totalPages` del resultado combinado; página 2 sin solaparse con la 1).

**Checkpoint**: `quickstart.md` paso 4 y 5 (sin vacío) pasan.

---

## Phase 7: User Story 4 - Sin resultados no es un callejón sin salida (Priority: P2)

**Goal**: cualquier combinación sin negocios muestra un estado vacío útil; una falla del servicio sigue mostrando el estado de error.

**Independent Test**: `quickstart.md` pasos 5 y 6: `?q=zzzz` ⇒ estado vacío con "Pedir presupuesto" (`/pedido`) y "Quitar filtros"; con el backend apagado ⇒ estado de error, nunca vacío.

- [x] T030 [US4] Generalizar `EmptyState` en `components/proveedores/proveedores-directory.tsx`: recibe `filters` y los nombres resueltos (rubro, zona) y usa `directory.empty.titleFor(...)` que nombra lo buscado; se muestra cuando `partners.length === 0 && hasActiveFilters(filters)` (hoy sólo con rubro); `result === null` sigue yendo a `ErrorState` antes que cualquier vacío. Mantener el comentario sobre `/pedido` pelado.
- [ ] T031 [P] [US4] Agregar a `lib/analytics/events.ts` un evento de catálogo para el CTA "Pedir presupuesto" del estado vacío (por ejemplo `directory_empty_quote`, props booleanas `hasQuery`, `hasZone`, `hasCategory`; **sin** el texto buscado) siguiendo el contrato que ya usa el listener delegado de `lib/analytics/track.ts` (confirmar primero cómo se declaran los eventos y los atributos `data-*`), y marcar el `ButtonLink` primario del `EmptyState` con esos atributos. Si el listener no soporta enlaces de servidor, anotar la limitación en `research.md` D10 y cerrar la tarea con el hallazgo.
- [ ] T032 [US4] Revisar `app/proveedores/page.tsx`: una `pagina=2` sobre un resultado vacío o fuera de rango ⇒ `notFound()` (el cálculo `filters.pagina > Math.max(1, totalPages)` ya lo cubre), pero la página 1 vacía renderiza el estado vacío; añadir el caso a `quickstart.md` si no estaba. Sin cambios de código si el comportamiento ya es el correcto (dejar constancia).

**Checkpoint**: `quickstart.md` pasos 5, 6 y 7.

---

## Phase 8: User Story 5 - Los resultados filtrados no ensucian el posicionamiento (Priority: P3)

**Goal**: todas las variantes con `q`/`zona` declaran canonical `/proveedores` y quedan fuera del sitemap.

**Independent Test**: `quickstart.md` paso 8.

- [ ] T033 [US5] Verificar (y sólo corregir si falla) que `app/proveedores/page.tsx` mantiene `metadata` estática con `path: PROVEEDORES_PATH` y que el comentario de la constante explica que `q` y `zona` tampoco llevan `noindex`; actualizar ese comentario para mencionar los parámetros nuevos.
- [ ] T034 [P] [US5] Verificar que `app/sitemap.ts` y `public/llms.txt` no necesitan cambios (se arman sin filtros; sin rutas públicas nuevas) y que el `ItemList` del JSON-LD en `app/proveedores/page.tsx` usa `numberOfItems: result.total` (total filtrado) y `startPosition` correcto para resultados filtrados y paginados; dejar constancia en el PR.

**Checkpoint**: `quickstart.md` paso 8.

---

## Phase 9: Polish & cross-cutting

- [ ] T035 [P] Backend: `npm run lint`, `npm run build`, `npm test` y `npm run test:e2e` en `backend-hex/` completos; corregir cualquier test del documento OpenAPI o de `schema-matches-ddl` que cambie por los parámetros/endpoint nuevos.
- [ ] T036 [P] Web: `npm run lint`, `npm run build` (typecheck + ESLint sin errores, Constitución) y `npm run test:proveedores` en el repo de la landing.
- [ ] T037 Recorrer a mano todo `quickstart.md` (también con JavaScript deshabilitado) y confirmar el paso 10: que el `#red` del `action` sobrevive al envío del formulario GET; si no, usar el `id` del formulario como ancla.
- [ ] T038 Revisión de accesibilidad y semántica (Constitución IV y VI): orden de tabulación, foco visible, etiquetas del input y del select, `aria-current`/`aria-label` en los links de filtros, un solo `h1`, el estado vacío con `h3`; verificar contraste y objetivos táctiles ≥ 44 px.
- [ ] T039 Dejar documentado en `research.md` (y en la descripción de cada PR cuando el usuario los pida) el orden de salida: backend primero, web después; sin migraciones; qué cubre cada release (Release 1 = nombre; Release 2 = zona).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (1)** → **Foundational (2)** → **US2 (3)** = Release 1.
- **Gate G1 (4)** puede correr en paralelo con la Fase 3 (no depende de código); bloquea la Fase 5.
- **US1 (5)** depende de Foundational y del Gate; reutiliza los componentes de US2 (T012–T013).
- **US3 (6)** depende de US2 y US1 (necesita los tres filtros).
- **US4 (7)** depende de Foundational; puede hacerse tras US2 (con `q`/rubro) y completarse con zona después de US1.
- **US5 (8)** son verificaciones: tras US2.
- **Polish (9)** al final.

### Dentro de cada historia

- Tests (backend) primero y fallando → DTO → reader/port → handler/controller → web (`autolibre-api.ts` → `page.tsx` → componentes).
- El backend va **siempre** antes que la web que lo consume (D9).

### Dependencias clave entre tareas

T003 → T008 → T009 · T004 → T013, T014, T024 · T011 → T014 · T012 → T013 → T025 → T027 · T018 → T019 → T021 → T022 · T023 → T024 → T025.

### Oportunidades de paralelismo

- Fase 2: T003, T004, T005, T006 son archivos distintos (T005 se escribe junto con T004).
- US2: T007 y T008 y T010 en paralelo; T012 en paralelo con las del backend; T011 y T012 son archivos distintos.
- US1: T017, T018, T020, T023 en paralelo.
- La Fase 4 (auditoría) y la Fase 3 en paralelo.
- Backend y web de una misma historia pueden avanzar en paralelo hasta T014/T024, que unen ambos.

## Parallel Example: User Story 2

```text
# En paralelo, archivos distintos:
Task: "T007 e2e de q en backend-hex/test/marketplace/partner-profiles.e2e-spec.ts"
Task: "T008 DTO de q en backend-hex/…/list-partner-profiles-query.dto.ts"
Task: "T010 doc del controller en backend-hex/…/partner-profile.controller.ts"
Task: "T012 formulario en components/proveedores/proveedores-search.tsx"
```

## Implementation Strategy

### MVP primero (US2, Release 1)

1. Fases 1 y 2.
2. Fase 3 (nombre) → validar → publicar backend y luego web.
3. En paralelo, correr la auditoría (Fase 4) y decidir.

### Entrega incremental

1. Release 1: búsqueda por nombre, estado vacío por texto/rubro (parte de US4), SEO sin cambios.
2. Si pasa el Gate: Release 2: faceta + selector de zona + US3 completo + estado vacío con zona.
3. Si no pasa: ticket de normalización de datos y se retoma US1 allí.

## Notes

- Total: 39 tareas — Setup 2 · Foundational 4 · US2 8 · Gate 2 · US1 9 · US3 4 · US4 3 · US5 2 · Polish 5.
- `InMemoryPartnerProfileReader` es un stub (devuelve vacío): no hay "paridad" que mantener, sólo la firma.
- No se hace push ni PR sin pedido explícito; los commits los decide el usuario.
- El Gate G1 necesita acceso a datos que esta sesión no tiene.
- **Implementación Release 1 (T001–T014, 2026-10-24)**: hecha y sin commitear en ambos repos.
  - Verificado: `npm test -- src/marketplace` (346 tests), `tsc` y `eslint` del backend; `npm run test:proveedores` (20 tests), `tsc` y `eslint` de la web; la web contra un backend simulado en memoria (form GET conserva `rubro`, `q` llega al backend, pills y paginado conservan `q`, canonical `/proveedores`, error ≠ vacío).
  - **e2e (T007) ejecutado el 2026-10-24** contra la base del `.env` (confirmada de desarrollo por el usuario): `partner-profiles.e2e-spec.ts` 32/32 en verde, incluida la query SQL real (`translate`, `LIKE … ESCAPE`, comodines literales, tope de 80).
  - **T030 hecho**: `EmptyState` generalizado (`hasActiveFilters`); un rubro solo conserva su mensaje de siempre y con búsqueda se nombra lo buscado; verificado con el backend simulado. T028 se adelantó (los pills conservan `q`/`zona`). Quedan T031 (analítica del CTA), T032 y las verificaciones manuales (scroll a `#red` en un navegador real).
  - Desvío de lo planeado: el test web vive en `scripts/proveedores/` (ver T005).
