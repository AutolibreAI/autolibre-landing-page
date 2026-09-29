import { BlogSearchForm } from "@/components/blog/blog-search-form";
import { CategoryChips } from "@/components/blog/category-chips";
import { Breadcrumbs, type Crumb } from "@/components/blog/breadcrumbs";
import { Section } from "@/components/ui/section";
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
 * bajada a la izquierda, buscador a la derecha y, abajo, los temas. La línea
 * divisoria cierra el bloque DESPUÉS de los chips: separa la navegación del
 * contenido, no el título de sus propios filtros.
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
    <Section spacing="sm" className="md:pt-20">
      <div className="flex flex-col gap-10 border-b border-line pb-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-12 xl:gap-20">
          <div className="flex flex-col gap-4">
            {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
            {eyebrow ? (
              <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="max-w-190 text-display-xs text-ink sm:text-display-sm md:text-display-md">
              {heading}
            </h1>
            <p className="max-w-150 text-lead leading-relaxed text-ink/70 md:text-lead-lg">
              {description}
            </p>
          </div>
          <BlogSearchForm defaultValue={q} category={activeCategory} className="lg:w-90 xl:w-105" />
        </div>

        <CategoryChips categories={categories} active={activeCategory} />
      </div>
    </Section>
  );
}
