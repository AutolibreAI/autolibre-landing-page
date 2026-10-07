---

description: "Lista de tareas de la feature 209 — Perfil público de proveedor (web + app)"
---

# Tasks: Perfil público de proveedor (web + app)

**Input**: documentos de diseño en `/specs/209-public-provider-profile/`
**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)

**Tests**: la spec no los pide. Se incluyen **solo para los módulos puros** (lógica determinística: horario, FAQ, métricas, indexabilidad, tipo de negocio, slug, atributos de analítica), porque el plan (D20) los define con el patrón `node --test` que ya usa el repo y son la única verificación fiable de esas reglas. Los componentes y el SEO se verifican con la [lista del quickstart](./quickstart.md#4-lista-de-verificación), no con tests de render.

**Organization**: agrupadas por historia de usuario para poder implementar y probar cada una de forma independiente. Todo el código de la **landing** se construye y verifica contra el servidor de prueba del contrato (`scripts/provider-profile/mock-api.mjs`): **no espera** al backend.

## Formato: `[ID] [P?] [Story] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencia de una tarea incompleta).
- **[Story]**: historia de la spec a la que pertenece (US1…US7).
- **🔗** = **repositorio externo** (`autolibre-backend-hex`, `autolibre-admin`, `autolibre-mobile`). Se listan acá para que se vea qué historia desbloquean, pero **`/speckit-implement` en este repo debe saltearlas**: las ejecuta el equipo de cada repo contra los [contratos](./contracts/). Su ruta lleva el prefijo del repo.

## Convenciones del repo que aplican a todas las tareas

- **Módulos puros** (`lib/provider-profile/{slug,indexability,open-status,business-type,faq,metrics}.ts` y `lib/analytics/provider-attrs.ts`): **autocontenidos**, sin imports con alias ni imports relativos con extensión `.ts`; declaran localmente los tipos mínimos que usan y **reciben las plantillas por parámetro**. Así los puede importar `node --test` (patrón de `lib/blog/faq.ts`).
- **Copy**: nada de strings visibles en componentes; todo en `lib/content/provider-profile.ts` (Constitución II).
- **Imágenes**: `next/image` con `width`/`height`/`sizes`; `preload` **solo** en la portada, **nunca** `priority`.
- **Clases**: canónicas de Tailwind y tokens de `@theme`; sin hex sueltos (la imagen OG es la única excepción).
- **Layout**: la página usa **un** `Container size="wide"` (el ancho del `SiteHeader` global; antes `content`, ver D21 revisada) con la grilla de dos columnas; las secciones son tarjetas `<section>` dentro de esa grilla, sin `Container` propio.
- **Secciones**: ninguna importa a otra; las islas compartidas viven en `components/ui/`.
- **Archivos compartidos entre historias**: `app/p/[slug]/page.tsx`, `profile-header.tsx`, `location.tsx` y `lib/content/provider-profile.ts` los tocan varias historias; esas tareas **no son `[P]`** y van en el orden en que aparecen.

---

## Phase 1: Setup (infraestructura compartida)

**Propósito**: andamiaje, interruptor de publicación y los dos spikes que pueden cambiar el diseño.

- [X] T001 Agregar a `package.json` los scripts `test:provider-profile` (`node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test "scripts/provider-profile/**/*.test.ts"`) y `typecheck:provider-profile` (`tsc -p scripts/provider-profile/tsconfig.json`), copiando el patrón de `test:blog` / `typecheck:blog`
- [X] T002 [P] Crear `scripts/provider-profile/tsconfig.json` con las mismas opciones que `scripts/blog/tsconfig.json` (`allowImportingTsExtensions`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `resolveJsonModule`) e `include` de `./**/*.ts` más `../../lib/provider-profile/{slug,indexability,open-status,business-type,faq,metrics}.ts` y `../../lib/analytics/provider-attrs.ts`
- [X] T003 [P] Documentar en `.env.example` un bloque "Perfiles de proveedores" con `PROVIDER_PROFILE_REVALIDATE_SECRET` (generar con `openssl rand -hex 32`; **distinto** de `HYGRAPH_REVALIDATE_SECRET`) y `PROVIDER_IMAGE_HOST` (hostname del bucket/CDN de imágenes; a confirmar con backend)
- [X] T004 [P] Crear `lib/provider-profile/visibility.ts` exportando `PROVIDER_PROFILES_PUBLIC: boolean = false`, con el mismo comentario de motivo que `lib/blog/visibility.ts` (apaga a la vez `noindex`, sitemap y links; **no** bloquear en `robots.ts`; `public/llms.txt` es manual)
- [X] T005 [P] Obtener los slugs reales de las 16 familias del catálogo con el endpoint público `GET /api/v1/service-catalog` (contra el backend de producción o QA) y guardarlos en `scripts/provider-profile/fixtures/service-categories.json` (`slug` + `name`); es el insumo de `business-type.ts` (research D9)
- [ ] T006 Coordinación sin código: entregar `specs/209-public-provider-profile/contracts/` a backend, app y panel de operadores y registrar en `specs/209-public-provider-profile/research.md` (sección nueva "Respuestas de producto") las respuestas a las 9 decisiones pendientes. **Sin la respuesta de D8 no se construyen T063–T064 (`/p`)**
- [ ] T007 Spike de la imagen OG (plan R4): descargar `Outfit-Bold.ttf` y `DMSans-Medium.ttf` (licencia OFL, Google Fonts) a `lib/provider-profile/fonts/` — **pedir confirmación antes de descargar** — y armar una versión mínima de `app/p/[slug]/og/route.tsx` (fondo, nombre y dos fuentes) para medir **(a)** el tamaño del bundle del handler tras `npm run build` contra el límite de 500 KB de `ImageResponse` y **(b)** el tiempo de generación. Registrar resultados y, si no entra, el plan B (una sola familia o fuentes por `fetch`) en `specs/209-public-provider-profile/research.md` D11. Esta ruta se completa en T048

---

## Phase 2: Foundational (prerrequisitos bloqueantes)

**Propósito**: tokens, tipos, cliente del backend, copy base, servidor de prueba y los módulos puros que usan todas las historias.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T008 [P] Agregar a `@theme` en `app/globals.css` los tokens del sistema "AutoLibre AI" **sin pisar los existentes**: `--color-canvas: #f1f2f0`, `--color-card: #fefefd`, `--color-card-line: #e4eae4`, `--color-card-muted: #f3f4f6`, `--color-brand-50: #e8f5e8`, `--color-status-ok: #1a7a4a`, `--color-status-ok-bg: #e0f5ec`. Radios: usar las clases canónicas (`rounded-lg` 8 px, `rounded-xl` 12 px, `rounded-2xl` 16 px, `rounded-full` para pills), sin tokens nuevos. Si se agrega algún `--text-*`, registrarlo también en `lib/utils.ts` (ver el comentario de `globals.css`)
- [X] T009 [P] Agregar a `components/ui/icon.tsx` y al union `IconName` de `lib/content/types.ts` los íconos de línea 24×24 que faltan: `phone`, `navigation`, `share`, `star`, `instagram`, `globe`, `shield-check`, `calendar`, `chevron-down`, `bolt`, `camera`. Los trazados salen de los SVG del artboard de diseño (mismo estilo de trazo que `Icon`; research D23). La estrella rellena se logra con `className="fill-current"`
- [X] T010 Exportar `apiBaseUrl` en `lib/autolibre-api.ts` (hoy es una función privada) para reutilizarla en `lib/provider-profile/api.ts`
- [X] T011 [P] Crear `lib/provider-profile/types.ts` con los tipos del contrato `contracts/partner-profile-api.md`: `PartnerProfile`, `ProfileImage`, `BusinessHoursDay`, `BrandsFacet`/`FuelFacet` (`mode: "all" | "specific"`), `ProfileWorks`, `ProfileReviews`, `ProfileMetrics`, `PartnerProfileSummary`, `ProfileResult` (`ok` / `moved` / `not_found`) y la página del listado. Todo `readonly`, sin `any`
- [X] T012 [P] Test `scripts/provider-profile/__tests__/slug.test.ts` de `isValidSlug`: acepta `mecanica-barrancas-san-isidro`; rechaza mayúsculas, tildes, `_`, espacios, guiones al borde o dobles, vacío y más de 120 caracteres
- [X] T013 [P] Crear `lib/provider-profile/slug.ts` (PURO) con `isValidSlug(value: string): boolean` (`^[a-z0-9]+(-[a-z0-9]+)*$`, largo ≤ 120)
- [X] T014 [P] Test `scripts/provider-profile/__tests__/indexability.test.ts` de `isIndexable`: verdadero con descripción + ≥1 servicio + horarios + (dirección **o** zona); falso si falta cualquiera de los cuatro; falso con descripción en blanco
- [X] T015 [P] Crear `lib/provider-profile/indexability.ts` (PURO) con `isIndexable(profile)` según `data-model.md §3.9`, con tipo estructural local mínimo
- [X] T016 [P] Crear `lib/content/provider-profile.ts` con el copy base: etiquetas de sección (`Sobre {nombre}`, `Servicios`, `Marcas que atiende`, `Horarios`, `Ubicación`, `Zona de cobertura`, `Contacto y redes`, `¿Necesitás una propuesta?`), textos de botones (WhatsApp, Llamar, Cómo llegar, Compartir, Pedir propuesta), sello "Aliado de AutoLibre", patrones de `title` y `description` con sus degradaciones (`contracts/seo-and-share.md §1`), plantilla de `alt` de imágenes y textos de bloque vacío. Tipado, sin lógica
- [X] T017 [P] Crear el servidor de prueba `scripts/provider-profile/mock-api.mjs` (escucha en `:4020`, carga todos los `*.json` de `scripts/provider-profile/fixtures/`) y los fixtures `mecanica-barrancas-san-isidro.json` (completo, con local, con coordenadas, horario cortado, marcas específicas, equipamiento), `gestoria-norte-san-isidro.json` (`locationMode: "mobile"`, zona de cobertura), `taller-incompleto.json` (sin descripción ni horarios) y el alias histórico `mecanica-barrancas` → `{status:"moved"}`. Sirve `GET /api/v1/partner-profiles/:slug` y `GET /api/v1/partner-profiles` con el shape de `contracts/partner-profile-api.md`. Las imágenes de los fixtures usan **rutas relativas** de `public/` (`/brand/og-image.png` para la portada y `/brand/logo-square.png` para el logo): Next 16 bloquea por defecto la optimización de imágenes remotas en IPs locales (`images.dangerouslyAllowLocalIP: false`), así que una URL `http://localhost:3000/...` no se vería
- [X] T018 [P] Modificar `next.config.ts`: sumar a `images.remotePatterns` el hostname de `process.env.PROVIDER_IMAGE_HOST` (solo si está definida) ; **no** agregar `localhost` (los fixtures usan rutas relativas, ver T017); conservar los patrones existentes
- [X] T019 Crear `lib/provider-profile/api.ts` (server-only): `getProviderProfile(slug)` → `ProfileResult` y `listProviderProfiles({ page, pageSize, category, locality })`. Usa `apiBaseUrl()` (T010) y `fetch` con `next: { revalidate: 600, tags: ["provider-profiles", \`provider:${slug}\`] }`. **Valida el slug con `isValidSlug` antes de llamar** y devuelve `not_found` sin consultar si no cumple. Semántica de error: backend caído → **tira** (Next conserva la última página buena); `404` → `not_found`. Parseo defensivo como `parseCategories` de `lib/autolibre-api.ts`; el único `as` va en ese borde, con comentario (depende de T010, T011, T013)

**Checkpoint**: cimientos listos; las historias pueden empezar en paralelo.

---

## Phase 3: User Story 1 — Ver el perfil de un proveedor y contactarlo (Priority: P1) 🎯 MVP

**Goal**: una persona abre el perfil, ve quién es el proveedor, si está abierto, qué hace, dónde y cómo escribirle, y lo contacta con un toque.

**Independent Test**: con el mock, abrir `/p/mecanica-barrancas-san-isidro` y verificar que se ven los bloques base, que el estado en vivo es correcto para la hora actual y que cada botón dispara su acción (spec US1, escenarios 1–6).

### Tests de User Story 1 (módulos puros)

- [X] T020 [P] [US1] Crear la fixture dorada `specs/209-public-provider-profile/contracts/fixtures/open-status-cases.json`: lista de `{ hours, now (ISO con offset -03:00), expected }` cubriendo abierto, cerrado antes y después de hora, **horario cortado** (descanso al mediodía → "abre 14:00"), sábado cerrado, **domingo → "abre el lunes"**, sin horarios → `unknown`, `closes_minute = 1440`. Es la misma que debe pasar la app (riesgo R3)
- [X] T021 [P] [US1] Test `scripts/provider-profile/__tests__/open-status.test.ts` que recorre la fixture de T020 (import JSON con `with { type: "json" }`)
- [X] T022 [P] [US1] Test `scripts/provider-profile/__tests__/provider-attrs.test.ts` de `parseProviderAttr` y `parseProviderAction`: un `provider` con formato inválido devuelve `undefined`; una `action` fuera de la lista cerrada devuelve `undefined`; el valor válido pasa

### Implementación de User Story 1

- [X] T023 [P] [US1] Crear `lib/provider-profile/open-status.ts` (PURO): `getOpenStatus(businessHours, now, timeZone = "America/Argentina/Buenos_Aires")` → `{ kind: "open", closesAt }` · `{ kind: "closed", nextOpening: { dayOffset, weekday, opensAt } }` · `{ kind: "unknown" }`. Obtiene día ISO y minutos con `Intl.DateTimeFormat` (sin librerías), soporta tramos múltiples por día, busca la próxima apertura hasta 7 días y trata `closes_minute = 1440` como `00:00` (`data-model.md §3.2`)
- [X] T024 [P] [US1] Crear `lib/analytics/provider-attrs.ts` (PURO): `parseProviderAttr(raw)` (regex de slug, máx. 120) y `parseProviderAction(raw, allowed: ReadonlySet<string>)`; ambos devuelven `undefined` ante un valor inválido
- [X] T025 [US1] Ampliar `lib/content/provider-profile.ts` con los textos del estado en vivo ("Abierto · cierra {hora}", "Cerrado · abre {cuándo}", "mañana", nombres de los días, "hoy") y la etiqueta "Feriados: consultar por WhatsApp" (depende de T016)
- [X] T026 [P] [US1] Crear `components/ui/open-status-badge.tsx` (`"use client"`): recibe `hours` y los textos por props, calcula con `getOpenStatus`, recalcula cada 60 s y **reserva un hueco de alto fijo** hasta montar para no generar CLS (depende de T023, T025)
- [X] T027 [P] [US1] Crear `components/ui/weekly-hours.tsx` (`"use client"`): lista semanal cuyo **texto sale en el HTML del servidor** y que resalta el día de hoy (en `America/Argentina/Buenos_Aires`) recién al montar
- [X] T028 [P] [US1] Modificar `lib/analytics/events.ts` según `contracts/analytics-events.md §2`: agregar `provider_action_clicked`, `PROVIDER_ACTIONS` (`call`, `directions`, `proposal`, `share`), el prop opcional `provider` en `whatsapp_clicked`, la entrada del catálogo (`posthog: "client"`, `meta: () => null`, `clickable: true`) y que la función `meta` de `whatsapp_clicked` devuelva `null` cuando el evento trae `provider`
- [X] T029 [US1] Modificar `components/analytics/analytics-events.tsx`: leer `data-analytics-provider` y `data-analytics-action` usando `lib/analytics/provider-attrs.ts` (depende de T024, T028)
- [X] T030 [US1] **(revisada por la spec 210, FR-020)** No se crea `site-bar.tsx`: la página usa el `SiteHeader` global (`components/layout/site-header.tsx`), con el mismo conjunto de links que el resto del sitio y `currentPath` vacío (el perfil no es un link del menú). Esta tarea consiste en **verificar** que el header se ve y se alinea bien sobre la página y en que depende de que la spec 210 haya dejado el header definitivo (anclas de la home disponibles en páginas internas). No se importa `PageShell`: la página compone `SiteHeader` + `<main>` + `footer-band` a mano porque el pie es propio. **Nota (spec 210, ya implementada)**: `SiteHeader` ya **no acepta** `showSectionLinks` ni `secondary`; solo `cta` y `currentPath`. Se usa así: `<SiteHeader />` sin props
- [X] T031 [P] [US1] Crear `components/sections/provider-profile/footer-band.tsx`: banda oscura con logo blanco, "Descargá AutoLibre", "Sumá tu negocio", la URL pública del perfil y enlaces a `/terminos` y `/privacidad`
- [X] T032 [US1] Crear `components/sections/provider-profile/profile-header.tsx`: portada (`next/image`, **única con `preload`**; sin portada o sin logo, un cuadro neutro `bg-card-muted` y nunca una imagen rota), logo cuadrado superpuesto, **único `<h1>` con el nombre**, sello "Aliado de AutoLibre" con el isotipo (solo si `isAlly`), pill del rubro principal + secundarios (`<span>`, nunca `h*`), puntuación con cantidad de reseñas **solo si hay reseñas** y enlazada (ancla `#resenas`) a la sección de reseñas, localidad, `OpenStatusBadge` y los botones WhatsApp (valida que el host sea `wa.me`), Llamar (`tel:` con E.164), Cómo llegar (búsqueda de Maps por dirección, o por coordenadas si existen) con los atributos `data-analytics-*` del contrato y `placement="provider_header"`. El botón Compartir lo cablea T050 (depende de T026, T028)
- [X] T033 [P] [US1] Crear `components/sections/provider-profile/about.tsx`: descripción (texto, nunca HTML), quién atiende (nombre, rol, foto opcional), "N años en el rubro" (calculado de `foundedYear`) y "En AutoLibre desde <mes año>" **solo si `memberSince` no es nulo**; omite cada dato ausente
- [X] T034 [P] [US1] Crear `components/sections/provider-profile/services.tsx`: servicios agrupados por familia (`h3`), "Marcas que atiende" (con `mode: "all"` mostrar "Todas las marcas"), tipos de vehículo, combustibles (solo si `mode: "specific"`) y equipamiento; omitir lo vacío
- [X] T035 [P] [US1] Crear `components/sections/provider-profile/hours.tsx`: usa `WeeklyHours` y muestra "Feriados: consultar por WhatsApp"; la sección se omite si no hay horarios (depende de T027)
- [X] T036 [P] [US1] Crear `components/sections/provider-profile/location.tsx` con la variante **con local**: título "Ubicación", dirección completa, enlace "Cómo llegar" y, **solo si hay coordenadas**, imagen de mapa estático (`next/image` con `width`/`height`/`sizes`/`alt`, host `maps.googleapis.com` en `remotePatterns`); sin coordenadas, solo texto y enlace
- [X] T037 [P] [US1] Crear `components/sections/provider-profile/contact.tsx`: teléfono (`tel:`), Instagram y web propia **solo con `http(s)`** y `rel="nofollow ugc noopener noreferrer"`; un link `javascript:` no se renderiza como `<a href>` (research D27)
- [X] T038 [P] [US1] Crear `components/sections/provider-profile/proposal-card.tsx`: tarjeta "¿Necesitás una propuesta?" con enlace a `/pedido?origen=perfil&proveedor=<slug>` y atributos de analítica (`action="proposal"`, `placement="provider_aside"`). En la v1 el slug viaja solo como atribución (research D19)
- [X] T039 [US1] Crear `app/p/[slug]/page.tsx`: `generateStaticParams` (recorre `listProviderProfiles`; devuelve `[]` y loguea si el backend no responde), `generateMetadata` **base** con `createMetadata({ title, description, path: "/p/<slug>", index: PROVIDER_PROFILES_PUBLIC && isIndexable(profile), image: { url: "/p/<slug>/og", width: 1200, height: 630, alt } })`, `notFound()` para `not_found` o slug inválido, y la composición: `SiteHeader` global → `<main className="bg-canvas">` → un `Container size="wide"` con la grilla de dos columnas (principal: perfil, sobre, servicios; derecha `<aside>`: propuesta, horarios, ubicación, contacto; en mobile la derecha pasa **debajo**) → `footer-band`. Outline según `contracts/seo-and-share.md §5` (depende de T019, T015, T016, T023–T038)
- [ ] T040 [US1] Verificar US1 con el mock siguiendo el [quickstart §4](./quickstart.md#4-lista-de-verificación): contenido en el HTML (`curl`/ver fuente), un único `h1` y outline sin saltos, alineación a 390 / 1024 / 1440 px, columna derecha debajo en mobile, primera pantalla en 375×667 con nombre + rubro + estado + WhatsApp (SC-001), badge sin salto de diseño, `preload` solo en la portada, Lighthouse mobile (LCP < 2,5 s, CLS < 0,1), axe sin violaciones críticas, y que cada botón genere **un** evento con `provider` y `placement` correctos

### Trabajo coordinado en otros repositorios (US1)

- [ ] T041 [US1] 🔗 (repo externo `autolibre-backend-hex`) Agregar en `src/shared/infrastructure/database/postgres/schema/` los schemas `partner-business-hours.schema.ts`, `partner-vehicle-types.schema.ts`, `equipment-catalog.schema.ts` y `partner-equipment.schema.ts` (exportarlos en `schema/index.ts`), y las columnas nuevas de `partners.schema.ts` (`primary_category_id`, `locality`, `province`, `cover_image_url/width/height` con `CHECK` de "las tres o ninguna", `founded_year`, `owner_name/role/photo_url`, `phone`, `member_since` con backfill solo para `source = 'application'`) según `data-model.md §1`. Generar la migración en `drizzle/` y **revisar que no traiga `DROP … CASCADE`** (ver el comentario de `0059_recreate_partner_directory_view.sql`); actualizar `autolibre-ddl-ddd.md`
- [ ] T042 [US1] 🔗 (repo externo `autolibre-backend-hex`) Implementar en `src/marketplace/partner/` el read-model `partner-profile.read-model.ts`, `get-partner-profile` (query + handler), `drizzle-partner-profile.reader.ts` y `presentation/partner-profile.controller.ts` con `GET /partner-profiles/:slug` (`@Public()`, slug validado → `400`, no publicado → `404`, `status: "ok"`), con `brands`/`fuelTypes` como `{ mode: "all" | "specific" }` y `locationMode` ya resuelto. Agregar al aprobar un partner el mapeo `vehicle_types` → `partner_vehicle_types`. Cubrirlo con `test/marketplace/schema-invariants.e2e-spec.ts`
- [ ] T043 [US1] 🔗 (repo externo `autolibre-admin`) Extender la ficha del partner (`src/server/partners.repo.ts`, `src/fn/partners.ts` y la ruta de `/partners/$partnerId`) para editar los campos nuevos (portada, descripción, quién atiende, año de inicio, horarios por tramos, equipamiento, rubro principal, teléfono). Las escrituras van por **funciones SQL** nuevas en `migrations/` (regla de `ops-write-actions.md`), nunca SQL a mano
- [ ] T044 [US1] 🔗 (operaciones) Migración asistida de los horarios de los 46 partners activos: del texto libre `partners.hours` a tramos en `partner_business_hours`, **a mano desde el panel** (no se parsea el texto: research D4). Es lo que habilita el estado "abierto ahora" con datos reales

**Checkpoint**: US1 funciona y se prueba sola (con el mock; con datos reales cuando T041–T044 estén).

---

## Phase 4: User Story 2 — Compartir con URL estable y vista previa propia (Priority: P1)

**Goal**: el proveedor comparte `autolibre.ai/p/<slug>` por WhatsApp con una tarjeta propia y la URL no se rompe si cambia el nombre.

**Independent Test**: publicar un proveedor, abrir su URL, pegarla en un mensajero para ver la tarjeta y renombrarlo para confirmar que la URL vieja redirige (spec US2, escenarios 1–5).

### Implementación de User Story 2

- [X] T045 [US2] Crear `lib/revalidation.ts` con `secretMatches` (comparación en tiempo constante, hoy copiada dentro de `app/api/revalidate/route.ts`) y modificar `app/api/revalidate/route.ts` para importarla en vez de duplicarla
- [X] T046 [US2] Crear `app/api/revalidate/provider/route.ts` según `contracts/revalidation-webhook.md`: `POST` con `x-revalidate-secret` (`PROVIDER_PROFILE_REVALIDATE_SECRET`); `500` si falta el secreto; `401` si no coincide; **validación estricta** del cuerpo (`slug` con `isValidSlug`, `previousSlugs` ≤ 10 con el mismo formato, `400` si no cumple); `revalidateTag("provider:<slug>", { expire: 0 })` por cada slug y `revalidateTag("provider-profiles", { expire: 0 })`; responde `{ revalidated, tags, now }` (depende de T045)
- [X] T047 [P] [US2] Crear `lib/provider-profile/og-tokens.ts` con constantes (colores, tamaños de texto, radios) que **espejan** los tokens de `@theme`, usadas solo por la imagen OG (Satori no entiende clases ni variables CSS: excepción técnica documentada en el plan)
- [X] T048 [US2] Completar `app/p/[slug]/og/route.tsx` (parte de T007): `ImageResponse` 1200×630 en Node runtime, solo flexbox, panel izquierdo (logo, nombre en máx. 2 líneas con elipsis, "<rubro> · <localidad>", fila de puntuación **solo si hay reseñas**, sello Aliado, logo de AutoLibre) y panel derecho de 420 px con la portada. **Degradaciones** (FR-042): sin portada → `#DCDEDC` liso; sin logo → se omite el cuadro; una imagen remota que falla se omite sin romper la tarjeta; slug inexistente → `404`. Fijar el caché con `revalidate` ≤ 600 y la etiqueta `provider:<slug>`; **antes de fijarlo, leer en `node_modules/next/dist/docs/` la configuración de caché de Route Handlers** (depende de T007, T019, T047)
- [X] T049 [P] [US2] Crear `components/ui/share-button.tsx` (`"use client"`): usa `navigator.share({ title, url })` si existe; si no, copia la URL canónica al portapapeles y avisa en una región `aria-live`; dispara `track("provider_action_clicked", { action: "share", provider, placement })`; objetivo táctil ≥ 44 px
- [X] T050 [US2] Modificar `components/sections/provider-profile/profile-header.tsx` para sumar el botón Compartir con `ShareButton` (depende de T032, T049)
- [X] T051 [US2] Modificar `app/p/[slug]/page.tsx` para que `{ status: "moved", slug }` resuelva con `permanentRedirect("/p/" + slug)` (308; research D6) (depende de T039)
- [ ] T052 [US2] Verificar US2 con el [quickstart](./quickstart.md#4-lista-de-verificación): `curl -sI /p/mecanica-barrancas` → `308` + `Location`; `/p/<slug>/og` devuelve un PNG de 1200×630 en < 3 s y las variantes sin portada / sin logo / sin reseñas / nombre largo salen legibles; el webhook responde `200` / `401` / `400`; un cambio en el mock avisado por webhook se ve en la página **y** en su imagen sin reiniciar; la tarjeta se ve completa en WhatsApp real o en un *debugger* de enlaces

### Trabajo coordinado en otros repositorios (US2)

- [ ] T053 [US2] 🔗 (repo externo `autolibre-backend-hex`) Crear `partner-slugs.schema.ts` (PK sobre `slug`, `is_current`, índice único parcial por partner, `CHECK` de formato), la función SQL `generate_partner_slug` (regla de `data-model.md §3.1`: nombre + localidad utilizable, sufijo numérico estable ante colisión), invocarla desde `approve_partner_application`, un script de backfill `scripts/backfill-partner-slugs.ts` que **imprima los 46 slugs para revisión manual antes de aplicar**, y la respuesta `status: "moved"` en `GET /partner-profiles/:slug`. Agregar el campo opcional `slug` a `GET /partners` y `GET /partners/:id` y **actualizar a propósito** el test de OpenAPI que fija esa lista de campos
- [ ] T054 [US2] 🔗 (repo externo `autolibre-admin`) En el panel: vista previa del slug antes de aprobar o renombrar, **mensaje de bienvenida copiable** con la URL del perfil y la instrucción de ponerla como "Sitio web" en el Perfil de Empresa de Google (cumple FR-037), y llamada a `POST {landing}/api/revalidate/provider` al guardar la ficha (con `previousSlugs` al renombrar)

**Checkpoint**: US1 y US2 funcionan; el perfil se comparte con tarjeta propia y sin enlaces rotos.

---

## Phase 5: User Story 3 — Ser encontrado por buscadores y asistentes de IA (Priority: P1)

**Goal**: Google y los LLM leen el perfil como texto, con datos estructurados correctos y sin indexar páginas pobres.

**Independent Test**: pedir la página sin ejecutar scripts, pasarla por los validadores de datos estructurados y consultar el sitemap (spec US3, escenarios 1–6).

### Tests de User Story 3

- [X] T055 [P] [US3] Test `scripts/provider-profile/__tests__/business-type.test.ts` de `businessTypeFor`: cada slug de `fixtures/service-categories.json` (T005) devuelve un tipo del mapa de `research.md` D9 y **falla si aparece una familia sin mapear**; un slug desconocido devuelve `AutomotiveBusiness`

### Implementación de User Story 3

- [X] T056 [P] [US3] Crear `lib/provider-profile/business-type.ts` (PURO): `businessTypeFor(primaryCategorySlug)` con la tabla de `research.md` D9 (`AutoRepair`, `TireShop`, `AutoWash`, `AutoBodyShop`, `AutoPartsStore`, `AutomotiveBusiness` por defecto), con las claves reales de T005
- [X] T057 [US3] Agregar `localBusinessSchema(profile)` a `lib/seo/schema.ts` según la tabla de `contracts/seo-and-share.md §2`: `@id` `<url>#business`, `logo`/`image` con dimensiones, `telephone`, `address` (`PostalAddress`, `addressCountry: "AR"`) solo si hay local y dirección, `geo` **solo si hay latitud y longitud**, `areaServed` para `mobile`/`both`, `openingHoursSpecification` por tramo (`"24:00"` si 1440), `aggregateRating` y `review` **solo si `count > 0` y se muestran**, `sameAs` con redes `http(s)`, `mainEntityOfPage`; **sin** `priceRange` ni `email` (depende de T056)
- [X] T058 [P] [US3] Crear `components/sections/provider-profile/breadcrumb.tsx`: `<nav aria-label="Ruta">` con "Proveedores" → `/p`, "<Localidad>" → `/p?zona=<slug>`, "<Rubro>" → `/p?rubro=<slug>` y el nombre como último paso sin enlace. **Un nivel sin dato se omite**; exporta también el `trail` que consume `breadcrumbSchema` para que lo visible y lo estructurado sean idénticos (FR-034)
- [X] T059 [US3] Modificar `app/p/[slug]/page.tsx` para renderizar el `breadcrumb` y un único `<JsonLd schema={graph(organizationSchema(), webPageSchema(…), localBusinessSchema(profile), breadcrumbSchema(trail))} />`, emitiendo el nodo de negocio **solo si `PROVIDER_PROFILES_PUBLIC && isIndexable(profile)`** (depende de T039, T057, T058)
- [X] T060 [P] [US3] Modificar `app/sitemap.ts`: con `PROVIDER_PROFILES_PUBLIC` en `true`, agregar `/p` (`daily`, `0.7`, `lastModified` = el más reciente) y un `/p/<slug>` por cada perfil con `indexable: true` del listado (recorriendo páginas; `lastModified = updatedAt`, `weekly`, `0.6`); los no indexables **no** entran; con el interruptor en `false`, ninguno (depende de T019)
- [ ] T061 [P] [US3] Agregar a `public/llms.txt` la sección "Perfiles de proveedores" (qué es una página `/p/<slug>` y enlace a `/p`), **al encender el interruptor**; dejar un comentario junto a `lib/provider-profile/visibility.ts` recordando sacarla si se vuelve a `false`
- [X] T062 [US3] Revisar `app/robots.ts`: confirmar que `/p/` queda permitido (la exclusión es por `noindex` en metadata, **no** por `robots.txt`) y dejar el comentario que lo explica; agregar a `lib/content/site.ts` el enlace "Proveedores" → `/p` en el pie **solo cuando `PROVIDER_PROFILES_PUBLIC` es `true`** (depende de T004)
- [X] T063 [P] [US3] **(solo si producto aprueba D8 — ver T006)** Crear `components/sections/provider-profile/directory.tsx`: listado de tarjetas de proveedores (logo, nombre, rubro principal, localidad, puntuación) con `<h2>` por sección y paginación
- [X] T064 [US3] **(solo si producto aprueba D8)** Crear `app/p/page.tsx`: índice "Proveedores en AutoLibre" con `createMetadata`, `webPageSchema({ type: "CollectionPage" })` y `breadcrumbSchema`; lee `?rubro=` y `?zona=` con `searchParams`; **las variantes filtradas llevan `noindex` y canonical a `/p`**; el listado vacío muestra un estado vacío, no una página rota (depende de T019, T063)
- [ ] T065 [US3] Verificar US3: `curl` a la página y confirmar que todo el contenido está como texto en el HTML (SC-002); `taller-incompleto` lleva `noindex`, **no** declara JSON-LD de negocio y no está en el sitemap; el JSON-LD pasa sin errores el *Rich Results Test* y `validator.schema.org` para `AutoRepair`, `BreadcrumbList` y (si hay) `FAQPage` (SC-003); lo declarado coincide con lo visible; `gestoria-norte-san-isidro` declara `areaServed` y **no** `address` ni `geo`; con el interruptor en `false`, nada en el sitemap ni links

### Trabajo coordinado en otros repositorios (US3)

- [ ] T066 [US3] 🔗 (repo externo `autolibre-backend-hex`) Implementar `GET /partner-profiles` (listado paginado, `pageSize` con tope duro de 100, orden total: aliados, nombre, desempate por `slug`; filtros `category` y `locality`; campos `indexable` y `updatedAt`) en `src/marketplace/partner/` según `contracts/partner-profile-api.md §2`

**Checkpoint**: las tres historias P1 completas = **Fase A** (siempre con `PROVIDER_PROFILES_PUBLIC = false`).

---

## Phase 6: User Story 4 — Evaluar la confianza: trabajos, reseñas y métricas (Priority: P2)

**Goal**: trabajos reales, reseñas de AutoLibre y métricas que superan el umbral — la web ya queda lista aunque el backend todavía no los tenga.

**Independent Test**: con un perfil de prueba con trabajos de ambos orígenes, reseñas con y sin respuesta y métricas por encima y por debajo del umbral, y con otro sin nada de eso (spec US4, escenarios 1–7).

> Estos bloques **solo se renderizan si llegan con contenido** (research D15). Los dominios de backend que los generan son la Fase C y **no** están en este plan.

### Tests de User Story 4

- [X] T067 [P] [US4] Test `scripts/provider-profile/__tests__/metrics.test.ts` de `selectVisibleMetrics`: una métrica con umbral `null` **no se muestra**; sin dato no se muestra; con todos los umbrales `null` devuelve `[]`; con umbrales definidos muestra solo las que los superan

### Implementación de User Story 4

- [X] T068 [P] [US4] Crear `lib/provider-profile/metrics.ts` (PURO): `selectVisibleMetrics(metrics, thresholds)` con `thresholds` tipado (`responseTimeMaxMinutes`, `responseRateMin`, `proposalsSentMin`) y **valores `null` hasta que producto los defina** (`data-model.md §3.8`)
- [X] T069 [P] [US4] Agregar el fixture `scripts/provider-profile/fixtures/taller-con-reputacion.json` (trabajos `autolibre` y `own` con fotos, 27 reseñas con y sin respuesta, métricas) — el mock lo toma solo; y un perfil sin Fase C ya existe (`taller-incompleto`)
- [X] T070 [P] [US4] Crear `components/sections/provider-profile/works.tsx`: grilla de 3 trabajos con foto(s) antes/después, servicio, vehículo (marca, modelo, año), mes y año, **badge distinto por origen** ("Registrado en AutoLibre" / "Cargado por el taller"), contador "N registrados en AutoLibre · M en total" y "Ver los M trabajos" (solo si hay más de los 3 visibles; hasta que producto defina un listado completo, es un ancla a la propia sección); **nunca patente ni datos del cliente**
- [X] T071 [P] [US4] Crear `components/sections/provider-profile/reviews.tsx`: puntuación general (una decimal con coma, "4,8"), 3 reseñas (`displayName` tal como llega, vehículo, fecha, estrellas, texto, respuesta pública opcional) y "Ver las N reseñas" (solo si hay más de las 3 visibles; ancla a la propia sección); la sección lleva `id="resenas"`; sin desglose por dimensión
- [X] T072 [P] [US4] Crear `components/sections/provider-profile/metrics.tsx`: usa `selectVisibleMetrics`, muestra la bajada fija "Solo se muestran los datos que superan nuestro estándar." y **no renderiza nada** si no hay métricas visibles
- [X] T073 [US4] Ampliar `lib/content/provider-profile.ts` con los textos de trabajos, reseñas y métricas (etiquetas de las tres métricas, la bajada fija, enlaces "Ver los M trabajos" / "Ver las N reseñas") (depende de T025)
- [X] T074 [US4] Modificar `app/p/[slug]/page.tsx` para insertar `works`, `reviews` y `metrics` en la columna principal, **omitiendo el bloque si el dato es nulo o vacío**, y modificar `localBusinessSchema` ya contempla `aggregateRating`/`review` (T057): confirmar que salen solo con `count > 0` (depende de T039, T070–T073)
- [X] T075 [US4] Verificar US4 con `taller-con-reputacion` y con `taller-incompleto`: los tres bloques aparecen/desaparecen según el contenido, sin cuadros vacíos ni datos inventados; los trabajos no muestran patente; el JSON-LD incluye `aggregateRating` y `review` solo en el primero y coinciden con lo visible

### Trabajo coordinado en otros repositorios (US4)

- [ ] T076 [US4] 🔗 (coordinación sin código, repo `autolibre-backend-hex`) Abrir las specs propias del backend para reseñas (con moderación), trabajos con consentimiento del cliente y métricas por partner, partiendo de las formas de `contracts/partner-profile-api.md` y de las advertencias de `research.md` D14 y D15 (las "propuestas" actuales las consiguen operadores; no hay fuente de tiempo ni tasa de respuesta)

**Checkpoint**: la web está lista para la Fase C; se enciende sola cuando el backend envía datos.

---

## Phase 7: User Story 5 — Preguntas frecuentes generadas solas (Priority: P2)

**Goal**: preguntas y respuestas derivadas de los datos estructurados, sin que el proveedor escriba nada, que alimentan el acordeón visible y el `FAQPage`.

**Independent Test**: con un proveedor de datos conocidos, verificar que las preguntas y respuestas corresponden exactamente a esos datos y cambian cuando los datos cambian (spec US5, escenarios 1–5).

### Tests de User Story 5

- [X] T077 [P] [US5] Crear la fixture dorada `specs/209-public-provider-profile/contracts/fixtures/faq-cases.json`: lista de `{ profile, expected[] }` que cubre una marca específica (con tope de 5), marcas `mode: "all"`, sábado abierto y sábado cerrado, `cng` declarado vs `fuelTypes.mode = "all"` (**no** genera GNC), escáner por equipamiento, zona de cobertura, sin dato → sin pregunta, y el **tope de 8 ítems**. Es la misma que debe pasar la app (riesgo R3)
- [X] T078 [P] [US5] Test `scripts/provider-profile/__tests__/faq.test.ts` que recorre la fixture de T077 y verifica que **nunca** se genera una pregunta negativa por una marca no declarada

### Implementación de User Story 5

- [X] T079 [P] [US5] Crear `lib/provider-profile/faq.ts` (PURO): `buildFaq(profile, templates)` → `{ id, question, answer }[]` con el orden y las precondiciones de `data-model.md §3.5` (`location`, `hours-weekly`, `hours-saturday`, `brands-<marca>` hasta 5, `brands-all`, `vehicle-<tipo>` hasta 3, `fuel-cng`, `diagnostic-scanner`, `mobile-service`), tope de 8; las plantillas llegan por parámetro
- [X] T080 [US5] Ampliar `lib/content/provider-profile.ts` con las **plantillas de pregunta y respuesta** de cada id de `faq.ts` (con marcadores `{marca}`, `{horario}`, etc.) y la lista de slugs de servicios de diagnóstico para `diagnostic-scanner` (a confirmar contra el catálogo real de T005) (depende de T073)
- [X] T081 [P] [US5] Crear `components/sections/provider-profile/faq.tsx`: `<section aria-labelledby>` con `<h2>` "Preguntas frecuentes" y un `<details>/<summary>` por pregunta (las preguntas son `<summary>`, no encabezados); el texto de las respuestas está en el HTML aunque estén cerradas
- [X] T082 [US5] Modificar `app/p/[slug]/page.tsx` para construir **una sola** lista con `buildFaq(profile, templates)` y pasarla al componente `faq` y a `faqPageSchema(items)` dentro del `graph` de JSON-LD; sin ítems no hay bloque ni `FAQPage` (depende de T059, T079–T081)
- [X] T083 [P] [US5] Agregar `"GNC"` a `PROVIDER_FUEL_TYPES` en `lib/content/providers.ts` y comprobar en `components/forms/provider-form.tsx` que la opción nueva se renderiza y se envía en `declaredFuelTypes` (research D28); sin esto ningún proveedor puede declarar GNC y la pregunta del ejemplo de la spec no se genera
- [X] T084 [US5] Verificar US5: las preguntas del acordeón y las del `FAQPage` son **idénticas**; cambiar un dato del mock cambia la respuesta; `taller-incompleto` no muestra el bloque; con `fuelTypes.mode = "all"` no aparece la pregunta de GNC

### Trabajo coordinado en otros repositorios (US5)

- [ ] T085 [US5] 🔗 (repo externo `autolibre-backend-hex`) En el flujo de aprobación (`approve_partner_application` y su traducción de `declared_fuel_types`) mapear la etiqueta `GNC` a `FuelType.CNG = 'cng'` y verificar de punta a punta que un alta con GNC llega a `partner_fuel_types` y al perfil

**Checkpoint**: US5 funciona sola; la FAQ y su dato estructurado salen de la misma fuente.

---

## Phase 8: User Story 6 — Perfil de un proveedor sin local a la calle (Priority: P2)

**Goal**: una gestoría o un servicio a domicilio muestra su zona de cobertura en lugar de una dirección.

**Independent Test**: con `gestoria-norte-san-isidro` (`locationMode: "mobile"`), verificar que no hay dirección ni "Cómo llegar" y que sí hay zona de cobertura (spec US6, escenarios 1–3).

### Implementación de User Story 6

- [X] T086 [US6] Modificar `components/sections/provider-profile/location.tsx` para la variante **sin local**: título "Zona de cobertura", lista de partidos/localidades de `serviceArea` y el texto "No atiende en un local a la calle. Coordiná por WhatsApp dónde y cuándo."; **sin mapa del área** (desvío 3 del plan: no hay geometría). Para `locationMode: "both"`: comportamiento de local más "También atiende a domicilio en: …" si hay zonas (provisorio, `data-model.md §3.4`) (depende de T036)
- [X] T087 [US6] Modificar `components/sections/provider-profile/profile-header.tsx` para la variante sin local: "A domicilio y online · <zona>" en lugar de la localidad/dirección y **sin el botón "Cómo llegar"** (depende de T032, T050)
- [X] T088 [US6] Verificar US6 con `gestoria-norte-san-isidro`: sin dirección, sin "Cómo llegar", con "Zona de cobertura" y el texto fijo; el JSON-LD declara `areaServed` y no `address`/`geo`; un perfil con `locationMode: "both"` muestra dirección **y** zonas

### Trabajo coordinado en otros repositorios (US6)

- [ ] T089 [US6] 🔗 (repo externo `autolibre-backend-hex`) Crear `partner-service-areas.schema.ts` (`locality`, `partido`, `position`) con su migración y devolver `serviceArea.localities` en el read-model del perfil; **no tocar** `coverage_zone`, que sigue siendo lo que ven los listados
- [ ] T090 [US6] 🔗 (repo externo `autolibre-admin`) Agregar a la ficha del partner el editor de localidades de cobertura (con función SQL de escritura) y validar la variante con proveedores reales, como pide la tarjeta (decisión abierta de la spec)

**Checkpoint**: US6 funciona; la feature sirve para rubros sin local.

---

## Phase 9: User Story 7 — Ver el perfil dentro de la app (Priority: P2)

**Goal**: la app muestra la misma información en una pantalla nativa, con distancia y "Hacerlo mi taller de cabecera".

**Independent Test**: abrir el perfil de un mismo proveedor en la web y en la app y comparar; repetir con y sin sesión y con y sin permiso de ubicación (spec US7, escenarios 1–4).

> Todo este bloque es del repo `autolibre-mobile`. **No se mejora una pantalla nueva**: se amplía `ProviderDetailScreen`, que ya tiene el CTA anclado de WhatsApp, el registro de `lead` al contactar y "Cómo llegar" por dirección (research D24); eso se **conserva**.

- [ ] T091 [US7] 🔗 (repo externo `autolibre-mobile`) Ampliar `modules/marketplace/core/entities/ProviderDetail.entity.ts` y `core/ports/ProviderRepository.port.ts` con los campos del perfil y la lectura por slug, y agregar el adaptador de infraestructura que consume `GET /partner-profiles/:slug` (el `id` UUID que ya conoce la app sigue sirviendo para el CTA y el `lead`)
- [ ] T092 [US7] 🔗 (repo externo `autolibre-mobile`) Implementar el cálculo del estado "abierto ahora" como un caso de uso del módulo (`modules/marketplace/core/usecases/`) y **pasarle la fixture dorada** `specs/209-public-provider-profile/contracts/fixtures/open-status-cases.json` de este repo (T020), copiándola o referenciándola, para que web y app no diverjan (riesgo R3); hacer lo mismo con `faq-cases.json` (T077)
- [ ] T093 [US7] 🔗 (repo externo `autolibre-mobile`) Ampliar `modules/marketplace/ui/screens/ProviderDetailScreen.tsx` y `ui/components/` con los bloques de la spec en el orden de la tarjeta: portada y rubro principal con "+N rubros", horarios con "Abierto · cierra 18:00", servicios, trabajos en **carrusel horizontal**, 2 reseñas, métricas, ubicación/zona de cobertura y FAQ en acordeón; omitir todo bloque sin datos
- [ ] T094 [US7] 🔗 (repo externo `autolibre-mobile`) Mostrar la **distancia** junto a la localidad solo con permiso de ubicación; botón "Compartir perfil" con `Share` de React Native y la URL pública `autolibre.ai/p/<slug>`; mandar los eventos con los mismos nombres y props del [contrato de analítica](./contracts/analytics-events.md); **omitir** "Hacerlo mi taller de cabecera" porque esa función no existe todavía (research D24)
- [ ] T095 [US7] 🔗 (repo externo `autolibre-mobile`) Verificar US7 comparando web y app para un mismo proveedor: mismos datos, mismos estados "abierto/cerrado", FAQ idéntica, y que un perfil incompleto no muestra bloques vacíos

**Checkpoint**: web y app muestran lo mismo.

---

## Phase 10: Polish y temas transversales

**Propósito**: cierre de calidad, seguridad y puerta de lanzamiento.

- [X] T096 [P] Documentar en `DESIGN.md` los tokens nuevos de `@theme` (T008) y aclarar que el perfil público sigue el sistema "AutoLibre AI" y no la paleta de superficie de la landing (research D22)
- [X] T097 Limpieza del spike: confirmar que no quedó código de T007 fuera de `app/p/[slug]/og/route.tsx` y dejar en `research.md` D11 el resultado final (tamaño del bundle, tiempo, decisión de fuentes)
- [X] T098 [P] Verificación de seguridad del contenido del proveedor (research D27): con un fixture cuya descripción contiene `<script>alert(1)</script>` y un link `javascript:…`, comprobar que se muestra como texto, que el link no es `<a href>` y que los válidos llevan `rel="nofollow ugc noopener noreferrer"`; que el slug con formato inválido responde `404` **sin llamar al backend**; y que el JSON-LD escapa `<`
- [ ] T099 Correr toda la lista del [quickstart §4](./quickstart.md#4-lista-de-verificación) y los comandos de cierre: `npm run lint`, `npx tsc --noEmit`, `npm run typecheck:provider-profile`, `npm run test:provider-profile` y `npm run build` **con el mock encendido y con el mock apagado** (el build no puede fallar si el backend no responde). Cero errores de TypeScript y de ESLint, sin `ts-ignore` ni `eslint-disable` sin justificar
- [ ] T100 **Puerta de lanzamiento** (no automática): antes de poner `PROVIDER_PROFILES_PUBLIC = true` cumplir la lista de [quickstart §5](./quickstart.md#5-puerta-de-lanzamiento-encender-provider_profiles_public) — backend desplegado con los 46 slugs revisados a mano, perfiles indexables suficientes, imágenes migradas a infraestructura propia, panel con los campos nuevos y el mensaje de bienvenida, analítica verificada (SC-008) y la respuesta de marketing sobre `Contact` de Meta; entonces actualizar `public/llms.txt` y enviar el sitemap a Search Console

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Setup (Fase 1)**: sin dependencias. T007 (spike) conviene hacerlo **primero**: es el único punto que puede forzar un rediseño.
- **Foundational (Fase 2)**: depende de Setup y **bloquea todas las historias**.
- **Historias (Fases 3–9)**: todas dependen de Foundational. Pueden avanzar en paralelo si hay gente, o en orden de prioridad (US1 → US2 → US3 → US4…US7).
- **Polish (Fase 10)**: depende de las historias que se quieran entregar.
- **Trabajo externo (🔗)**: no bloquea el código de la landing (se prueba con el mock) pero **sí bloquea verificar con datos reales y lanzar**.

### Dependencias entre historias

- **US1 (P1)**: arranca tras Foundational; no depende de otra historia. Es el **MVP**.
- **US2 (P1)**: independiente de US1 salvo que **modifica** `profile-header.tsx` (T050) y `page.tsx` (T051); puede construirse en paralelo y se integra después.
- **US3 (P1)**: independiente, pero **modifica** `page.tsx` (T059). `breadcrumb`/`/p` (T058, T063, T064) dependen de la decisión de producto D8.
- **US4 (P2)**: independiente de US1–US3 en lógica; reusa `localBusinessSchema` (T057) y `page.tsx`.
- **US5 (P2)**: usa el `graph` de JSON-LD de US3 (T059) y `page.tsx`.
- **US6 (P2)**: **extiende** `location.tsx` y `profile-header.tsx` de US1.
- **US7 (P2)**: es el repo de la app; depende del contrato y de que existan las fixtures doradas (T020, T077).

### Archivos compartidos (tareas sin `[P]` que van en orden)

| Archivo | Tareas, en este orden |
|---|---|
| `app/p/[slug]/page.tsx` | T039 → T051 → T059 → T074 → T082 |
| `components/sections/provider-profile/profile-header.tsx` | T032 → T050 → T087 |
| `components/sections/provider-profile/location.tsx` | T036 → T086 |
| `lib/content/provider-profile.ts` | T016 → T025 → T073 → T080 |
| `lib/seo/schema.ts` | T057 (y T074 solo verifica) |

### Dentro de cada historia

- Los tests de módulos puros se escriben primero y **deben fallar** antes de la implementación.
- Módulos puros → islas → secciones → página → verificación.

---

## Oportunidades de paralelismo

- Setup: T002, T003, T004 y T005 en paralelo.
- Foundational: T008, T009, T011, T012–T015, T016, T017 y T018 en paralelo (T010 y T019 van aparte).
- **US1**: las secciones T033–T038 y las islas T026–T027 en paralelo; T030 y T031 también.
- US2: T047 y T049 en paralelo; T045→T046 es una cadena.
- US3: T055/T056 y T058 en paralelo con T060 y T061.
- US4: T070, T071 y T072 en paralelo.
- Las tareas 🔗 de cada repo corren **en paralelo con la landing** una vez acordados los contratos.

### Ejemplo en paralelo: User Story 1

```text
# Tests de módulos puros:
Task: "Crear fixture dorada open-status-cases.json en specs/209-public-provider-profile/contracts/fixtures/"   (T020)
Task: "Test open-status.test.ts en scripts/provider-profile/__tests__/"                                       (T021)
Task: "Test provider-attrs.test.ts en scripts/provider-profile/__tests__/"                                    (T022)

# Después, en paralelo (archivos distintos):
Task: "open-status.ts en lib/provider-profile/"                    (T023)
Task: "provider-attrs.ts en lib/analytics/"                        (T024)
Task: "open-status-badge.tsx en components/ui/"                    (T026)
Task: "weekly-hours.tsx en components/ui/"                         (T027)
Task: "about.tsx / services.tsx / hours.tsx / location.tsx / contact.tsx / proposal-card.tsx
       en components/sections/provider-profile/"                   (T033–T038)
```

---

## Estrategia de implementación

### MVP primero (solo US1)

1. Fase 1: Setup (empezar por el spike T007).
2. Fase 2: Foundational (**bloqueante**).
3. Fase 3: US1.
4. **PARAR y VALIDAR** US1 contra el mock con T040.
5. Mostrar a producto el perfil con datos de prueba.

### Entrega incremental

1. Setup + Foundational → cimientos.
2. US1 → probar → demo (**MVP**).
3. US2 → probar → demo (compartir con tarjeta propia).
4. US3 → probar → demo (**Fase A completa**, interruptor apagado).
5. US5, US6, `/p` y US7 (**Fase B**).
6. US4 cuando el backend tenga los dominios de la **Fase C**.
7. Cada historia agrega valor sin romper las anteriores.

### Estrategia con varias personas

1. Una persona resuelve el spike T007 y el equipo termina Setup + Foundational.
2. Después:
   - Persona A: US1 (landing).
   - Persona B: US2 y US3 (landing; coordinar `page.tsx` y `profile-header.tsx`).
   - Backend: T041, T042, T053, T066 (los contratos ya están acordados).
   - Panel: T043, T054.
   - App: T091–T095, una vez disponibles las fixtures doradas.

---

## Notas

- `[P]` = archivos distintos, sin dependencias pendientes.
- La etiqueta `[US#]` mapea cada tarea a su historia de la spec.
- Cada historia debe poder completarse y probarse sola; confirmar con la tarea de verificación antes de pasar a la siguiente.
- **No encender `PROVIDER_PROFILES_PUBLIC` hasta cumplir T100.** Con el interruptor en `false` las páginas existen y funcionan pero con `noindex`, fuera del sitemap y sin links.
- Commitear después de cada tarea o grupo lógico.
- Evitar: tareas vagas, conflictos en un mismo archivo y dependencias entre historias que rompan su independencia.
