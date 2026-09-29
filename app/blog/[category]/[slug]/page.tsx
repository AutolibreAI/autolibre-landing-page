import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticleTocDesktop, ArticleTocMobile } from "@/components/blog/article-toc";
import { authorInitials } from "@/components/blog/author-initials";
import { formatPostDate } from "@/components/blog/format-date";
import { MobileDownloadBar } from "@/components/blog/mobile-download-bar";
import { PostCard } from "@/components/blog/post-card";
import { RichText } from "@/components/blog/rich-text";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import {
  getPostBySlug,
  getPosts,
  postPath,
  relatedPosts,
} from "@/lib/hygraph/posts";
import { extractToc, estimateReadingMinutes } from "@/lib/hygraph/toc";
import { siteConfig } from "@/lib/seo/config";
import { createMetadata } from "@/lib/seo/metadata";
import {
  blogPostingSchema,
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

/** Otros posts para "Seguí leyendo" y el bloque "Del mismo tema" del sidebar. */
const RELATED_COUNT = 3;

type PageProps = {
  readonly params: Promise<{ category: string; slug: string }>;
};

/**
 * Prerenderiza los posts existentes al buildear. Los que se publiquen después
 * se generan en el primer request (`dynamicParams` es `true` por defecto) y
 * quedan cacheados, así que publicar no exige un deploy.
 */
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((post) => ({ category: post.category.slug, slug: post.slug }));
}

/**
 * El slug es único en todo el modelo `Post` (no por categoría), así que se
 * busca solo por `slug` y se valida el segmento `category` de la URL contra
 * el que realmente tiene el post. Si no coinciden —link viejo tras mover un
 * post de categoría, o alguien arma la URL a mano—, 404: la categoría es
 * parte de la identidad pública de la página, no un adorno.
 */
async function getPostForRoute(category: string, slug: string) {
  const post = await getPostBySlug(slug);
  return post && post.category.slug === category ? post : null;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPostForRoute(category, slug);

  if (!post) return { title: "Artículo no encontrado", robots: { index: false } };

  return createMetadata({
    title: post.title,
    description: post.excerpt || siteConfig.description,
    path: postPath(post),
    index: BLOG_PUBLIC,
    article: { publishedTime: post.date, authors: [post.authorName] },
    image: post.coverImage
      ? {
          url: post.coverImage.url,
          width: post.coverImage.width ?? 1200,
          height: post.coverImage.height ?? 630,
          alt: post.title,
        }
      : undefined,
  });
}

export default async function PostPage({ params }: PageProps) {
  const { category, slug } = await params;
  const [post, allPosts] = await Promise.all([
    getPostForRoute(category, slug),
    getPosts(),
  ]);

  if (!post) notFound();

  const path = postPath(post);
  const description = post.excerpt || siteConfig.description;
  const date = formatPostDate(post.date);
  const toc = extractToc(post.content);
  const readingMinutes = estimateReadingMinutes(post.content);
  const related = relatedPosts(allPosts, post, RELATED_COUNT);

  const schema = graph(
    organizationSchema(),
    webPageSchema({ name: post.title, description, path }),
    blogPostingSchema({
      title: post.title,
      description,
      path,
      datePublished: post.date,
      authorName: post.authorName,
      imageUrl: post.coverImage?.url,
    }),
    breadcrumbSchema([
      { name: "Inicio", path: "/" },
      { name: "Blog", path: "/blog" },
      { name: post.category.name, path: `/blog/${post.category.slug}` },
      { name: post.title, path },
    ]),
  );

  return (
    <>
      <PageShell secondary={{ label: "Soy dueño de auto", href: "/" }} currentPath="/blog">
        {/* `pb-24` reserva el lugar de la barra de descarga fija en mobile. */}
        <article className="pb-24 lg:pb-0">
          {/*
            Título y cuerpo comparten el mismo contenedor y el mismo `max-w`
            SIN `mx-auto` en la columna de texto a propósito: si el cuerpo se
            centra dentro de la columna `1fr` (que en desktop es más ancha
            que 720px por el sidebar) y el título se centra en el ancho
            completo del viewport, los dos quedan centrados en ejes distintos
            y el texto no alinea con el título. Un solo contenedor con una
            sola columna de texto pegada a la izquierda evita el problema de
            raíz en vez de forzarlos a coincidir con retoques de margen.
          */}
          <Container
            size="content"
            className="grid gap-14 pt-10 pb-8 md:pt-14 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start lg:gap-20"
          >
            <div className="flex max-w-[720px] flex-col gap-8">
              <div className="flex flex-col gap-5">
                <nav aria-label="Migas de pan">
                  <ol className="flex items-center gap-2 text-sm text-ink/50">
                    <li>
                      <Link href="/" className="hover:text-ink">
                        Inicio
                      </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link href="/blog" className="hover:text-ink">
                        Blog
                      </Link>
                    </li>
                    <li aria-hidden="true">/</li>
                    <li>
                      <Link href={`/blog?category=${post.category.slug}`} className="hover:text-ink">
                        {post.category.name}
                      </Link>
                    </li>
                  </ol>
                </nav>

                <p className="inline-flex w-fit items-center rounded-full bg-surface-muted px-3.5 py-1.5 text-[0.8125rem] font-semibold text-brand-hover">
                  {post.category.name}
                </p>

                <h1 className="font-display text-[2rem] leading-[1.1] font-bold text-ink md:text-[2.875rem]">
                  {post.title}
                </h1>

                {post.excerpt ? (
                  <p className="text-lg leading-relaxed text-ink/70 md:text-xl">
                    {post.excerpt}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white"
                    >
                      {authorInitials(post.authorName)}
                    </span>
                    <p className="text-sm font-semibold text-ink">{post.authorName}</p>
                  </div>
                  {date ? (
                    <p className="text-sm text-ink/50">
                      <time dateTime={post.date}>{date}</time>
                    </p>
                  ) : null}
                  <p className="flex items-center gap-1.5 text-sm text-ink/50">
                    <Icon name="clock" size={16} />
                    {readingMinutes} min de lectura
                  </p>
                </div>
              </div>

              <div className="lg:hidden">
                <ArticleTocMobile items={toc} />
              </div>

              <RichText content={post.content} references={post.references} />
            </div>

            <aside className="hidden flex-col gap-10 lg:sticky lg:top-24 lg:flex">
              <ArticleTocDesktop items={toc} />

              {related.length > 0 ? (
                <div className="flex flex-col gap-3 border-t border-line pt-6">
                  <p className="text-[0.8125rem] font-semibold text-ink">Del mismo tema</p>
                  {related.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={postPath(item)}
                      className="text-sm leading-snug font-medium text-ink/80 hover:text-brand-hover"
                    >
                      {item.title}
                    </Link>
                  ))}
                </div>
              ) : null}
            </aside>
          </Container>
        </article>

        {related.length > 0 ? (
          <Section tone="muted" spacing="md">
            <Container>
              <h2 className="font-display text-[1.75rem] leading-tight font-bold text-ink md:text-[2rem]">
                Seguí leyendo
              </h2>
              <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {related.map((item) => (
                  <li key={item.id}>
                    <PostCard post={item} />
                  </li>
                ))}
              </ul>
            </Container>
          </Section>
        ) : null}
      </PageShell>

      <MobileDownloadBar />

      <JsonLd schema={schema} />
    </>
  );
}
