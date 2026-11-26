import { getPosts, type BlogPostSummary } from "@/lib/hygraph/posts";

/**
 * Notas del blog que enlazan el Home y `/pedido`. Salen del mismo fetch
 * cacheado del blog (`getPosts`: data cache de Next con `revalidate` y el tag
 * `hygraph`), así que se regeneran cuando se publica una nota. Si Hygraph
 * falla, `getPosts` devuelve `[]` y la sección no se muestra: la página
 * nunca se cae por el blog.
 */
export async function getGuidePicks({
  latest,
  slugs = [],
}: {
  /** Cuántas de las más nuevas. */
  readonly latest: number;
  /** Notas elegidas a mano, por slug; las que no existan se saltean. */
  readonly slugs?: readonly string[];
}): Promise<{ latest: BlogPostSummary[]; picked: BlogPostSummary[] }> {
  const posts = await getPosts();
  const newest = posts.slice(0, latest);
  const shown = new Set(newest.map((post) => post.id));
  const picked = slugs
    .map((slug) => posts.find((post) => post.slug === slug))
    .filter((post): post is BlogPostSummary => post !== undefined && !shown.has(post.id));
  return { latest: newest, picked };
}
