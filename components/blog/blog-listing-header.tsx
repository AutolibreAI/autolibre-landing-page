import { BlogSearchForm } from "@/components/blog/blog-search-form";
import { CategoryChips } from "@/components/blog/category-chips";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { Section } from "@/components/ui/section";
import { blogContent } from "@/lib/content/blog";
import type { BlogCategory } from "@/lib/hygraph/posts";

type BlogListingHeaderProps = {
  /** Eyebrow sobre el título. Un `<p>`: no entra en el outline. */
  readonly eyebrow?: string;
  /** El `h1` de la página. */
  readonly heading: string;
  readonly description: string;
  /** Migas de pan visibles (las páginas de categoría); el listado general no las lleva. */
  readonly breadcrumbs?: readonly Crumb[];
  readonly categories: readonly BlogCategory[];
  /** Slug de la categoría de la página, o `""` en `/blog`. */
  readonly activeCategory: string;
  readonly q: string;
};

/**
 * Encabezado de un listado del blog (`/blog` y `/blog/[category]`): título y
 * bajada a la izquierda, buscador a la derecha y, abajo, los temas. Misma
 * composición que antes del rediseño; cambian tokens, píldoras y contraste.
 */
export function BlogListingHeader({
  eyebrow,
  heading,
  description,
  breadcrumbs,
  categories,
  activeCategory,
  q,
}: BlogListingHeaderProps) {
  return (
    <Section spacing="sm" className="bg-card pb-6 md:pt-16 md:pb-9">
      <div className="flex flex-col gap-7">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-16">
          <div className="flex flex-col gap-3">
            {breadcrumbs ? (
              <Breadcrumbs items={breadcrumbs} label={blogContent.breadcrumb.label} />
            ) : null}
            {eyebrow ? (
              <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-155 font-display text-display-xs font-bold tracking-tight text-balance text-fg sm:text-display-sm md:text-display-md">
              {heading}
            </h1>
            <p className="max-w-140 text-lead text-fg-muted">{description}</p>
          </div>
          <BlogSearchForm defaultValue={q} category={activeCategory} className="lg:w-105" />
        </div>

        <CategoryChips categories={categories} active={activeCategory} />
      </div>
    </Section>
  );
}
