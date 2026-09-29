import { cache } from "react";
import type {
  EmbedReferences,
  RichTextContent,
} from "@graphcms/rich-text-types";
import { hygraphFetch } from "@/lib/hygraph/client";

/**
 * Modelo `Post` de Hygraph (API ID `Post`, plural `posts`). Campos esperados:
 *
 *   title       Single line text   (obligatorio)
 *   slug        Slug               (obligatorio, único — sale de `title`)
 *   excerpt     Multi line text    (bajada; también es la meta description)
 *   coverImage  Asset              (single)
 *   content     Rich text          (con Embeds > Assets habilitado)
 *   date        Date               (obligatorio: es el que ordena el listado)
 *   updatedAt   (campo de sistema) última edición publicada: alimenta el
 *                                    "Actualizado el" y el `dateModified`.
 *   authorName  Single line text   (opcional; sin él firma "AutoLibre")
 *   category    Reference          (obligatoria, a un modelo `Category` con
 *                                    `name` y `slug`) — define la URL del
 *                                    post: `/blog/[category.slug]/[slug]`.
 *
 * Si se renombra un campo en Hygraph, se cambia acá y en nada más: las
 * páginas consumen `BlogPost`, no la forma cruda de la API.
 */

export interface BlogImage {
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
}

export interface BlogCategory {
  readonly slug: string;
  readonly name: string;
}

export interface BlogPostSummary {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly excerpt: string;
  /** ISO `YYYY-MM-DD`. */
  readonly date: string;
  /**
   * ISO `YYYY-MM-DD` de la última edición, o `""` si no es posterior a
   * `date`: republicar el mismo día no cuenta como actualización.
   */
  readonly updatedAt: string;
  readonly authorName: string;
  readonly coverImage: BlogImage | null;
  readonly category: BlogCategory;
}

export interface BlogPost extends BlogPostSummary {
  readonly content: RichTextContent;
  readonly references: EmbedReferences;
}

const DEFAULT_AUTHOR = "AutoLibre";

/** Hygraph limita `first` a 100. Con más posts hay que paginar con `skip`. */
const LIST_LIMIT = 100;

const SUMMARY_FIELDS = /* GraphQL */ `
  id
  slug
  title
  excerpt
  date
  updatedAt
  authorName
  coverImage {
    url
    width
    height
  }
  category {
    slug
    name
  }
`;

const POSTS_QUERY = /* GraphQL */ `
  query BlogPosts($first: Int!) {
    posts(first: $first, orderBy: date_DESC, stage: PUBLISHED) {
      ${SUMMARY_FIELDS}
    }
  }
`;

const POST_QUERY = /* GraphQL */ `
  query BlogPost($slug: String!) {
    post(where: { slug: $slug }, stage: PUBLISHED) {
      ${SUMMARY_FIELDS}
      content {
        raw
        references {
          ... on Asset {
            id
            url
            mimeType
            width
            height
          }
        }
      }
    }
  }
`;

type RawSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  date?: string | null;
  updatedAt?: string | null;
  authorName?: string | null;
  coverImage?: {
    url: string;
    width?: number | null;
    height?: number | null;
  } | null;
  category?: { slug: string; name: string } | null;
};

type RawPost = RawSummary & {
  content?: { raw: RichTextContent; references?: EmbedReferences } | null;
};

/**
 * `updatedAt` es un timestamp (`2026-09-29T14:03:11Z`) y `date` un día. Se
 * compara por día: si la edición es del mismo día de publicación (o anterior,
 * con un `date` puesto a futuro), la nota no se muestra como "actualizada".
 */
function laterDay(updatedAt: string | null | undefined, date: string | null | undefined): string {
  const day = updatedAt?.slice(0, 10) ?? "";
  return day && (!date || day > date) ? day : "";
}

/**
 * `category` es requerido en el schema, pero un post viejo migrado sin uno
 * asignado, o el campo borrado a mano, puede llegar en `null`: se descarta
 * antes de mostrarlo en vez de crashear con una URL rota (`/blog//slug`).
 */
function toSummary(raw: RawSummary): BlogPostSummary | null {
  if (!raw.category) return null;

  return {
    id: raw.id,
    slug: raw.slug,
    title: raw.title,
    excerpt: raw.excerpt?.trim() ?? "",
    date: raw.date ?? "",
    updatedAt: laterDay(raw.updatedAt, raw.date),
    authorName: raw.authorName?.trim() || DEFAULT_AUTHOR,
    coverImage: raw.coverImage
      ? {
          url: raw.coverImage.url,
          width: raw.coverImage.width ?? null,
          height: raw.coverImage.height ?? null,
        }
      : null,
    category: raw.category,
  };
}

/**
 * Posts publicados, del más nuevo al más viejo.
 *
 * Devuelve `[]` —nunca tira— si Hygraph no contesta o falta la config: que el
 * CMS esté caído no puede tumbar el build de una página de marketing, pero
 * tampoco pasa inadvertido, de ahí el log.
 */
export async function getPosts(): Promise<BlogPostSummary[]> {
  try {
    const data = await hygraphFetch<{ posts: RawSummary[] }>(POSTS_QUERY, {
      first: LIST_LIMIT,
    });
    return data.posts
      .map(toSummary)
      .filter((post): post is BlogPostSummary => post !== null);
  } catch (error) {
    console.error("[blog] no se pudieron leer los posts:", error);
    return [];
  }
}

/**
 * Un post por slug, o `null` si no existe o no está publicado.
 *
 * A diferencia de `getPosts`, acá un error de red SÍ tira. Devolver `null`
 * convertiría una caída del CMS en un 404, y ese 404 quedaría cacheado como
 * si el post no existiera. Tirando, el render falla, Next sigue sirviendo la
 * última versión buena de la página y reintenta en la próxima revalidación.
 *
 * `cache` de React deduplica la llamada entre `generateMetadata` y la página
 * (los POST no entran en la memoización de `fetch`).
 */
export const getPostBySlug = cache(
  async (slug: string): Promise<BlogPost | null> => {
    const data = await hygraphFetch<{ post: RawPost | null }>(POST_QUERY, {
      slug,
    });
    const raw = data.post;
    if (!raw?.content?.raw) return null;

    const summary = toSummary(raw);
    if (!summary) return null;

    return {
      ...summary,
      content: raw.content.raw,
      references: raw.content.references ?? [],
    };
  },
);

/** `/blog/[category]/[slug]` de un post. Único lugar que arma esta URL. */
export function postPath(post: Pick<BlogPostSummary, "slug" | "category">) {
  return `/blog/${post.category.slug}/${post.slug}`;
}

/**
 * Categorías con al menos un post publicado, sin repetir, alfabéticas.
 *
 * No hay una query aparte a Hygraph para esto: la lista de categorías del
 * blog es, por definición, "las que ya tiene algún post" — pedirla del
 * modelo `Category` directo mostraría categorías vacías (creadas pero sin
 * usar todavía) como si tuvieran contenido.
 */
/**
 * Otros posts para "Seguí leyendo": de la misma categoría primero, más
 * recientes primero, sin repetir el post actual; si la categoría no alcanza
 * el `limit`, se completa con los más recientes de cualquier categoría.
 */
export function relatedPosts(
  all: readonly BlogPostSummary[],
  current: Pick<BlogPostSummary, "id" | "category">,
  limit: number,
): BlogPostSummary[] {
  const rest = all.filter((post) => post.id !== current.id);
  const sameCategory = rest.filter(
    (post) => post.category.slug === current.category.slug,
  );
  const others = rest.filter(
    (post) => post.category.slug !== current.category.slug,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function collectCategories(
  posts: readonly BlogPostSummary[],
): BlogCategory[] {
  const bySlug = new Map<string, BlogCategory>();
  for (const post of posts) bySlug.set(post.category.slug, post.category);

  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "es"));
}
