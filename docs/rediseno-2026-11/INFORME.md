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
