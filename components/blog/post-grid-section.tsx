import Link from "next/link";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { PostCard } from "@/components/blog/post-card";
import { Section } from "@/components/ui/section";
import { blogHref, type BlogFilters } from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import type { BlogPostSummary } from "@/lib/hygraph/posts";

type PostGridSectionProps = {
  readonly id?: string;
  readonly heading: string;
  readonly subtitle?: string;
  readonly posts: readonly BlogPostSummary[];
  readonly page: number;
  readonly totalPages: number;
  readonly filters: Pick<BlogFilters, "q" | "category">;
  /**
   * `true` cuando el filtro activo no dio resultados. La sección vacía sin
   * filtro no se renderiza: la página decide no mostrarla (si hay una nota
   * destacada arriba, un "no hay notas" la contradiría).
   */
  readonly emptyFiltered?: boolean;
};

/** Grilla de notas con su heading y paginación (listado y categorías). */
export function PostGridSection({
  id,
  heading,
  subtitle,
  posts,
  page,
  totalPages,
  filters,
  emptyFiltered = false,
}: PostGridSectionProps) {
  const headingId = id ? `${id}-titulo` : "notas-titulo";

  return (
    <Section id={id} tone="subtle" spacing="md" aria-labelledby={headingId}>
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-3">
          <h2 id={headingId} className="text-3xl leading-tight text-ink md:text-4xl">
            {heading}
          </h2>
          {subtitle ? (
            <p className="max-w-140 text-lead leading-relaxed text-ink/70">{subtitle}</p>
          ) : null}
        </div>

        {emptyFiltered ? (
          <div className="rounded-card bg-surface p-10 text-center">
            <p className="text-ink/70">{blogContent.grid.emptyFiltered}</p>
            <Link
              href={blogHref({ category: filters.category })}
              className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-brand-hover hover:text-brand"
            >
              {blogContent.grid.clearFilters}
            </Link>
          </div>
        ) : (
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}

        <BlogPagination page={page} totalPages={totalPages} filters={filters} />
      </div>
    </Section>
  );
}
