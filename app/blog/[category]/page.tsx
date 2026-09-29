import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogListingHeader } from "@/components/blog/blog-listing-header";
import { PostGridSection } from "@/components/blog/post-grid-section";
import { ClosingCtaSection } from "@/components/sections/home/closing-cta";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
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
import { collectCategories, getPosts, type BlogCategory } from "@/lib/hygraph/posts";
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
 * de una página sin contenido.
 */
async function getCategory(slug: string): Promise<BlogCategory | null> {
  const categories = collectCategories(await getPosts());
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function generateStaticParams() {
  return collectCategories(await getPosts()).map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ category: slug }, rawSearch] = await Promise.all([params, searchParams]);
  const category = await getCategory(slug);
  if (!category) return { title: "Categoría no encontrada", robots: { index: false } };

  const { q, page } = parseBlogFilters(rawSearch);

  return createMetadata({
    title: blogContent.category.heading(category.name),
    description: blogContent.category.description(category.name),
    path: blogHref({ category: category.slug, page }),
    index: BLOG_PUBLIC && q === "",
  });
}

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const [{ category: slug }, rawSearch] = await Promise.all([params, searchParams]);
  const allPosts = await getPosts();
  const categories = collectCategories(allPosts);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  // La categoría sale del path; un `?category=` suelto en la URL se ignora.
  const filters = { ...parseBlogFilters(rawSearch), category: category.slug };
  const filtered = filterPosts(allPosts, filters);
  const { items, page, totalPages } = paginate(filtered, filters.page, PAGE_SIZE);

  const heading = blogContent.category.heading(category.name);
  const description = blogContent.category.description(category.name);
  const path = categoryPath(category.slug);
  const trail = [
    { name: blogContent.breadcrumb.home, path: "/" },
    { name: blogContent.breadcrumb.blog, path: "/blog" },
    { name: category.name, path },
  ];

  const schema = graph(
    organizationSchema(),
    webPageSchema({ name: heading, description, path, type: "CollectionPage" }),
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

        <ClosingCtaSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
