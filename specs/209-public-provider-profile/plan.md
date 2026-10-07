# Implementation Plan: Perfil público de proveedor (web + app)

**Branch**: `209-public-provider-profile` | **Date**: 2026-10-07 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/209-public-provider-profile/spec.md`

## Summary

Una página pública por proveedor en `autolibre.ai/p/<slug>`, renderizada en el servidor y regenerada por tiempo y por evento, que el proveedor pueda usar como su propia web y que Google y los asistentes de IA indexen; la misma información se ve en la app.

**Enfoque técnico** (detalle en [research.md](./research.md)):

- **La landing** (este repo) consume un **contrato de datos nuevo** del backend (`GET /partner-profiles/:slug`, [contrato](./contracts/partner-profile-api.md)). Página `app/p/[slug]/page.tsx` con `generateStaticParams` + ISR, sin dependencias nuevas: imagen de vista previa con `next/og`, datos estructurados con builders en `lib/seo/schema.ts`, analítica con el catálogo único existente.
- **Toda la lógica determinística** (estado "abierto ahora", preguntas frecuentes, métricas visibles, indexabilidad, tipo de negocio, validación de slug) va en **módulos puros** probados con `node --test`, el patrón que ya usa el repo (`test:blog`).
- **El backend, la app y el panel de operadores** se tocan por **contrato**: este plan define qué tienen que exponer y qué tienen que mostrar, pero su implementación es trabajo de esos repositorios.
- **Entrega en fases con un interruptor de publicación** (`PROVIDER_PROFILES_PUBLIC`, como `BLOG_PUBLIC`): hoy el backend **no tiene** slug, portada, horarios estructurados, reseñas, trabajos ni métricas, y en producción hay 46 partners con datos ralos. Publicar páginas pobres como indexables es el mayor riesgo de SEO de la feature.

> **Lo que ordena el plan** (research §0): la spec pide una página, pero el dato que la alimenta **casi no existe**. El trabajo real es un contrato de datos nuevo + su migración, y la página es la parte chica. Reseñas, trabajos y métricas necesitan dominios enteros de backend que **no están en este plan**; acá solo se fija su forma.

## Technical Context

**Language/Version**: TypeScript 5 (strict) · React 19.2.4 · Next.js 16.2.4, App Router (landing). Backend: NestJS + Drizzle/PostgreSQL. App: React Native/Expo (expo-router). Panel: TanStack. *(Solo la landing se implementa con detalle acá.)*
**Primary Dependencies**: **ninguna nueva** en la landing (`next/og`, `next/image`, `node:crypto` ya vienen; Tailwind v4, `cva`, `clsx`, `tailwind-merge` ya están). Íconos Phosphor como **trazados SVG en línea** en `components/ui/icon.tsx`, sin librería.
**Storage**: PostgreSQL en el backend (tablas nuevas en el [data-model](./data-model.md)). La landing no guarda nada: data cache de Next + ISR.
**Testing**: `node --test` con *type stripping* de Node 22 para los módulos puros (patrón `test:blog`), más la [lista de verificación](./quickstart.md#4-lista-de-verificación) para render, validadores de datos estructurados, Lighthouse y axe. Sin Jest/Vitest.
**Target Platform**: web (SSR/ISR) + iOS/Android.
**Project Type**: aplicación web (landing) **más cambios coordinados en 3 repos** (backend, app, panel).
**Performance Goals**: LCP < 2,5 s, CLS < 0,1, INP < 200 ms (Constitución IV); imagen de vista previa < 3 s; un cambio visible en ≤ 10 minutos (SC-007).
**Constraints**: todo el contenido indexable en el HTML inicial; islas cliente solo en la hoja; `ImageResponse` limita el bundle a 500 KB y solo admite flexbox y fuentes `ttf`/`otf`/`woff`; **los endpoints del backend aún no existen** (se desarrolla contra un servidor de prueba del contrato).
**Scale/Scope**: 46 partners activos hoy (producción); listado paginado de 50; ~12 componentes de sección, 2 islas, 7 módulos puros, 3 rutas (`/p`, `/p/[slug]`, `/p/[slug]/og`) y 1 de revalidación; 3 repos externos con cambios.

**No quedan `NEEDS CLARIFICATION` técnicos**: todos se resolvieron en [research.md](./research.md). Lo que queda abierto es **de producto** (lista abajo).

## Constitution Check

*GATE: debe pasar antes de la Fase 0 de implementación. Re-evaluado tras el diseño.*

| # | Principio | Antes de investigar | Tras el diseño | Cómo se cumple |
|---|---|---|---|---|
| I | App Router primero; Server Components; indexable en el HTML | ✅ | ✅ | Todo es Server Component salvo dos islas hoja: `OpenStatusBadge` y `ShareButton`. Los textos indexables salen del servidor; el badge no es indexable (se vuelve falso al pasar la hora). |
| II | Todo el copy en `lib/content/*` | ✅ | ✅ | `lib/content/provider-profile.ts` (rótulos, plantillas de FAQ, textos de estado, patrones de título). El dato del proveedor es **dato**, no copy. Las funciones puras reciben las plantillas **por parámetro**. |
| III | Props tipadas; sin `any`; `as` justificado | ✅ | ✅ | `lib/provider-profile/types.ts` (contrato). La respuesta del backend se parsea **defensivamente** (como `parseCategories` en `lib/autolibre-api.ts`); el único `as` va en ese borde, con comentario. |
| IV | Accesibilidad y rendimiento (NON-NEGOTIABLE) | ⚠️ riesgo | ✅ con notas | `next/image` con `width`/`height`/`sizes`; `preload` **solo** en la portada, nunca `priority`; badge con hueco de alto fijo (CLS). **Nota**: la imagen OG no puede usar `next/font` (Satori necesita `ttf`); es una excepción técnica de esa ruta, no de la página. |
| V | Aislamiento de secciones | ✅ | ✅ | Una sección por archivo en `components/sections/provider-profile/`, **ninguna importa a otra**; las islas compartidas viven en `components/ui/` (el encabezado y la sección de horarios usan la misma). |
| VI | HTML semántico y encabezados | ✅ | ✅ | Outline definido en [contracts/seo-and-share.md §5](./contracts/seo-and-share.md#5-estructura-semántica-de-la-página-constitución-vi): un `h1`, `section` + `aria-labelledby`, acordeón con `details/summary`. |
| VII | SEO y GEO por defecto (NON-NEGOTIABLE) | ✅ | ✅ | `createMetadata`, `<JsonLd>` con builders en `lib/seo/schema.ts`, sitemap, `llms.txt`, `robots` revisado. **Más** una regla de indexabilidad por perfil (research D7). |
| VIII | Tailwind canónico y tokens | ✅ | ⚠️ una excepción | Tokens nuevos en `@theme` (`canvas`, `card`, …), clases canónicas. **Excepción**: la imagen OG usa hex en estilos en línea (Satori no entiende clases) → *Complexity Tracking*. |
| — | Sin dependencias runtime nuevas | ✅ | ✅ | `next/og` es parte de Next. No se actualiza la sección *Technology Stack*. |
| — | Spec previa · build sin errores · sin `ts-ignore` | ✅ | ✅ | Spec en `specs/209-…`. `npm run build` con 0 errores de TS y ESLint antes de mergear. |

**Reglas de `AGENTS.md` que condicionan el diseño**: §1 islas hoja · §2 un `h1` y outline · §3 accesibilidad y `motion` · §4 imágenes y fuentes · §5 SEO obligatorio · §6 GEO (`sitemap` + `robots` + `llms.txt` sincronizados) · §7 clases canónicas · §8 copy en la capa de contenido · §9 contenedores (cada sección dentro de `Section`/`Container`; **nunca** un `Container` anidado a mano; los bordes alinean con el encabezado y el pie a 390 / 1024 / 1440 px).

**Resultado del gate**: ✅ **aprobado**, con **una excepción técnica justificada** (hex en la imagen OG) y **ocho desvíos respecto de la spec** que se confirman con producto (ver abajo). Ninguno viola un principio de la constitución.

## Project Structure

### Documentation (this feature)

```text
specs/209-public-provider-profile/
├── spec.md
├── plan.md                         # Este archivo
├── research.md                     # Fase 0 — 29 decisiones con evidencia
├── data-model.md                   # Fase 1 — tablas, modelo de lectura, reglas derivadas
├── quickstart.md                   # Fase 1 — cómo desarrollar y verificar
├── source/trello-209.md            # Texto textual de la tarjeta
├── checklists/requirements.md
├── contracts/
│   ├── partner-profile-api.md      # Backend → landing/app
│   ├── revalidation-webhook.md     # Panel/backend → landing
│   ├── analytics-events.md         # Catálogo de eventos
│   └── seo-and-share.md            # Metadata, JSON-LD, sitemap, OG, outline
└── tasks.md                        # Fase 2 — lo genera /speckit.tasks (NO este comando)
```

### Source Code — landing (este repositorio)

Marca: **A** núcleo P1 · **B** P2 sin dominios nuevos · **C** necesita backend nuevo (la web ya queda lista).

```text
app/
├── p/
│   ├── page.tsx                          # B — índice "/p" (listado + filtros ?rubro= ?zona=, con noindex en filtros)
│   └── [slug]/
│       ├── page.tsx                      # A — perfil: generateStaticParams, generateMetadata, JSON-LD, permanentRedirect
│       └── og/route.tsx                  # A — imagen 1200×630 (ImageResponse, Node runtime)
├── api/revalidate/
│   ├── route.ts                          # existente — pasa a usar lib/revalidation.ts
│   └── provider/route.ts                 # A — aviso de cambio de perfil
├── sitemap.ts                            # A — suma /p y los perfiles indexables
└── globals.css                           # A — tokens nuevos en @theme

components/
├── sections/provider-profile/            # una sección por archivo; ninguna importa a otra
│   │                                     #     (sin site-bar: la página usa el `SiteHeader` global; ver D21 revisada y spec 210)
│   ├── profile-header.tsx                # A — portada, logo, <h1>, sello, rubros, puntuación, estado, botones
│   ├── breadcrumb.tsx                    # A — Proveedores › Localidad › Rubro › Nombre
│   ├── about.tsx                         # A — descripción, quién atiende, años, "En AutoLibre desde"
│   ├── services.tsx                      # A — servicios por familia, marcas, vehículos, equipamiento
│   ├── hours.tsx                         # A — tabla semanal + día de hoy (usa OpenStatusBadge/TodayRow)
│   ├── location.tsx                      # A — "Ubicación" (con local) | "Zona de cobertura" (sin local)
│   ├── contact.tsx                       # A — teléfono, redes, web propia
│   ├── proposal-card.tsx                 # A — "¿Necesitás una propuesta?" (columna derecha)
│   ├── footer-band.tsx                   # A — banda de AutoLibre + URL del perfil + Términos/Privacidad
│   ├── faq.tsx                           # B — acordeón details/summary
│   ├── directory.tsx                     # B — listado de la página /p
│   ├── works.tsx                         # C — grilla 3 + "Ver los M trabajos"
│   ├── reviews.tsx                       # C — 3 reseñas + respuesta del proveedor
│   └── metrics.tsx                       # C — "Medido por AutoLibre"
└── ui/
    ├── open-status-badge.tsx             # A — "use client": badge de estado en vivo (isla hoja)
    ├── weekly-hours.tsx                  # A — "use client": tabla semanal (texto SSR) que resalta el día de hoy al montar
    ├── share-button.tsx                  # A — "use client": Web Share API + portapapeles + aria-live
    └── icon.tsx                          # A — modificado: íconos de línea 24×24 nuevos (los del artboard de diseño)

lib/
├── provider-profile/
│   ├── types.ts                          # A — tipos del contrato (alias OK: lo usa la app, no los tests)
│   ├── api.ts                            # A — server-only: getProviderProfile / listProviderProfiles (fetch + tags + errores)
│   ├── visibility.ts                     # A — PROVIDER_PROFILES_PUBLIC (constante, como BLOG_PUBLIC)
│   ├── og-tokens.ts                      # A — constantes que espejan los tokens (solo para Satori)
│   ├── open-status.ts                    # A — PURO · getOpenStatus(horarios, ahora, zona)
│   ├── slug.ts                           # A — PURO · isValidSlug
│   ├── indexability.ts                   # A — PURO · isIndexable(perfil)
│   ├── business-type.ts                  # A — PURO · familia → tipo de schema.org
│   ├── faq.ts                            # B — PURO · buildFaq(perfil, plantillas)
│   └── metrics.ts                        # C — PURO · selectVisibleMetrics(métricas, umbrales)
├── content/provider-profile.ts           # A — copy: rótulos, plantillas FAQ, estados, patrones de título/descripción
├── content/providers.ts                  # A — modificado: se agrega "GNC" a PROVIDER_FUEL_TYPES (research D28)
├── seo/schema.ts                         # A — modificado: + localBusinessSchema(); faqPageSchema y breadcrumbSchema se reutilizan
├── analytics/events.ts                   # A — modificado: + provider_action_clicked, PROVIDER_ACTIONS, prop `provider`
└── revalidation.ts                       # A — nuevo: secretMatches compartido (se extrae de app/api/revalidate/route.ts)

components/analytics/analytics-events.tsx # A — modificado: + data-analytics-provider / data-analytics-action
next.config.ts                            # A — modificado: remotePatterns (Spaces/CDN y, si hay mapa, maps.googleapis.com)
public/llms.txt                           # A — sección "Perfiles de proveedores" (al encender el interruptor)
.env.example                              # A — + PROVIDER_PROFILE_REVALIDATE_SECRET
package.json                              # A — + scripts test:provider-profile y typecheck:provider-profile

scripts/provider-profile/
├── mock-api.mjs                          # A — servidor de prueba del contrato (nunca se empaqueta en la app)
├── tsconfig.json                         # A — mismo esquema que scripts/blog/tsconfig.json
└── __tests__/                            # A/B/C — open-status, slug, indexability, business-type, faq, metrics, analytics-attrs
```

**Regla de los módulos puros** (aprendida del repo, `scripts/blog/tsconfig.json`): los que se prueban con `node --test` **no importan nada con alias** y no tienen imports relativos con extensión `.ts` (Next no los admite); por eso son **autocontenidos**, declaran localmente los tipos mínimos que necesitan (el tipado estructural hace que `PartnerProfile` les calce) y **reciben las plantillas por parámetro**.

### Source Code — otros repositorios *(por contrato; su implementación es de cada repo)*

```text
autolibre-backend-hex/                            # dueño de los datos
├── src/shared/infrastructure/database/postgres/schema/
│     partner-slugs · partner-business-hours · partner-vehicle-types ·
│     equipment-catalog · partner-equipment · partner-service-areas  (.schema.ts)      # A / B
│     partners.schema.ts  (+ columnas: primary_category_id, locality, province, cover_*, founded_year,
│                          owner_*, phone, member_since)                                # A
├── drizzle/                                       # migraciones + función generate_partner_slug + backfill de los 46
├── src/marketplace/partner/
│     application/use-cases/{get-partner-profile,list-partner-profiles}/               # A
│     domain/read-models/partner-profile.read-model.ts                                 # A
│     infrastructure/adapters/drizzle-partner-profile.reader.ts                        # A
│     presentation/partner-profile.controller.ts  + dtos/                              # A  (@Public)
├── (aprobación)  approve_partner_application: copiar vehicle_types, mapear GNC→cng, generar slug   # A
└── autolibre-ddl-ddd.md                           # actualizar

autolibre-mobile/                                  # mejora la pantalla que YA existe
├── modules/marketplace/core/entities/ProviderDetail.entity.ts   # + campos del perfil
├── modules/marketplace/core/ports/ProviderRepository.port.ts    # + lectura por slug
├── modules/marketplace/ui/screens/ProviderDetailScreen.tsx      # + bloques; se CONSERVA el CTA, el lead y "Cómo llegar"
└── modules/marketplace/ui/components/                           # horarios, FAQ, trabajos, reseñas, métricas      # B / C

autolibre-admin/                                   # única vía de carga de datos hoy
├── ficha del partner: portada, descripción, quién atiende, año, horarios estructurados, equipamiento,
│   rubro principal, zona de cobertura                                         # A
├── vista previa del slug antes de aprobar / renombrar                          # A
├── mensaje de bienvenida copiable: URL del perfil + instrucción de Google ("Sitio web")   # A
└── llamada a POST /api/revalidate/provider al guardar                          # A
```

**Structure Decision**: la landing implementa por completo su parte (página, SEO, imagen, revalidación, analítica, lógica pura y pruebas). Los otros tres repos se coordinan **a través de los contratos** de esta carpeta, que son lo que se acuerda **antes** de que cada uno empiece. Se eligió **no** repartir la lógica de negocio de visibilidad en el cliente: el backend decide qué se publica y la web recibe el resultado resuelto.

## Phases de entrega

> `tasks.md` (siguiente comando) las desglosa en tareas con dependencias. Acá solo el orden y qué bloquea qué.

**Fase 0 — spikes y acuerdos** *(antes de escribir la página)*
1. **Spike de la imagen OG**: ¿entran Outfit + DM Sans (`ttf`) en el límite de 500 KB y generan en < 3 s? Es el único punto técnico con riesgo de forzar un rediseño.
2. **Acordar el contrato** con backend, app y panel (los 4 documentos de `contracts/`). Incluye la lista de decisiones de producto.
3. **Servidor de prueba** (`mock-api.mjs`) y *fixtures* **doradas** compartidas (casos de horario y de FAQ) para que web y app no diverjan (riesgo R3).
4. Confirmar los **slugs reales** de las 16 familias del catálogo para el mapa de `business-type.ts` (el snapshot solo trae nombres).

**Fase A — núcleo P1** *(detrás del interruptor apagado)*
- Backend: migraciones, función de slug, backfill, endpoints, ajustes de aprobación (GNC, tipos de vehículo).
- Landing: página `/p/[slug]` con bloques 1, 2, 3, 7, 8 y 10; SEO completo; imagen OG; sitemap; revalidación; analítica; `GNC` en el formulario.
- Panel: campos nuevos, vista previa de slug, mensaje de bienvenida, webhook.
- *Bloquea*: nada de la web se puede **verificar con datos reales** hasta que el backend publique el endpoint; hasta entonces, se prueba contra el mock.

**Fase B — P2 sin dominios nuevos**: preguntas frecuentes, variante sin local (zonas de cobertura), página índice `/p` y los filtros de las migas, mejoras de la pantalla de la app.

**Fase C — dominios nuevos de backend** *(fuera de este plan de construcción)*: reseñas, trabajos, métricas. La web y la app ya quedan listas por contrato.

**Fuera de este plan** (research D29): el link corto vía el Worker de Cloudflare (FR-005, opcional; el contrato solo garantiza la URL canónica a la que apuntaría), el editor para que el proveedor complete su perfil con el indicador de "perfil completo al 70%" (sugerencia no vinculante de la spec) y las páginas indexables por zona y por rubro (`/p/zona/…`).

**Puerta de lanzamiento**: encender `PROVIDER_PROFILES_PUBLIC` solo con la [lista del quickstart §5](./quickstart.md#5-puerta-de-lanzamiento-encender-provider_profiles_public).

## Riesgos principales

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | **Los datos no existen** (slug, portada, horarios, reseñas, trabajos…) y el backend es otro equipo | Contrato primero, mock, fases, interruptor |
| R2 | Indexar 46 páginas pobres daña la calidad percibida del dominio | Interruptor global + `isIndexable` por perfil + sin JSON-LD si no es indexable |
| R3 | Lógica duplicada entre web y app (estado "abierto", FAQ) diverge | Reglas escritas en el [data-model](./data-model.md) + *fixtures* doradas que pasan **ambos** repos |
| R4 | La imagen OG no entra en 500 KB | **Resuelto en la v1**: fuente por defecto de `ImageResponse` (30–75 KB); las fuentes de marca quedan como mejora pendiente (ver research, "Resultado del spike") |
| R5 | Slugs mal generados cuestan SEO al corregirlos | Backfill revisado a mano; vista previa en el panel; localidades genéricas fuera del slug |
| R6 | Logos legacy de hosts arbitrarios rompen `next/image` | `unoptimized` con dimensiones fijas + migración a Spaces |
| R7 | Función SQL de aprobación: tocarla afecta el flujo diario de operaciones | Migración con *rollback*; probar la aprobación completa en entorno de QA |
| R8 | El `Contact` de Meta se contamina con clicks de perfiles | Decisión (b) del contrato de analítica, confirmar con marketing |
| R9 | Los operadores son la única vía de carga: el perfil queda tan completo como ellos lo carguen | Alcance explícito; editor para proveedores es otra feature |
| R10 | Costo de mapas estáticos y clave de API | Mapa **solo** con coordenadas (hoy ninguno); estimar con volumen real |

## Desvíos respecto de la spec *(a confirmar con producto)*

| # | La spec dice | El plan hace | Por qué |
|---|---|---|---|
| 1 | Redirect **301** del slug viejo | **308** (`permanentRedirect`) | Next 16 emite 308; Google los trata igual. 301 exigiría `proxy.ts` sin beneficio |
| 2 | Título `… \| AutoLibre` | `… · AutoLibre` | El layout del repo usa `·`; `AGENTS.md` pide no incluir la marca en el `title` |
| 3 | Zona de cobertura con **mapa del área** | Solo **lista de localidades** | No existe geometría de cobertura; solo texto |
| 4 | "Pedir propuesta" **llega a ese proveedor** | **Atribución** en la v1 (`/pedido?proveedor=<slug>`) | El backend no tiene pedidos dirigidos a un partner puntual |
| 5 | Migas `Proveedores › Localidad › Rubro › Nombre` | Igual, **más una página `/p`** que no estaba en la tarjeta | Un `BreadcrumbList` exige URL en cada nivel y esas páginas no existen |
| 6 | Botón "Hacerlo mi taller de cabecera" | **Omitido** hasta que exista la función | No existe en la app ni en el backend |
| 7 | "Llamar" | Usa el número de **WhatsApp** | `partners` no tiene teléfono aparte |
| 8 | "Íconos Phosphor" | Íconos de línea 24×24 **del propio diseño** | Phosphor es de 256 px con relleno y `Icon` es 24 px con trazo (research D23) |

## Decisiones de producto pendientes

Las 9 están en [research.md · lista única](./research.md#lista-única-de-decisiones-de-producto-pendientes): 308 vs 301 · página índice `/p` · `Contact` de Meta · zona sin mapa y costo de mapas · "Pedir propuesta" dirigido o atribución · dos paletas de superficie · WhatsApp que recibe llamadas · umbrales de métricas · perfil gratis vs suscripción.

## Complexity Tracking

> Solo lo que se aparta de la constitución o suma complejidad que hay que justificar.

| Desvío | Por qué hace falta | Alternativa más simple descartada porque… |
|---|---|---|
| **Cuatro repositorios** con cambios | La spec exige web **y** app; los datos viven en el backend; el panel es la **única** vía de carga | Una sola landing con datos fijos o leídos de la base rompería el límite de repos y no resolvería la app |
| **Pie propio** (banda de AutoLibre; el header es el global desde la spec 210) | FR-025 pide una banda con la URL del perfil, "Descargá AutoLibre" y "Sumá tu negocio" | Reusar `SiteFooter` pierde la URL del perfil y la llamada a la acción propia |
| **Hex en estilos en línea** en la imagen OG | Satori no entiende clases de Tailwind ni variables CSS | No hay alternativa dentro de `ImageResponse`; las constantes **espejan** los tokens (`og-tokens.ts`) |
| **Tokens de superficie nuevos** que se superponen en intención con `surface`/`line` | El sistema "AutoLibre AI" (`#F1F2F0`, `#FEFEFD`, `#E4EAE4`) no coincide con el de la landing | Pisar los tokens existentes cambiaría todo el sitio |
| **Fuentes de la imagen OG** como archivos propios (`lib/provider-profile/fonts/`), no `next/font` | `ImageResponse` (Satori) no puede usar `next/font` ni CSS; necesita el binario de la fuente | Cargar las fuentes por `fetch` en cada render suma latencia y un punto de falla externo |
| **Dos islas cliente** (`OpenStatusBadge`, `ShareButton`) | El estado depende de la hora actual y compartir usa API del navegador | Renderizar el estado en el servidor lo hace falso entre revalidaciones; hacer toda la sección cliente viola I |
| **Servidor de prueba del contrato** en `scripts/` | El backend no tiene los endpoints todavía | Esperar al backend bloquea toda verificación |
| **Página `/p`** fuera de la tarjeta | Las migas exigen URLs reales | Migas sin enlaces incumplen FR-034; ver desvío 5 |
