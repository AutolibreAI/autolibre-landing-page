# Implementation Plan: Buscar por nombre y por zona en el directorio de proveedores

**Branch**: `AUT-139-search-providers-by-name-and-zone` (en `autolibre-landing-page` y en `autolibre-backend-hex`) | **Date**: 2026-10-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-provider-directory-search/spec.md`

## Summary

Se agregan al directorio `/proveedores` una **búsqueda por nombre** (`?q=`) y un **recorte por zona** (`?zona=`) que se combinan con el rubro y el paginado existentes. Ambos filtros se resuelven **en el backend**, sobre todo el directorio, como parámetros nuevos y aditivos de `GET /api/v1/partner-profiles` (el endpoint que ya usa la web), más una faceta `GET /partner-profiles/facets/zones` para armar el desplegable. En la web, un `<form method="get">` server-rendered (sin JavaScript) y links para quitar cada filtro mantienen la regla "filtros = URL". El estado vacío existente se generaliza y el canonical/sitemap no cambian.

Tres puntos a validar con el equipo (detalle en `research.md`):

1. **La zona sale de `coverage_zone` (texto libre) normalizado**, con parámetro propio `zone`. No se reutiliza `locality`, que el backend dejó deliberadamente vacío (H2).
2. **Gate G1**: la historia de zona espera una auditoría de datos (`quickstart.md`); si los valores reales no son utilizables, se entrega sólo la búsqueda por nombre y la zona pasa a un ticket de normalización.
3. **Dos repos, un ticket**: backend primero (aditivo), web después; sin migraciones.

## Technical Context

**Language/Version**: TypeScript 5 (strict) en ambos repos; web: Next.js 16 / React 19 (App Router); backend: NestJS (CQRS, arquitectura hexagonal)
**Primary Dependencies**: sin dependencias nuevas. Web: `next`, `clsx`/`tailwind-merge`, componentes de `components/ui`. Backend: `drizzle-orm`, `class-validator`/`class-transformer` ya presentes.
**Storage**: PostgreSQL existente. Sin migraciones: se usan expresiones sobre `partners.name` y `partners.coverage_zone` (`translate(lower(…))`, `regexp_replace`). Sin extensión `unaccent`.
**Testing**: Backend: Jest unit (handler, `normalizeSearchText`) + e2e contra Postgres (`partner-profiles.e2e-spec.ts`). Web: `node --test` para `scripts/proveedores/*` (importa `lib/proveedores/query.ts`) (nuevo script `test:proveedores`, mismo mecanismo que `test:blog`), `npm run lint`, `npm run build` (typecheck) y recorrido manual de `quickstart.md`; no hay runner de componentes en el repo.
**Target Platform**: Web (SSR/RSC) + API pública anónima
**Project Type**: web application (frontend Next.js + backend NestJS en repos separados)
**Performance Goals**: sin regresión de LCP/INP del directorio (SC-006); el filtro es un `AND` más sobre una tabla de decenas/cientos de filas; el `ORDER BY` sigue usando `tier, name`.
**Constraints**: filtros representables en la URL y funcionales sin JS; texto de búsqueda siempre literal y acotado (80); las búsquedas con `q` no se guardan en el Data Cache de Next; el backend se despliega antes que la web.
**Scale/Scope**: hasta ~96 negocios hoy (4 páginas de 24 según el ticket), 79 rubros/396 tareas en el catálogo (fuera de alcance); una pantalla modificada, un endpoint extendido, uno nuevo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitución de la landing v1.1.0.

| Principio | Estado | Cómo se cumple |
|-----------|--------|----------------|
| I. Next.js App Router First | ✅ | Todo server-rendered: formulario GET nativo, sin isla cliente. Todo el contenido indexable en el HTML. |
| II. Content-Driven | ✅ | Textos nuevos (etiquetas, placeholders, estado vacío, "quitar filtro") van en `lib/content/providers-directory.ts`; nada hardcodeado en componentes. |
| III. Typed Component Contracts | ✅ | `ProveedoresFilters` extendido y `PartnerZone` tipados; sin `any`. |
| IV. Accessibility & Performance | ✅ | `<label>` visibles para `q` y zona, `role="search"`, foco visible, objetivos ≥ 44 px (`min-h-11`, igual que las pills). Sin imágenes ni fuentes nuevas. |
| V. Section Isolation | ✅ | Cambios dentro de `components/proveedores/` (donde ya vive el directorio); sin imports cruzados entre secciones. |
| VI. Semantic HTML | ✅ | Un único `h1` (hero) intacto; el formulario se ubica bajo el `h2` de "Toda la red"; el estado vacío usa `h3` como hoy. |
| VII. SEO & GEO | ✅ | `createMetadata` y canonical estático `/proveedores` sin tocar; variantes filtradas fuera del sitemap; `ItemList` con total filtrado. Sin rutas públicas nuevas ⇒ sin cambios en `sitemap.ts`/`llms.txt`. |
| VIII. Tailwind v4 | ✅ | Se reutilizan los tokens y las clases `pill`/`pageLink` del directorio; sin valores arbitrarios nuevos. |
| Stack: sin dependencias nuevas | ✅ | Ninguna. |
| Workflow: spec antes de implementar | ✅ | Esta spec. |

Sin violaciones ⇒ **Complexity Tracking** vacío. Re-evaluado tras el diseño de Phase 1: sin cambios.

Reglas del backend (hexagonal/DDD, `CLAUDE.md` de `autolibre-backend-hex`): lecturas por puerto (`IPartnerProfileReader`) con adapter Drizzle (el adapter en memoria de perfiles es hoy un stub que devuelve vacío: se mantiene al día con la firma nueva, sin lógica); sin lógica en el controller más allá de normalizar el boundary; texto de usuario siempre parametrizado.

## Project Structure

### Documentation (this feature)

```text
specs/006-provider-directory-search/
├── plan.md                              # Este archivo
├── research.md                          # Phase 0: hallazgos H1–H8, decisiones D1–D10, gate G1
├── data-model.md                        # Phase 1: filtros, zona derivada, criterios, estados
├── quickstart.md                        # Phase 1: auditoría de zonas + validación
├── contracts/
│   └── partner-profiles-search.md       # Phase 1: contrato HTTP y URL
├── checklists/requirements.md
└── tasks.md                             # Phase 2 (/speckit-tasks — no lo crea este comando)
```

### Source Code

```text
# autolibre-landing-page
app/proveedores/page.tsx                       # lee q/zona, pide zonas, ajusta loadPartners, 404, JSON-LD
lib/proveedores/query.ts                       # ProveedoresFilters + q/zona, parse, proveedoresHref, hasActiveFilters
lib/proveedores/query.test.ts                  # NUEVO: node --test (parseo, hrefs, límites)
lib/autolibre-api.ts                           # fetchPartners({q, zone}), PartnerZone, fetchPartnerZones, no-store con q
lib/content/providers-directory.ts             # textos de búsqueda, zona, filtros activos, estado vacío
components/proveedores/proveedores-directory.tsx      # <SearchForm>, <ActiveFilters>, Pagination con todos los filtros, EmptyState generalizado
components/proveedores/proveedores-search.tsx         # NUEVO: formulario y filtros activos (server component)
lib/analytics/events.ts                        # evento del CTA del estado vacío (confirmar contrato del listener)
package.json                                   # script test:proveedores
.specify/…, .cursor/rules/specify-rules.mdc    # contexto del agente

# autolibre-backend-hex
src/marketplace/partner/presentation/dtos/list-partner-profiles-query.dto.ts   # q, zone
src/marketplace/partner/presentation/partner-profile.controller.ts             # trim de q, ruta facets/zones
src/marketplace/partner/application/use-cases/partner-profiles/partner-profiles.handler.ts   # criterios + ListPartnerZonesQuery
src/marketplace/partner/application/port/partner-profile.reader.port.ts        # ProfileCriteria + listZones
src/marketplace/partner/domain/…/normalize-search-text.ts                      # NUEVO: normalización compartida (TS)
src/marketplace/partner/infrastructure/adapters/drizzle-partner-profile.reader.ts      # AND q/zone + listZones (SQL)
src/marketplace/partner/infrastructure/adapters/in-memory-partner-profile.reader.ts    # sólo la firma nueva (es un stub)
src/marketplace/partner/presentation/dtos/partner-profile-response.dto.ts      # PartnerZonesResponseDto
test/marketplace/partner-profiles.e2e-spec.ts + specs unitarios                # casos de q, zone, facet
```

**Structure Decision**: aplicación web en dos repos existentes (sin carpetas nuevas de primer nivel). La spec vive en `autolibre-landing-page/specs/006-…` por ser el repo con Spec Kit y donde nace el pedido; el backend se implementa en su propio branch homónimo y se referencia desde acá. El componente del formulario se separa en `proveedores-search.tsx` para no engordar `proveedores-directory.tsx` (250 líneas) y para que sea testeable/legible de forma aislada.

## Phases

| Fase | Contenido | Depende de | Entregable independiente |
|------|-----------|------------|--------------------------|
| A | Backend: `q` (nombre) + tests de normalización | — | ✅ `GET /partner-profiles?q=` |
| B | Web: formulario, `?q=`, filtros activos, estado vacío generalizado, paginado con filtros | A | ✅ US2 + US3 (parcial) + US4 + US5 → **búsqueda por nombre lista para release** |
| G1 | Auditoría de `coverage_zone` | acceso de lectura a la base | decide si siguen C/D |
| C | Backend: `zone` + `facets/zones` | A, G1 | ✅ |
| D | Web: selector de zona, `?zona=`, validación contra la faceta | B, C | ✅ US1 + US3 completo |
| E | Cierre: medición (D10), recorrido de `quickstart.md`, revisión de a11y | B–D | — |

Orden de release: A → B (se puede publicar solo) → C → D. El backend siempre antes que la web que lo consume.

## Riesgos y preguntas abiertas

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| `coverage_zone` real no es utilizable (muchas variantes / varias zonas por celda) | La zona no se puede ofrecer | Gate G1; si falla, ticket de normalización de datos y se entrega sólo nombre |
| Decisión previa de backend de no exponer texto libre como localidad (H2) | Posible objeción del equipo de backend | Parámetro/faceta con nombre propio (`zone`), `locality` intacto; confirmarlo con backend antes de la fase C |
| Dos implementaciones de la normalización (TS y SQL) | Divergencia silenciosa | Una función TS compartida + los mismos casos de prueba corridos como unit (TS) y como e2e contra Postgres (SQL) |
| `q` en la URL abre un espacio infinito de URLs | Rastreo/caché | Canonical único, fuera del sitemap, `no-store` en Next para `q`, límite de 80 |
| Fragmento `#red` en el `action` del form | Si el navegador lo descarta, el resultado queda fuera de vista | Verificado en el recorrido manual (paso 10); alternativa: `id` en el form y anchor en el hero |
| Medición de búsquedas fallidas (SC-007) con un formulario sin JS | No se mide el envío, sólo el rescate | Se mide el click en el CTA del estado vacío; el envío puede medirse en servidor si hace falta |

## Complexity Tracking

> Sin violaciones de la Constitución que justificar.
