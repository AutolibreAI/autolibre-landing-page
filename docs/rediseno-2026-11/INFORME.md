# Informe del rediseño de autolibre.ai (noviembre 2026)

## Fase 0: línea base

Medición del 2026-11-24 sobre la rama `feat/rediseno-2026-11` (igual a `redesign`, sin cambios de código), con build de producción local (`next build` + `next start` en el puerto 3100, Next.js 16.2.4 con Turbopack). Los JSON de Lighthouse están en `docs/rediseno-2026-11/lighthouse/antes/` con el formato `<ruta>-{movil,escritorio}.json`.

### Cómo se midió y qué tener en cuenta

- **Lighthouse 12.8.2**, Chrome headless (`--headless=new`), una corrida por ruta y modo. Móvil = preset por defecto (Moto G Power emulado, 4G lento, CPU ×4). Escritorio = `--preset=desktop`. Con una sola corrida, Performance puede variar entre ±5 y ±10 puntos: comparar tendencias, no décimas.
- **Servidor local sin CDN ni compresión de Vercel.** Por eso aparecen `uses-long-cache-ttl` y `render-blocking-resources`, y los 2 errores de consola son 404 de `/_vercel/insights/script.js` y `/_vercel/speed-insights/script.js`: solo existen en Vercel. Ese es el motivo por el que Buenas prácticas da 74-75 en local y 78-79 en prod.
- **Backend**: el `.env` apunta a un backend `AUTOLIBRE_API_URL` que al principio rechazó la conexión (`ECONNREFUSED`): `/proveedores` salió vacío y `/proveedores/asistir24` devolvió 500. Unos minutos después ya respondía y las mediciones se hicieron con datos cargados. Es un backend de **prueba**: el directorio muestra negocios de test ("Billing A mw27tthvzglv"), y el perfil local no trae la sección "Preguntas frecuentes" que sí tiene prod. Como referencia, también se midieron `/proveedores` y `/proveedores/asistir24` en **producción** (`autolibre.ai`), marcadas con "(prod)".
- **Slugs usados**: perfil `asistir24`, que no está en el sitemap. Ningún perfil de proveedor está en `sitemap.xml`; el slug salió del HTML de `autolibre.ai/proveedores`. Nota del blog: `seguros/que-hacer-si-chocas`, linkeada desde `/blog` y listada en el sitemap.
- **Terceros que pesan**: Meta Pixel (Facebook) suma unos 254 KB y unos 520-590 ms de bloqueo en móvil, en todas las rutas. En `/proveedores/registro`, Clerk (`accounts.dev` + `@clerk/ui`) suma 395 KB y unos 1.000 ms de bloqueo.

### Lighthouse 12.8.2

| Ruta | Modo | Performance | Accesibilidad | Buenas prácticas | SEO | LCP (s) | CLS | TBT (ms) | FCP (s) | Elemento LCP |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Móvil | 55 | 96 | 75 | 100 | 4.72 | 0.000 | 2046 | 1.22 | `h1` |
| `/` | Escritorio | 84 | 96 | 74 | 100 | 1.07 | 0.000 | 327 | 0.45 | `img` |
| `/pedido` | Móvil | 53 | 100 | 75 | 100 | 6.28 | 0.000 | 1224 | 1.16 | `h1` |
| `/pedido` | Escritorio | 77 | 100 | 74 | 100 | 1.35 | 0.000 | 446 | 0.33 | `h1` |
| `/proveedores` | Móvil | 64 | 100 | 75 | 100 | 3.68 | 0.000 | 1441 | 1.28 | `h1` |
| `/proveedores` | Escritorio | 88 | 100 | 74 | 100 | 0.93 | 0.000 | 281 | 0.46 | `h1` |
| `/proveedores/asistir24` | Móvil | 48 | 96 | 75 | 69 | 6.60 | 0.000 | 2573 | 1.05 | `p` |
| `/proveedores/asistir24` | Escritorio | 83 | 96 | 74 | 69 | 1.84 | 0.000 | 244 | 0.29 | `img` |
| `/blog` | Móvil | 48 | 96 | 75 | 100 | 6.47 | 0.000 | 3450 | 1.16 | `img` |
| `/blog` | Escritorio | 95 | 96 | 74 | 100 | 0.83 | 0.000 | 163 | 0.28 | `img` |
| `/blog/seguros/que-hacer-si-chocas` | Móvil | 60 | 96 | 75 | 100 | 3.58 | 0.000 | 3535 | 1.01 | `p` |
| `/blog/seguros/que-hacer-si-chocas` | Escritorio | 79 | 96 | 74 | 100 | 0.96 | 0.000 | 435 | 0.38 | `img` |
| `/sobre-nosotros` | Móvil | 69 | 100 | 75 | 100 | 3.48 | 0.000 | 965 | 1.14 | `p` |
| `/sobre-nosotros` | Escritorio | 81 | 100 | 74 | 100 | 0.87 | 0.000 | 410 | 0.41 | `h1` |
| `/proveedores/registro` | Móvil | 44 | 96 | 75 | 100 | 6.64 | 0.000 | 4036 | 2.16 | `p` |
| `/proveedores/registro` | Escritorio | 93 | 96 | 74 | 100 | 1.67 | 0.000 | 64 | 0.63 | `p` |
| `/proveedores/planes` | Móvil | 64 | 96 | 75 | 100 | 3.48 | 0.000 | 1658 | 0.92 | `p` |
| `/proveedores/planes` | Escritorio | 79 | 96 | 74 | 100 | 1.42 | 0.000 | 369 | 0.37 | `h1` |
| `(prod) autolibre.ai/proveedores/asistir24` | Móvil | 65 | 96 | 79 | 69 | 3.34 | 0.000 | 1573 | 1.25 | `p` |
| `(prod) autolibre.ai/proveedores/asistir24` | Escritorio | 70 | 96 | 78 | 69 | 1.02 | 0.000 | 1010 | 0.39 | `img` |
| `(prod) autolibre.ai/proveedores` | Móvil | 66 | 100 | 79 | 100 | 3.05 | 0.000 | 2061 | 1.18 | `h1` |
| `(prod) autolibre.ai/proveedores` | Escritorio | 88 | 100 | 78 | 100 | 0.63 | 0.000 | 277 | 0.38 | `h1` |

### JS por ruta

`next build` (16.2.4, Turbopack) ya no imprime "First Load JS". Se sumaron los `<script src>` del mismo origen que trae el HTML servido de cada ruta (bytes crudos y gzip calculado localmente con nivel por defecto). No incluye scripts de terceros (Meta Pixel, Clerk, Google Maps) ni chunks que se cargan después de forma dinámica.

| Ruta | Scripts | JS crudo (KB) | JS gzip (KB) | HTML (KB) |
|---|---|---|---|---|
| `/` | 13 | 720.0 | 220.6 | 221.0 |
| `/pedido` | 13 | 735.8 | 225.4 | 108.1 |
| `/proveedores` | 13 | 700.1 | 213.0 | 185.2 |
| `/proveedores/asistir24` | 13 | 701.2 | 213.5 | 110.9 |
| `/blog` | 13 | 700.1 | 213.0 | 120.9 |
| `/blog/seguros/que-hacer-si-chocas` | 13 | 700.7 | 213.3 | 143.5 |
| `/sobre-nosotros` | 13 | 700.1 | 213.0 | 137.1 |
| `/proveedores/registro` | 16 | 950.0 | 285.9 | 169.4 |
| `/proveedores/planes` | 13 | 700.1 | 213.0 | 77.7 |
| `(prod) autolibre.ai/proveedores/asistir24` | 13 | 701.9 | 213.7 | 116.2 |

### Inventario SEO por ruta

Sacado del HTML del server con `fetch` (sin ejecutar JS).

#### `/`

- **title**: AutoLibre · Todo tu auto, en un solo lugar
- **description**: Documentación, vencimientos, historial, diagnóstico con IA y talleres cerca tuyo. Toda la información de tu auto ordenada en una sola app. Descargala gratis para iPhone y Android.
- **canonical**: https://autolibre.ai
- **robots**: `index, follow`
- **H1**: "Todo tu auto, en un solo lugar." (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebSite, WebPage, SoftwareApplication, Offer, FAQPage, Question, Answer
- **Outline**:
  - h1: Todo tu auto, en un solo lugar.
    - h2: Resolvemos todo para tu auto.
    - h2: Beneficios de nuestros aliados
      - h3: Del auxilio al taller, sin vueltas.
      - h3: Reducí tus multas de tránsito.
      - h3: Intēgrity Seguros : +3 cuotas fijas En tu seguro de auto
    - h2: Ahora sabés qué necesita tu auto
    - h2: Todo lo que necesitás, en una app
      - h3: Documentación
      - h3: Vencimientos
      - h3: Historial
      - … (2 h3 más, una por tarjeta)
    - h2: Un pedido, varias respuestas.
    - h2: Cada service suma. Que quede probado.
    - h2: Empezás en dos minutos.
      - h3: Ordenás lo tuyo
      - h3: Sumás el diagnóstico
    - h2: Entendé qué le pasa antes de llegar al taller.
    - h2: ¿Tenés un taller o prestás un servicio?
    - h2: Preguntas frecuentes
    - h2: Guías para tener tu auto en regla
      - h3: Si tenés moto: qué papeles y controles cambian
      - h3: Prórroga de licencias en PBA (Disposición 12/2026)
      - h3: Patente del auto en PBA y CABA: a quién se paga y cuándo vence
    - h2: Tu auto siempre supo qué tenía. Ahora vos también.

#### `/pedido`

- **title**: Presupuestos gratis para tu auto, por WhatsApp · AutoLibre
- **description**: Contanos qué le pasa a tu auto y te pasamos Presupuestos de proveedores en tu zona en AMBA por WhatsApp. Te respondemos en el día, gratis y sin compromiso.
- **canonical**: https://autolibre.ai/pedido
- **robots**: `index, follow`
- **H1**: "Presupuestos de proveedores en tu zona, por WhatsApp." (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BreadcrumbList, ListItem, FAQPage, Question, Answer
- **Outline**:
  - h1: Presupuestos de proveedores en tu zona, por WhatsApp.
    - h2: ¿Preferís que te escribamos?
    - h2: Cómo funciona
      - h3: 1 . Nos escribís
      - h3: 2 . Consultamos proveedores cerca tuyo
      - h3: 3 . Te pasamos los presupuestos
    - h2: Así te llega la respuesta
    - h2: Preguntas frecuentes
      - h3: ¿Cuánto cuesta?
      - h3: ¿Me van a llamar los proveedores?
      - h3: ¿Qué datos necesitan?
      - h3: ¿Tengo que bajar una app?
    - h2: Contanos qué le pasa a tu vehículo

#### `/proveedores`

- **title**: Proveedores · AutoLibre
- **description**: Directorio de los talleres, aseguradoras, estudios para multas y casas de repuestos que forman parte de AutoLibre en todo el país y reciben pedidos de presupuesto desde la app.
- **canonical**: https://autolibre.ai/proveedores
- **robots**: `index, follow`
- **H1**: "Los negocios que ya forman parte de AutoLibre" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, CollectionPage, BreadcrumbList, ListItem, ItemList
- **Outline**:
  - h1: Los negocios que ya forman parte de AutoLibre
    - h2: Toda la red
      - h3: Asistir24
      - h3: Autech
      - h3: Avalos Racing
      - … (21 h3 más, una por tarjeta)
    - h2: ¿Tenés un taller o prestás un servicio?

#### `/proveedores/asistir24`

- **title**: Asistir24 · AutoLibre
- **description**: Asistir24: Asistencia y emergencias. Pedí presupuesto por AutoLibre.
- **canonical**: https://autolibre.ai/proveedores/asistir24
- **robots**: `noindex, nofollow`
- **H1**: "Asistir24" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BreadcrumbList, ListItem, LocalBusiness, PostalAddress, GeoCoordinates
- **Outline**:
  - h1: Asistir24
    - h2: Sobre Asistir24
    - h2: Servicios
      - h3: Asistencia y emergencias
    - h2: Ubicación
    - h2: Más proveedores de Asistencia y emergencias
      - h3: Hasser Performance
      - h3: Host Garage
      - h3: HyG Cars Service
    - h2: ¿Tenés un taller o prestás un servicio?

#### `/blog`

- **title**: Blog · AutoLibre
- **description**: Vencimientos, papeles, mantenimiento y diagnóstico, explicados sin vueltas por el equipo de AutoLibre.
- **canonical**: https://autolibre.ai/blog
- **robots**: `index, follow`
- **H1**: "Guías claras para tener tu auto en regla." (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, CollectionPage, BreadcrumbList, ListItem
- **Outline**:
  - h1: Guías claras para tener tu auto en regla.
    - h2: Nota destacada
      - h3: Si tenés moto: qué papeles y controles cambian
    - h2: Últimas notas
      - h3: Prórroga de licencias en PBA (Disposición 12/2026)
      - h3: Patente del auto en PBA y CABA: a quién se paga y cuándo vence
      - h3: Auto con GNC: oblea y prueba hidráulica al día
      - h3: Licencia digital en Mi Argentina: dónde vale y dónde no
    - h2: Guías por tema
      - h3: Me retuvieron la licencia en un control en PBA: qué hacer
      - h3: VTV en PBA: turno, qué llevar y qué pasa si da condicional
      - h3: Descargo de multas en PBA y multas de un auto que vendiste
      - … (6 h3 más, una por tarjeta)
    - h2: Tu auto siempre supo qué tenía. Ahora vos también.

#### `/blog/seguros/que-hacer-si-chocas`

- **title**: Qué hacer si chocás o te chocan · AutoLibre
- **description**: Qué te obliga la ley en el lugar del choque, qué datos pedirle al otro conductor, cuándo avisarle a tu seguro y qué hacer si te llega una demanda.
- **canonical**: https://autolibre.ai/blog/seguros/que-hacer-si-chocas
- **robots**: `index, follow`
- **H1**: "Qué hacer si chocás o te chocan: paso a paso" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BlogPosting, BreadcrumbList, ListItem, FAQPage, Question, Answer
- **Outline**:
  - h1: Qué hacer si chocás o te chocan: paso a paso
    - h2: Qué tenés que hacer en el lugar del choque
    - h2: Qué datos le tenés que pedir al otro conductor
    - h2: La denuncia a tu aseguradora
    - … (4 h2 más, una por tarjeta)
      - h3: ¿Tengo que llamar a la policía si choco?
      - h3: ¿El otro conductor me tiene que mostrar el seguro?
      - h3: ¿Tengo que avisarle a mi aseguradora?
      - … (2 h3 más, una por tarjeta)
    - h2: Fuentes oficiales
    - h2: Seguí leyendo
      - h3: Seguro obligatorio del auto: qué cubre y qué tenés que llevar
      - h3: Si tenés moto: qué papeles y controles cambian
      - h3: Prórroga de licencias en PBA (Disposición 12/2026)

#### `/sobre-nosotros`

- **title**: Sobre nosotros · AutoLibre
- **description**: AutoLibre nació en Buenos Aires en febrero de 2026. Conocé la misión, la historia y a los cinco cofundadores de la app de gestión de autos y motos.
- **canonical**: https://autolibre.ai/sobre-nosotros
- **robots**: `index, follow`
- **H1**: "Todo tu auto en un solo lugar" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, AboutPage, BreadcrumbList, ListItem, Person
- **Outline**:
  - h1: Todo tu auto en un solo lugar
    - h2: Misión y visión
      - h3: Misión
      - h3: Visión
    - h2: Nuestra historia
    - h2: Cómo llegamos hasta acá
      - h3: La primera idea
      - h3: Se suma Matías García Guevara
      - h3: Primera iteración con IA
      - … (7 h3 más, una por tarjeta)
    - h2: Equipo
      - h3: Nicolás Leunda
      - h3: Matías García Guevara
      - h3: Ramiro Sarasola
      - … (2 h3 más, una por tarjeta)
    - h2: Tu auto siempre supo qué tenía. Ahora vos también.

#### `/proveedores/registro`

- **title**: Sumá tu taller a AutoLibre · AutoLibre
- **description**: Recibí consultas con la información del vehículo y el servicio solicitado. Registrá tu taller o servicio en AutoLibre y armá tu perfil en la app.
- **canonical**: https://autolibre.ai/proveedores/registro
- **robots**: `index, follow`
- **H1**: "Registrá tu taller" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BreadcrumbList, ListItem
- **Outline**:
  - h1: Registrá tu taller
    - h2: Entrá o creá tu cuenta

#### `/proveedores/planes`

- **title**: Planes para proveedores · AutoLibre
- **description**: Conocé los planes pagos de AutoLibre para talleres y servicios: cuánto cuestan, cuántos pedidos por WhatsApp incluyen y cómo sumar más volumen.
- **canonical**: https://autolibre.ai/proveedores/planes
- **robots**: `index, follow`
- **H1**: "Elegí el plan que se ajusta al volumen de tu negocio" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BreadcrumbList, ListItem, OfferCatalog, Offer, UnitPriceSpecification
- **Outline**:
  - h1: Elegí el plan que se ajusta al volumen de tu negocio
    - h2: Planes disponibles
      - h3: Gratis
      - h3: Plus
      - h3: Plus Max
      - h3: ¿Necesitás más volumen o algo a medida?

#### `(prod) autolibre.ai/proveedores/asistir24`

- **title**: Asistir24 · AutoLibre
- **description**: Asistir24: Asistencia y emergencias. Pedí presupuesto por AutoLibre.
- **canonical**: https://autolibre.ai/proveedores/asistir24
- **robots**: `noindex, nofollow`
- **H1**: "Asistir24" (1)
- **JSON-LD @type**: Organization, ImageObject, Country, ContactPoint, WebPage, BreadcrumbList, ListItem, LocalBusiness, PostalAddress, GeoCoordinates, FAQPage, Question, Answer
- **Outline**:
  - h1: Asistir24
    - h2: Sobre Asistir24
    - h2: Servicios
      - h3: Asistencia y emergencias
    - h2: Preguntas frecuentes
    - h2: Ubicación
    - h2: Más proveedores de Asistencia y emergencias
      - h3: Hasser Performance
      - h3: Host Garage
      - h3: HyG Cars Service
    - h2: ¿Tenés un taller o prestás un servicio?

### Lectura rápida

- **Móvil es el problema.** Performance móvil va de 44 a 69 y ninguna ruta llega a LCP < 2,5 s (el mejor caso es 3,48 s). TBT móvil va de 965 a 4.036 ms. En escritorio, todo queda entre 77 y 95.
- **CLS es 0 en todas las rutas.** Accesibilidad da 96-100 y SEO da 100, salvo los perfiles de proveedor.
- **Las 3 peores métricas**:
  1. `/proveedores/registro` en móvil: Performance 44, TBT 4.036 ms, LCP 6,64 s y FCP 2,16 s, el único FCP malo. Lo explican Clerk y un bundle propio más grande (286 KB gzip contra 213 del resto).
  2. `/proveedores/asistir24` en móvil: Performance 48, LCP 6,60 s, SEO 69. El SEO baja por `is-crawlable`: el perfil sale con `noindex, nofollow` porque el backend manda `partner.indexable = false`, lo mismo en local que en prod. En escritorio, el LCP es la imagen del mapa con `loading="lazy"` (`lcp-lazy-loaded`).
  3. `/blog` en móvil: Performance 48, LCP 6,47 s y TBT 3.450 ms. El LCP es una imagen `fill` de portada sin prioridad (`lcp-discovery-insight`). La nota del blog tiene el TBT más alto después de registro (3.535 ms).
- **Contraste** (`color-contrast`) falla en `/`, el perfil, `/blog`, la nota, `/proveedores/registro` y `/proveedores/planes`: `<time>` de las tarjetas del blog, migas de pan con `hover:text-ink` y textos `text-ink/60`.
- **El JS propio es casi igual en todas las rutas**: unos 700 KB crudos y 213 KB gzip, con 13 scripts. Solo `/proveedores/registro` sube a 950 KB crudos y 286 KB gzip, con 16 scripts. Lighthouse marca `unused-javascript` y `legacy-javascript` en todas.
- **SEO estructural**: todas las rutas tienen un único H1 y ningún salto de nivel en los headings, más canonical correcto y JSON-LD con `Organization`. Pendientes: a `/` le falta `BreadcrumbList`, el estándar del proyecto pide `webPageSchema` + `breadcrumbSchema`, y la home tiene `WebPage` pero no migas. Los perfiles de proveedor no están en el sitemap. `/proveedores/planes` usa valores arbitrarios (`text-[1.75rem]`, `text-[1.0625rem]`) en su H1 y su LCP.

## Fase 1: tokens y primitivas

Rama `feat/rediseno-2026-11`. Solo agrega: ninguna página cambia de aspecto (los tokens y variantes viejos siguen y los call sites existentes se renombraron para conservar su look). La migración de páginas va en las fases siguientes.

### Tokens

Reusados y promovidos a base global (ya existían para el perfil de proveedor, spec 209; sin cambio de valor): `canvas` `#f1f2f0` (fondo de página), `card` `#fefefd` (superficies), `card-line` `#e4eae4` (bordes), `card-muted` `#f3f4f6`, `brand-50` `#e8f5e8` (seleccionados y bandas suaves), `status-ok` `#1a7a4a` / `status-ok-bg` `#e0f5ec`. `brand` `#2a8c3a` pasa a ser solo acento y `brand-hover` `#23752f` el texto verde chico.

Nuevos en `@theme` (`app/globals.css`):

| Token | Valor | Uso |
|---|---|---|
| `action` | `#1c2b1c` | Fondo del botón principal; borde de `outline` y del chip seleccionado. |
| `action-hover` | `#2a3a2a` | Hover del botón principal. |
| `fg` | `#111827` | Títulos y texto fuerte. |
| `fg-muted` | `#374151` | Texto corrido. |
| `fg-subtle` | `#6b7280` | Metadatos y placeholder, solo sobre `card`. |
| `on-dark` | `#dcdedc` | Texto sobre fondo oscuro. |
| `on-dark-muted` | `#b8bcb8` | Texto secundario sobre oscuro. |
| `on-dark-subtle` | `#8c968c` | Terciario y bordes sobre oscuro. |
| `brand-200` | `#a8dfb0` | Bandas y eyebrows sobre oscuro. |
| `control-line` | `#d1d5db` | Borde de chips y tarjetas de opción. |
| `control-line-strong` | `#9ca3af` | Borde de inputs. |
| `status-pending` / `status-pending-bg` | `#78350f` / `#fef3c7` | Pill "pendiente". |
| `status-alert` | `#b91c1c` | Pill "alerta" (sobre `alert-bg`). |
| `--text-control` | `0.9375rem` (15px) | Botones y chips de 44-48px. Registrado en `lib/utils.ts`. |

Sin tokens nuevos de radio: píldora = `rounded-full`; tarjetas = `rounded-card` (16), `rounded-panel` (20), `rounded-3xl` (24). `--radius-field` (10) queda marcado como deprecado.

### Contraste (WCAG 2.1, calculado con un script de node)

| Texto / fondo | Ratio | AA texto chico (4.5) |
|---|---|---|
| blanco / `action` | 14.88 | sí |
| blanco / `action-hover` | 12.09 | sí |
| `fg` / `card` · `canvas` · `brand-50` · `brand-200` | 17.58 · 15.80 · 15.76 · 11.70 | sí |
| `fg-muted` / `card` · `canvas` · `brand-50` | 10.21 · 9.18 · 9.16 | sí |
| `fg-subtle` / `card` | 4.79 | sí |
| `fg-subtle` / `canvas` | 4.30 | **no** (solo sobre `card`) |
| `brand-hover` / `card` · `canvas` · `brand-50` | 5.69 · 5.11 · 5.10 | sí |
| `brand` / `card` · `canvas` | 4.24 · 3.81 | no: solo acento (íconos y foco, 3:1) |
| `on-dark` / `action` | 11.00 | sí |
| `on-dark-muted` / `action` | 7.74 | sí |
| `on-dark-subtle` / `action` | 4.86 | sí |
| `brand-200` / `action` | 9.81 | sí |
| pill ok: `status-ok` / `status-ok-bg` | 4.70 | sí |
| pill pendiente: `status-pending` / `status-pending-bg` | 8.15 | sí |
| pill alerta: `status-alert` / `alert-bg` | 5.26 | sí |
| pill neutra: `fg-muted` / `canvas` | 9.18 | sí |
| (viejo) `alert-fg` / `alert-bg` | 3.93 | **no** (hallazgo, no se tocó) |

No-texto (WCAG 1.4.11, mínimo 3:1): anillo de foco `brand` sobre `card` 4.24, sobre `canvas` 3.81, sobre `action` 3.48 (pasa); borde `action` sobre `card` 14.74; `on-dark-subtle` como borde sobre `action` 4.86; `control-line` sobre `card` 1.46 y **`control-line-strong` sobre `card` 2.52 (no llega a 3:1)**.

### Fuentes

`app/layout.tsx` ya cargaba Outfit y DM Sans con `next/font/google`, subset latin y `display: swap`. Se agregó `adjustFontFallback: true` explícito (ya era el default) y se documentó la medición.

| | Antes | Después |
|---|---|---|
| Outfit | variable, sin `weight` (100-900), 1 woff2 latin de 32,3 KB | igual |
| DM Sans | variable, sin `weight` (100-1000), solo eje `wght`, 1 woff2 latin de 36,9 KB | igual |

No se acotaron pesos, a propósito: se midió contra la API de Google Fonts que `wght@600;700`, `wght@600..700`, `wght@500;600;700;800` y el rango completo devuelven **el mismo archivo variable** (mismos bytes). Acotar no ahorra nada y agrega riesgo (un peso fuera del rango se clampa sin aviso). Pesos en uso según `rg`: Outfit 500 (un `h2`), 600, 700 y 800 (`font-extrabold` en `allies.tsx`); DM Sans 400, 500, 600 y 700.

### Primitivas (`components/ui/`, Server Components con `cva`)

- **`Button`, `ButtonLink` (`next/link`) y `ButtonAnchor` (nuevo, `<a>` externo)** en `button.tsx`. Props: `variant`, `size`, `block`, `className` + las del elemento.
  - Variantes vigentes: `primary` (`action` + blanco), `outline` (borde `action` sobre `card`), `light` (`card` + `fg`, para fondos oscuros). Todas en píldora y Outfit 600.
  - Tamaños vigentes: `"44"`, `"48"` (15px), `"52"`, `"56"` (16px), alto fijo.
  - Deprecadas (look anterior intacto): `brand` (antes `primary`), `brandOutline` (antes `outline`), `outlineInverse`, `inverse`; tamaños `sm`/`md`/`lg`. El radio `field` pasó de la base a cada variante vieja.
  - `transition-colors` con `motion-reduce:transition-none`; foco con el anillo global.
- **`PillInput`** (`pill-input.tsx`): `id` y `label` obligatorios, `hideLabel`, `hint`, `error` (`aria-invalid` + `aria-describedby` con `{id}-hint`/`{id}-error`), `size` `"52"`/`"56"` (default 56), `required` (asterisco `aria-hidden`), `className` (wrapper), `inputClassName` + props de `<input>`. Fuente de 16px en todos los anchos, borde `control-line-strong`, foco con el anillo global + borde `action`.
- **`Chip`** (`chip.tsx`): con `pressed: boolean` renderiza `<button type="button" aria-pressed>` (+ props de botón: `onClick`, `disabled`…); sin `pressed`, `<span>` con `selected`. `icon`, `size` `"44"`/`"48"`. Seleccionado: `brand-50` + borde `action`; en reposo: `card` + borde `control-line`.
- **`Card`** (`card.tsx`): nueva variante `surface` (`card` + borde `card-line`, sin sombra), nuevo prop `radius` `md`/`lg`/`xl` (16/20/24) y `as` ampliado (`section`, `aside`). El default sigue siendo `outline` (viejo).
- **`StatusPill`** (`status-pill.tsx`): `tone` `ok`/`pending`/`alert`/`neutral`, `dot`, + props de `<span>`. 13px semibold, píldora.

### Cambios en call sites

16 archivos pasaban `variant="outline"` o `"primary"` explícito al botón: se renombraron a `brandOutline`/`brand` para que no tomen el look nuevo (TypeScript no lo detectaría: `primary` y `outline` siguen siendo nombres válidos). `WhatsappLink` (`components/pedido/whatsapp-link.tsx`) cambió su prop `variant` de `"primary" | "inverse"` a `"brand" | "inverse"` (ningún caller pasaba `"primary"`). Los call sites sin `variant` no cambian porque el default sigue siendo `brand`.

### Diferencias con el diseño o con lo pedido

- **Nombres de variantes**: el pedido es `primary`/`outline`/`light`, y `button.tsx` ya tenía `primary` y `outline` con otro significado. Se priorizaron los nombres pedidos (son los finales) y se renombraron las viejas, en lugar de inventar nombres para las vigentes.
- **Default del botón**: sigue en `brand` + `md` (viejo) para no cambiar los call sites que no pasan `variant`. Al terminar la migración, el default pasa a `primary` y se borran las variantes viejas.
- **Input**: el prototipo (`ModuloPedido.dc.html`) usa radio de 12px en los inputs sueltos; el pedido dice píldora. Se hizo en píldora (el buscador compuesto del Home también lo es).
- **Borde del input** `#9ca3af`: 2.52:1 sobre `card`, debajo del 3:1 de WCAG 1.4.11. Se respetó el valor del diseño y queda como decisión abierta. Alternativa AA dentro de la paleta: `fg-subtle` `#6b7280` (4.79:1), más pesado a la vista.
- **`fg-subtle` `#6b7280`** no estaba en la lista pedida, pero el diseño lo usa 24 veces (metadatos de 11-13px). Se agregó con la restricción de usarlo solo sobre `card` (sobre `canvas` da 4.30:1).
- **Fondo de página**: `canvas` existe como token, pero `body` sigue en `surface` (blanco). Cambiarlo ahora cambiaría todas las páginas; va con la migración.
- **Hovers**: el diseño no los define. Se eligió `action-hover` `#2a3a2a` (aparece en el lienzo como superficie oscura) para `primary`, y `brand-50` para `outline`/`light`.
- **Pill alerta**: el diseño usa `#b91c1c` sin fondo definido; se reusó `alert-bg` `#fbe2e2` (5.26:1) en vez de sumar otro rosa.
- **Pill neutra**: usa `canvas` de fondo como el diseño; sobre una página `canvas` no se ve su contorno, así que va dentro de tarjetas.
- **Fuentes**: no se recortaron pesos (ver arriba: no hay ahorro medible).
- **No se agregó** la variante de botón "contorno sobre oscuro" (borde `on-dark-subtle`, texto claro) que el diseño usa en `Pedido` y `Sumate`: no estaba en el pedido; se suma con la primera página que la necesite.

### Verificación

`npm run lint`: 0 errores (282 warnings, todos preexistentes en scripts de skills vendorizados en `.agents/`, `.claude/` y `.cursor/`; el mismo número que antes del cambio). `npx tsc --noEmit`: sin errores. `npm run build`: OK (56 páginas estáticas). En el CSS compilado salen las utilities nuevas (`bg-action`, `text-control`, `h-13`, `border-control-line-strong`, etc.).

## Fase 2: estructura compartida

Encabezado, menú de cuenta, pie, barra fija inferior en celular y fondo de página del sistema "AutoLibre AI". Las páginas en sí no se tocaron (van en la fase 4): conviven el header y el pie nuevos con secciones del sistema anterior.

### Qué cambió

- **Corrección de la fase 1**: `control-line-strong` pasa de `#9ca3af` (2.52:1) a `#6b7280` (4.79:1 sobre `card`, 4.30:1 sobre `canvas`): el borde del `PillInput` cumple WCAG 1.4.11. El hover del input pasa a `fg-muted`. Es una diferencia con el diseño, a propósito.
- **`SiteHeader`** (Server Component): logo, Proveedores · Blog · Sobre nosotros, enlace "Sumá tu negocio" / "Ir a mi negocio", botón de cuenta (hamburguesa + avatar) y "Hacé tu pedido" (`ButtonLink` `primary` `"44"` → `/pedido`). Se fueron "Descargar la app", "Soy proveedor" y las anclas de la home (Producto, Cómo funciona, Aliados, FAQ). Debajo de `lg` (1024 px): logo + botón "Menú y cuenta". Sticky, 68 px, `card` sólido sin blur.
  - Dos islas client hoja: `HeaderBusinessLink` (el texto del enlace de negocio) y `HeaderAccountMenu` (botón + panel). Se borraron `HeaderAccountSwap` y `MobileNav`.
  - Prop `cta={false}`: ahora saca "Hacé tu pedido" (header y menú mobile). La siguen pidiendo `/pedido` (la página ES el pedido: el botón sería un link a sí misma), `/proveedores/planes` y `/proveedores/registro` (le hablan al negocio; mandarlo a pedir para su auto lo distrae). Documentado en `site-header.tsx`.
  - Links a rutas con Clerk (`/cuenta`, alta, reclamo, contratar) con `prefetch={false}`: el header los resuelve en el server (`loadsClerk`).
- **`SiteFooter`** (Server Component): fondo `action`, logo + "Todo tu auto, en un solo lugar.", grupos Servicios / La app / Empresa / Ayuda y fila de copyright con redes. Todo desde `siteContent.footer` (que arma los links con `siteConfig`). Links externos con `target="_blank"` y aviso `sr-only`; en celular, 44 px de alto por link.
- **`MobileActionBar`** (Server Component, sin JS): "Hacé tu pedido" (`primary` `"52"`) + WhatsApp (`outline` `"52"`, mensaje "¡Hola! Quiero pedir propuestas para mi auto.") debajo de `lg`, en la home y en `/proveedores` (`PageShell actionBar`). Es `sticky bottom-0` y va DESPUÉS del footer (como en el prototipo): mientras se scrollea queda al pie de la pantalla y al final ocupa su propio lugar debajo del footer, así nunca lo tapa y no hace falta padding de reserva en `<main>`. Respeta `env(safe-area-inset-bottom)`.
- **Fondo de página**: `body` pasa de `surface` a `canvas`. Cada `Section` pinta su propio fondo, así que en las páginas actuales casi no asoma (revisado en `/`, `/support`, `/proveedores` y `/pedido` a 390 y 1440 px). Nada quedó ilegible: el texto de las secciones viejas sigue sobre sus propios fondos.
- **`/cuenta`**: escribe y borra la pista de rol y atiende `?salir=1` (ver abajo). `AccountBar` borra la pista al cerrar sesión.

### Patrón ARIA del menú: disclosure

Botón con `aria-expanded` + `aria-controls` que muestra un panel con `<nav>` de links (no `role="menu"`). Son links de navegación, no comandos: `menu` obliga a manejar el foco con flechas, saca los links del modo de lectura normal y los anuncia como "elemento de menú". La APG de la W3C recomienda disclosure para la navegación de sitios. Comportamiento:

- Tab recorre los links en orden (sin trampa de foco).
- Escape cierra y devuelve el foco al botón (verificado con CDP: `aria-expanded` vuelve a `false`, el panel se desmonta y `document.activeElement` es el botón).
- Click o toque afuera cierra; si el foco sale del botón y del panel (Tab después del último link), también.
- Elegir un link cierra. En celular el panel es de pantalla completa y bloquea el scroll del fondo (en `<html>`); en desktop no.
- Nombre accesible por ancho: "Menú y cuenta" debajo de `lg`, "Cuenta" desde `lg` (dos `sr-only` con `display: none` alternado). Foco visible: el anillo global.
- Landmarks dentro del panel: `<nav aria-label="Secciones">` (solo celular) y `<nav aria-label="Tu cuenta">`.

### Sesión y rol sin Clerk

- **Sesión**: la misma pista de antes, la cookie `__client_uat` de Clerk (`useSessionHint`).
- **Rol (nuevo)**: cookie `al_role` de primer partido, legible por JS, sin datos personales: `proveedor.<valor de __client_uat>` (`lib/auth/role-hint.ts`). La escribe `/cuenta` cuando `GET /partners/me/memberships` devuelve al menos un negocio y la borra si devuelve cero; con error no se toca. Vale solo si su `__client_uat` coincide con el actual: si se cierra sesión (`"0"`) o entra otra cuenta (otro timestamp), el header vuelve solo a "sin sesión" o "cliente" (verificado con una pista vieja: se ve como cliente). Igual se borra al cerrar sesión desde `/cuenta`. 30 días de vida. Nunca autoriza nada: es solo para elegir qué se pinta.
- `useAccountHint` devuelve `anon` / `cliente` / `proveedor`; en el server y en la hidratación, siempre `anon`. Sin CLS: el avatar cambia de color en el mismo lugar y tamaño; el enlace de negocio reserva el ancho del texto más largo (los dos en la misma celda de una grilla, el que no se ve `invisible`); las opciones solo se ven con el panel abierto.
- **Cerrar sesión** desde el menú: el header no puede cerrarla (no tiene Clerk), así que lleva a `/cuenta?salir=1`; `AccountPanel` (que sí tiene Clerk) borra la pista, cierra la sesión y vuelve al inicio. Sin sesión, solo limpia la URL.
- **Cero Clerk en páginas públicas**: verificado con `curl` sobre el build (`/`, `/pedido`, `/proveedores`, `/blog`, `/sobre-nosotros`, `/support`, `/proveedores/planes`, `/descarga`, `/terminos`): ninguna menciona Clerk en el HTML ni en los chunks de JS que referencian.
- Limitación: un proveedor que nunca pasó por `/cuenta` en ese browser (o cuyo `__client_uat` cambió) se ve como "cliente" hasta entrar a `/cuenta`. El alta y el reclamo no escriben la pista (no se tocó más flujo privado del necesario).

### Eventos nuevos (sin renombrar nada)

Placements nuevos, en `LAYOUT_PLACEMENTS` y `QUOTE_CTA_PLACEMENTS` de `lib/analytics/events.ts`, con el patrón de siempre (`data-analytics-*` + el listener delegado de `AnalyticsEvents`), documentados en `analytics.md`:

| Botón | Evento | `placement` |
|---|---|---|
| "Hacé tu pedido" de la barra fija | `quote_cta_clicked` | `mobile_bar` (nuevo valor de `QUOTE_CTA_PLACEMENTS`) |
| WhatsApp de la barra fija | `whatsapp_clicked` | `mobile_bar` |
| WhatsApp del footer (antes sin evento) | `whatsapp_clicked` | `footer` |
| Botón flotante de WhatsApp (antes sin evento) | `whatsapp_clicked` | `fab` |
| "Sumá tu negocio" del header | `partner_register_started` | `header` |
| "Sumá tu negocio" del menú de cuenta / mobile | `partner_register_started` | `account_menu` |
| "Sumate como proveedor" del footer (antes sin evento) | `partner_register_started` | `footer` |

Los `quote_cta_clicked` `header`, `header_menu` y `footer` siguen igual. Dejan de llegar `app_store_clicked` `header` y `header_menu` (el header ya no ofrece la descarga). Los WhatsApp del layout van sin `lead_source`: en Meta son `Contact`, no `Lead`.

### `WhatsappFab`

Se queda, con dos cambios: se mide (`fab`) y en celular se esconde en las páginas con barra fija (`data-bottom-bar`, mecanismo que ya existía), porque la barra trae WhatsApp y no se duplica. Desde `lg`, y en celular en las páginas sin barra, sigue visible: el prototipo no lo dibuja, pero DECISIONES pide que WhatsApp "quede visible como segunda opción" y en desktop no hay otro acceso fijo. Si producto prefiere sacarlo en desktop, es borrar una línea en `app/layout.tsx`.

### Diferencias con el diseño y por qué

- **Borde del input** `#6b7280` en lugar de `#9ca3af` (accesibilidad, ver arriba).
- **Ancho del contenido**: el prototipo usa `max-width: 1200px` con padding `clamp(16px, 4vw, 40px)`; el repo usa `Container size="wide"` (1440 px + 6 %) para que header, secciones y footer compartan bordes (regla de `AGENTS.md`). Lo mismo en la barra fija (`px-[6%]` en lugar de 16 px).
- **Breakpoint**: el prototipo cambia a celular en 860 px; acá es `lg` (1024 px), porque entre 861 y 1023 px el header completo no entra con el gutter del 6 %.
- **Avatar sin inicial**: con sesión el prototipo muestra "R". El header no sabe el nombre (no carga Clerk y la pista no guarda datos personales): va el ícono de persona sobre `action`.
- **Opciones del menú**:
  - Sin "Mis pedidos" ni "Mis autos" (cliente y sin sesión) ni "Mis pedidos · Los que hiciste para tu auto" (proveedor): la cuenta del usuario final no existe todavía en la web (pendiente en DECISIONES). Un link a `/cuenta` con ese nombre llevaría a la cuenta de talleres.
  - Cliente: "Mi cuenta" pasa a ser la opción principal.
  - Proveedor: "Pedidos recibidos", "Perfil del negocio" y "Plan" se reemplazan por "Mi negocio · Tus negocios y el estado de su plan" (`/cuenta`, que hoy no tiene pestañas) + "Planes para proveedores". Cuando la fase de la cuenta sume pestañas, se vuelven a separar.
  - "Ingresar o crear cuenta" lleva a `/cuenta` (hoy, el login de talleres); se ajusta cuando se haga la pantalla `Ingresar`.
  - "Ayuda" lleva a `/support`.
- **Menú mobile**: el prototipo lo despliega dentro del header empujando la página; acá es un panel de pantalla completa debajo del header (sin salto de layout y con scroll propio).
- **`/pedido`**: el prototipo muestra "Hacé tu pedido" en el header también ahí; se mantiene `cta={false}` (sería un link a la misma página). La barra fija de `/pedido`, la del perfil de proveedor y la del blog son las actuales hasta que se rehagan esas páginas (fase 4); la barra compartida solo va en la home y el directorio.
- **Footer**: "Sumate como proveedor" lleva al alta (`/proveedores/registro`, mismo texto que ya usaba el sitio), "Descargar la app" a `/descarga` y WhatsApp al chat sin mensaje precargado (el viejo `contact.whatsapp` precargaba "comprar un escáner"). En celular los grupos van de a dos columnas y cada link mide 44 px.

### Dudas abiertas

- ¿Se declara la cookie `al_role` en `/privacidad`? Es funcional, de primer partido y sin datos personales; no se tocó el texto legal.
- `DownloadCta` quedó sin uso (el header era su único consumidor). Se dejó por si alguna página de la fase 4 vuelve a ofrecer la descarga en mobile; si no, se borra junto con `nav.cta` y `nav.downloadTargets`.
- `/cuenta?salir=1` cierra sesión con un GET: alguien podría mandar ese link y cerrarte la sesión. Riesgo bajo (solo molesta), pero conviene saberlo.

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes de `.agents/`, `.claude/` y `.cursor/`).
- `npx tsc --noEmit`: sin errores.
- `npm run build`: OK.
- Capturas con Chrome headless (CDP) del build en `next start --port 3100`: header a 1440 px en los tres estados con el menú abierto (sin sesión, cliente con `__client_uat`, proveedor con `al_role`), pista de rol vieja (se ve como cliente), header, menú y barra a 390 px, fin de página a 390 px (la barra queda debajo del footer), footer a 1440 px (`/support`) y `/pedido` a 390 px con el menú abierto (sin "Hacé tu pedido"). Los bordes del logo y del contenido del footer coinciden con el header. Comparadas contra `capturas/HeaderEstados.webp`, `SiteFooter.webp` y `Home-celular.webp`.
- No hay tests automatizados del layout (los scripts `npm run test:*` cubren blog, perfiles, directorio, reclamos y facturación, que no se tocaron).

## Fase 3: módulo de pedido

`ModuloPedido` (`components/modulo-pedido/`): pestañas Taller / Auxilio / Multas / Seguro con íconos 3D, barra "¿Qué le pasa?" + "¿Dónde estás?" + "Pedir propuestas", chips de "Lo más pedido", paso 2 con WhatsApp y patente "(opcional, recomendada)", y estado enviado. Reutilizable: props `placement` (`modulo_home` | `modulo_pedido`), `headingLevel` (`h2` | `h3`, lo decide la página) e `idPrefix`.

### Dónde quedó montado

En una **vista previa**: `/pedido/modulo` (`index: false`, fuera del sitemap y de `llms.txt`, `PageShell` sin "Hacé tu pedido"). No se reemplazó el form de `/pedido` porque no es un cambio de pieza sino de página: `PedidoForm` es la tarjeta de la columna derecha del hero en desktop y una vista a pantalla completa en celular, y la abren tres botones (`OpenFormButton` del hero, de la banda de cierre y de la barra fija) por un listener delegado. Montar el módulo ahí obliga a rehacer el hero (el diseño lo pone centrado debajo del H1) y la barra fija, que es la fase 4. La vista previa se borra en esa fase. `/pedido` y el Home siguen como estaban.

### Mapeo pestaña → backend

| Pestaña | Qué hace | Backend |
|---|---|---|
| Taller | Form de 2 pasos | `POST /api/presupuesto` → `POST /api/v1/quote-requests`, con el mismo body que el form de `/pedido`: `description` = "¿Qué le pasa?", `address` = "¿Dónde estás?" + geocode de Places, `contactPhone`, `plate` y `vehicleLookup` opcionales, `consent: true`. |
| Auxilio | Panel con "Pedí auxilio" → asistir24.com.ar | No hay vertical de auxilio en el backend. Mismo aliado y misma URL que el banner del Home (`homeContent.allies`). |
| Multas | Panel con "Consultá tu caso" → sinfotomultas.com.ar | Ídem: aliado del Home. |
| Seguro | Panel con "Cotizá por WhatsApp" (chat de AutoLibre con "¡Hola! Quiero cotizar el seguro de mi auto.") | **No existe endpoint de cotización de seguros.** El prototipo trae un form (patente, WhatsApp, tipo de cobertura); no se simuló: se reemplazó por WhatsApp, lo más conservador. |

El backend no recibe categoría ni pestaña: el DTO de `quote-requests` usa `forbidNonWhitelisted`. La pestaña viaja solo a PostHog (`quoteTab` y `quotePlacement` en el body de la route, que los valida contra valores cerrados y no los reenvía).

### Qué es server y qué es client

- **Server** (`modulo-pedido.tsx`): arma todo lo que se lee. Íconos (`next/image`, `alt=""`), labels, chips, los cuatro paneles (los de aliados enteros, con sus `h2`), la fila "¿Preferís chatear?" con el WhatsApp medido por `data-analytics-*`, el link a `/privacidad`, el ícono del enviado y "Bajar la app". El copy del form llega a la isla como props (viaja en el HTML, no en el JS).
- **Client, dos islas hoja**:
  - `ModuloTabs`: solo qué pestaña está elegida. Recibe íconos y paneles ya renderizados.
  - `ModuloForm`: el form de Taller (estado, validación, Places, lookup de patente, envío y los tres estados).
- Verificado con `curl` del build: el HTML del server trae las cuatro pestañas, los tres títulos de los paneles de aliados, labels, placeholders, chips y el WhatsApp. En el chunk de la isla, de copy solo están los mensajes de error del WhatsApp (se separaron a `lib/content/whatsapp-errors.ts`, re-exportado desde `presupuesto.ts`, para no arrastrar todo el copy de `/pedido`).
- Lógica compartida con `PedidoForm`, sin cambiar su comportamiento: `components/pedido/pedido-client.ts` (`usePlateLookup`, `usePlacesAutocomplete`, `postQuoteRequest`, `placesDropdownOpen`, `withTimeout`), extraídos tal cual de `pedido-form.tsx`, que ahora los usa.
- Íconos: 9 PNG de `autolibre-mobile/assets/images/{pedido,icons-3d}/` (256-288 px) convertidos con `sharp` a WebP en `public/images/pedido/`: pestañas a 104 px (uso 52) y chips a 56 px (uso 28), de 1.7 a 5.4 KB cada uno. `next/image` con `width`/`height` reales y `sizes`; ninguno es LCP, sin `preload`.

### JS (build de producción, suma de los `<script src>` del HTML, gzip local)

| Ruta | Antes (HEAD de la fase 2) | Después |
|---|---|---|
| `/pedido` | 13 scripts · 727.9 KB · 222.0 KB gzip | 13 · 729.6 KB · 222.5 KB gzip |
| `/` | 13 · 712.6 KB · 217.3 KB gzip | 13 · 713.1 KB · 217.4 KB gzip |
| `/pedido/modulo` (nueva) | — | 13 · 717.5 KB · 217.6 KB gzip |

Chunk propio de la ruta (lo que no comparte con `/sobre-nosotros`): **módulo 45.8 KB / 15.6 KB gzip** contra **57.8 KB / 20.6 KB gzip** de las islas de `/pedido` (`PedidoForm` + barra fija). Las demás rutas suben menos de 1 KB por las entradas nuevas del catálogo de eventos (`events.ts` va en el layout). El script de Google Maps sigue sin bajar hasta el primer foco o toque de "¿Dónde estás?" (verificado interceptando la red: la primera petición a `maps.googleapis.com` sale recién al enfocar el campo).

### Eventos nuevos (sin renombrar nada; detalle en `analytics.md`)

| Qué | Evento | Props |
|---|---|---|
| Inicio del pedido por pestaña | `quote_started` (existente), `quote_tab_selected` (nuevo), `quote_partner_clicked` (nuevo, clickable) | `tab`, `placement`. Taller: `quote_started` con `tab: "taller"`. Auxilio y Multas: `quote_partner_clicked` (su "inicio" es salir al aliado). `quote_tab_selected`: cada elección de pestaña (la inicial no cuenta). |
| Paso 2 visto | `quote_step_viewed` (existente) | `step: 2`, `tab`, `placement`. Antes solo lo usaba el modal. |
| Envío por pestaña | `quote_submitted` (existente, no se creó otro) | La route suma `tab` y `placement` al evento de PostHog; el cliente los manda en su `track` (a Meta solo llega `lead_source`, como siempre). `quote_failed` también suma `tab` y `placement`. |
| Chips | `quote_chip_clicked` (nuevo) | `chip` (id cerrado, nunca texto), `placement`, `selected`. |
| WhatsApp por ubicación | `whatsapp_clicked` (existente) | `placement: "modulo_home"` o `"modulo_pedido"`, más `tab` (nuevo atributo `data-analytics-tab`, valores cerrados). `lead_source: "whatsapp"` solo en `modulo_pedido`, como el resto de `/pedido`. |

`lead_source` del pedido: `form` en las dos ubicaciones, igual que lo que ya ponía la route en PostHog para todo `flow: "page"`.

### Accesibilidad

- Tabs: patrón APG con activación automática. `tablist`/`tab`/`tabpanel`, `aria-selected`, `aria-controls` y `aria-labelledby` cruzados, roving tabindex, ←/→ en círculo, Inicio/Fin. Verificado con CDP: cada tecla mueve el foco y la selección, y Tab desde la pestaña entra a "¿Qué le pasa?".
- Errores: `aria-invalid` + `aria-describedby` al texto del error y foco al primer campo inválido. El error del servidor va en una región `aria-live="assertive"` que existe siempre. El estado de la patente ("Validando…", "Patente validada", "No pudimos validarla…") en una región `polite`, como en `/pedido`.
- Al pasar de paso o enviar, el foco va al título nuevo (`tabIndex=-1`); "Cambiar" y "Hacer otro pedido" lo devuelven a "¿Qué le pasa?".
- Labels visibles en todos los campos; inputs de 16 px; objetivos de 44 px o más (pestañas, chips de 44, botones de 44 a 56, "Cambiar" de 44, "Hacer otro pedido" de 48). Foco: anillo `brand` en la celda de la barra (el input no tiene borde propio), en el control del WhatsApp y el global en el resto.
- Chips con `aria-pressed`, dentro de un `role="group"` con nombre "Lo más pedido".
- Links que salen del sitio con el aviso `sr-only` "(se abre en otra pestaña)" de `siteContent.nav.externalHint`.
- Contraste: solo tokens ya verificados en la fase 1 (`fg`, `fg-muted` y `fg-subtle` sobre `card`, `action` sobre `brand-50`, `status-alert` sobre `card`).

### CLS

0 en la carga (PerformanceObserver de `layout-shift` a 390 y 1440 px). El estado inicial (Taller, paso 1) es el mismo en el server y al hidratar. Los cambios de alto (paso 2, enviado, errores, cambio de pestaña) pasan solo por un click o una tecla: con eventos reales de mouse y teclado por CDP, la suma de `layout-shift` sin `hadRecentInput` en todo el flujo dio 0 en los dos anchos.

### Diferencias con el diseño y por qué

- **Seguro**: sin el form del prototipo (no hay endpoint); panel con WhatsApp.
- **Patente**: no se reusó `plate-field.tsx`. Es la patente del modal (obligatoria, label fijo "Patente", tarjeta "Sí, es mi auto / No es mi auto") y está atada al estado de `useQuoteFlow`; acá la patente es opcional y va en una fila. Se reusó la validación existente: `normalizePlateInput` e `isValidPlate`, el lookup en clasific.ar al salir del campo con el mismo hook que `/pedido` (nunca bloquea; el envío lo espera hasta 5 s) y el ícono de estado (`FieldStatusIcon`). Como en `/pedido`, no se muestran marca y modelo.
- **Enviado**: no se reusó `quote-success.tsx` tal cual: importarlo desde la isla arrastra `use-quote-flow.ts` (todo el hook del modal) y `StoreLinks` al bundle. Se adaptó su anatomía (check en círculo, título, bajada, siguiente paso) al diseño del módulo, con el ícono y "Bajar la app" renderizados en el server. Suma el código del pedido ("Tu pedido es el #AL-1042") cuando el backend lo devuelve.
- **Chips**: un chip reemplaza el texto de "¿Qué le pasa?" (como el prototipo); tocarlo de nuevo lo vacía. Está "puesto" si el campo dice exactamente su texto, así que editar a mano lo apaga. En `/pedido` los atajos se suman con coma.
- **Texto legal**: el prototipo solo dice "Tu WhatsApp lo usamos solo para avisarte de este pedido". Como el envío manda `consent: true` sin checkbox (igual que `/pedido`), se sumó "Al enviarlo aceptás que compartamos tu consulta con proveedores de nuestra red." El link a `/privacidad` es interno.
- **Inputs del paso 2 en píldora** con borde `control-line-strong` (`#6b7280`, decisión de la fase 2) en lugar de radio de 12 px y `#9ca3af`. El borde de la barra del paso 1 también usa `control-line-strong`.
- **Breakpoint**: la barra pasa de tarjeta apilada a píldora en `md` (768 px), no en 861 px: la píldora entra desde ahí y es el breakpoint del repo más cercano.
- **CTA de Seguro**: "Cotizá por WhatsApp" (el texto largo partía en dos renglones a 390 px).
- **Hovers**: el diseño no los define; pestañas con borde `control-line` y el resto los de las primitivas.
- **WhatsApp**: los links de Taller y Seguro usan `whatsappUrl` (el número de `siteConfig`), no el número escrito a mano del prototipo.

### Endpoints que faltan

- **Cotización de seguros** (por ejemplo `POST /api/v1/insurance-quote-requests` con patente, WhatsApp, tipo de cobertura y consentimiento). Con eso la pestaña Seguro puede tener el form del diseño.
- **Pestaña o categoría en `quote-requests`**: el DTO no acepta un campo de categoría (ni los UTMs, TODO viejo). Hoy la pestaña solo queda en PostHog.
- Auxilio y Multas no necesitan endpoint mientras sean aliados externos.

### Dudas abiertas

- ¿Producto confirma que Seguro vaya a WhatsApp hasta que exista el endpoint, y la promesa "te mandamos una cotización para que compares" (copy del diseño)?
- ¿El chip debe reemplazar el texto (diseño) o sumarse con coma como los atajos de `/pedido`?
- En el Home, ¿el WhatsApp del módulo tiene que ser `Lead` (con `lead_source`) o `Contact` como el resto del Home? Hoy: `Contact`. Es cambiar una línea en `modulo-pedido.tsx`.
- `quote_step_viewed` ahora también lo manda el módulo (`step: 2`, `flow: "page"`): en Meta es `PedidoPaso`, que antes solo venía del modal (que ya no se abre). Si marketing usa ese evento, conviene avisarle.

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes).
- `npx tsc --noEmit`: sin errores.
- `npm run build`: OK (`/pedido/modulo` estática).
- Tests: `test:blog` 86, `test:provider-profile` 44, `test:proveedores` 58, `test:partner-claims` 16 y `test:partner-billing` 70, todos pasan. Ninguno cubre el pedido: no hay tests del form.
- Visual con Chrome headless (CDP) sobre `next start --port 3100`, a 1440 y 390 px, contra `capturas/ModuloPedido.webp`, `Pedido.webp` y `Pedido-celular.webp`: paso 1, paso 1 con errores, paso 2, paso 2 con error de WhatsApp, error del servidor, enviado y los paneles de Auxilio y Seguro.
- Flujo con teclado y mouse reales por CDP. **Ningún pedido salió**: `/api/presupuesto` se interceptó con `Fetch.requestPaused` (primero un 502 simulado, después un OK con `AL-9999`), y `/api/vehicle-lookup` y `maps.googleapis.com` se bloquearon. El body interceptado trae `quoteTab: "taller"` y `quotePlacement: "modulo_pedido"`.
- `/pedido` después del refactor de `PedidoForm`: mismo flujo a 1440 px con la red interceptada (envío vacío marca problema, zona y WhatsApp con foco en el primero; 502 simulado muestra el error; el OK simulado muestra la confirmación con #AL-9998). El body sigue igual (sin `quoteTab` ni `quotePlacement`), el lookup de la patente sale al salir del campo y Google Maps recién al enfocar la zona.

## Fase 4a: Home y /pedido

Rama `feat/rediseno-2026-11`, 2026-11-24. El Home y `/pedido` pasan al diseño nuevo (`Main`/`Home-celular`, `Pedido`/`Pedido-celular`) con el `ModuloPedido` como formulario. Medido con build de producción local (`next start --port 3100`), igual que la fase 0.

### Decisiones de producto incorporadas (2026-11-24, decisión de producto)

1. **Sin seguros por ahora**: se sacó la pestaña Seguro del módulo (quedan Taller, Auxilio y Multas). `QUOTE_TABS` ya no tiene `seguro` (el listener de `data-analytics-tab` y la route de `/api/presupuesto` descartan ese valor); se borraron `public/images/pedido/seguro.webp`, el panel y su copy. Tabs: el patrón APG no depende de la cantidad (roving tabindex, ←/→ en círculo, Inicio/Fin), verificado con 3 pestañas. Alineado: `public/llms.txt` ya no lista seguros entre lo que se puede pedir y `PRODUCT.md` lo anota. Queda en el Home el **beneficio** del aliado Intēgrity Seguros (es un descuento de un aliado, no un pedido): si producto quiere sacarlo también, es borrar un ítem de `homeContent.allies`.
2. **Auxilio y Multas** siguen llevando a Asistir24 y Sin Fotomultas.
3. **Consentimiento real** en el paso 2 del módulo: checkbox nativo visible, **desmarcado** por defecto, con `label` asociado que ocupa todo el renglón (116 px de alto a 390, 56 px a 1440: objetivo táctil de 44 px o más). Texto: "Acepto que AutoLibre comparta mi consulta y mi WhatsApp con proveedores de su red para que me respondan, según los Términos y Condiciones y la Política de Privacidad." (links a `/terminos` y `/privacidad`, en otra pestaña para no perder lo cargado; copy en `lib/content/modulo-pedido.ts`, basado en el del modal). Si no está marcado, el envío se bloquea: error visible con `aria-invalid` + `aria-describedby` y foco en el checkbox (verificado por CDP: 0 llamadas a `/api/presupuesto` y foco en `pedido-modulo-consentimiento`). `consent` viaja con el valor real del checkbox. Se sacó la frase de la fase 3 ("Al enviarlo aceptás…"); queda "Tu WhatsApp lo usamos solo para avisarte de este pedido.". El error aparece por interacción (CLS 0 en todo el flujo). Revisión con `rg consent`: `PedidoForm` (forzaba `true`) se borró con el form viejo; `components/quote-flow` (el modal, hoy sin importadores) ya usaba un checkbox real desmarcado y obligatorio; la route exige `consent === true`.
4. **Backend sin cambios**: la pestaña sigue yendo solo a PostHog.
5. **Avisar a marketing de `PedidoPaso`**: `quote_step_viewed` (`step: 2`) ahora lo manda el módulo en el Home y en `/pedido` (antes solo el modal). Anotado también en `analytics.md`.

### Qué cambió

- **Home** (`app/page.tsx`): hero centrado con el `<h1>` y el módulo (Taller por defecto, `placement: "modulo_home"`), cifras (+150 proveedores, 700+ vehículos, "En el día"), "Todo lo que podés pedir" (6 servicios con ícono 3D + "También…", todo enlaza a `/pedido`), "Un pedido, varias respuestas.", beneficios de aliados (scroll horizontal nativo en celular), panel oscuro de la app (con `id="descargar"`: el ancla `/#descargar` sigue viva), guías del blog, FAQ y tarjeta para negocios. Todo Server Component; las únicas islas son las del módulo. Se borraron 13 secciones viejas (hero animado, presupuestos, problema, funciones, marketplace, historial, cómo funciona, diagnóstico, FAQ con pestañas client, carrusel de aliados client, pantallas, últimas guías). `ClosingCtaSection` y `ProviderBandSection` se conservaron porque las usan `/blog`, `/sobre-nosotros`, `/proveedores` y los perfiles.
- **`/pedido`** (`app/pedido/page.tsx` + `components/pedido/pedido-sections.tsx`): migas "Inicio / Pedir propuestas", sello, `<h1>` "Presupuestos para tu auto, de proveedores en tu zona." (mantiene "presupuesto"), módulo (`placement: "modulo_pedido"`), tres checks, "Así te llega la respuesta", "Cómo funciona", FAQ + "Guías que te pueden servir" y banda de cierre ("Hacé tu pedido" sube al módulo; WhatsApp con borde y `lead_source: "whatsapp"`). Barra fija de celular: la compartida (`MobileActionBar`), con "Hacé tu pedido" → `#pedido` y el WhatsApp como `Lead`.
- **Borrado** (verificado con `rg`, sin importadores): `PedidoForm`, `PedidoHero`, `PedidoStickyBar`, `OpenFormButton`, `WhatsappLink`, `components/pedido/shared.ts`, la vista previa `app/pedido/modulo/page.tsx` y su copy, el QR de WhatsApp de `/pedido` (`qr-code.tsx`) y `presupuestoContent.section`. `pedido-client.ts` se queda (lo usa el módulo).
- **Lo que el form viejo hacía y se conservó**: `lead_source: "form"` en el `Lead` del pedido y `"whatsapp"` en los WhatsApp de `/pedido` (módulo, barra y cierre); `quote_started`, `quote_step_viewed` (`PedidoPaso`), `quote_submitted` con `metaEventId` compartido con la Conversions API y `quote_failed`; lookup de patente y Google Places diferido. **No se conservó** el botón "Mandanos un mensaje ahora" de la confirmación (`whatsapp_clicked` `confirmation`, era opcional): el enviado del módulo ofrece "Bajar la app" y "Hacer otro pedido", como el diseño.
- **Piezas nuevas**: `components/marketing/` (`styles.ts`, `numbered-steps.tsx`, `faq-list.tsx` con `<details>`, `guide-links.tsx`), `lib/blog/picks.ts` (notas de Hygraph por fecha y por slug, con el mismo `getPosts` cacheado: `revalidate` + tag `hygraph`), variante de botón `outlineDark` (borde `on-dark-subtle` 4.86:1, texto blanco), tonos `card` y `canvas` en `Section` y props de `MobileActionBar` (`quoteHref`, `label`, `whatsappLead`) vía `PageShell`. Íconos de servicios: 6 WebP de 128 px (3,7 a 6,1 KB) en `public/images/servicios/`, desde los PNG de `autolibre-mobile`.
- **Eventos nuevos** (detalle en `analytics.md`): `quote_cta_clicked` `home_services` y `pedido_cta_band`; `app_store_clicked` `home_app`; `whatsapp_clicked` `home_faq`; `partner_register_started` `home_band`.
- **Arreglo de paso**: la fecha de `PostCard` pasa de `text-ink/60` a `fg-subtle` (era el `color-contrast` que fallaba en `/` y en `/blog`).

### Title y description del Home (la decisión final es del equipo)

| | Title | Description |
|---|---|---|
| **A (aplicada)** | AutoLibre · Pedí propuestas de talleres cerca tuyo, gratis | Contá qué le pasa a tu auto y recibí propuestas de talleres y proveedores de tu zona por WhatsApp, en el día. Gratis y sin compromiso. +150 proveedores en AMBA. |
| B | Talleres y servicios para tu auto en AMBA · AutoLibre | Pedí propuestas gratis de talleres, gomerías y servicios de tu zona en AMBA. Contá qué le pasa a tu auto y te respondemos por WhatsApp en el día. |

Se aplicó A: arranca con la acción (la conversión principal según `PRODUCT.md`), usa el vocabulario confirmado ("Pedí propuestas") y solo afirma lo que ya se publica (gratis, en el día, AMBA, +150). B apunta más a la keyword ("talleres AMBA") pero pierde la marca al principio. Viven en `homeContent.meta`. El Home no recibe el template del layout, por eso la marca va escrita.

**Titular**: se aplicó el eslogan actual "Todo tu auto, en un solo lugar." (lo conservador). La otra opción del lienzo es "¿Qué necesita tu auto?". Las palabras rotativas del hero viejo no están en el diseño y se fueron: la excepción `motion-exempt` de `AGENTS.md` §3 para esas palabras queda sin uso (la de `VerticalsBandSection` tampoco aplica: esa franja ya no está en el Home). No se tocó `AGENTS.md`; conviene actualizar ese párrafo.

### Inventario SEO antes / después (HTML del server)

| | `/` antes | `/` después | `/pedido` antes | `/pedido` después |
|---|---|---|---|---|
| title | AutoLibre · Todo tu auto, en un solo lugar | AutoLibre · Pedí propuestas de talleres cerca tuyo, gratis | Presupuestos gratis para tu auto, por WhatsApp · AutoLibre | igual |
| description | "Documentación, vencimientos… Descargala gratis…" | opción A (arriba) | "…te pasamos Presupuestos de proveedores…" | "…recibí presupuestos de proveedores de tu zona en AMBA por WhatsApp…" (se corrigió la mayúscula) |
| canonical · robots | `https://autolibre.ai` · index, follow | igual | `https://autolibre.ai/pedido` · index, follow | igual |
| H1 | Todo tu auto, en un solo lugar. (1) | igual (1) | Presupuestos de proveedores en tu zona, por WhatsApp. (1) | Presupuestos para tu auto, de proveedores en tu zona. (1) |
| Saltos de heading | ninguno | ninguno | ninguno | ninguno |
| JSON-LD | Organization, WebSite, WebPage, SoftwareApplication, FAQPage | + **BreadcrumbList** (faltaba) | Organization, WebPage, BreadcrumbList, FAQPage | igual (miga "Pedir propuestas") |
| Clerk (HTML y chunks) | 0 | 0 | 0 | 0 |

Outline del Home después: h1 → h2 "¿Te quedaste en el camino?" y "¿Tenés multas?" (paneles del módulo, ocultos pero en el HTML) → "Todo lo que podés pedir" → "Un pedido, varias respuestas." (3 h3) → "Beneficios de nuestros aliados" (3 h3) → "Todo lo que necesitás, en una app" (3 h3) → "Guías para tener tu auto en regla" (3 h3 de notas + "Más guías") → "Preguntas frecuentes" (h3 "Sobre la app") → "¿Tenés un taller o prestás un servicio?". `/pedido`: h1 → h2 de los paneles del módulo → "Así te llega la respuesta" → "Cómo funciona" (3 h3) → "Preguntas frecuentes" → "Guías que te pueden servir" → "Contanos qué le pasa a tu vehículo".

Contenido indexable que se mantuvo de otra forma: la FAQ de la app (`lib/content/faq.ts`, unas 30 preguntas de documentación, diagnóstico, OBD2, talleres e historial) sigue en el Home debajo de las 5 del pedido, agrupada por tema en `<details>` (todo en el HTML y en el `FAQPage`; solo se saca "¿En qué zonas…?", que repite "¿Dónde funciona?"). "Cada service suma…" y "Entendé qué le pasa…" pasaron a `h3` del panel de la app. Se pierde el texto de "Ahora sabés qué necesita tu auto", "Empezás en dos minutos" y el ejemplo de historial (el diseño los saca). En `/pedido` las preguntas pasan de `h3` a `<summary>` (siguen en el `FAQPage`).

Enlazado interno del Home: `/pedido` (header, 6 tarjetas y 9 links de servicios), 3 notas nuevas + 3 elegidas ("Más guías"), `/blog`, `/proveedores` ("Ver la red"), `/proveedores/registro` y `/proveedores/planes`. `/pedido` enlaza 3 notas, `/blog`, `/descarga`, `/terminos` y `/privacidad`.

`app/sitemap.ts`: `lastModified` de `/` y `/pedido` = 2026-11-24. `public/llms.txt`: Inicio y Pedir presupuesto reescritos (módulo, consentimiento, +150, sin seguros). `/pedido/modulo` devuelve 404.

### Lighthouse 12 antes / después

Mismo método que la fase 0. Móvil: una corrida suelta variaba mucho en esta máquina (tareas largas "Unattributable" de 2 s que aparecían al azar), así que se hicieron 3 corridas por ruta y se guardó la **mediana** como `<ruta>-movil.json`; las tres están en `despues/<ruta>-movil-corrida{1,2,3}.json` (`/`: Performance 72 / 78 / 59; `/pedido`: 60 / 86 / 82).

| Ruta | Modo | Medición | Perf | A11y | BP | SEO | LCP (s) | CLS | TBT (ms) | FCP (s) | Elemento LCP | Bloqueo de Facebook |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/` | Móvil | Antes | 55 | 96 | 75 | 100 | 4.72 | 0 | 2046 | 1.22 | `h1#hero-title` | 546 ms |
| `/` | Móvil | Después | 72 | 97 | 96 | 100 | 3.56 | 0 | 743 | 1.34 | `h1#hero-title` | no cargó |
| `/` | Escritorio | Antes | 84 | 96 | 74 | 100 | 1.07 | 0 | 327 | 0.45 | `img` (pantalla del hero) | 85 ms |
| `/` | Escritorio | Después | 90 | 100 | 96 | 100 | 1.06 | 0 | 235 | 0.34 | `h1#hero-title` | no cargó |
| `/pedido` | Móvil | Antes | 53 | 100 | 75 | 100 | 6.28 | 0 | 1224 | 1.16 | `h1#pedido-titulo` | 583 ms |
| `/pedido` | Móvil | Después | 82 | 100 | 96 | 100 | 3.46 | 0 | 369 | 1.09 | `h1#pedido-titulo` | no cargó |
| `/pedido` | Escritorio | Antes | 77 | 100 | 74 | 100 | 1.35 | 0 | 446 | 0.33 | `h1#pedido-titulo` | 85 ms |
| `/pedido` | Escritorio | Después | 99 | 100 | 96 | 100 | 0.85 | 0 | 78 | 0.30 | `h1#pedido-titulo` | no cargó |

Lectura:

- **LCP**: en las dos páginas y en los dos anchos el LCP es el `<h1>` (texto del server, sin animación, `next/font` con `swap` y fallback métrico). No hay imagen LCP, así que ninguna imagen lleva `preload`. En la traza, el LCP **observado es igual al FCP** (1,23 s y 1,08 s en las corridas móviles): el h1 se pinta en el primer frame. Los 3,5 s móviles son la simulación de Lantern, que le carga al LCP todo el JS pedido antes (el "Render Delay" es el 85 %). Para bajar de 2,5 s en la simulación hay que achicar el JS compartido de la plataforma (el chunk más pesado es el mismo en todas las rutas), fuera del alcance de esta fase. En producción (compresión y CDN de Vercel) la fase 0 ya medía mejor que en local.
- **CLS 0** en todo: carga a 390 y 1440 y el flujo completo del módulo con mouse y teclado reales (PerformanceObserver).
- **Buenas prácticas 74-75 → 96**: una parte es real (sin las advertencias del Pixel), pero en buena medida es porque el Pixel no llega a cargar durante la medición (ver abajo). Los 404 de `/_vercel/*` siguen siendo un artefacto local.
- **Accesibilidad**: `/` móvil da 97 por `target-size` en dos chips ("Alineación y balanceo", "Frenos"): miden 44 px, pero en el viewport de Lighthouse (412 × 823) quedan debajo de la barra fija inferior al cargar. Es la barra del diseño; al scrollear quedan libres.

### JS por ruta (suma de los `<script src>` del HTML, gzip local)

| Ruta | Antes (fase 0) | Fase 3 | Después |
|---|---|---|---|
| `/` | 13 · 720.0 KB · 220.6 KB gzip · HTML 221.0 KB | 13 · 713.1 KB · 217.4 KB gzip | **12 · 713.4 KB · 215.9 KB gzip** · HTML 217.2 KB |
| `/pedido` | 13 · 735.8 KB · 225.4 KB gzip · HTML 108.1 KB | 13 · 729.6 KB · 222.5 KB gzip | **12 · 713.4 KB · 215.9 KB gzip** · HTML 123.5 KB |

Las dos rutas cargan ahora exactamente el mismo JS: el de la plataforma más las dos islas del módulo. Se fueron del Home la FAQ con pestañas y el carrusel de aliados (client), y de `/pedido` el form viejo (57,8 KB / 20,6 KB gzip de islas) y la barra fija con su `IntersectionObserver`.

### Meta Pixel y PostHog

- **Meta Pixel**: ya tenía el stub `fbq` inline en el `<head>` (cola de eventos) y `fbevents.js` con `next/script` `lazyOnload`, y aun así sumaba 520-590 ms de bloqueo en celular (`fbevents.js` + su `signals/config`, unos 260 KB). Ahora `fbevents.js` lo inyecta un loader inline (`metaPixelLoader` en `app/layout.tsx`) con la **primera interacción** (`pointerdown`, `keydown`, `scroll` o `touchstart`) o, si no la hay, **3,5 s después del `load`** y en `requestIdleCallback` (tope de 2 s). La cola del stub conserva todo lo encolado antes (`init`, `PageView` y cualquier `QuoteStart` o `Lead` temprano), así que no se pierden eventos de quien interactúa. Verificado por CDP: sin interacción, la primera petición a `connect.facebook.net` sale a los ~3,7 s; en Lighthouse ya no aparece (bloqueo de Facebook: 0). **Costo**: quien se va antes de ~3,5 s después del `load` sin tocar ni scrollear no registra su `PageView` en Meta. El Pixel no se sacó.
- **PostHog**: ya estaba fuera del camino crítico (`instrumentation-client.ts` → `schedulePostHogLoad()`: `import()` de `posthog-js` después del `load` y en idle, con cola de eventos y el proxy `/ingest` del rewrite). Además solo carga en el deploy de Production de Vercel, así que en local no aparece en las mediciones. No se cambió.

### Diferencias con el diseño y por qué

- **Ejemplo de propuestas del Home** ("Service · Toyota Corolla 2013 · Tigre" con "[Proveedor A]" y "$ [precio]"): marcadores sin dato real, no se muestra.
- **Chat de ejemplo de `/pedido`**: el lienzo usa "[Proveedor A]", "$ [precio]" y "[dirección]". Se mantuvieron los valores que ya estaban publicados (Host Garage $ 100.000 y HyG Garage $ 125.000, con direcciones), rotulados "Ejemplo ilustrativo", sin los teléfonos que mostraba antes. Ojo: son nombres de negocios reales de la red con precios inventados (ver dudas).
- **La Esquina del Neumático** ("20% OFF" en el lienzo): sigue afuera (pendiente en DECISIONES).
- **Cifras del hero**: "+150" (DECISIONES) y "700+" vehículos (`traction` de `about.ts`, publicable según `PRODUCT.md`).
- **Botones de tienda**: se reusó `StoreLinks` (radio `field`, no píldora como el lienzo) para no duplicar la medición.
- **Paso 2 del módulo**: "Enviar pedido" bajó debajo del consentimiento (el lienzo lo pone en la fila de los inputs): el checkbox tiene que ir antes del botón en el orden de tabulación.
- **Captura del teléfono** del panel de la app: `IMG_0577.PNG` (la misma del hero viejo), con bisel `ink` (el lienzo usa `#0B130D`).
- **FAQ del Home**: el lienzo tiene 5 preguntas; se sumó "Sobre la app" debajo para no perder unas 30 preguntas indexables.
- **Header de `/pedido`**: sigue sin "Hacé tu pedido" (`cta={false}`, decisión de la fase 2).
- **"Ver la red"**: `outline` con borde `control-line`, como el lienzo (1.46:1: el botón se identifica por su texto).
- **Ancho**: `Container size="wide"` (regla de `AGENTS.md`) en lugar de 1200 px.
- **Bug encontrado y corregido**: en celular, los `sr-only` (posición absoluta) de la fila deslizable de aliados se escapaban del scroll y ensanchaban la página a 750 px (el navegador achicaba todo). La fila ahora es `relative`.

### Marcadores sin dato real

- "[Proveedor A/B/C]", "$ [precio]" y "[dirección]" (Home y `/pedido`): ver arriba.
- "Foto de portada actual" de las guías: se usan las portadas reales de Hygraph.

### Dudas abiertas

- ¿El chat de ejemplo de `/pedido` puede seguir usando nombres reales (Host Garage, HyG Garage) con precios inventados, o se cambian por nombres genéricos?
- ¿Se saca también el beneficio de Intēgrity Seguros del Home, ahora que no se ofrecen seguros?
- Title y description del Home: A aplicada, B alternativa. Titular: eslogan aplicado, "¿Qué necesita tu auto?" como alternativa.
- `AGENTS.md` §3 menciona las palabras rotativas del hero y `VerticalsBandSection`: ya no están en el Home; conviene actualizar ese párrafo.
- Sin la confirmación vieja ya no hay "Mandanos un mensaje ahora" después de pedir (`whatsapp_clicked` `confirmation`). Si se quiere, se suma al enviado del módulo como `Contact`.
- `PhoneFrame` y `DownloadCta` (`components/ui/`) y los keyframes `hero-word`/`hero-screen` de `globals.css` quedaron sin uso; no se borraron (primitivas y CSS compartidos): se pueden limpiar en la fase de cierre.

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes de `.agents/`, `.claude/` y `.cursor/`).
- `npx tsc --noEmit`: sin errores.
- `npm run build`: OK; `/` y `/pedido` son estáticas con revalidación de 5 min (la del fetch de Hygraph).
- Tests: `test:blog` 86, `test:provider-profile` 44, `test:proveedores` 58, `test:partner-claims` 16 y `test:partner-billing` 70: todos pasan. Ninguno cubre el módulo.
- Visual a 390 y 1440 con Chrome headless (CDP) contra `Main.webp`, `Home-celular.webp`, `Pedido.webp` y `Pedido-celular.webp`. Flujo del módulo en `/pedido` con la red interceptada (**ningún pedido real**: `/api/presupuesto` respondido por CDP con `AL-9999`; `vehicle-lookup` y Google Maps bloqueados): el envío sin consentimiento se bloquea, Espacio marca el checkbox y el body enviado lleva `consent: true`, `quoteTab: "taller"` y `quotePlacement: "modulo_pedido"`.
- `curl`: un solo h1, sin saltos, canonical, JSON-LD y cero Clerk en el HTML y en los chunks (tabla de arriba).

## Fase 4b: directorio y perfil

Rama `feat/rediseno-2026-11`, 2026-11-24. `/proveedores` y `/proveedores/[slug]` pasan al diseño nuevo (`Proveedores`/`Proveedores-celular`, `Proveedor`/`Proveedor-celular`; el perfil parte del de la spec 209). Medido con build de producción local (`next start --port 3100`) contra el backend de prueba (430 negocios de test; respondió durante toda la medición).

### Decisiones aplicadas

- **Todos los perfiles indexados** (decisión de producto): `index: true` para todo perfil encontrado, sin mirar `partner.indexable`. **Pendiente de backend**: hoy `indexable` es `true` solo con horarios estructurados (0 de los 26 negocios con dueño los tienen); conviene alinearlo (o sacarlo del contrato) en autolibre-backend-hex. La landing lo sigue parseando pero no lo usa.
- **Todos los perfiles al sitemap**: 430 URLs `/proveedores/{slug}` (antes 0), del mismo `fetchAllPartners` que usa el directorio (cacheado 1 h). `lastModified` = `updatedAt` del listado (el backend ya lo manda: `partners.updated_at`); si falta, la fecha fija 2026-11-24. Backend caído: el sitemap sale igual, sin perfiles. Se siguen salteando los slugs reservados. `/proveedores` con `lastModified` 2026-11-24.
- **Conteo real**: "430 negocios · 13 rubros · En todo el país" sale del directorio completo (y de las familias con al menos un negocio). Sin el dato, ese tramo no se muestra. "+150" queda solo en el marketing del Home.
- **Vocabulario**: "Pedir propuestas" / "Pedile una propuesta" en el directorio, el perfil, su 404, la meta description ("…Pedí propuestas gratis por AutoLibre.") y la FAQ del perfil ("¿Cómo le pido una propuesta a X?").

### Estrategia de render y caché

| Ruta | Antes | Después |
|---|---|---|
| `/proveedores` (sin query) | `ƒ` dinámica (leía `searchParams`) | **`○` estática con ISR 1 h** (`export const revalidate = 3600`): sale del CDN |
| `/proveedores?rubro=…&zona=…&q=…&pagina=…` | la misma ruta dinámica | rewrite `beforeFiles` de `next.config.ts` a `app/proveedores-filtros` (`ƒ`, dinámica, fetches en Data Cache; `q` sin caché como antes). La URL visible no cambia |
| `/proveedores/[slug]` | ISR on-demand (`generateStaticParams` → `[]`) | igual: el build no depende del backend; cada perfil se genera en su primer request y se revalida (1 h) |

Por qué así: según `page.md`, leer `searchParams` vuelve dinámica la página entera. Los filtros son links y un form GET (funcionan sin JS, se comparten y llevan canonical a `/proveedores`), y no quería pasarlos a una isla con fetch en el cliente. Separar la base (estática) de las variantes (dinámicas) con un rewrite por parámetro mantiene las dos cosas: la URL principal, la que se indexa y comparte, sale del CDN, y las variantes siguen siendo HTML del server con 404 real para `?pagina=` fuera de rango. `/proveedores-filtros` lleva la misma metadata (canonical `/proveedores`) y `robots.ts` la excluye; nadie la enlaza por ese nombre.

- Backend caído al regenerar la base: `connection()` (mismo recurso que `/proveedores/registro`) hace fallar la regeneración y Next sigue sirviendo la última versión buena; en el build, la ruta queda dinámica para ese deploy.
- Cache tags: los `fetch` de perfiles y directorio ahora llevan `provider-profiles` y `provider:{slug}`, las etiquetas que ya invalidaba `POST /api/revalidate/provider`. Antes ese webhook no vaciaba nada (los fetch no tenían tags).
- Verificado: `/proveedores` 200 (`x-nextjs-cache: HIT`), `?pagina=2`, `?rubro=motor`, `?q=garage` 200, `?pagina=999` 404, slug inexistente 404, `/proveedores-filtros` responde pero está en `Disallow`.

### Mapa

- **Sin librería de mapas.** Una imagen de Google Static Maps sin marcadores, con centro y zoom calculados en el server (`lib/proveedores/map.ts`, proyección Web Mercator, con tests) y los marcadores en HTML encima, en su posición real. Cero JS de terceros; los marcadores son botones (`aria-pressed`) y la tarjeta del elegido lleva al perfil.
- **Carga**: la imagen se pide con `IntersectionObserver` **y** después de la primera interacción (scroll, toque, tecla). Así nunca es candidata a LCP (el navegador deja de medirlo con la primera interacción): en la línea base el mapa del perfil, `loading="lazy"`, era el LCP de escritorio. Antes de la imagen se ve el fondo de referencia (calles dibujadas en SVG) con los marcadores ya en su lugar, en un contenedor de medidas fijas: CLS 0. Si Google rechaza la key, queda el fondo.
- **Directorio**: el listado del backend no trae coordenadas. Leer el perfil de cada negocio de la página (24 lecturas) en cada vista filtrada se comió el límite del backend (**60 pedidos por minuto por IP**: con unas pocas páginas filtradas seguidas el backend respondió 429 y un perfil no cacheado dio 500). Quedó así: las lecturas de perfiles se hacen **solo para la página base**, que es estática y se regenera a lo sumo una vez por hora, de a 4 en paralelo; las páginas con filtros muestran el mapa solo si el listado trae coordenadas (hoy no: sin mapa, grilla de 3 columnas). La landing ya parsea `address.latitude/longitude` del listado si llegan. **Pendiente de backend**: coordenadas en `GET /partner-profiles` (el read model ya las tiene).
- **Perfil**: mapa centrado en el negocio (zoom 15) con el marcador "monograma + localidad" del lienzo, solo con coordenadas y key.
- Sin distancias ("1,1 km" del lienzo): la web no conoce la ubicación de la persona.

### Otras piezas

- **Buscador**: una píldora (nombre · zona · rubro · Buscar) desde `md`; en celular, el nombre + botón "Filtros" (isla hoja `FiltersToggle`, `aria-expanded`) que muestra zona, rubro y Buscar. Sigue siendo un form GET. El rubro pasó de fila de links a desplegable, como el lienzo.
- **"¿No sabés a quién elegir?"** (directorio) y **"Pedile una propuesta"** (costado del perfil): `QuotePrefillForm`, isla hoja que guarda el texto en `sessionStorage` (nunca en la URL: no termina en `$pageview`, Meta ni logs) y navega a `/pedido`, donde el módulo lo carga en "¿Qué le pasa?" (sin mover el foco ni contar como `quote_started`). Sin JS es un GET a `/pedido` con el campo vacío. Verificado por CDP: escribir "hace ruido al frenar" en el directorio y enviar deja `/pedido` con ese texto en el campo.
- **Perfil**: banda `brand-50`, "Pedile una propuesta" (principal, a `/pedido`) + WhatsApp del negocio (`outline`) + compartir; cuerpo en `card`; costado con pedir propuesta, horarios, ubicación y redes; "Más proveedores de {familia}" (hasta 3 del mismo rubro con `GET /partner-profiles?category=`, datos reales) con "Ver toda la red"; banda oscura "Sumate a AutoLibre".
- **Barra fija del perfil**: la vieja `PartnerStickyBar` (solo WhatsApp, `fixed`) se borró; ahora es la `MobileActionBar` compartida con "Pedir propuesta" + el WhatsApp del negocio (o el de AutoLibre si no tiene), con la medición del perfil.
- **Migas**: componente nuevo `components/marketing/breadcrumbs.tsx` (`fg-muted`, links de 44 px). El del blog usa `ink/60` y falla contraste; no se reusó.
- **Tarjeta de negocio** (`PartnerCard`) y **paginación** (1 2 3 … N, `paginationItems` con tests) al estilo del lienzo.
- Botón: variante nueva `accent` (`brand-200` con texto `fg`, 11.70:1) para las acciones sobre `action`. `Section`: tonos `mint` (`brand-50`) y `action`.

### Pendiente heredado de la 4a: `target-size` del Home

La barra fija tapaba dos chips del módulo al cargar. Ahora, en el Home y en `/pedido` (`revealOnScroll`), la barra arranca fuera de la pantalla y con `visibility: hidden` (no se enfoca ni tapa nada) y entra en los primeros 12rem de scroll, con `animation-timeline: scroll()` (CSS, sin JS). Ahí el módulo ya es la acción a la vista, así que la barra no hace falta. Sin soporte o con `prefers-reduced-motion`, la barra está desde la carga como antes. Verificado por CDP a 412 × 823: al cargar `visibility: hidden` y `top` 823; con 400 px de scroll, visible.

### `prefers-reduced-motion` (AGENTS.md §3)

`rg` confirmó que ya no queda ningún uso de `motion-exempt`, `hero-word`, `hero-screen`, `marquee` ni `VerticalsBandSection` en el código (la 4a sacó esas secciones). Se reescribió el párrafo de `AGENTS.md` §3: hoy no hay excepciones aprobadas y cualquier animación nueva que no respete la preferencia necesita una decisión explícita de producto. Se borraron de `app/globals.css` los tokens `--animate-hero-word`, `--animate-hero-word-fade`, `--animate-hero-screen` y `--animate-marquee` con sus `@keyframes`, y la regla de reduced motion ya no exceptúa `.motion-exempt`. `DESIGN.md` todavía menciona `motion-exempt` (líneas ~253 y ~507): no se tocó.

### Inventario SEO antes / después (HTML del server)

| | `/proveedores` antes | `/proveedores` después | `/proveedores/asistir24` antes | después |
|---|---|---|---|---|
| title | Proveedores · AutoLibre | igual | Asistir24 · AutoLibre | igual |
| description | "…reciben pedidos de presupuesto desde la app." | "…Buscá por nombre, zona o rubro y pedí propuestas gratis." | "Asistir24: Asistencia y emergencias. Pedí presupuesto por AutoLibre." | "…Pedí propuestas gratis por AutoLibre." |
| canonical | `/proveedores` | igual (también en las variantes con filtros) | `/proveedores/asistir24` | igual |
| robots | index, follow | igual | **noindex, nofollow** | **index, follow** |
| H1 | 1 | 1 | 1 | 1 |
| Saltos de heading | ninguno | ninguno | ninguno | ninguno |
| JSON-LD | Organization, CollectionPage, BreadcrumbList, ItemList | igual | Organization, WebPage, BreadcrumbList, LocalBusiness (+ FAQPage si hay FAQ visible) | igual (`FAQPage` solo con la FAQ visible; el backend de prueba no da FAQ para este perfil) |
| Migas visibles | no | **sí** ("Inicio / Proveedores") | sí | sí (estilo nuevo, contraste AA) |
| En el sitemap | sí (2026-10-27) | sí (2026-11-24) | **no** (ningún perfil) | **sí: 430 perfiles** |
| Clerk (HTML y chunks) | 0 | 0 | 0 | 0 |

Outline del directorio: h1 → h2 "¿No sabés a quién elegir?" → h2 "Toda la red" (24 h3, uno por negocio) → h2 "¿Tenés un taller o prestás un servicio?". Perfil: h1 → h2 "Sobre X" → h2 "Servicios" (h3 por familia) → [h2 "Preguntas frecuentes"] → h2 del costado (Pedile una propuesta, Horarios, Ubicación, Contacto y redes) → h2 "Más proveedores de {familia}" (h3 por negocio) → h2 de la banda. El 404 del perfil (`notFound()`) sigue respondiendo 404 real con `noindex`.

### Lighthouse 12.8.2 antes / después

Mismo método que la 4a: móvil con 3 corridas y la **mediana** como `<ruta>-movil.json` (las tres en `despues/<ruta>-movil-corrida{1,2,3}.json`); escritorio también con 3 corridas esta vez (`-escritorio-corrida{1,2,3}.json`), porque la primera salió con una tarea larga "Unattributable" de 760 ms. Corridas (Performance): `/proveedores` móvil 62 / 62 / 62, escritorio 72 / 95 / 73; perfil móvil 66 / 70 / 63, escritorio 76 / 90 / 93; Home móvil 84 / 65 / 59 (`home-movil-fase4b*.json`, para no pisar las de la 4a).

| Ruta | Modo | Medición | Perf | A11y | BP | SEO | LCP (s) | CLS | TBT (ms) | FCP (s) | Elemento LCP | A11y que fallan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/proveedores` | Móvil | Antes | 64 | 100 | 75 | 100 | 3.68 | 0.000 | 1441 | 1.28 | `h1#proveedores-titulo` | — |
| `/proveedores` | Móvil | Después | 62 | 100 | 96 | 100 | 3.88 | 0.000 | 1356 | 1.49 | `h1#proveedores-titulo` | — |
| `/proveedores` | Escritorio | Antes | 88 | 100 | 74 | 100 | 0.93 | 0.000 | 281 | 0.46 | `h1#proveedores-titulo` | — |
| `/proveedores` | Escritorio | Después | 73 | 100 | 74 | 100 | 0.86 | 0.000 | 753 | 0.33 | `h1#proveedores-titulo` | — |
| `/proveedores/asistir24` | Móvil | Antes | 48 | 96 | 75 | 69 | 6.60 | 0.000 | 2573 | 1.05 | `p` (descripción) | color-contrast |
| `/proveedores/asistir24` | Móvil | Después | 66 | 100 | 96 | 100 | 3.49 | 0.000 | 1398 | 0.92 | `p` (descripción) | — |
| `/proveedores/asistir24` | Escritorio | Antes | 83 | 96 | 74 | 69 | 1.84 | 0.000 | 244 | 0.29 | `img` (mapa `lazy`) | color-contrast |
| `/proveedores/asistir24` | Escritorio | Después | 90 | 100 | 96 | 100 | 0.76 | 0.000 | 254 | 0.32 | `p` (costado "Pedile una propuesta") | — |
| `/` | Móvil | 4a | 72 | 97 | 96 | 100 | 3.56 | 0.000 | 743 | 1.34 | `h1#hero-title` | target-size |
| `/` | Móvil | 4b | 65 | 100 | 96 | 100 | 3.70 | 0.000 | 1180 | 1.34 | `h1#hero-title` | — |

Lectura:

- **Perfil**: SEO 69 → 100 (ya no es `noindex`), accesibilidad 96 → 100 (contraste de las migas), LCP móvil 6,60 → 3,49 s y escritorio 1,84 → 0,76 s. El LCP es texto del server en los dos anchos (la descripción en celular; en escritorio el párrafo de la tarjeta "Pedile una propuesta", que ocupa más que el `h1` corto "Asistir24"): se pinta en el primer frame (LCP observado por CDP: 104 ms en escritorio). El mapa ya no es candidato.
- **Home**: `target-size` resuelto (accesibilidad 97 → 100). El Performance móvil bajó en la mediana, pero las corridas fueron 84 / 65 / 59: es la misma variabilidad de la 4a (tareas "Unattributable" al azar). El Home solo sumó un atributo y CSS.
- **Directorio**: LCP y CLS iguales o mejores. Performance en la línea de base en móvil (62 contra 64, dentro del ruido) y más bajo en la mediana de escritorio (73 contra 88). En escritorio, dos de las tres corridas tuvieron una tarea "Unattributable" de 600-750 ms y cargaron el Pixel de Meta dentro de la traza (3,5 s después del `load`; por eso BP 74 en esa corrida); la tercera dio 95 con TBT 152. El HTML pasó de 185 a 201 KB (los 17 marcadores del mapa viajan en el payload). Lo que más pesa sigue siendo el JS compartido de la plataforma, como en la 4a.
- En producción el directorio base sale del CDN (estático), cosa que esta medición local no refleja.

### JS por ruta (suma de los `<script src>` del HTML, gzip local)

| Ruta | Antes (fase 0) | Después |
|---|---|---|
| `/proveedores` | 13 · 700.1 KB · 213.0 KB gzip · HTML 185.2 KB | **12 · 692.5 KB · 209.3 KB gzip** · HTML 200.6 KB |
| `/proveedores/asistir24` | 13 · 701.2 KB · 213.5 KB gzip · HTML 110.9 KB | **12 · 691.3 KB · 209.0 KB gzip** · HTML 127.2 KB |

Islas client nuevas, todas hoja: `FiltersToggle`, `QuotePrefillForm`, `DirectoryMapMarkers` y `LazyMapImage` (más `ShareProfileButton`, que ya estaba). Cero librerías de mapas: Static Maps es una imagen.

### Diferencias con el diseño y por qué

- **Distancias del mapa** ("1,1 km"): no se muestran (la web no conoce la ubicación de la persona).
- **Mapa del directorio en las páginas con filtros**: no aparece mientras el listado del backend no traiga coordenadas (límite de 60 pedidos por minuto, ver "Mapa"). En la página base sí.
- **"Todas las marcas" en las tarjetas**: el listado no trae marcas; mostrarlo sería inventarlo. Va solo en el perfil, donde el dato existe.
- **Búsqueda en celular**: el lienzo dice "Negocio o zona" en un solo campo; el backend busca solo por nombre (`q`), así que el placeholder dice "Nombre del negocio" y la zona está en "Filtros".
- **Orden en celular**: el DOM sigue el orden de escritorio (la banda de pedido primero, que es la conversión) y en celular se reordena con `order` como el lienzo (mapa arriba de la lista, banda después). Con teclado o lector, en celular la banda llega antes de la lista.
- **Mapa cuadrado** (el lienzo usa 460 × 640 en escritorio): imagen y contenedor necesitan la misma proporción para que los marcadores caigan en su lugar; el cuadrado sirve en los dos anchos.
- **Breakpoint** `lg` (1024 px) para lista + mapa en columnas, como el resto del rediseño (el lienzo cambia en 861 px).
- **Ancho**: `Container size="wide"` en lugar de 1200 px (regla de `AGENTS.md`).
- **Compartir**: borde `control-line-strong` (4.79:1) en lugar de `#D1D5DB` (1.46:1, no llega a 3:1).
- **Rubro**: de fila de links a desplegable dentro del buscador, como el lienzo. Los links filtrados llevaban canonical a `/proveedores`; los perfiles ahora se descubren por el sitemap y la paginación.
- **Botón flotante de WhatsApp**: sigue visible desde `lg` (decisión de la fase 2); en celular, en el perfil, se esconde porque hay barra.

### Endpoints o datos que faltan (backend)

- **`partner.indexable`**: alinearlo con la decisión de indexar todos los perfiles (hoy `true` solo con horarios estructurados). La landing ya no lo usa.
- **Coordenadas en el listado** (`GET /partner-profiles`): `address.latitude`/`longitude` como en el perfil. Con eso el mapa sale en todas las páginas del directorio sin leer perfiles; la landing ya las parsea si llegan.
- **Límite de 60 pedidos por minuto por IP**: la landing (server) sale de pocas IPs de Vercel. Si el sitemap, el directorio y los perfiles se regeneran juntos, conviene un balde propio para la landing (como el del admin) o un token de servicio.
- Ya existía y ahora se usa: `updatedAt` del listado (sitemap).

### Dudas abiertas

- ¿Producto prefiere que el mapa del directorio no aparezca hasta tener coordenadas en el listado (hoy sale solo en la página base), o está bien así?
- ¿WhatsApp del negocio en la barra fija del perfil (como el lienzo) o el de AutoLibre (como el resto de la barra)? Hoy: el del negocio, y el de AutoLibre si el negocio no tiene.
- `DESIGN.md` todavía describe `motion-exempt`; conviene actualizarlo junto con `AGENTS.md`.
- Los componentes de la spec 209 que no usa ninguna página (`components/sections/provider-profile/*`, `components/ui/profile-card.tsx`, `lib/provider-profile/*` salvo lo que usa el webhook) siguen en el repo: se pueden limpiar en la fase de cierre.

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes). `npx tsc --noEmit`: sin errores. `npm run build`: OK (`/proveedores` estática con revalidación de 1 h; `/proveedores-filtros` dinámica).
- Tests: `test:proveedores` 72 (suma `map.test.ts` y `paginationItems`), `test:provider-profile` 44, `test:blog` 86, `test:partner-claims` 16, `test:partner-billing` 70; los cuatro `typecheck:*` OK.
- Visual con Chrome headless (CDP) a 390 y 1440 px contra `Proveedores*.webp` y `Proveedor*.webp`: cabecera, buscador (con "Filtros" abierto y cerrado), banda, grilla, mapa (antes y después de la imagen), paginación, perfil completo y barra fija.
- CDP: CLS 0 en la carga de las dos rutas a 390 y 1440 px; la imagen del mapa no se pide sin interacción y sí después de un scroll; 17 marcadores en la página base; el texto de la banda llega a "¿Qué le pasa?" en `/pedido`; la barra del Home entra al scrollear.
- `curl`: un h1, sin saltos, canonical, `index, follow` en el perfil, JSON-LD, 430 perfiles en el sitemap con `lastmod`, `?pagina=999` 404, `Disallow: /proveedores-filtros`, cero Clerk.
- Backend local (de prueba): respondió toda la sesión; durante una ráfaga de pruebas dio 429 (ver "Mapa"), lo que llevó al cambio de estrategia.

## Ajuste: pedido enviado con recomendación de la app

Rama `feat/rediseno-2026-11`, 2026-11-24. Especificación: `docs/rediseno-2026-11/pedido-enviado/PROMPT.md` (más las capturas y `ModuloPedido.dc.html` de esa carpeta). Cambia el estado enviado del módulo de pedido (Home y `/pedido`).

### Qué se hizo

- **Confirmación** (arriba): check en círculo `brand-50`, "¡Listo! Ya tenemos tu pedido", "Tu pedido es el **#AL-…**." solo si el backend devolvió `publicCode` (si no, la oración no va: no se inventa), "Te escribimos por WhatsApp en el día con las propuestas." y "Hacer otro pedido" (44 px). `role="status"` en el bloque de la confirmación y foco al título (`tabIndex=-1`), como antes. Se fue "Bajar la app" (lo reemplaza el bloque de abajo).
- **Bloque de la app** (`components/modulo-pedido/modulo-app-promo.tsx`, Server Component), sobre `bg-canvas` debajo de una línea `card-line`: eyebrow, título (`h3`, un nivel debajo del título del enviado), bajada, tres pasos con capturas reales de la app en un marco de teléfono recortado, descarga y cierre por WhatsApp. En celular los pasos van en una fila con `overflow-x-auto` y `scroll-snap` (`snap-x snap-mandatory`, sin `scroll-behavior: smooth`); la fila es un `<ol>` con `aria-label` y `tabIndex=0` (verificado: la flecha derecha la desplaza 260 px a 390).
- **Capturas**: `public/images/app/app-propuestas.webp`, `app-elegir.webp`, `app-elegiste.webp` (432x600 reales, el doble del uso), `next/image` con `width`/`height` reales, `sizes="228px"` (la tarjeta es de 240 con bordes de 6, así que se dibujan a 228 y no a 216 como dice la especificación: mismo candidato del `srcset`), `loading="lazy"` y `alt=""` (cada paso tiene su texto). El marco tiene alto fijo (300 px): no hay salto cuando bajan.
- **Descarga**: desde `lg`, QR (SVG inline, `QrCode code="pedidoEnviado"`) a `https://autolibre.ai/descarga?utm_source=web&utm_medium=pedido_enviado` más "Escaneá el código con la cámara del celular."; siempre, los botones de tienda (`StoreLinks`). En un iPhone se ve solo App Store y en un Android solo Google Play, con el `data-platform` que el script inline del layout pone antes del primer paint (las variantes `platform-ios`/`platform-android` que ya usaba `DownloadCta`): sin JS después de montar y sin salto. En la compu o sin JS, los dos. (`/descarga` muestra los dos siempre; no se tocó.)
- **QR**: generado una vez con `qrcode` (npm) instalado FUERA del proyecto, versión 5, corrección M (con Q la URL larga pedía versión 6), pegado como path en `components/ui/qr-code.tsx`. Verificado decodificando con `jsQR` el PNG dibujado desde el path tal como quedó en el archivo: devuelve la URL exacta. Falta escanearlo con un teléfono real.
- **Server / client**: el bloque se arma en el server y llega a la isla `ModuloForm` como prop `appPromo: ReactNode`; la isla solo lo monta al enviar. El QR no usa librería en el cliente.

### Flag `appVinculada`

`APP_VINCULADA = false` en `lib/content/modulo-pedido.ts`, documentado: hoy los pedidos de la web no quedan asociados a ninguna cuenta (0 de 31 con `user_id`). Apagado, el bloque dice "Así se ve en la app" / "Con la app ves las propuestas apenas llegan" y nunca "Tu pedido ya está en la app" ni "Seguí este pedido desde el celular". La variante `linked` está escrita en `appPromo.linked` para cuando el backend vincule el pedido a la cuenta por el WhatsApp. Diferencia con el prototipo: su bajada vinculada nombra el número de pedido; acá dice "tu pedido", porque el bloque se arma en el server y el número recién se conoce en el cliente.

### Eventos (detalle en `analytics.md`)

| Evento | Props | Cuándo |
|---|---|---|
| `pedido_app_promo_view` (nuevo) | `placement`, `app_linked` | Una vez por envío, al montarse el bloque |
| `qr_view` (nuevo) | `section: "pedido_enviado"`, `placement` | Una vez por envío, cuando el QR entra en pantalla (`IntersectionObserver`, umbral 0,5). En celular el QR tiene `display: none` y el observer nunca lo ve: solo escritorio (verificado por CDP: `true` a 1440, nunca a 390) |
| `cta_download_click` (nuevo, clickable) | `store`, `section: "pedido_enviado"`, `placement` | Click en una tienda del enviado |
| `app_store_clicked` (existente) | `store`, `placement` (`modulo_home`/`modulo_pedido`), `section` | Mismo click |

**Por qué los dos en el click a tienda**: `cta_download_click` lo pide la especificación, pero `app_store_clicked` es el conteo histórico de clicks a tienda de todo el sitio (insights por `placement`); mandar solo el nuevo cortaría esa serie. El listener delegado ahora acepta varios nombres en `data-analytics-event` separados por espacio y el atributo nuevo `data-analytics-section` (valores cerrados en `DOWNLOAD_SECTIONS`). Ningún evento existente se renombró. Si producto prefiere uno solo, es sacar un nombre en `StoreLinks`. En local PostHog no carga (solo Production), así que el envío real de los eventos no se pudo ver: se verificaron los atributos `data-analytics-*` y que el observer del QR dispara solo a 1440.

### JS por ruta (suma de los `<script src>` del HTML, gzip local, build de producción)

| Ruta | Antes (HEAD `9640bd8`) | Después |
|---|---|---|
| `/` | 12 · 714.1 KB · 216.1 KB gzip · HTML 217.3 KB | 12 · 715.1 KB · 216.5 KB gzip · HTML 229.5 KB (40.3 KB gzip) |
| `/pedido` | 12 · 714.1 KB · 216.1 KB gzip · HTML 123.6 KB | 12 · 715.1 KB · 216.5 KB gzip · HTML 136.4 KB (25.2 KB gzip) |

Chunk de la isla del módulo: 47.6 KB / 16.1 KB gzip → 48.2 KB / 16.4 KB gzip (el efecto de los dos eventos). El HTML sube unos 12 KB sin comprimir porque el bloque viaja en el payload RSC (el path del QR es ~5 KB) aunque no se dibuja hasta enviar. Las capturas **no se piden antes de enviar** (0 requests a `/images/app/` durante la carga, interceptando la red por CDP) y no hay `<img>` ni `preload` de ellas en el HTML.

### CLS

0 en la carga inicial (PerformanceObserver de `layout-shift`, 390 y 1440, Home y `/pedido`). El estado enviado aparece por la acción de enviar.

### Diferencias con la referencia

- **Botones de tienda**: `StoreLinks` (los oficiales del sitio, radio `field`, decisión de la 4a para no duplicar la medición) en lugar de las píldoras de texto del prototipo. A 390 no entran dos en una fila y quedan apilados (en un celular real se ve uno solo, el de su sistema).
- **Pestaña Seguro**: las capturas de referencia la muestran; se mantiene la decisión de producto del 2026-11-24 (sin Seguro).
- **Radio de la tarjeta**: `rounded-panel` (20 px) como el resto de los estados del módulo, no 24. Marco del teléfono: `rounded-t-3xl` (24) en lugar de 28 (sin valor arbitrario).
- **QR**: 144 px (no 112) por la densidad de la versión 5: 3,2 px por módulo, el mismo criterio de `/descarga`.
- **`role="status"`**: va en la confirmación (título + texto), no en toda la tarjeta: así el lector no anuncia el bloque de la app entero.
- **`PhoneFrame`** no se reusó: es un iPhone completo de 320 px con isla dinámica; la referencia es un marco recortado de 240. Sigue sin uso.

### Verificación

- `npm run lint`: 0 errores, 282 warnings (los mismos preexistentes). `npx tsc --noEmit`: sin errores. `npm run build`: OK.
- Tests: `test:blog` 86, `test:provider-profile` 44, `test:proveedores` 72, `test:partner-claims` 16, `test:partner-billing` 70: todos pasan. Ninguno cubre el módulo.
- Flujo por CDP sobre `next start --port 3100`, Home y `/pedido` a 390 y 1440: chip, zona, Enter, WhatsApp, consentimiento, enviar. **Ningún pedido real**: `/api/presupuesto` respondido por CDP con `AL-22123`; `vehicle-lookup` y Google Maps bloqueados. Foco en el `h2` del enviado, outline `h2 → h3`, "Hacer otro pedido" de 44 px, tiendas de 56 px, con UA de Android solo Google Play. Capturas comparadas contra `captura-escritorio.png` y `captura-celular.png`.

### Dudas abiertas

- ¿Mandar `cta_download_click` y `app_store_clicked` juntos (hoy) o solo uno?
- Escanear el QR nuevo con un teléfono real antes del deploy.
- "Tus próximos pedidos los hacés y los seguís desde ahí" y "Te abrimos WhatsApp con el mensaje listo para el taller" vienen del prototipo y coinciden con las capturas de la app; confirmar con producto que siguen vigentes.

## Fase 4c: blog y sobre nosotros

Rama `feat/rediseno-2026-11`, 2026-11-24. `/blog`, las categorías y la nota pasan al sistema nuevo con cambios mínimos (`Blog`/`Blog-celular`, `BlogNota`/`BlogNota-celular`); `/sobre-nosotros` se rehízo completa (`Nosotros`/`Nosotros-celular`). Medido con build de producción local (`next start --port 3100`), como las fases anteriores.

### Qué cambió

**Blog (listado, categorías y nota): misma composición, sistema nuevo.**

- Tokens: `ink`/`ink/60`/`ink/70` → `fg`/`fg-muted`; `bg-ink` → `bg-action`; filetes `card-line`; fondos `card` (contenido) y `canvas` ("Guías por tema", "Seguí leyendo"). Buscador en píldora de 52 px (16 px de texto, borde `control-line-strong`); temas como chips de 44 px (`action` el elegido, `control-line` el resto); paginación en píldora. `h1` del listado con la escala del rediseño (`display-xs` → `display-md`).
- **Contraste** (lo que la línea base marcaba en `/blog` y la nota): fechas `<time>` de tarjetas, "Últimas notas", destacada y cabecera de la nota, migas, bajadas e índice pasan de `ink/60`-`ink/70` a `fg-muted` (9.18:1 sobre `canvas`, 10.21:1 sobre `card`). La fecha de `PostCard` estaba en `fg-subtle`, que sobre `canvas` da 4.30:1: también pasó a `fg-muted`.
- **Migas**: se borró `components/blog/breadcrumbs.tsx` (fallaba contraste) y el blog usa `components/marketing/breadcrumbs.tsx` (4b), que suma `endsAtCurrent` para la nota (las migas terminan en la categoría y son todas links). Visibles en las categorías y en la nota, como el lienzo; el listado no las muestra (tampoco el lienzo) y conserva su `BreadcrumbList`.
- **LCP**: la portada destacada de `/blog` pasa de `preload` a `fetchPriority="high"` + `loading="eager"` (en celular queda al borde del primer viewport, así que según la pantalla la LCP es ella o texto: es el caso que AGENTS.md y la doc de `next/image` resuelven con prioridad en el `<img>`), con `sizes` del ancho real (`(min-width: 1640px) 940px, (min-width: 1024px) calc(88vw - 500px), 88vw`; antes `60vw, 100vw`). La portada de la nota suma `fetchPriority="high"` a su `eager` y su `sizes` pasa a `88vw` en celular. Ningún `priority`. React 19 igual emite el `<link rel=preload>` de la imagen con prioridad alta, así que el descubrimiento queda resuelto (`lcp-discovery-insight`: `fetchpriority=high` pasa de "no" a "sí").
- **Llamado a `/pedido` en la nota** (`ArticleQuoteCallout`): "¿Tu auto necesita un arreglo? Pedí propuestas." (en Seguros: "¿Chocaste o te chocaron? Pedí propuestas para el arreglo."), bajada y "Hacé tu pedido" (`primary` 52 px, `quote_cta_clicked` `blog_article`). Va antes del `h2` "Preguntas frecuentes" (o al final del cuerpo si la nota no tiene FAQ): `RichText` acepta `insert` y parte el AST en dos con los mismos renderers, así los `id` de los `h2` siguen coincidiendo con el índice. Nueva función pura `faqSectionIndex` en `lib/blog/faq.ts`, con tests.
- **Cierre**: la banda verde (`ClosingCtaSection`) del listado y las categorías, y el bloque de descarga dentro del cuerpo de la nota (`ArticleAppCta`, borrado), pasan a un panel oscuro `action` al final (`BlogAppBand`), como el lienzo, con los mismos `placement` de siempre (`closing_cta` y `blog_article`).
- **Barra fija de celular**: el lienzo del blog NO usa la `MobileActionBar` (pedido + WhatsApp) sino "Descargar la app gratis". Se mantuvo esa barra, restilada (`primary` 52, `card` con filete) y con la mecánica de la fase 2 (`sticky bottom-0` después del footer, sin espacio de reserva), ahora también en el listado y las categorías como el lienzo. Lleva a `/descarga` (antes a `/#descargar`). `PageShell` suma `bottomBar` para eso.

**`/sobre-nosotros`: rediseño completo.** Todo Server Component, cero islas.

- Hero tipográfico: "Feb 2026 —— Buenos Aires", `h1` grande (44 → 96 px), definición canónica y ficha `<dl>` con filetes (Fundada, Cofundadores, Disponible en, Vehículos 700+, Proveedores +150). Se fueron la ilustración de la ruta y los íconos de la ficha (el lienzo no los tiene).
- Misión (`action`) y visión (`brand-50`) en dos tarjetas; `h2` "Misión y visión" en `sr-only` (el lienzo no lo muestra) y un `h3` por tarjeta con aspecto de eyebrow.
- Historia sobre `canvas`: "Lo que aprendimos" grande y centrado en un `<figure>` (es nuestra frase: `<p>` + `<figcaption>`, no `<blockquote>`) y el relato en tres columnas.
- Hitos: título fijo a la izquierda desde `lg`, `<ol>` sobre una línea con fecha (`<time>`), `h3` y texto; el último con "Hoy".
- Equipo: retrato 4:5 con `next/image` (lazy, `sizes` por columnas, `alt` con nombre y rol), `h3` con el nombre y el rol debajo. Fotos verificadas contra `main` (`git diff main -- public/images/about` vacío: son las del commit `8208970`, no se movieron).
- Cierre: "Tu auto siempre supo qué tenía. Ahora vos también.", links de texto a las tiendas (`app_store_clicked` `closing_cta`, lo que medía la banda vieja), "Hacé tu pedido" (`quote_cta_clicked` `about_closing`) y "Sumá tu negocio" (`partner_register_started` `about_closing`).
- Sin migas visibles ni barra fija (el lienzo no las tiene).
- Cifras: `MARKETING_PROVIDERS_COUNT` ("+150") se mudó a `lib/content/about.ts` junto a `traction` (el Home la re-exporta desde `home.ts`, sin cambiar sus imports) y reemplaza al "100+" de la ficha y del hito "Tracción". El hito pasa a `Oct 2026` también en su `dateTime` (decía `2026-09` con el rótulo "Oct 2026"). `PRODUCT.md` lo anota.

### Inventario SEO antes / después (HTML del server)

| | `/blog` antes | `/blog` después | nota antes | nota después | `/sobre-nosotros` antes | después |
|---|---|---|---|---|---|---|
| title · description · canonical · robots | — | iguales | — | iguales | — | iguales |
| H1 | 1 | 1 | 1 | 1 | 1 | 1 |
| Saltos de heading | ninguno | ninguno | ninguno | ninguno | ninguno | ninguno |
| JSON-LD | Organization, CollectionPage, BreadcrumbList | igual | Organization, WebPage, BlogPosting, BreadcrumbList, FAQPage | igual | Organization, AboutPage, BreadcrumbList, Person ×5 | igual |
| Migas visibles | no | no (como el lienzo) | sí (fallaban contraste) | sí (`fg-muted`, 44 px) | no | no |
| Clerk (HTML) | 0 | 0 | 0 | 0 | 0 | 0 |

Outlines después:

- `/blog`: h1 → h2 "Nota destacada" (`sr-only`, h3 de la nota) → h2 "Últimas notas" (4 h3) → h2 "Guías por tema" (h3 por tarjeta) → h2 "Tus papeles y vencimientos, en el teléfono." (reemplaza a "Tu auto siempre supo qué tenía…" de la banda vieja).
- Nota: h1 → los h2 del cuerpo (con "Preguntas frecuentes" y sus h3, y "Fuentes oficiales") → h2 "Seguí leyendo" (3 h3) → h2 del panel de la app. El llamado al pedido no entra en el outline (su título es un `<p>`, ver diferencias).
- `/sobre-nosotros`: h1 → h2 "Misión y visión" (h3 Misión, Visión) → h2 "Nuestra historia" → h2 "Cómo llegamos hasta acá" (10 h3) → h2 "Equipo" (5 h3) → h2 "Tu auto siempre supo qué tenía. Ahora vos también.". Mismo contenido indexable que antes (misión, visión, historia, 10 hitos, 5 personas).

`app/sitemap.ts`: `/sobre-nosotros` y la fecha fija de `/blog` (solo se usa si no hay notas; si hay, manda la nota más nueva) = 2026-11-24. `public/llms.txt`: la línea de Sobre nosotros suma qué es AutoLibre, Buenos Aires y las cifras.

### Lighthouse 12 antes / después

Mismo método que la 4b: 3 corridas por ruta y modo, la **mediana** como `<ruta>-{movil,escritorio}.json` y las tres en `despues/<ruta>-{movil,escritorio}-corrida{1,2,3}.json`. Corridas (Performance): `/blog` móvil 55 / 61 / 61, escritorio 78 / 86 / 68; nota móvil 60 / 80 / 61, escritorio 69 / 80 / 73; `/sobre-nosotros` móvil 68 / 77 / 69, escritorio 100 / 98 / 75.

| Ruta | Modo | Medición | Perf | A11y | BP | SEO | LCP (s) | CLS | TBT (ms) | FCP (s) | Elemento LCP | `fetchpriority` en la LCP | A11y que fallan |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `/blog` | Móvil | Antes | 48 | 96 | 75 | 100 | 6.47 | 0.000 | 3450 | 1.16 | `img` (portada destacada) | no | color-contrast |
| `/blog` | Móvil | Después | 61 | 100 | 96 | 100 | 3.77 | 0.000 | 2007 | 0.94 | `img` (portada destacada) | sí | — |
| `/blog` | Escritorio | Antes | 95 | 96 | 74 | 100 | 0.83 | 0.000 | 163 | 0.28 | `img` (portada destacada) | no | color-contrast |
| `/blog` | Escritorio | Después | 78 | 100 | 96 | 100 | 0.82 | 0.000 | 502 | 0.32 | `img` (portada destacada) | sí | — |
| `/blog/seguros/que-hacer-si-chocas` | Móvil | Antes | 60 | 96 | 75 | 100 | 3.58 | 0.000 | 3535 | 1.01 | `p` (bajada) | — | color-contrast |
| `/blog/seguros/que-hacer-si-chocas` | Móvil | Después | 61 | 100 | 96 | 100 | 3.47 | 0.000 | 3354 | 1.01 | `p` (bajada) | — | — |
| `/blog/seguros/que-hacer-si-chocas` | Escritorio | Antes | 79 | 96 | 74 | 100 | 0.96 | 0.000 | 435 | 0.38 | `img` (portada) | no | color-contrast |
| `/blog/seguros/que-hacer-si-chocas` | Escritorio | Después | 73 | 100 | 96 | 100 | 0.71 | 0.000 | 702 | 0.45 | `img` (portada) | sí | — |
| `/sobre-nosotros` | Móvil | Antes | 69 | 100 | 75 | 100 | 3.48 | 0.000 | 965 | 1.14 | `p` (bajada) | — | — |
| `/sobre-nosotros` | Móvil | Después | 69 | 100 | 96 | 100 | 3.16 | 0.000 | 1309 | 1.04 | `p` (definición) | — | — |
| `/sobre-nosotros` | Escritorio | Antes | 81 | 100 | 74 | 100 | 0.87 | 0.000 | 410 | 0.41 | `h1` | — | — |
| `/sobre-nosotros` | Escritorio | Después | 98 | 100 | 96 | 100 | 0.79 | 0.000 | 126 | 0.42 | `h1` | — | — |

Lectura:

- **`/blog` móvil**: LCP 6,47 → 3,77 s y TBT 3.450 → 2.007 ms; accesibilidad 96 → 100. Lo que queda del LCP simulado es "Render Delay" del JS compartido de la plataforma (igual que en la 4a y la 4b). Observado por CDP a 390 px, la portada se pinta a los 816 ms.
- **Contraste**: `color-contrast` resuelto en `/blog` y en la nota (accesibilidad 96 → 100 en los dos modos).
- **Escritorio del blog y de la nota**: la mediana baja, pero no por la página: las tres corridas de `/blog` dieron TBT 502 / 315 / 1.195 ms, con una tarea "Unattributable" de 300 a 600 ms y, en dos, el Pixel de Meta cargando dentro de la traza (632 ms de bloqueo en la tercera). Es la misma variabilidad documentada en la 4a y la 4b. El LCP queda igual o mejor (0,83 → 0,82 s; nota 0,96 → 0,71 s) y las páginas cargan menos JS que antes (tabla de abajo).
- **CLS 0** en las tres rutas a 390 y 1440 (PerformanceObserver por CDP), sin desborde horizontal.

### JS por ruta (suma de los `<script src>` del HTML, gzip local)

| Ruta | Antes (fase 0) | Después |
|---|---|---|
| `/blog` | 13 · 700.1 KB · 213.0 KB gzip · HTML 120.9 KB | **12 · 687.8 KB · 207.7 KB gzip** · HTML 126.7 KB |
| `/blog/seguros/que-hacer-si-chocas` | 13 · 700.7 KB · 213.3 KB gzip · HTML 143.5 KB | **12 · 688.4 KB · 208.0 KB gzip** · HTML 149.5 KB |
| `/sobre-nosotros` | 13 · 700.1 KB · 213.0 KB gzip · HTML 137.1 KB | **12 · 687.8 KB · 207.7 KB gzip** · HTML 107.4 KB |

Sin islas nuevas: la única del blog sigue siendo `ArticleTocActive` (marcador del índice). `/sobre-nosotros` no tiene ninguna.

### Diferencias con el diseño y por qué

- **Título del llamado de la nota**: `<p>` y no `h3`. El llamado cae donde termine el cuerpo (antes de la FAQ o al final) y en una nota sin `h2` previo haría saltar `h1 → h3`; además es un llamado, no una sección. El `<aside>` lleva su nombre por `aria-labelledby`.
- **Texto del llamado**: el lienzo lo escribe para la nota de la VTV ("¿Te la dieron condicional?"). Hygraph no tiene un campo para eso: va un texto genérico y uno por categoría donde el caso es claro (Seguros). Se ubica antes de la FAQ y no en un punto exacto del texto.
- **Sin campo "¿Qué le pasa?"** en el llamado: el lienzo muestra solo el botón.
- **Barra fija del blog**: la de descarga del lienzo, no la `MobileActionBar`. Ahora también en el listado y las categorías (antes solo en la nota).
- **Retrato de Matías Vidal**: el lienzo dice "Foto pendiente". No hay foto: va el mismo marco con sus iniciales ("MV", decorativas), sin texto de marcador.
- **Hito de hoy**: el lienzo dice "Más de 700 vehículos únicos y más de 150 proveedores"; acá sale de las constantes: "700+ vehículos únicos y +150 proveedores en el marketplace."
- **Botones de tienda del panel del blog**: `StoreLinks` (radio `field`), como en la 4a, en lugar de las píldoras de texto del lienzo.
- **`h1` de `/sobre-nosotros`**: 96 px desde `xl` (escala de Tailwind) en lugar de 116 px, acotado a `max-w-240` para que parta en dos renglones como el lienzo. En celular, 44 px como el lienzo.
- **Línea de los hitos**: `control-line-strong` (4.79:1) en lugar de `#9CA3AF`.
- **Ancho y breakpoints**: `Container size="wide"` en lugar de 1200 px (AGENTS.md §9) y los breakpoints del repo (`md`/`lg`) en lugar de 861 px.

### Marcadores sin dato real

- "Foto pendiente" de Matías Vidal: iniciales en su lugar. Falta la foto (4:5, `public/images/about/equipo-matias-vidal.webp`).
- "Foto de portada actual" del blog: se usan las portadas reales de Hygraph.
- "[La nota sigue igual que hoy…]" del lienzo de la nota: no es contenido; la nota queda como está.

### Dudas abiertas

- ¿Texto del llamado por categoría (hoy solo Seguros tiene uno propio) o un campo en Hygraph para escribirlo por nota, como en el lienzo?
- `/blog` sigue siendo dinámica (`ƒ`: lee `searchParams` para la búsqueda y la paginación). Con el mismo rewrite de la 4b (`/proveedores-filtros`) la página base saldría del CDN; no se hizo por ser "cambios mínimos".
- `ClosingCtaSection` (`components/sections/home/closing-cta.tsx`) ya no la usa ninguna página: se puede borrar en la fase de cierre.
- La barra del blog ahora lleva a `/descarga` (antes `/#descargar`, el panel del Home). Si se prefiere el ancla, es cambiar `blogContent.mobileBar.href`.

### Verificación

- `npm run lint`: 0 errores. Los warnings suben a 846 porque ESLint también recorre `.claude/worktrees/` (copias sin trackear de otras sesiones); todos son de scripts vendorizados de skills, ninguno del sitio.
- `npx tsc --noEmit`: sin errores. `npm run build`: OK.
- Tests: `test:blog` 88 (suma 2 de `faqSectionIndex`), `test:provider-profile` 44, `test:proveedores` 72, `test:partner-claims` 16, `test:partner-billing` 70; los cuatro `typecheck:*` OK.
- Visual con Chrome headless (CDP) a 390 y 1440 contra `Blog*.webp`, `BlogNota*.webp` y `Nosotros*.webp`: página completa, equipo con los retratos cargados y el llamado de la nota en celular.
- `curl`: un h1, sin saltos, canonical, robots, JSON-LD y cero Clerk en las tres rutas (y en `/blog/seguros`). La portada LCP sale con `fetchpriority="high"` en el HTML.

## Registro: cliente o taller

Decisión de producto del 2026-11-24: al crear una cuenta en la web, la persona elige si es **cliente** o **proveedor/taller**, para que no se confunda un cliente registrándose como taller ni al revés. Una cuenta vieja, sin elección y sin taller, es **cliente**. Los permisos sobre un taller siguen saliendo de la membresía (`GET /partners/me/memberships`): **la membresía siempre manda** para mostrar "Mi negocio".

### Contrato con el backend

- La elección vive en **Clerk `publicMetadata.signupIntent`**: `"partner"` | `"customer"`. Clave y valores en una sola constante, `lib/auth/signup-intent.ts` (`SIGNUP_INTENT_KEY`, `SIGNUP_INTENTS`). Nunca en `unsafeMetadata`.
- `users.role = 'partner'` en el backend significa "se registró como proveedor". **El backend aceptó el contrato tal cual** (confirmado el 2026-11-24): el webhook de Clerk sube `user → partner` cuando llega `signupIntent = "partner"`, nunca toca a un admin ni baja el rol, y hace el **backfill de los owners actuales**.
- La escribe **solo el server de la landing**: `POST /api/account/intent` (`app/api/account/intent/route.ts`; la lógica pura está en `handleSignupIntentRequest`):
  1. Valida `intent` contra los dos valores (400 `invalid_intent`).
  2. Verifica el `Authorization: Bearer <token de sesión>` con `verifyToken` de `@clerk/backend` (vía `@clerk/nextjs/server`) y `CLERK_SECRET_KEY`: firma contra el JWKS de la instancia, vencimiento y emisor. La landing no tiene `clerkMiddleware`, así que `auth()` no sirve. El `userId` sale del `sub` del token verificado, nunca del cuerpo (401 `unauthenticated`).
  3. Si la cuenta ya tiene intent, lo devuelve sin pisarlo (200, `saved: false`).
  4. Si la cuenta tiene más de 30 minutos (`user.createdAt`), no escribe (403 `window_closed`): una cuenta vieja no puede autoasignarse el intent.
  5. Escribe con `users.updateUserMetadata` (merge) y devuelve el intent (200, `saved: true`). Un error de Clerk es 502 `unavailable`; el log solo lleva el tipo de error, nunca el token, el email ni el `userId`.
- El front **no** llama a `GET /auth/me`: necesitaría CORS en el backend y, justo después del alta, puede devolver `user` hasta que llegue el webhook. La pantalla sale de `publicMetadata.signupIntent` (`useUser`) y de la membresía.

### Flujo

- **`/cuenta`** ("Ingresar o crear cuenta" del header): el panel ofrece "Ingresar" / "Crear cuenta" (dos botones con `aria-pressed`). "Ingresar" es el `<SignIn withSignUp>` de siempre. "Crear cuenta" muestra primero "¿Cómo vas a usar AutoLibre?" con dos tarjetas de radio (`fieldset`/`legend`, radios nativos, foco visible en la tarjeta, 44 px o más): **"Soy cliente"** y **"Tengo un taller o negocio"**. Recién con "Continuar" aparece el `<SignUp>` de Clerk, con "Creando tu cuenta … · Cambiar" arriba. El "Registrate"/"Ingresá" del pie de Clerk va oculto: lo reemplazan esos dos botones.
- **Flujos de proveedor** (alta `?alta=1`, reclamo, contratar y su resultado): `PartnerSignIn` tiene la prop nueva `signupIntent` (`"partner"` por defecto, `"customer"` o `"ask"`). Ahí es `partner` sin preguntar y el login no cambia.
- **Cómo viaja el intent**: en `sessionStorage` (`al_signup_intent`, `lib/auth/pending-signup-intent.ts`), que sobrevive a la ida y vuelta de Google, al código por email y a las recargas de la pestaña. `SignupIntentSync` (montado en `ScopedClerkProvider`, así cubre `/cuenta` y los flujos) lo manda una vez por carga apenas hay sesión. `saved`/`existing`: recarga el usuario de Clerk y borra el pendiente. `rejected` (cuenta vieja): lo borra. `failed`: lo deja y reintenta en la próxima carga. Nunca bloquea.
- **Google con una cuenta nueva desde "Crear cuenta"**: el pendiente ya está y el server lo acepta (cuenta de minutos). Al volver de Google, si la pestaña estaba en "Crear cuenta" (`al_signup_entry`), se monta el `<SignUp>` para que procese `#/sso-callback`.
- **Cuenta nueva creada desde "Ingresar"** (Google o un email nuevo en el `<SignIn withSignUp>`): no hubo elección. Si no tiene negocio, ni intent, ni pendiente, y tiene menos de 30 minutos, `/cuenta` pregunta una vez ("Te damos la bienvenida a AutoLibre", mismas tarjetas, "Guardar").
- **Pista del header (`al_role`)**: dice "proveedor" si hay membresía **o** `signupIntent = "partner"` (guardado o pendiente). El formato de la cookie no cambió.
- Clerk sigue solo en `/cuenta` y en los flujos privados. Verificado con el HTML y los chunks de `/`, `/pedido`, `/proveedores`, `/proveedores/registro`, `/proveedores/planes`, `/blog` y `/sobre-nosotros`: ninguno menciona Clerk (control: `/cuenta` sí).

### Pantallas de "Mi cuenta"

| Caso | Pantalla |
| --- | --- |
| Tiene membresía | "Mi negocio", sin cambios |
| Sin negocio, `signupIntent = "partner"` | "Sumá tu negocio a AutoLibre": `NoPartnerOptions` con `withRegister`, dos tarjetas: "Registrar mi negocio" (`/proveedores/registro?alta=1`) y "Canjear mi código" (`/proveedores/reclamar`). La contratación sigue con el código solo |
| Sin negocio, sin intent, cuenta de menos de 30 minutos | La pregunta "¿Cómo vas a usar AutoLibre?" |
| `signupIntent = "customer"`, o sin intent y cuenta vieja | **Cuenta de cliente** (`components/cuenta/customer-account.tsx`): "Hola, {nombre}", "Hacé tu pedido" (`primary` a `/pedido`), "Tus pedidos los seguís en la app" con `StoreLinks`, WhatsApp de ayuda y "¿Tenés un taller? Sumá tu negocio". No promete ver los pedidos en la web ni en la app (los pedidos web no quedan asociados a la cuenta: 0 de 31 tienen `user_id`) |

El copy está en `lib/content/account.ts` (`customer`, `onboarding`, `newAccount`), `lib/content/partner-account.ts` (`entry`, `intentChoice`) y `lib/content/partner-checkout.ts` (`noPartner.account`). La meta de `/cuenta` pasó a "Mi cuenta".

### Eventos

`signup_intent_selected` (`intent`, `placement`: `cuenta_crear` | `cuenta_nueva`; los flujos de proveedor no lo mandan) y `signup_intent_saved` (`intent`, `result`: `saved` | `existing` | `rejected` | `failed`). Los placements nuevos de la cuenta de cliente y del onboarding están en `analytics.md`. Nada de datos personales.

### Verificación

- `scripts/signup-intent/route.test.ts` (`npm run test:signup-intent`, `typecheck:signup-intent`): validación del intent, token ausente/mal formado/inválido, `userId` del token y no del cuerpo, idempotencia, cuenta vieja rechazada, límite exacto de 30 minutos y errores de Clerk sin datos en el log. Clerk mockeado.
- La ruta en vivo (`next start`): intent inválido 400, sin token 401, token falso 401.
- Capturas a 390 y 1440 del panel, la elección, el `<SignUp>` con la elección, el onboarding de proveedor, la cuenta de cliente y la pregunta de una cuenta nueva (con una ruta de vista previa que se borró antes del commit; sin cuentas reales ni metadata real).
- `eslint.config.mjs` ignora `.claude/**` (worktrees de otros agentes con su propio `.next`).

### Pendientes

- **Backend**: el webhook que sube el rol a `partner` y el backfill (confirmados por la otra sesión). Si algún día cambia el nombre de la clave, se cambia solo en `lib/auth/signup-intent.ts`.
- **App móvil**: no pregunta cliente o taller. Una cuenta creada en la app queda sin intent (cliente) salvo que tenga membresía.
- **Pedidos web asociados a la cuenta**: hasta que existan, la cuenta de cliente no lista pedidos.
- `.env.example`: no se pudo revisar ni editar desde esta sesión (regla de permisos). Si no lista `CLERK_SECRET_KEY`, hay que sumar el nombre sin valor.
- Clerk: el placeholder de contraseña del `<SignUp>` sale en inglés ("Create a password") con `esUY`, y "Facebook" se corta a 390 px en los botones sociales. Las dos cosas ya pasaban antes y no son de este cambio.
