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
