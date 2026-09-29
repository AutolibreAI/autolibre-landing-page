import type { Metadata } from "next";
import { BlogPagination } from "@/components/blog/blog-pagination";
import { BlogSearchForm } from "@/components/blog/blog-search-form";
import { CategoryChips } from "@/components/blog/category-chips";
import { FeaturedPost } from "@/components/blog/featured-post";
import { LatestList } from "@/components/blog/latest-list";
import { PostCard } from "@/components/blog/post-card";
import { ClosingCtaSection } from "@/components/sections/home/closing-cta";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/heading";
import { PAGE_SIZE, blogHref, filterPosts, hasActiveFilter, paginate, parseBlogFilters } from "@/lib/blog/query";
import { collectCategories, getPosts } from "@/lib/hygraph/posts";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const TITLE = "Blog";
const DESCRIPTION =
  "Guías claras para tener tu auto en regla: vencimientos, papeles, mantenimiento y diagnóstico, explicados sin vueltas por el equipo de AutoLibre.";
const PATH = "/blog";
/** Notas mostradas en la columna lateral junto a la destacada. */
const LATEST_COUNT = 4;

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Blog", path: PATH },
  ]),
);

type PageProps = {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * El listado se lee en el servidor: el fetch a Hygraph lleva `revalidate` y
 * el tag `hygraph` (invalidado on-demand por `/api/revalidate` al publicar).
 * Filtro, búsqueda y paginación se resuelven acá mismo, en memoria, sobre esa
 * misma lista — no hay una query aparte por combinación de filtros: con el
 * volumen de un blog de marketing (decenas de posts, no miles) es más simple
 * y no le pega a Hygraph una vez por cada búsqueda que alguien tipea.
 */
export default async function BlogPage({ searchParams }: PageProps) {
  const filters = parseBlogFilters(await searchParams);
  const allPosts = await getPosts();
  const categories = collectCategories(allPosts);
  const filtered = filterPosts(allPosts, filters);

  // La nota destacada y "Últimas notas" sólo tienen sentido en el listado
  // completo: filtrando por categoría o buscando, el resultado es una
  // grilla lisa — separar "la más nueva" del resto ahí no aporta nada y
  // además la sacaría de los resultados de la búsqueda.
  const showSpotlight = !hasActiveFilter(filters) && filters.page === 1;
  const featured = showSpotlight ? (filtered[0] ?? null) : null;
  const rest = showSpotlight ? filtered.slice(1) : filtered;
  const latest = showSpotlight ? rest.slice(0, LATEST_COUNT) : [];
  const gridSource = showSpotlight ? rest.slice(LATEST_COUNT) : filtered;
  const { items: gridPosts, totalPages } = paginate(gridSource, filters.page, PAGE_SIZE);

  return (
    <>
      <PageShell secondary={{ label: "Soy dueño de auto", href: "/" }} currentPath={PATH}>
        <Section spacing="sm">
          <Container>
            <div className="grid gap-10 border-b border-line pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-20">
              <SectionHeading
                as="h1"
                size="lg"
                title="Guías claras para tener tu auto en regla."
                subtitle="Vencimientos, papeles, mantenimiento y diagnóstico, explicados sin vueltas por el equipo de AutoLibre."
              />
              <BlogSearchForm defaultValue={filters.q} category={filters.category} />
            </div>

            <div className="mt-8">
              <CategoryChips categories={categories} active={filters.category} q={filters.q} />
            </div>
          </Container>
        </Section>

        {featured ? (
          <Section spacing="md">
            <Container>
              <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_26rem] lg:gap-20">
                <FeaturedPost post={featured} />
                <LatestList posts={latest} />
              </div>
            </Container>
          </Section>
        ) : null}

        <Section tone="muted" spacing="md">
          <Container>
            {gridPosts.length > 0 ? (
              <div className="flex flex-col gap-12">
                {!featured ? (
                  <h2 className="font-display text-2xl font-bold text-ink">
                    {hasActiveFilter(filters)
                      ? `Resultados${filters.q ? ` para "${filters.q}"` : ""}`
                      : "Guías por tema"}
                  </h2>
                ) : (
                  <h2 className="font-display text-[1.875rem] leading-tight font-bold text-ink md:text-[2.375rem]">
                    Guías por tema
                  </h2>
                )}

                <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <li key={post.id}>
                      <PostCard post={post} />
                    </li>
                  ))}
                </ul>

                <BlogPagination page={filters.page} totalPages={totalPages} filters={filters} />
              </div>
            ) : (
              <div className="rounded-card bg-surface p-10 text-center">
                <p className="text-ink/70">
                  {hasActiveFilter(filters)
                    ? "No encontramos notas con ese filtro."
                    : "Todavía no publicamos artículos. Volvé pronto."}
                </p>
                {hasActiveFilter(filters) ? (
                  <a
                    href={blogHref({})}
                    className="mt-4 inline-block text-sm font-semibold text-brand-hover hover:text-brand"
                  >
                    Ver todas las notas
                  </a>
                ) : null}
              </div>
            )}
          </Container>
        </Section>
      </PageShell>

      <ClosingCtaSection />

      <JsonLd schema={schema} />
    </>
  );
}
