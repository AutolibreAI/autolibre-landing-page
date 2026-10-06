import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { BlogListingHeader } from "@/components/blog/blog-listing-header";
import { FeaturedPost } from "@/components/blog/featured-post";
import { LatestList } from "@/components/blog/latest-list";
import { PostGridSection } from "@/components/blog/post-grid-section";
import { ClosingCtaSection } from "@/components/sections/home/closing-cta";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import {
  PAGE_SIZE,
  blogHref,
  filterPosts,
  hasActiveFilter,
  paginate,
  parseBlogFilters,
  type BlogFilters,
} from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import { collectCategories, getPosts } from "@/lib/hygraph/posts";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, heading: HEADING, eyebrow: EYEBROW } = blogContent.index;
const DESCRIPTION = blogContent.index.description;
const PATH = "/blog";
/** Notas mostradas en la columna lateral junto a la destacada. */
const LATEST_COUNT = 4;
const GRID_ID = "guias";

type PageProps = {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Cada página del listado es su propia URL canónica (`/blog?page=2` no
 * apunta a `/blog`: tiene otras notas). Una búsqueda (`?q=`) no se indexa:
 * son infinitas combinaciones de texto, contenido duplicado del listado.
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, page } = parseBlogFilters(await searchParams);

  return createMetadata({
    title: TITLE,
    description: DESCRIPTION,
    path: blogHref({ page }),
    index: BLOG_PUBLIC && q === "",
  });
}

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH, type: "CollectionPage" }),
  breadcrumbSchema([
    { name: blogContent.breadcrumb.home, path: "/" },
    { name: blogContent.breadcrumb.blog, path: PATH },
  ]),
);

/**
 * El listado se lee en el servidor: el fetch a Hygraph lleva `revalidate` y
 * el tag `hygraph` (invalidado on-demand por `/api/revalidate` al publicar).
 * Búsqueda y paginación se resuelven acá mismo, en memoria, sobre esa misma
 * lista: con el volumen de un blog de marketing (decenas de posts, no miles)
 * es más simple y no le pega a Hygraph una vez por búsqueda.
 */
export default async function BlogPage({ searchParams }: PageProps) {
  const filters = parseBlogFilters(await searchParams);

  // `/blog?category=x` es la URL vieja de una categoría: hoy cada una es su
  // propia página (`/blog/x`). 308 para que links y señales pasen a la nueva.
  if (filters.category) permanentRedirect(blogHref(filters));

  const allPosts = await getPosts();
  const categories = collectCategories(allPosts);
  const filtered = filterPosts(allPosts, filters);

  // La nota destacada y "Últimas notas" solo tienen sentido en la primera
  // página del listado completo: buscando, el resultado es una grilla lisa
  // (separar "la más nueva" la sacaría de los resultados).
  const showSpotlight = !hasActiveFilter(filters) && filters.page === 1;
  const featured = showSpotlight ? (filtered[0] ?? null) : null;
  const rest = showSpotlight ? filtered.slice(1) : filtered;
  const latest = showSpotlight ? rest.slice(0, LATEST_COUNT) : [];
  const gridSource = showSpotlight ? rest.slice(LATEST_COUNT) : filtered;
  const { items: gridPosts, page, totalPages } = paginate(gridSource, filters.page, PAGE_SIZE);

  // Una página fuera de rango es 404 y no la última página con otro número:
  // si no, `?page=99` sería una URL indexable duplicada (y hay infinitas).
  if (filters.page > totalPages) notFound();

  const isSearch = hasActiveFilter(filters);
  const gridFilters: Pick<BlogFilters, "q" | "category"> = { q: filters.q, category: "" };

  return (
    <>
      <PageShell currentPath={PATH}>
        <BlogListingHeader
          eyebrow={EYEBROW}
          heading={HEADING}
          description={DESCRIPTION}
          categories={categories}
          activeCategory=""
          q={filters.q}
        />

        {featured ? (
          <Section spacing="md" aria-labelledby="destacada">
            <h2 id="destacada" className="sr-only">
              {blogContent.featured.srHeading}
            </h2>
            <div className="grid gap-16 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-12 xl:gap-20">
              <FeaturedPost post={featured} />
              <div className="lg:w-90 xl:w-105">
                <LatestList posts={latest} seeAllHref={`#${GRID_ID}`} />
              </div>
            </div>
          </Section>
        ) : null}

        {/* Sin notas para la grilla y sin búsqueda, la sección no va: con una
            destacada arriba, un "todavía no hay notas" la contradiría. */}
        {gridPosts.length > 0 || isSearch ? (
          <PostGridSection
            id={GRID_ID}
            heading={isSearch ? blogContent.grid.results(filters.q) : blogContent.grid.heading}
            subtitle={isSearch ? undefined : blogContent.grid.subtitle}
            posts={gridPosts}
            page={page}
            totalPages={totalPages}
            filters={gridFilters}
            emptyFiltered={isSearch && gridPosts.length === 0}
          />
        ) : null}

        {!featured && !isSearch && gridPosts.length === 0 ? (
          <Section spacing="md">
            <p className="rounded-card bg-surface-subtle p-10 text-center text-ink/70">
              {blogContent.grid.emptyAll}
            </p>
          </Section>
        ) : null}

        <ClosingCtaSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
