import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListingHeader } from "@/components/blog/blog-listing-header";
import { PostGridSection } from "@/components/blog/post-grid-section";
import { RichText } from "@/components/blog/rich-text";
import { ClosingCtaSection } from "@/components/sections/home/closing-cta";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Section } from "@/components/ui/section";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import {
  PAGE_SIZE,
  blogHref,
  categoryPath,
  filterPosts,
  paginate,
  parseBlogFilters,
} from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import { getCategoryBySlug, type BlogCategoryDetail } from "@/lib/hygraph/categories";
import { collectCategories, getPosts, type BlogPostSummary } from "@/lib/hygraph/posts";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

type PageProps = {
  readonly params: Promise<{ category: string }>;
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Página de una categoría (`/blog/mantenimiento`): el hub de un tema. Junta
 * todas sus notas en una URL propia, indexable y con título propio — es la
 * página que puede rankear para "guías de mantenimiento del auto", y la que
 * el breadcrumb de cada nota declara como su padre.
 *
 * Una categoría existe si tiene al menos un post publicado (ver
 * `collectCategories`): una categoría vacía creada en Hygraph da 404 en vez
 * de una página sin contenido. Recién validado eso se piden sus datos
 * propios (bajada, SEO, texto pilar). Si la categoría todavía no está
 * publicada en Hygraph (el post la referencia igual), esos datos faltan y
 * la página cae a las plantillas de `blogContent.category`: no es un 404.
 */
async function getCategory(
  slug: string,
  posts: readonly BlogPostSummary[],
): Promise<BlogCategoryDetail | null> {
  const category = collectCategories(posts).find((item) => item.slug === slug);
  if (!category) return null;

  return (
    (await getCategoryBySlug(slug)) ?? {
      ...category,
      description: "",
      seo: { title: "", description: "" },
      content: null,
    }
  );
}

/** Bajada visible y meta description: la de Hygraph, o la plantilla genérica. */
function categoryDescription(category: BlogCategoryDetail): string {
  return category.description || blogContent.category.description(category.name);
}

export async function generateStaticParams() {
  return collectCategories(await getPosts()).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ category: slug }, rawSearch] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug, await getPosts());
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };

  const { q, page } = parseBlogFilters(rawSearch);

  return createMetadata({
    title: category.seo.title || blogContent.category.heading(category.name),
    description: category.seo.description || categoryDescription(category),
    path: blogHref({ category: category.slug, page }),
    index: BLOG_PUBLIC && q === "",
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ category: slug }, rawSearch] = await Promise.all([params, searchParams]);
  const allPosts = await getPosts();
  const categories = collectCategories(allPosts);
  const category = await getCategory(slug, allPosts);
  if (!category) notFound();

  // La categoría sale del path; un `?category=` suelto en la URL se ignora.
  const filters = { ...parseBlogFilters(rawSearch), category: category.slug };
  const filtered = filterPosts(allPosts, filters);
  const { items, page, totalPages } = paginate(filtered, filters.page, PAGE_SIZE);

  // Fuera de rango, 404: `?page=99` no puede ser un duplicado indexable.
  if (filters.page > totalPages) notFound();

  const heading = blogContent.category.heading(category.name);
  const description = categoryDescription(category);
  // La meta description (y la del JSON-LD) prioriza la de `seo`; la bajada
  // visible no: es texto para el lector, no para Google.
  const metaDescription = category.seo.description || description;
  const path = categoryPath(category.slug);
  // El texto pilar va solo en la página 1 sin búsqueda: en `?page=2` o en
  // los resultados sería contenido duplicado.
  const pillar = page === 1 && filters.q === "" ? category.content : null;
  const trail = [
    { name: blogContent.breadcrumb.home, path: "/" },
    { name: blogContent.breadcrumb.blog, path: "/blog" },
    { name: category.name, path },
  ];

  const schema = graph(
    organizationSchema(),
    webPageSchema({
      name: heading,
      description: metaDescription,
      path,
      type: "CollectionPage",
    }),
    breadcrumbSchema(trail),
  );

  return (
    <>
      <PageShell secondary={{ label: "Soy dueño de auto", href: "/" }} currentPath="/blog">
        <BlogListingHeader
          heading={heading}
          description={description}
          breadcrumbs={trail}
          categories={categories}
          activeCategory={category.slug}
          q={filters.q}
        />

        <PostGridSection
          heading={
            filters.q ? blogContent.grid.results(filters.q) : blogContent.grid.headingInCategory
          }
          posts={items}
          page={page}
          totalPages={totalPages}
          filters={{ q: filters.q, category: category.slug }}
          emptyFiltered={items.length === 0}
        />

        {pillar ? (
          <Section spacing="md" aria-labelledby="guia-titulo">
            <div className="max-w-180">
              <h2 id="guia-titulo" className="text-3xl leading-tight text-ink md:text-4xl">
                {blogContent.category.pillarHeading(category.name)}
              </h2>
              {/* `nested`: los headings del editor bajan a `h3`+, colgados
                  de este `h2`. */}
              <div className="mt-8 [&>:first-child]:mt-0">
                <RichText content={pillar.raw} references={pillar.references} nested />
              </div>
            </div>
          </Section>
        ) : null}

        <ClosingCtaSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
