# Research: Perfil público de proveedor (web + app)

**Feature**: `209-public-provider-profile` · **Fecha**: 2026-10-07 · **Spec**: [spec.md](./spec.md)

Esta fase salió de leer el código real de los cuatro repositorios que toca la feature —no de suposiciones—:
`autolibre-landing-page` (este), `autolibre-backend-hex` (API), `autolibre-mobile` (app) y `autolibre-admin` (panel de operadores). Cada decisión cita su evidencia. Las que dependen de producto están marcadas **[DECISIÓN DE PRODUCTO]** y aparecen otra vez al final, en una sola lista.

---

## 0. Hallazgo que ordena todo: el backend ya publica un directorio, pero le falta casi todo lo que la spec pide

`autolibre-backend-hex` ya expone `GET /api/v1/partners` y `GET /api/v1/partners/:id`, ambos públicos (`@Public()`), solo para partners `active` (los pausados y archivados responden 404 igual que un id inexistente). La app móvil ya los consume en `ProviderDetailScreen`.

Contraste entre lo que la spec necesita y lo que existe hoy:

| Bloque de la spec | ¿Existe hoy? | Evidencia |
|---|---|---|
| Nombre, descripción, logo, WhatsApp, dirección, rubros, marcas, combustibles, links, sello (`tier = founding`) | **Sí** | `partner-detail.read-model.ts`, `partners.schema.ts`, `partner-links.schema.ts` |
| **Slug** (nombre + localidad) y su historial | **No** — el identificador público es un UUID | `partners.schema.ts` no tiene columna |
| **Portada** | **No** | no hay columna ni tabla de imágenes del partner |
| **Horarios estructurados** | **No** — `hours` es texto libre | el propio read-model dice: "no alcanza para calcular 'abierto ahora'… necesita `partner_business_hours`, que todavía no existe" |
| **Geo** (coordenadas) | Columnas sí, **datos no** | `latitude IS NULL` en los 40 partners activos (`autolibre-admin/.claude/rules/partners-coverage.md`); `idx_partners_geo` marcado pendiente |
| **Localidad** | Solo `coverage_zone`, texto libre y sucio | 29 valores distintos para 40 partners ("Pacheco" y "General Pacheco", "A confirmar", "Nacional") |
| **Rubro principal** | **No** — hay muchos rubros y ninguno es "el principal" | `partner_services` es una lista plana |
| **Tipos de vehículo** | Se capturan en el alta (`vehicle_types`) pero **no llegan a `partners`** | `partner-applications.schema.ts` vs `partners.schema.ts` |
| **Equipamiento**, **quién atiende**, **año de inicio** | **No** | sin columnas |
| **Reseñas** | **No existen en ningún repositorio** | `grep review|rating|stars` sin resultados en `src/` ni `drizzle/` |
| **Trabajos registrados** | **No** — `maintenance_occurrences` no referencia a un partner | única referencia es un comentario |
| **Métricas** | **Parcial**: hay `ops.quote_request_response` (propuestas) desde 2026-09-22, cargadas por operadores | `autolibre-admin/.claude/plans/metricas-tiempo.md`; no hay dato de "tiempo de respuesta" ni "tasa" por partner |
| "Aliado de AutoLibre" | **Sí** | `tier = 'founding'` |
| "En AutoLibre desde" | **Parcial** — `created_at`, pero engañoso en los partners migrados de la planilla | `partners.source` distingue `legacy_sheet` |
| Teléfono para "Llamar" | **No** — solo `whatsapp` | sin columna `phone` |

**Consecuencia para el plan**: la feature no es "armar una página" sino "armar una página **y** un contrato de datos que hoy no existe". Por eso el plan se organiza en fases (D1) y las historias P2 de la spec que dependen de datos inexistentes (reseñas, trabajos, métricas) quedan **diseñadas por contrato pero no construidas en datos**.

---

## D1. Entrega en fases, con interruptor de publicación

**Decisión**: tres fases y un interruptor `PROVIDER_PROFILES_PUBLIC` (constante, mismo patrón que `BLOG_PUBLIC` en `lib/blog/visibility.ts`).

- **Fase A — núcleo P1 (con interruptor apagado hasta que haya datos)**: slug + endpoint de perfil + horarios estructurados + portada + localidad; página web con los bloques 1, 2, 3, 7, 8 y 10; SEO completo; imagen de vista previa; sitemap; revalidación; analítica.
- **Fase B — P2 sin dependencias de datos nuevos**: preguntas frecuentes, variante sin local, página índice `/proveedor`, pantalla de la app.
- **Fase C — P2 que necesita dominios nuevos del backend**: reseñas, trabajos, métricas. **Fuera de este plan de construcción**; acá solo se fija el contrato para que la web y la app queden listas.

**Por qué**: el interruptor no es cosmética. En producción hay **46 partners activos** con datos ralos; publicar 46 páginas casi vacías y declararlas indexables es el riesgo de SEO más grande de la feature (contenido pobre). El patrón del blog resuelve exactamente esto: el interruptor apaga **a la vez** `noindex`, sitemap y links; apagar solo uno manda señales contradictorias (así lo documenta `lib/blog/visibility.ts`).

**Alternativas descartadas**: (a) construir todo y publicar de una — arriesga indexar páginas pobres y bloquea el lanzamiento detrás de tres dominios nuevos del backend; (b) hacer solo la página web — la spec exige que la app muestre lo mismo y la app ya tiene una pantalla que hay que mejorar, no reemplazar.

---

## D2. Contrato de datos: endpoint nuevo por slug, no extender el de UUID

**Decisión**: sumar al contexto `marketplace/partner` del backend (mismo bounded context, mismo patrón de `QueryBus` + read-model) tres lecturas públicas:

- `GET /api/v1/partner-profiles/:slug` → el perfil completo, o `{ status: "moved", slug }` si el slug es histórico, o 404.
- `GET /api/v1/partner-profiles` → listado paginado (alimenta el sitemap y la página `/proveedor`).
- Contrato completo en [contracts/partner-profile-api.md](./contracts/partner-profile-api.md).

**Por qué no extender `GET /partners/:id`**: ese endpoint tiene un comentario explícito sobre por qué el listado y el detalle son proyecciones distintas ("el listado paga por lo que solo usa el detalle"), y un test del documento OpenAPI que asserta la lista completa de campos para forzar la conversación. Mezclar slugs, horarios estructurados y reseñas ahí rompería ese contrato con la app instalada. Un recurso nuevo no cambia nada de lo que la app ya consume. El `id` UUID sigue valiendo para la app; el `slug` es la identidad **pública** (URL).

**Por qué la respuesta "moved" va en el cuerpo (200) y no como un 301 del backend**: la landing llama al backend servidor-a-servidor; un 3xx obligaría a configurar `redirect: "manual"` y leer `Location`. Un cuerpo explícito es más simple de probar y no depende de cómo cada cliente HTTP trate los redirects.

**Alternativas descartadas**: GraphQL o endpoint por bloque — más viajes y más superficie sin beneficio con un solo consumidor SSR; leer la base directo desde la landing — rompe el límite de repos (la landing nunca toca la base) y duplica reglas de visibilidad.

---

## D3. Slug: se guarda, no se calcula al vuelo, y vive en una tabla propia

**Decisión**: tabla `partner_slugs (slug PK, partner_id FK, is_current bool, created_at)` con un índice único parcial que permite **un solo** `is_current` por partner. El slug vigente y los históricos comparten la misma clave primaria.

**Por qué una tabla y no una columna `slug` + otra tabla de historial**: con dos tablas, nada impide que el slug histórico de A coincida con el vigente de B (redirigiría al partner equivocado). Una sola PK sobre todos los slugs lo hace imposible por construcción.

**Regla de formación** (detalle en [data-model.md §3.1](./data-model.md#31-slug)): `slugify(nombre)` + `-` + `slugify(localidad)`; minúsculas, sin tildes, guiones. Colisión: sufijo numérico determinístico (`-2`, `-3`) asignado una vez y estable.

**Dónde se genera**: la aprobación de un partner la ejecuta una **función SQL** (`approve_partner_application`) invocada desde el panel de operadores, no código del backend (`autolibre-admin/.claude/rules/partner-approval.md`). Por eso el slug se genera en la base (función `generate_partner_slug`) y se invoca desde la aprobación y desde un **backfill** para los 46 existentes. El panel muestra una vista previa antes de confirmar.

**Riesgo conocido**: la localidad hoy sale de `coverage_zone`, que es sucia. Regla de resguardo: valores genéricos ("A confirmar", "Nacional", vacío) **no entran al slug**; el slug queda solo con el nombre. Cuando llegue la localidad estructurada de la spec `004-partner-approval-data` (geocode con localidad y provincia), esa pasa a ser la fuente. **Cambiar un slug después de publicado cuesta SEO** (redirects), así que el backfill se revisa a mano antes de encender el interruptor.

---

## D4. Horarios estructurados, y el estado "abierto ahora" se calcula en una isla chica

**Decisión (datos)**: tabla `partner_business_hours (partner_id, weekday 1..7 ISO, opens_minute 0..1439, closes_minute 1..1440)`, varias filas por día para el horario cortado. Minutos desde medianoche, enteros: sin `time`, sin husos, sin ambigüedad con "24:00". No se permite cruzar medianoche en una fila (un salón que cierra 02:00 se carga como dos tramos).

**Decisión (render)**: la página es estática con revalidación, y **"Abierto · cierra 18:00" depende de la hora actual**, así que no puede salir del HTML cacheado. Se resuelve con una isla cliente mínima (`OpenStatusBadge`) que recibe los horarios por props, calcula con `Intl.DateTimeFormat` en `America/Argentina/Buenos_Aires` (sin dependencias) y resalta el día de hoy. El servidor renderiza el **horario semanal completo como texto** (eso sí es contenido indexable) y deja un hueco de alto fijo para el badge, para no generar salto de diseño (CLS < 0,1).

**Por qué no render dinámico por request**: perder el caché estático del perfil por un badge empeora TTFB y LCP en todas las visitas, y el estado "abierto" no es contenido que un buscador deba indexar (sería falso apenas pasa la hora).

**Por qué no parsear el texto libre existente**: la propia app lo rechazó con razón (`ProviderDetailScreen.tsx`: "el primer `Lun a Vie 9 a 18hs y Sab AM` deja 'Cerrado' sobre un taller abierto, que es peor que no decir nada"). Se hace migración **manual asistida** de los 46 horarios desde el panel.

**Alternativas descartadas**: calcular el estado en el servidor con `revalidate` corto (sigue siendo falso entre revalidaciones); `<meta refresh>`; un servicio externo de horarios.

---

## D5. Renderizado y caché: estático con revalidación por tiempo **y** por evento

**Decisión**:
- `app/proveedor/[slug]/page.tsx` con `generateStaticParams` (slugs del listado) y `dynamicParams = true` (los nuevos se generan en el primer request), exactamente como `app/blog/[category]/[slug]/page.tsx`.
- Las llamadas al backend usan `fetch` con `next: { revalidate: 600, tags: ["provider-profiles", "provider:<slug>"] }`. **600 s = el tope de 10 minutos de SC-007** aunque falle el aviso.
- Aviso por evento: ruta `POST /api/revalidate/provider` (mismo esquema que la ruta existente de Hygraph: secreto en header, comparación en tiempo constante, `revalidateTag(tag, { expire: 0 })`). Contrato en [contracts/revalidation-webhook.md](./contracts/revalidation-webhook.md).
- **Semántica de error** (copiada de `getPostBySlug`): backend caído → **tira** (Next sigue sirviendo la última página buena y reintenta); slug inexistente → `notFound()`. Devolver `null` ante un error de red convertiría una caída en un 404 cacheado.
- El build no puede fallar si el backend no responde: `generateStaticParams` devuelve `[]` y loguea (igual que `getPosts()` del blog).

**Quién avisa**: quien escribe el dato. Hoy las escrituras de partners salen del **panel de operadores** (`ops-write-actions.md`), así que el panel llama al webhook al guardar. Si algún día los proveedores editan solos, el backend toma esa responsabilidad.

---

## D6. Redirect del slug viejo: `permanentRedirect` (308), no 301

**Decisión**: `permanentRedirect()` de Next, que responde **308**. La spec dice "redirect 301".

**Por qué**: la doc de Next 16 lo confirma ("`permanentRedirect`… will serve a 308 (Permanent) HTTP redirect"); 301 y 308 son ambos redirects permanentes y Google los trata igual para transferir señales de indexación. La diferencia real (308 preserva el método HTTP) no afecta a un `GET` de página. Forzar 301 exigiría un `proxy.ts` o un Route Handler propio por un beneficio nulo.

**[DECISIÓN DE PRODUCTO]** informativa: confirmar que 308 es aceptable. Si hay un requisito duro de 301, se agrega una tarea de `proxy.ts`.

---

## D7. Una página pobre no se indexa: regla de "indexable" por perfil

**Decisión**: función pura `isIndexable(profile)` en `lib/provider-profile/indexability.ts`. Un perfil es indexable solo si tiene, como mínimo: descripción, al menos un servicio, horarios estructurados y (dirección **o** zona de cobertura). Si no lo es, la página existe y funciona pero lleva `noindex`, **no entra al sitemap** y no declara datos estructurados de negocio. El interruptor global (D1) manda sobre todo.

**Por qué**: es la defensa contra contenido pobre a escala (46 hoy, más mañana). Y es coherente con FR-036 de la spec: no declarar lo que no se muestra.

**Alternativas descartadas**: indexar todo y confiar en que "cuanto más páginas mejor" — con datos ralos arrastra la calidad percibida del dominio entero.

---

## D8. Migas de pan: las páginas intermedias no existen

**Hallazgo**: la spec pide `Proveedores › Localidad › Rubro › Nombre`, visible y como `BreadcrumbList`. Pero **ninguna** de esas tres páginas intermedias existe: `/proveedores` es la página de **alta** de talleres ("Sumá tu taller a AutoLibre"), no un directorio. Un `BreadcrumbList` exige URL en todos los niveles menos el último.

**Decisión (propuesta)**: crear una página índice mínima `/proveedor` ("Proveedores en AutoLibre") que reutiliza el listado público; "Proveedores" enlaza ahí. Los niveles "Localidad" y "Rubro" enlazan a `/proveedor?zona=<slug>` y `/proveedor?rubro=<slug>`, que son **filtros con `noindex` y canonical a `/proveedor`** (mismo criterio de "una sola URL indexable" que se aplicó al blog). Páginas indexables por zona y por rubro (`/proveedor/zona/…`) quedan como mejora posterior y serían un buen activo de SEO local.

**[DECISIÓN DE PRODUCTO]**: confirmar `/proveedor` como parte de esta feature (es alcance nuevo, no estaba en la tarjeta). Si no se aprueba, la alternativa es mostrar las migas sin enlaces intermedios y declarar el `BreadcrumbList` solo con `Inicio › Nombre`, incumpliendo FR-034 parcialmente.

---

## D9. Rubro principal y tipo de negocio de schema.org

**Decisión**: columna `partners.primary_category_id` (nullable, FK a `service_categories`); mientras sea nula, **derivada**: la familia con más servicios del partner, desempate por posición en el catálogo. Mapeo de las 16 familias a tipos de schema.org en un único archivo `lib/provider-profile/business-type.ts`, con **`AutomotiveBusiness` como valor por defecto**:

| Familias del catálogo | Tipo schema.org |
|---|---|
| Motor · Electricidad y electrónica · Tren rodante y frenos · Transmisión · Climatización | `AutoRepair` |
| Neumáticos y llantas | `TireShop` |
| Estética (lavado y detailing) | `AutoWash` |
| Carrocería y cristales | `AutoBodyShop` |
| Repuestos e insumos · Accesorios y equipamiento | `AutoPartsStore` |
| Trámites y documentación · Asistencia y emergencias · Seguridad y rastreo · Seguros y siniestros · Compra-venta y valuación · Financiación | `AutomotiveBusiness` |

**Por qué un mapa y no lógica por nombre**: las claves son los **slugs** de `service_categories` (sin leer los nombres). Se agrega una prueba que falla si aparece una familia nueva sin mapear, para que nunca caiga en silencio al genérico. *(Los slugs exactos se confirman contra el catálogo real en la primera tarea: el snapshot `service-catalog-taxonomy.csv` trae nombres, no slugs.)*

---

## D10. Imágenes: alojarlas en infraestructura propia

**Hallazgo**: `partners.logo_url` es una **URL cruda que viene de la planilla** ("los logos vienen de la planilla"), de hosts arbitrarios. `next/image` solo optimiza hosts declarados en `remotePatterns` (hoy: Vercel Blob y `*.graphassets.com`).

**Decisión**: las imágenes nuevas (portada, foto de quien atiende, trabajos) se suben a DigitalOcean Spaces (ya es el storage del backend) y se sirven con `url + width + height`. Se agrega **un** host al `remotePatterns`. Los logos legacy de hosts desconocidos se migran a Spaces en el backfill; mientras tanto se renderizan con `unoptimized` y `width/height` fijos (Constitución IV exige dimensiones explícitas siempre).

**LCP**: la portada es la imagen más grande de la primera pantalla → única con `preload` (nunca `priority`, deprecado en Next 16).

---

## D11. Imagen de vista previa (OG): Route Handler con `ImageResponse`

**Decisión**: `app/proveedor/[slug]/og/route.tsx` con `ImageResponse` de `next/og` (incluido en Next: **cero dependencias nuevas**). Se referencia desde `createMetadata({ image: … })`.

**Por qué un Route Handler y no el archivo `opengraph-image.tsx`**: `createMetadata()` siempre escribe `openGraph.images` y `twitter.images`; la doc de Next no dice cuál gana si conviven con la convención de archivo. Un Route Handler explícito, enlazado por `createMetadata`, no deja ambigüedad y respeta la regla del repo de no armar `Metadata` a mano.

**Restricciones de la API (doc de Next 16)**: solo flexbox (sin `grid`); fuentes `ttf`/`otf`/`woff` (**no `woff2`**); **bundle máximo de 500 KB** que incluye JSX, fuentes e imágenes; las imágenes remotas (logo, portada) se piden en runtime.

**Riesgo → primera tarea de spike**: Outfit + DM Sans en `ttf` estático (dos pesos cada una) tienen que entrar en el presupuesto de 500 KB junto con el diseño; las imágenes del proveedor se descargan al generar. Si no entra: una sola familia o fuentes por `fetch`. Se mide **antes** de construir el resto de la imagen.

**Degradación**: logo, portada o reseñas ausentes → fondo neutro y layout que sigue siendo legible (FR-042); texto largo se recorta; si una imagen remota falla, se omite sin romper la tarjeta. Caché: `revalidate` + el mismo tag del perfil, para que la tarjeta se renueve junto con la página.

**Nota de diseño**: Satori no entiende clases de Tailwind ni tokens CSS, así que la imagen usa estilos en línea con constantes que **espejan** los tokens (`lib/provider-profile/og-tokens.ts`). Es una excepción técnica a la regla de "sin hex sueltos", documentada en *Complexity Tracking*.

---

## D12. Analítica por proveedor, con el catálogo único del sitio

**Hallazgo**: `lib/analytics/events.ts` es el catálogo **único** ("cualquier evento nuevo se agrega acá primero") y `AnalyticsEvents` captura clicks por atributos `data-analytics-*` de una lista cerrada, para que los links medidos sigan siendo Server Components.

**Decisión** (cumple SC-008):
- El WhatsApp del perfil reutiliza `whatsapp_clicked` con `placement: "provider_profile"` (o `"provider_profile_sticky"`).
- Evento nuevo `provider_action_clicked` con `action ∈ { call, directions, proposal, share }` (solo PostHog, `meta: () => null`).
- Un prop nuevo `provider` (slug) en ambos, vía atributo nuevo `data-analytics-provider`, **validado con regex de slug** en el listener (mismo criterio que `lead_source` y `store`: lo que no está en la lista se descarta). `action` también es lista cerrada.
- El slug es un identificador de **negocio público**, no un dato personal: no viola la regla "nunca datos personales en los props".
- `share` es una isla cliente, así que dispara `track()` directo.

**Punto a vigilar**: hoy `whatsapp_clicked` sin `lead_source` se mapea al evento estándar `Contact` de Meta. Un click de WhatsApp en el perfil de un proveedor mandaría ese `Contact` al Pixel. Es coherente semánticamente, pero **conviene confirmar con marketing** que no ensucie la audiencia de la campaña. Contrato en [contracts/analytics-events.md](./contracts/analytics-events.md).

---

## D13. Preguntas frecuentes: plantillas deterministas, sin LLM en la v1

**Decisión**: módulo puro `lib/provider-profile/faq.ts` que recibe el perfil y devuelve `FaqItem[]`. Las plantillas de pregunta y respuesta viven en `lib/content/provider-profile.ts` (copy en la capa de contenido). **Una sola lista** alimenta el acordeón visible y el `FAQPage` de JSON-LD, así que no pueden divergir (FR-033, FR-036).

**Reglas**: una plantilla se evalúa solo si existe el dato (FR-024). **Cuidado con el vacío**: en el backend `brands: []` significa "todas las marcas" y `fuelTypes: []` "todos". Por eso:
- Marcas: si hay lista explícita → una pregunta por cada marca declarada ("¿Atienden autos Peugeot?" → sí, estas son las marcas); si está vacía → una sola pregunta general ("¿Atienden todas las marcas?" → sí, es generalista). **Nunca** se genera una pregunta negativa por una marca no listada.
- GNC: solo cuando el partner **declara** GNC en combustibles. Con `fuelTypes` vacío no se afirma que atienda GNC (sería inventar).
- Horarios: "¿Abren los sábados?" se responde sí/no desde los tramos estructurados, con los horarios.

**Por qué sin LLM**: la spec lo permite pero no lo exige; las plantillas ya producen respuestas correctas, no cuestan por request y no introducen una segunda fuente de verdad. Si más adelante se quiere redacción natural, entra como mejora sin tocar la lógica.

---

## D14. Métricas: bloque oculto hasta que existan datos y umbrales

**Decisión**: función pura `selectVisibleMetrics(metrics, thresholds)` en `lib/provider-profile/metrics.ts`. Los umbrales viven en un objeto tipado cuyos valores son `null` hasta que producto los defina; **con un umbral `null` la métrica no se muestra**. Con todos nulos, el bloque no aparece (el valor por defecto seguro que fijó la spec).

**Honestidad del dato**: las "propuestas" de hoy las **consiguen los operadores llamando a los talleres** (`quote-request-proposals.schema.ts`: "lo que el operador CONSIGUIÓ llamando"). Rotularlas "Propuestas enviadas" por el proveedor **es una interpretación**: es lo que ese taller cotizó cuando AutoLibre le preguntó. Y **no existe** ninguna fuente para "tiempo de respuesta" ni "tasa de pedidos respondidos" por partner. Por eso las métricas van en la Fase C y la redacción final de cada etiqueta la valida producto.

---

## D15. Reseñas y trabajos: contrato definido, construcción en otra feature

**Hallazgo**: no hay modelo de reseñas en ningún repo, y "Cargado por el taller" necesita una pantalla de carga para proveedores que **tampoco existe** (no hay portal ni app de proveedores).

**Decisión**: se fijan las formas `ProviderReviews` y `ProviderWorks` en el contrato (campos opcionales) y la web las renderiza **solo si llegan con contenido**. La construcción del dominio (tablas, moderación, consentimiento del cliente para mostrar un trabajo, carga de fotos) es una feature de backend propia, con su spec. La web no necesita cambios cuando llegue.

**Aviso de SEO**: Google puede no mostrar estrellas enriquecidas para reseñas de un negocio que aloja el propio sitio. Las de AutoLibre son de terceros sobre negocios ajenos (más cercano a un directorio), pero no está garantizado. No bloquea nada: se declaran igual, y solo si son visibles (FR-036).

---

## D16. Compartir

**Decisión**: botón "Compartir" como isla cliente: `navigator.share({ title, url })` cuando existe (móvil); si no, copia la URL canónica al portapapeles y avisa en una región `aria-live`. En la app, `Share` de React Native con la URL pública construida desde `slug`.

---

## D17. Mapa: solo cuando hay coordenadas, y sin mapa de área en la v1

**Hallazgo**: **hoy ningún partner tiene coordenadas** (producción, 2026-09), y no hay geometría de cobertura de ningún tipo (solo texto).

**Decisión**:
- **Con local y con coordenadas**: imagen estática de mapa (Google Static Maps; la landing ya usa una clave de Google Maps para Places). Es más liviana que un iframe y no trae JS de terceros, que importa para Core Web Vitals. Declarada en `remotePatterns`, con `width`/`height`/`alt`.
- **Con local sin coordenadas** (el caso de hoy): sin mapa; dirección en texto y "Cómo llegar" por búsqueda de Maps por dirección, **igual que la app** (`BuildProviderDirectionsUrl.usecase`).
- **Sin local**: lista de localidades **sin** mapa de área. **Desvío respecto de la spec (FR-023)**, que pide "mapa con el área": no hay datos para dibujarla.

**[DECISIÓN DE PRODUCTO]**: aceptar el desvío del mapa de área, y confirmar el costo de la API de mapas estáticos.

---

## D18. Cómo entran los datos: el panel de operadores, no los proveedores

**Hallazgo**: no hay portal de proveedores. Los datos nuevos (portada, descripción, quién atiende, horarios estructurados, equipamiento, año de inicio, rubro principal) solo pueden cargarse hoy desde `autolibre-admin`, y la regla del repo es que las escrituras pasan por **funciones de la base**, no SQL a mano.

**Decisión**: la Fase A incluye extender la ficha del partner en el panel con esos campos, la vista previa del slug, y un **mensaje de bienvenida copiable** con la URL del perfil y la instrucción de ponerla como "Sitio web" en Google (cumple FR-037; la aprobación ya genera un mensaje de WhatsApp para el proveedor, migración `0105`). Un editor para que el proveedor complete su perfil es otra feature.

---

## D19. Lo que la landing necesita para que "Pedir propuesta" funcione de verdad

**Hallazgo**: el flujo de pedido existente (`/pedido`, `POST /api/v1/quote-requests`) no tiene el concepto de "pedido dirigido a un proveedor puntual".

**Decisión (v1)**: "Pedir propuesta" lleva a `/pedido?origen=perfil&proveedor=<slug>`. El slug viaja solo como **atribución** (analítica); no cambia a quién le llega el pedido. Dirigirlo de verdad requiere un campo nuevo en el backend (`target_partner_id` opcional en `quote_requests`) y que el panel de operadores lo muestre. Queda como dependencia explícita, no como supuesto escondido.

**[DECISIÓN DE PRODUCTO]**: ¿alcanza la atribución en la v1, o "dirigido" es requisito de lanzamiento?

---

## D20. Pruebas: el patrón del repo, sin dependencias nuevas

**Hallazgo**: el repo no usa Jest ni Vitest. Tiene `npm run test:blog` = `node --test` con **type stripping nativo** de Node 22, y un `tsconfig` aparte (`scripts/blog/tsconfig.json`) para tipar esos módulos. Los módulos puros que comparten la app y los tests (`lib/blog/faq.ts`) **no importan nada con alias** y los tests los importan por ruta relativa con `.ts`.

**Decisión**: replicar el patrón. La lógica determinística (horario, preguntas frecuentes, métricas, indexabilidad, tipo de negocio, validación de slug) va en módulos **autocontenidos** de `lib/provider-profile/`, con tests en `scripts/provider-profile/__tests__/` y un script `test:provider-profile`. **Cero dependencias nuevas.**

**Lo que NO cubre**: render de componentes y validación de datos estructurados contra Google; eso va en la lista de verificación del [quickstart](./quickstart.md).

---

## D21. Encabezado global y pie propio de la página

> **Revisada el 2026-10-07** por la spec [`210-header-hero-clarity`](../210-header-hero-clarity/spec.md) (FR-016 y FR-020): el feedback en video marcó que el header cambia entre páginas y desorienta. Producto decidió que **el header es el mismo en todas las páginas**. La decisión original (encabezado propio) queda reemplazada.

**Decisión**: la página usa el **`SiteHeader` global** del sitio (el mismo conjunto de links y orden que el resto de las páginas) y mantiene la **banda de pie propia** (banda oscura con la URL del perfil, "Descargá AutoLibre", "Sumá tu negocio" y enlaces a Términos y Privacidad, porque la página es pública y recolecta clicks de contacto). Ya **no** hay `site-bar.tsx`.

**Por qué**: un header que cambia al navegar desorienta (spec 210, historia 4). Costo asumido: el menú del sitio (Producto, Cómo funciona, FAQ, Blog, Pedir presupuesto…) aparece sobre una página que el proveedor quiere usar como **su web**; el sello y el cromado del perfil quedan debajo del header global. Si más adelante se quiere una versión "sin cromado de AutoLibre" para compartir, sería una decisión nueva y separada.

**Pie**: la decisión del feedback es solo sobre el header. El pie propio se mantiene; si producto quiere unificarlo también, se revisa FR-025 de la spec 209.

**Alineación**: el `SiteHeader` usa `Container size="wide"` (1440 px). La grilla de la página pasa a `size="wide"` para que los bordes sigan alineados con el header y el pie (AGENTS §9).

---

## D22. Tokens del sistema de diseño "AutoLibre AI"

**Hallazgo**: el sistema "AutoLibre AI" (de la app) y los tokens de la landing **no coinciden**: lienzo `#F1F2F0` y tarjetas `#FEFEFD` con borde `#E4EAE4`, frente a `surface #ffffff` / `surface-muted #eaf3ec` / `line #eaf3ec` de la landing. Tipografías y verde de marca sí coinciden (Outfit, DM Sans, `#2A8C3A`; la landing usa el mismo verde como `--color-brand`).

**Decisión**: agregar al `@theme` de `app/globals.css` los tokens que faltan (`canvas`, `card`, `card-line`, estados de OK y sus fondos, radios de 12/20 si no existen), con nombres propios que **no pisen** los existentes. Nada de hex en clases (Constitución VIII).

**[DECISIÓN DE PRODUCTO / DISEÑO]**: confirmar que el perfil público debe seguir el sistema de la app y no el de la landing. La spec (FR-050) lo manda; el costo es que la web tendrá dos paletas de superficie.

---

## D23. Íconos

**Decisión**: la Constitución prohíbe librerías de íconos y exige SVG en línea en `components/ui/icon.tsx`; la spec pide Phosphor. **Phosphor "regular" no calza tal cual**: sus íconos son de `viewBox` 256 y con relleno, y `Icon` dibuja todo en 24×24 con trazo (`fill="none"`, `stroke="currentColor"`). Importarlos exigiría soporte de `viewBox` y relleno por ícono, cambiando un componente que usa todo el sitio.

Lo que sí calza: **los íconos de línea 24×24 del propio artboard de diseño** (teléfono, navegación, compartir, estrella, calendario, sello, flecha de acordeón, rayo, cámara…), que tienen exactamente el estilo de trazo de `Icon`. Se copian sus trazados al registro (los que faltan: `phone`, `navigation`, `share`, `star`, `instagram`, `globe`, `shield-check`, `calendar`, `chevron-down`, `bolt`, `camera`). Sin dependencia. **Desvío menor de FR-050** ("Íconos Phosphor"): el lenguaje visual es el mismo de línea; confirmar con diseño. La estrella rellena se logra con `className="fill-current"` sobre el `<svg>`.

---

## D24. La app: mejorar la pantalla que ya existe

**Decisión**: no se crea una pantalla nueva. `app/(tabs)/servicios/[partnerId].tsx` → `ProviderDetailScreen` pasa a consumir el endpoint por slug (el listado ya conoce el `slug` una vez que el backend lo exponga) y suma, por bloque, lo que falte. Ya existen el CTA anclado de WhatsApp, el registro de `lead` al contactar, "Cómo llegar" por dirección y la lógica de especialidades condicionales — se **conservan**.

**Dependencia nueva descubierta**: la spec pide el botón "Hacerlo mi taller de cabecera" que "conecta con la función de taller de cabecera". **Esa función no existe** (ni en la app ni en el backend). El botón se omite hasta que exista; no se inventa su comportamiento.

---

## D25. Teléfono para "Llamar"

**Hallazgo**: `partners` tiene `whatsapp` pero no `phone`.

**Decisión (v1)**: "Llamar" usa el número de WhatsApp en formato E.164 (`tel:+54…`), y `telephone` del JSON-LD sale del mismo dato. Se agrega `phone` opcional al modelo para cuando un proveedor tenga un fijo distinto. **[DECISIÓN DE PRODUCTO]**: confirmar que los números de WhatsApp de los proveedores atienden llamadas.

---

## D26. "En AutoLibre desde" no se puede inferir siempre

**Hallazgo**: `partners.created_at` es la fecha de alta **solo** para los que entraron por solicitud (`source = 'application'`). Para los migrados de la planilla (`legacy_sheet`) es la fecha de la migración, y mostrarla como "En AutoLibre desde" sería falso.

**Decisión**: el backend devuelve `memberSince` solo para `source = 'application'` (o cuando un operador lo cargue); en los demás casos va `null` y la web omite el dato. Cumple la regla de la spec de no mostrar datos inventados.

---

## D27. Seguridad y privacidad de lo que muestra una página pública

- **Validación del slug** antes de llamar al backend: `^[a-z0-9]+(?:-[a-z0-9]+)*$`, máximo 120 caracteres; cualquier otra cosa es `notFound()` sin tocar el backend.
- **Texto del proveedor es no confiable**: se renderiza como texto (React escapa); la meta descripción se recorta; el JSON-LD pasa por `JsonLd`, que ya escapa `<`.
- **Links del proveedor** (web propia, redes): solo `http(s)`, con `rel="nofollow ugc noopener noreferrer"` (no se le transfiere autoridad a un destino que no controlamos).
- **WhatsApp**: el backend entrega `whatsappContactUrl` ya armado (derivado, nunca guardado); la web valida que el host sea `wa.me` antes de usarlo.
- **No se expone** el email del partner (la spec no lo pide; el endpoint legacy sí lo devuelve y no hace falta ampliar esa superficie).
- **Reseñas y trabajos**: nunca patente, apellido completo ni datos de contacto del cliente (FR-017, FR-018).

---

## D28. Dos brechas del alta que la spec no veía

Al cruzar el formulario de `/proveedores` con el backend aparecieron dos cosas que rompen ejemplos de la propia spec:

1. **GNC no se puede declarar.** El backend ya soporta `FuelType.CNG = 'cng'`, pero `PROVIDER_FUEL_TYPES` (`lib/content/providers.ts`) ofrece solo *Nafta, Diesel, Híbridos, Eléctricos*. Hoy ningún proveedor puede decir que trabaja con GNC, así que "¿Trabajan con autos con GNC?" **no se generaría nunca**. → Tarea en **esta** landing: sumar "GNC" al formulario y verificar que la aprobación lo traduzca a `cng`.
2. **Los tipos de vehículo se capturan y se pierden.** El alta guarda `vehicle_types` (*Autos, SUVs, Pickups, Motos*) en `partner_applications`, pero `partners` no tiene dónde ponerlos y la aprobación no los copia. → Tabla `partner_vehicle_types` y mapeo etiqueta → enum en el flujo de aprobación (coordinar con la spec `004-partner-approval-data`, que ya trata "transferir lo capturado").

Ambas son baratas y de bajo riesgo, pero **bloquean datos que la página promete**. Van en la Fase A.

---

## D29. Alcance que queda explícitamente afuera de este plan

- **Link corto vía Worker de Cloudflare** (FR-005, "opcional"): es infraestructura fuera de este repositorio; el contrato solo garantiza la URL canónica a la que apuntaría.
- **Dominio de reseñas, trabajos y métricas** (Fase C): features de backend con su propia spec.
- **Editor para el proveedor** y el indicador de "perfil completo al 70%": la spec lo marca como sugerencia no vinculante.
- **Páginas indexables por zona y por rubro** (`/proveedor/zona/…`): mejora posterior de D8.

---

## Lista única de decisiones de producto pendientes

1. **D6** — ¿Es aceptable 308 en lugar de 301 para los slugs viejos?
2. **D8** — ¿Se incluye la página índice `/proveedor` en esta feature (alcance nuevo)?
3. **D12** — ¿Un click de WhatsApp del perfil puede viajar a Meta como `Contact`?
4. **D17** — ¿Se acepta que la zona de cobertura salga sin mapa de área, y el costo de mapas estáticos?
5. **D19** — ¿Alcanza la atribución para "Pedir propuesta" o "dirigido" es requisito de lanzamiento?
6. **D22** — ¿El perfil sigue el sistema de la app (dos paletas de superficie en la web)?
7. **D25** — ¿Los números de WhatsApp de los proveedores reciben llamadas?
8. **D14** — Texto final y umbrales de "Medido por AutoLibre" (ya era decisión abierta de la tarjeta).
9. **Heredadas de la tarjeta**: perfil gratis vs suscripción; validar la variante sin local con proveedores reales.

---

## Resultado del spike de la imagen OG (2026-10-07)

**Decisión tomada al implementar (D11 / riesgo R4)**: la v1 usa la **fuente por defecto de `ImageResponse`** (Geist, incluida en Next) y **no** Outfit/DM Sans. Motivo: esas fuentes hay que bajarlas como `ttf` desde Google Fonts, y descargar archivos requiere confirmación; además su peso cuenta para el límite de 500 KB del bundle. Con la fuente por defecto el PNG sale de **30–75 KB** y se genera en **0,1–1,2 s** (la primera vez, con la lectura de imágenes del proveedor); con el caché ISR de 10 minutos, los scrapers de WhatsApp no la regeneran.

Consecuencias que conviene saber: (a) el título sale sin negrita real (la fuente por defecto trae un solo peso) y (b) las imágenes **WebP** no se pintan (Satori no las soporta): la portada o el logo en WebP se omiten sin romper la tarjeta (degradación FR-042); PNG y JPEG funcionan.

**Mejora pendiente (decisión tuya)**: sumar `Outfit-Bold.ttf` y `DMSans-Medium.ttf` (licencia OFL) a `lib/provider-profile/fonts/`, medir el bundle y pasarlas a `ImageResponse`. Pedir confirmación antes de descargarlas.
