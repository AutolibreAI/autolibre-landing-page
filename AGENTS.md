<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Principios del sitio

Este sitio compite por visibilidad. Todo cambio se evalúa en este orden: **SEO/GEO primero**, después performance, accesibilidad y contenido. Si una decisión de diseño o de código empeora cualquiera de esos cuatro, se justifica por escrito o no se hace.

### 1. Server Components por defecto

- Todo componente es Server Component salvo que sea imposible. Un client component manda menos HTML en el render inicial, más JS al navegador y empeora LCP e INP: rankea y rinde peor.
- `"use client"` SOLO cuando es obligatorio: formularios, estado interactivo, event handlers, APIs del browser (`window`, `localStorage`, `IntersectionObserver`, etc.).
- Empujá el boundary a la hoja: islas client chicas. El contenido server se pasa como `children` o props a la isla, no se mueve adentro.
- Nunca marques una sección entera como client por un botón, un toggle o un modal. Extraé ese pedacito.
- Todo el contenido indexable tiene que estar en el HTML que devuelve el server. Nada de texto importante que aparezca recién después de hidratar o de un fetch en el cliente.
- Evitá esconder contenido importante detrás de interacción (carruseles, tabs, acordeones cerrados). Si no hay alternativa, que el contenido igual esté en el DOM inicial.

### 2. HTML semántico y jerarquía de headings

La estructura del HTML es lo primero que leen buscadores y LLMs. Es una regla propia, no un detalle de estilo.

- **Exactamente un `<h1>` por página**, y describe el tema/keyword principal de esa página.
- **Los headings no saltean niveles**: `h1 → h2 → h3`. Nunca `h1 → h3`.
- Cada `<section>` arranca con su propio heading (`h2` para secciones de primer nivel) y lo referencia con `aria-labelledby`.
- **El nivel se elige por el outline del documento, NUNCA por el tamaño visual.** El tamaño se da con clases: un `h2` puede verse chico y un `<p>` puede verse grande.
- No uses `h*` para texto decorativo ni eyebrows. Un eyebrow es un `<p>`.
- Landmarks semánticos: `<header>`, `<nav>`, un único `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`. Listas como `<ul>`/`<ol>`, navegación como `<a>`, acciones como `<button>`. Cero div-soup.
- Los componentes reutilizables que renderizan headings (ej. `SectionHeading` en `components/ui/heading.tsx`) reciben el nivel por prop (`as`/`level`): la página decide la jerarquía, no el componente.
- Antes de cerrar una página, verificá su outline (devtools, extensión HeadingsMap o similar).

### 3. Accesibilidad

- WCAG 2.1 AA como piso, no como extra.
- `alt` significativo en toda imagen con contenido; `alt=""` y `aria-hidden` en las decorativas.
- Focus visible siempre. No se quita el outline sin reemplazo.
- Respetá `prefers-reduced-motion`: ninguna animación es obligatoria para entender o usar la página. Única excepción aprobada: las palabras rotativas del hero siguen cambiando, con un fundido en el lugar y sin desplazamiento (clase `motion-exempt`). No sumar otras excepciones sin decisión explícita de producto.
- Contraste, objetivos táctiles de 44px en mobile e inputs de 16px para evitar el zoom de iOS.

### 4. Performance

- Imágenes con `next/image`, siempre con `width`/`height` (o `fill` con contenedor dimensionado) y `sizes`.
- `preload` SOLO en la imagen LCP de la página (en Next 16 `priority` está deprecado: no se usa). Si la imagen LCP cambia según el viewport, usá `loading="eager"` o `fetchPriority="high"` en lugar de `preload`, y nunca combines `preload` con esas props.
- Fuentes con `next/font` (ya configuradas en `app/layout.tsx`). Nada de `<link>` a Google Fonts.
- Evitá librerías pesadas en el cliente. Antes de sumar una dependencia, preguntate si se puede resolver en el server o con CSS.
- Objetivos Core Web Vitals: **LCP < 2.5 s, CLS < 0.1, INP < 200 ms**.

### 5. SEO obligatorio en TODA página

- `export const metadata = createMetadata({ title, description, path })` desde `lib/seo/metadata.ts` (o `generateMetadata` si la página es dinámica). Eso resuelve canonical, Open Graph, Twitter y robots. No armes `Metadata` a mano.
- `title` sin la marca (el template del layout la agrega) y `description` **única** por página.
- JSON-LD con `<JsonLd schema={graph(...)} />` usando los builders de `lib/seo/schema.ts`. Mínimo: `webPageSchema` + `breadcrumbSchema` (más `organizationSchema`). Los específicos según el tipo: `faqPageSchema`, `softwareApplicationSchema`, etc. Si falta un builder, se agrega a `lib/seo/schema.ts`, no inline en la página.
- Agregá la ruta a `app/sitemap.ts` con su `lastModified` fijo; actualizá esa fecha cuando cambie el contenido.
- Si la página es privada o no debe indexarse: `index: false` en `createMetadata`, sacala del sitemap y revisá `app/robots.ts`.

### 6. GEO (Generative Engine Optimization)

- Al agregar o cambiar una ruta, o al cambiar el producto, mantené sincronizados `app/sitemap.ts`, `app/robots.ts` y `public/llms.txt`.
- Rutas claras, en español, descriptivas y planas (`/descarga`, `/proveedores`), sin anidamiento innecesario.
- Contenido factual y citable: respuestas directas, FAQs, datos concretos. La primera oración de cada sección tiene que poder citarse sola.
- Nunca inventes métricas, testimonios ni claims (ver `PRODUCT.md`). Un LLM cita lo que escribimos: tiene que ser verdad.
- Entidades consistentes: el nombre (`AutoLibre`), la razón social (`AutoLibre.AI`), el dominio y las redes salen de `siteConfig` (`lib/seo/config.ts`) y tienen que coincidir con el schema `Organization`.

### 7. Tailwind v4: clases canónicas

- Usá SIEMPRE las clases canónicas de la escala en lugar de valores arbitrarios: `w-5` y no `w-[20px]`, `max-w-155` y no `max-w-[620px]`. En v4 el spacing es dinámico (`n × 0.25rem`), así que casi todo valor tiene su clase.
- Colores, radios y fuentes vía tokens de `@theme` (`bg-brand`, `text-ink`, `rounded-field`, `font-display`). Nunca un hex suelto en una clase.
- Si no existe equivalente, creá un token en el `@theme` de `app/globals.css`.
- Valores arbitrarios solo como último recurso y con un comentario que lo justifique.

### 8. Contenido en la capa de contenido

- Todo copy visible (títulos, textos, CTAs, labels, `alt`, metadata) vive en `lib/content/*`. Los componentes no traen strings hardcodeados.
- URLs de tiendas, contacto y redes salen de `siteConfig`, nunca escritas a mano.

### 9. Layout: ancho del contenido

- Todo contenido de sección vive dentro de un contenedor: `Section` ya trae `Container size="wide"` por defecto (el ancho del header, el hero y el footer). Otro ancho (`prose`, `narrow`, `content`) solo como decisión deliberada y centrada, con `container="..."` y `containerClassName`; `container={false}` solo para bandas full-bleed que manejan su propio gutter (o secciones que son columnas de una grilla que ya vive en un `Container`). Nunca anidar un `Container` dentro de un `Section` a mano.

### Checklist antes de dar por terminada una página

- [ ] Es Server Component; los `"use client"` que quedan son islas hoja justificadas.
- [ ] Todo el contenido indexable está en el HTML del server (verificado con "ver código fuente", no con devtools).
- [ ] Un único `<h1>` con el tema de la página; headings sin saltos de nivel; outline verificado.
- [ ] Landmarks correctos (`<main>` único, `<section>` con heading y `aria-labelledby`), sin div-soup.
- [ ] Los bordes del contenido de cada sección se alinean con el header y el footer (verificado a 390, 1024 y 1440 px).
- [ ] `metadata` con `createMetadata` (title + description única + path).
- [ ] `<JsonLd>` con `webPageSchema` + `breadcrumbSchema` (+ los específicos del tipo de página).
- [ ] Ruta agregada a `app/sitemap.ts` y a `public/llms.txt`; `robots.ts` revisado si es privada.
- [ ] Imágenes con `next/image`, `sizes` y `alt`; `preload` solo en la LCP (nunca `priority`).
- [ ] Focus visible, contraste AA y `prefers-reduced-motion` respetado.
- [ ] Clases canónicas de Tailwind y tokens de `@theme`; sin hex ni valores arbitrarios injustificados.
- [ ] Copy en `lib/content/*`, sin strings hardcodeados.
