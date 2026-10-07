# Contrato: SEO, datos estructurados, vista previa y estructura de la página

**Ruta**: `app/proveedor/[slug]/page.tsx` · **Imagen de vista previa**: `app/proveedor/[slug]/og/route.tsx` · **Índice**: `app/proveedor/page.tsx`.
Cumple Constitución VII (metadata con `createMetadata`, JSON-LD con builders de `lib/seo/schema.ts`, sitemap y `llms.txt`) y VI (estructura semántica).

---

## 1. Metadata de la página

`generateMetadata` (la página es dinámica) llama a `createMetadata({ title, description, path, index, image })`; **no** se arma `Metadata` a mano.

| Campo | Regla |
|---|---|
| `title` | `<Nombre> — <rubro principal> en <localidad>`. El template del layout agrega ` · AutoLibre`. Degrada: sin localidad → `<Nombre> — <rubro>`; sin rubro → `<Nombre> en <localidad>`; sin ninguno → `<Nombre>`. |
| `description` | La descripción del proveedor **recortada a ~155 caracteres en un límite de palabra**, sin saltos de línea ni marcado. Sin descripción → plantilla de la capa de contenido: `"<Nombre>, <rubro> en <localidad>. Servicios, horarios y contacto en AutoLibre."` (única por perfil porque incluye nombre). |
| `path` / canonical | `/proveedor/<slug vigente>`. Un slug histórico **no llega a renderizar**: redirige antes. |
| `index` | `true` solo si `PROVIDER_PROFILES_PUBLIC` **y** `isIndexable(profile)`; si no, `noindex,nofollow` (la página sigue funcionando). |
| `image` | `{ url: "/proveedor/<slug>/og", width: 1200, height: 630, alt: "<Nombre> — <rubro> en <localidad>" }`. Se pasa a `createMetadata`: así `openGraph.images` y `twitter.images` apuntan a la imagen dinámica sin ambigüedad con la convención de archivo. |
| `article` | no aplica (es una página de negocio, no un artículo). |

**Desvío menor respecto de la spec**: la spec dice `… | AutoLibre`; el repo usa un template de layout con separador `·` (`%s · AutoLibre`) y la regla de `AGENTS.md` ("title sin la marca"). Se sigue la regla del repo; para el buscador es equivalente.

## 2. Datos estructurados (JSON-LD)

Un solo `<JsonLd schema={graph(...)} />` con, en este orden: `organizationSchema()` · `webPageSchema()` · `localBusinessSchema(profile)` *(nuevo builder)* · `faqPageSchema(items)` *(ya parametrizable)* · `breadcrumbSchema(trail)`.

**Solo si el perfil es indexable.** Si no lo es, no se declara el negocio (FR-036: no declarar lo que no se muestra).

### `localBusinessSchema(profile)` — campos

| Campo | Fuente | Condición |
|---|---|---|
| `@type` | `businessTypeFor(primaryCategory.slug)` → `AutoRepair` \| `TireShop` \| `AutoWash` \| `AutoBodyShop` \| `AutoPartsStore` \| `AutomotiveBusiness` | siempre (genérico por defecto) |
| `@id` | `<url>#business` | siempre |
| `name`, `url`, `description` | perfil | siempre (`description` si existe) |
| `logo`, `image` | `ImageObject` con `url`, `width`, `height` (portada + logo) | si existen |
| `telephone` | `contact.phoneE164` | si existe |
| `address` | `PostalAddress`: `streetAddress` = `address.full`, `addressLocality`, `addressRegion`, `addressCountry: "AR"` | `locationMode` ≠ `mobile` **y** hay dirección |
| `geo` | `GeoCoordinates` | solo si **hay** latitud y longitud (hoy: ninguno) |
| `areaServed` | lista de `AdministrativeArea` por localidad | `locationMode` = `mobile` o `both` con zonas |
| `openingHoursSpecification` | una entrada por tramo: `dayOfWeek` (`Monday`…), `opens`, `closes` (`"24:00"` si 1440) | si hay horarios |
| `aggregateRating`, `review` | de `reviews` | **solo** si `count > 0` y los datos se **muestran** en la página |
| `sameAs` | `links` http(s) de redes | si existen |
| `mainEntityOfPage` | `{ "@id": "<url>#webpage" }` | siempre |
| *no se declara* | `priceRange`, `email` | sin precios (fuera de alcance) y el email no es público |

Variante **sin local**: sin `address` ni `geo`; con `areaServed`.

### `faqPageSchema(items)`

Los `items` son **exactamente** los de `buildFaq(profile)`: los mismos que renderiza el acordeón. Sin ítems, no hay bloque ni `FAQPage`.

### `breadcrumbSchema(trail)`

Trayecto **idéntico al visible** (FR-034): `Proveedores` → `<Localidad>` → `<Rubro>` → `<Nombre>`.
- `Proveedores` → `/proveedor` · `<Localidad>` → `/proveedor?zona=<slug>` · `<Rubro>` → `/proveedor?rubro=<slug>` (filtros con `noindex` y canonical a `/proveedor`; research D8).
- Un nivel sin dato (sin localidad, sin rubro) **se omite en los dos lados**, visible y estructurado.
- La spec **no** incluye "Inicio" como primer paso; se sigue la spec.

## 3. Sitemap y `llms.txt`

**`app/sitemap.ts`**: agrega, solo con `PROVIDER_PROFILES_PUBLIC = true`:
- `/proveedor` (`changeFrequency: "daily"`, `priority: 0.7`, `lastModified` = el más reciente de los perfiles);
- un `/proveedor/<slug>` por cada perfil con `indexable = true` del listado (`GET /partner-profiles`, recorriendo páginas), con `lastModified = updatedAt`, `changeFrequency: "weekly"`, `priority: 0.6`. Los no indexables **no** entran.

**`public/llms.txt`**: sección nueva "Perfiles de proveedores" (cuando el interruptor esté encendido) que describe qué es una página `/proveedor/<slug>` y lista `/proveedor`. Como pasa con el blog, `llms.txt` es manual: si el interruptor vuelve a `false`, se saca de ahí también.

**`app/robots.ts`**: sin cambios (`/proveedor/` ya queda permitido; `noindex` va por metadata, **no** por `robots.txt`, para que Google pueda leerlo).

## 4. Imagen de vista previa (`/proveedor/<slug>/og`)

`ImageResponse` de `next/og`, 1200×630, PNG.

**Composición** (flexbox; sin `grid`, que Satori no soporta):

```text
┌──────────────────────────────────────────────┬───────────────┐
│ 64px de padding                              │               │
│ [logo 120×120, borde 1px]                    │               │
│ Nombre del proveedor        (Outfit 700, 64) │  portada      │
│ <rubro> · <localidad>       (DM Sans 500, 28)│  420 px       │
│ ★ 4,8  27 reseñas en AutoLibre   (si hay)    │  (cover)      │
│                                              │               │
│ [Aliado de AutoLibre]            [logo AutoLibre]            │
└──────────────────────────────────────────────┴───────────────┘
```

Fondo `#FEFEFD`, texto `#111827`/`#374151`, sello `#E8F5E8` con texto `#1C2B1C`. Constantes en `lib/provider-profile/og-tokens.ts` que **espejan** los tokens (Satori no entiende clases ni variables CSS: excepción técnica documentada).

**Degradación (FR-042)**:
- sin portada → panel derecho `#DCDEDC` liso;
- sin logo → se omite el cuadro y el nombre sube;
- sin reseñas → se omite la fila de puntuación;
- sin sello → se omite el badge;
- nombre largo → máximo 2 líneas con elipsis;
- una imagen remota que falla al descargarse → se omite **sin romper** la tarjeta;
- slug inexistente → **404** (no una imagen genérica).

**Restricciones de la API a respetar** (doc de Next 16): bundle máximo de **500 KB** (JSX + fuentes + imágenes); fuentes solo `ttf`/`otf`/`woff` (no `woff2`). El presupuesto se mide en un **spike previo** (plan, Fase 0).

**Caché**: `revalidate` acotado (≤ 600 s) y etiqueta `provider:<slug>`, de modo que el aviso de cambio renueva página e imagen juntas. **Tiempo objetivo**: < 3 s (SC-004).

## 5. Estructura semántica de la página (Constitución VI)

Un solo `<h1>`; todas las secciones con `aria-labelledby`; los niveles no saltan.

```text
<header>  (SiteHeader global del sitio; ver D21 revisada y spec 210)
<main>
  <nav aria-label="Ruta">  Proveedores › Localidad › Rubro › Nombre
  <section aria-labelledby="perfil-encabezado">
      <h1> Nombre comercial </h1>   + sello, rubros, puntuación, estado, localidad, botones
  <div> dos columnas en desktop; la derecha pasa debajo en mobile
    columna principal
      <section> <h2> Sobre {Nombre} </h2>
      <section> <h2> Servicios </h2>                 <h3> por familia </h3>  <h3> Marcas que atiende </h3> …
      <section> <h2> Trabajos hechos </h2>           (Fase C; omitida si vacía)
      <section> <h2> Reseñas </h2>                   (Fase C; omitida si vacía)
      <section> <h2> Medido por AutoLibre </h2>      (Fase C; omitida si vacía)
      <section> <h2> Preguntas frecuentes </h2>      <details>/<summary> por pregunta
    <aside>  (columna derecha)
      <section> <h2> ¿Necesitás una propuesta? </h2>
      <section> <h2> Horarios </h2>
      <section> <h2> Ubicación | Zona de cobertura </h2>
      <section> <h2> Contacto y redes </h2>
<footer>  (banda de AutoLibre con la URL del perfil + Términos y Privacidad)
```

- Las preguntas del acordeón son `<summary>` (no encabezados): se evita saltar de `h2` a un `h3` decorativo y el `FAQPage` ya las declara.
- Los eyebrows y etiquetas ("Aliado de AutoLibre", rubros en pills) son `<p>`/`<span>`, nunca `h*`.
- El orden **visual** de la columna derecha en mobile (debajo) coincide con el orden del DOM.

## 6. Imágenes de la página (Constitución IV)

Todas con `next/image`, `width`/`height` y `sizes`. **Solo la portada** lleva `preload` (es el candidato a LCP); nunca `priority`. Logo y foto de quien atiende: carga diferida. Los hosts de imagen (Spaces/CDN y, si hay mapa estático, `maps.googleapis.com`) se declaran en `remotePatterns` de `next.config.ts`. Los logos legacy de hosts desconocidos se renderizan `unoptimized` con dimensiones fijas hasta migrarse (research D10).

## 7. Qué verifica este contrato

Ver la lista de verificación del [quickstart](../quickstart.md): fuente de la página sin ejecutar scripts, validación de datos estructurados, vista previa en un mensajero real, outline de encabezados y alineación a 390 / 1024 / 1440 px.
