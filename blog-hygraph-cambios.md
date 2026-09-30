# Blog: adaptar el front al nuevo schema de Hygraph

> Instrucciones para Claude Code. Antes de tocar código, leé `AGENTS.md` (reglas del sitio) y la guía de Next en `node_modules/next/dist/docs/` que corresponda a lo que vayas a cambiar.

## Contexto

El 30/09/2026 se ajustó el schema del proyecto Hygraph **AutolibreAI** (entorno `master`). Todos los campos nuevos son **opcionales**: las queries actuales siguen funcionando y nada se rompe si esta tarea no se hace. El objetivo es que el front **use** lo nuevo para SEO.

### Qué cambió en Hygraph

| Modelo | Cambio |
|---|---|
| Componente nuevo `Seo` | `metaTitle: String`, `metaDescription: String` |
| `Post` | + `seo: Seo` · + `tags: [Tag!]!` (muchos a muchos) · `slug` ahora es único |
| `Category` | + `description: String` (bajada corta) · + `content: RichText` (texto de la página pilar) · + `seo: Seo` · `slug` ahora es único |
| Modelo nuevo `Tag` | `name`, `slug` (único), `description`, `seo: Seo`, `posts` (reverse de `Post.tags`) |
| Locale | Se renombró `en` → `es` (sigue siendo default). **No afecta al código**: ninguna query pasa `locales`. No hay nada que cambiar por esto. |

Categorías actuales (slugs): `tramites-y-documentacion`, `mantenimiento`, `diagnostico-y-fallas`, `seguros`, `compra-y-venta`, `financiacion-y-costos`, `gnc-y-combustible`, `talleres-y-servicios`, `manejo-y-seguridad`. Tags: por ahora solo `vencimientos`; después se van a sumar marcas, modelos, provincias y códigos OBD.

Query verificada contra la API (funciona tal cual):

```graphql
categories { slug name description seo { metaTitle metaDescription } content { raw } }
posts { slug seo { metaTitle metaDescription } tags { slug name } category { slug } }
tags { slug name description seo { metaTitle metaDescription } posts { slug } }
```

---

## Tareas

Hacelas en este orden; cada una deja el sitio funcionando.

### 1. `lib/hygraph/posts.ts`: leer los campos nuevos del post

- Sumar a `SUMMARY_FIELDS`: `tags { slug name }`.
- Sumar a `POST_QUERY` (no al summary, no hace falta en listados): `seo { metaTitle metaDescription }`.
- Tipos:
  - `BlogTag { slug; name }` y `BlogSeo { title: string; description: string }` (strings ya trimeados, `""` si vienen vacíos o `null`).
  - `BlogPostSummary.tags: readonly BlogTag[]` (`[]` si viene `null`).
  - `BlogPost.seo: BlogSeo`.
- Actualizar el comentario de cabecera del archivo con los campos nuevos (hoy dice que `excerpt` es la meta description: ya no es exactamente así, ver tarea 2).

### 2. Metadata del post: usar `seo` con fallback

En `app/blog/[category]/[slug]/page.tsx`, `generateMetadata`:

- `title`: `post.seo.title || post.title`
- `description`: `post.seo.description || post.excerpt || siteConfig.description`

El `<h1>` sigue siendo `post.title` y la bajada visible sigue siendo `post.excerpt`: el meta title está pensado para Google (~60 caracteres) y puede diferir del título de la nota. Usá la misma `description` resuelta en `webPageSchema` y `blogPostingSchema`, para que metadata y JSON-LD coincidan.

### 3. Página de categoría: datos propios desde Hygraph

Hoy `/blog/[category]` arma título y descripción con plantillas genéricas de `blogContent.category` y la categoría sale de `collectCategories(posts)` (solo `slug` y `name`).

- Nueva función `getCategoryBySlug(slug)` en `lib/hygraph/` (puede ir en un `categories.ts` nuevo), con el mismo patrón que `getPostBySlug`: envuelta en `cache` de React, `stage: PUBLISHED`, y **que tire** ante error de red (no devolver `null`, por el mismo motivo documentado en `getPostBySlug`). Pide `slug name description seo { metaTitle metaDescription } content { raw references { ... on Asset { id url mimeType width height } } }`.
- **Se mantiene la regla actual**: una categoría sin posts publicados da 404. Validar primero contra `collectCategories(await getPosts())` y recién después pedir sus datos.
- Metadata:
  - `title`: `seo.metaTitle || blogContent.category.heading(name)`
  - `description`: `seo.metaDescription || category.description || blogContent.category.description(name)`
- Bajada visible del header (`BlogListingHeader`): `category.description || blogContent.category.description(name)`.
- **Contenido pilar**: si `category.content` existe, renderizarlo con el componente `RichText` existente en una `<section>` propia **debajo de la grilla de posts** y antes de `ClosingCtaSection`, con `h2` y `aria-labelledby`. El copy del heading va en `lib/content/blog.ts` (por ejemplo `category.pillarHeading: (name) => \`Guía completa de ${name}\``). Revisá la jerarquía: los headings dentro del rich text no pueden ser `h1` (si el editor mete un `heading-one`, el renderer tiene que bajarlo a `h2`/`h3`; verificá cómo lo maneja hoy `components/blog/rich-text`).
- Mostrarlo solo en la página 1 y sin búsqueda activa (`page === 1 && q === ""`), para no duplicar el texto en `?page=2`.
- Aplicar las mismas `description` en el `webPageSchema` de tipo `CollectionPage`.

### 4. Tags en la nota

- En `app/blog/[category]/[slug]/page.tsx`, mostrar los tags del post como chips debajo del cuerpo (antes de `ArticleAppCta`), en una lista `<ul>`. Si el post no tiene tags, no se renderiza nada.
- Por ahora los chips **no linkean** (no hay páginas de tag todavía, ver tarea 6). Si preferís dejarlos preparados, que el link dependa de un flag y quede apagado.
- Copy (label de la lista) en `lib/content/blog.ts`.
- Sumar los tags a `blogPostingSchema` como `keywords` (string separado por comas). Si hace falta, extendé el builder en `lib/seo/schema.ts`, no inline.

### 5. Buscador del blog: incluir tags

En `lib/blog/query.ts`, `filterPosts`: que la búsqueda de texto también matchee contra los nombres de los tags (`${post.title} ${post.excerpt} ${post.tags.map(t => t.name).join(" ")}`). Así "Gol Trend" o "vencimientos" encuentran notas aunque la palabra no esté en el título.

### 6. (Opcional, siguiente iteración) Páginas de tag

No hacerlo en esta tarea salvo que se pida. Queda documentado para cuando haya contenido:

- Ruta: `app/blog/tema/[tag]/page.tsx` → `/blog/tema/gol-trend`. El segmento estático `tema` le gana en el ruteo al dinámico `[category]`, así que **el slug `tema` queda reservado** y no se puede usar como categoría. Documentarlo en un comentario.
- Mismas reglas que la página de categoría: 404 si el tag no tiene posts publicados, `createMetadata` con `seo` y fallback, `CollectionPage` + breadcrumb, sitemap y `llms.txt`.

### 7. Webhook de revalidación

`app/api/revalidate/route.ts` documenta un trigger solo sobre el modelo `Post`. Con categorías y tags editables, un cambio en la descripción o el texto pilar de una categoría no invalidaría el cache hasta la ventana de 5 minutos.

- Actualizar el comentario del archivo: el trigger ahora es **Models: Post, Category, Tag** · Stage Published · Publish, Unpublish, Update.
- El código no cambia (invalida todo el tag `hygraph`).
- ⚠️ El cambio real del webhook se hace a mano en Hygraph (Project settings > Webhooks). Avisale a Ramiro al terminar.

### 8. Límite de 100 posts (preparar)

`getPosts` pide `first: 100` y Hygraph no deja pedir más en una query. El plan es publicar muchas notas, así que:

- Paginar `getPosts` con `skip` en un loop hasta que una página devuelva menos de 100.
- Mantener el contrato actual: devuelve todo, ordenado por `date_DESC`, y nunca tira.

---

## Cómo verificar

1. `npm run lint` y `npm run build` sin errores.
2. `npm run dev` con `HYGRAPH_ENDPOINT` apuntando a AutolibreAI:
   - `/blog/mantenimiento` muestra la descripción de Hygraph (no la plantilla genérica) y el `<title>` es el `metaTitle`.
   - `/blog/mantenimiento/cada-cuanto-cambiar-el-aceite-del-auto` sigue funcionando; sin `seo` cargado, usa título y excerpt como antes.
   - Con una categoría sin `description`/`seo`, los fallbacks funcionan.
3. "Ver código fuente": la descripción de categoría, el texto pilar y los tags están en el HTML del server.
4. Outline de headings de la página de categoría: un solo `h1`, sin saltos.
5. **Ojo con el stage**: el front lee `stage: PUBLISHED`. Hoy las categorías y el tag están en **DRAFT** en Hygraph, así que en el sitio no se van a ver sus `description`/`seo` hasta que se publiquen. Para probar en dev, publicarlos desde Hygraph (o probar la query con `stage: DRAFT` sin commitearlo).

## Fuera de alcance

- No cambiar `BLOG_PUBLIC` (`lib/blog/visibility.ts`): el blog sigue oculto hasta que Ramiro lo decida.
- No tocar el schema de Hygraph desde el código.
- No sumar dependencias: el cliente GraphQL propio (`lib/hygraph/client.ts`) alcanza.
