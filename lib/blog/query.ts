import type { BlogPostSummary } from "@/lib/hygraph/posts";

/** Posts por página en la grilla "Guías por tema". */
export const PAGE_SIZE = 9;

export interface BlogFilters {
  readonly q: string;
  readonly category: string;
  readonly page: number;
}

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lee los `searchParams` de `/blog`. Nunca tira: un valor raro (un `page`
 * no numérico, un array donde no debería haber uno) cae al default en vez de
 * romper el render — son query params, cualquiera los puede escribir a mano.
 */
export function parseBlogFilters(searchParams: SearchParams): BlogFilters {
  const q = (firstValue(searchParams.q) ?? "").trim().slice(0, 100);
  const category = (firstValue(searchParams.category) ?? "").trim();
  const pageRaw = Number(firstValue(searchParams.page));
  const page = Number.isInteger(pageRaw) && pageRaw > 1 ? pageRaw : 1;

  return { q, category, page };
}

/** `true` si hay un filtro de texto o categoría activo (no cuenta la página sola). */
export function hasActiveFilter(filters: Pick<BlogFilters, "q" | "category">): boolean {
  return filters.q !== "" || filters.category !== "";
}

/** Sin tildes ni mayúsculas: "cédula" y "cedula" tienen que matchear igual. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function filterPosts(
  posts: readonly BlogPostSummary[],
  filters: Pick<BlogFilters, "q" | "category">,
): BlogPostSummary[] {
  const needle = filters.q ? normalize(filters.q) : "";

  return posts.filter((post) => {
    if (filters.category && post.category.slug !== filters.category) return false;
    if (needle && !normalize(`${post.title} ${post.excerpt}`).includes(needle)) {
      return false;
    }
    return true;
  });
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly totalPages: number;
}

/** Recorta `items` a una página. Un `page` fuera de rango se ajusta al borde más cercano. */
export function paginate<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const start = (clampedPage - 1) * pageSize;

  return { items: items.slice(start, start + pageSize), page: clampedPage, totalPages };
}

/**
 * Arma un link a `/blog` con los filtros dados, omitiendo los que están
 * vacíos o en su default — así "Todas" es `/blog` liso y no `/blog?category=`.
 */
export function blogHref({
  q,
  category,
  page,
}: Partial<BlogFilters>): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (page && page > 1) params.set("page", String(page));

  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
}
