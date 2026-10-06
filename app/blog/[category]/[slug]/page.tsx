import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArticleAppCta } from "@/components/blog/article-app-cta";
import { ArticleTocDesktop, ArticleTocMobile } from "@/components/blog/article-toc";
import { authorInitials } from "@/components/blog/author-initials";
import { Breadcrumbs } from "@/components/blog/breadcrumbs";
import { formatPostDate } from "@/components/blog/format-date";
import { MobileDownloadBar } from "@/components/blog/mobile-download-bar";
import { PostCard } from "@/components/blog/post-card";
import { RichText } from "@/components/blog/rich-text";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { extractFaq } from "@/lib/blog/faq";
import { categoryPath } from "@/lib/blog/query";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { blogContent } from "@/lib/content/blog";
import {
  getPostBySlug,
  getPosts,
  postModifiedDate,
  postPath,
  relatedPosts,
  type BlogPost,
} from "@/lib/hygraph/posts";
import { extractToc, estimateReadingMinutes } from "@/lib/hygraph/toc";
import { siteConfig } from "@/lib/seo/config";
import { createMetadata } from "@/lib/seo/metadata";
import {
  blogPostingSchema,
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

/** Otros posts para "Seguí leyendo" y el bloque "Del mismo tema" del sidebar. */
const RELATED_COUNT = 3;

/**
 * La portada ocupa la columna del cuerpo (`max-w-180` = 720px) desde `md`;
 * debajo, el ancho de la pantalla.
 */
const COVER_SIZES = "(min-width: 768px) 720px, 100vw";

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

/**
 * Meta description de la nota: la de `seo` si el editor la cargó, si no la
 * bajada. La misma va a la metadata y al JSON-LD para que coincidan.
 */
function postDescription(post: BlogPost): string {
  return post.seo.description || post.excerpt || siteConfig.description;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const post = await getPostForRoute(category, slug);

  if (!post) return { title: "Artículo no encontrado", robots: { index: false } };

  const modifiedTime = postModifiedDate(post);

  // El meta title es para Google (~60 caracteres) y puede diferir del
  // título de la nota, que sigue siendo el `h1`.
  return createMetadata({
    title: post.seo.title || post.title,
    description: postDescription(post),
    path: postPath(post),
    index: BLOG_PUBLIC,
    article: {
      publishedTime: post.date,
      ...(modifiedTime ? { modifiedTime } : {}),
      authors: [post.authorName],
    },
    image: post.coverImage
      ? {
          url: post.coverImage.url,
          width: post.coverImage.width ?? 1200,
          height: post.coverImage.height ?? 630,
          alt: post.coverAlt || post.title,
        }
      : undefined,
  });
}

export default async function PostPage({ params }: PageProps) {
  const { category, slug } = await params;
  const [post, allPosts] = await Promise.all([getPostForRoute(category, slug), getPosts()]);

  if (!post) notFound();

  const { article: copy } = blogContent;
  const path = postPath(post);
  const description = postDescription(post);
  const toc = extractToc(post.content);
  const readingMinutes = estimateReadingMinutes(post.content);
  const related = relatedPosts(allPosts, post, RELATED_COUNT);
  // `relatedPosts` completa con otras categorías; "Del mismo tema" no.
  const sameTopic = related
    .filter((item) => item.category.slug === post.category.slug)
    .slice(0, 2);

  // "Actualizado el" solo si hubo una edición posterior al día de
  // publicación; si no, "Publicado el". La fecha que se ve es la del schema.
  const shownDate = post.updatedAt || post.date;
  const dateLabel = shownDate
    ? (post.updatedAt ? copy.updated : copy.published)(formatPostDate(shownDate))
    : "";
  const reviewedLabel = post.reviewedAt ? copy.reviewed(formatPostDate(post.reviewedAt)) : "";

  // Preguntas frecuentes del cuerpo (un `h2` "Preguntas frecuentes" con sus
  // `h3`): el JSON-LD sale de lo mismo que se ve, como exige Google.
  const faq = extractFaq(post.content, copy.faqHeading);

  const trail = [
    { name: blogContent.breadcrumb.home, path: "/" },
    { name: blogContent.breadcrumb.blog, path: "/blog" },
    { name: post.category.name, path: categoryPath(post.category.slug) },
  ];

  const schema = graph(
    organizationSchema(),
    webPageSchema({
      name: post.title,
      description,
      path,
      lastReviewed: post.reviewedAt || undefined,
    }),
    blogPostingSchema({
      title: post.title,
      description,
      path,
      datePublished: post.date,
      dateModified: postModifiedDate(post),
      authorName: post.authorName,
      imageUrl: post.coverImage?.url,
      keywords: post.tags.map((tag) => tag.name),
    }),
    breadcrumbSchema([...trail, { name: post.title, path }]),
    ...(faq.length > 0 ? [faqPageSchema(faq)] : []),
  );

  return (
    <>
      <PageShell currentPath="/blog">
        <article>
          {/* Encabezado a todo el ancho del contenedor, cerrado por una
              línea: el título manda y el índice arranca recién con el cuerpo. */}
          <header>
            <Container size="wide">
              <div className="flex flex-col gap-5 border-b border-line pt-10 pb-10 md:pt-14 md:pb-12">
                <Breadcrumbs items={trail} endsAtCurrent={false} />

                <Link
                  href={categoryPath(post.category.slug)}
                  className="inline-flex min-h-8 w-fit items-center rounded-full bg-surface-muted px-3.5 text-label font-semibold text-brand-hover hover:text-ink"
                >
                  {post.category.name}
                </Link>

                {/* Line-height propio y no el del token display (1.05): es un
                    título de 2-3 líneas en mobile, más largo que un eslogan. */}
                <h1 className="max-w-220 text-4xl leading-[1.1] text-ink md:text-5xl lg:text-display-md lg:leading-[1.05]">
                  {post.title}
                </h1>

                {post.excerpt ? (
                  <p className="max-w-190 text-lead-lg leading-relaxed text-ink/70 md:text-xl">
                    {post.excerpt}
                  </p>
                ) : null}

                <div className="flex flex-wrap items-center gap-x-7 gap-y-3 pt-2">
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-bold text-white"
                    >
                      {authorInitials(post.authorName)}
                    </span>
                    <p className="text-[0.9375rem] font-semibold text-ink">
                      {copy.byline(post.authorName)}
                    </p>
                  </div>
                  {dateLabel ? (
                    <p className="text-sm text-ink/60">
                      <time dateTime={shownDate}>{dateLabel}</time>
                    </p>
                  ) : null}
                  {reviewedLabel ? (
                    <p className="text-sm text-ink/60">
                      <time dateTime={post.reviewedAt}>{reviewedLabel}</time>
                    </p>
                  ) : null}
                  <p className="flex items-center gap-1.5 text-sm text-ink/60">
                    <Icon name="clock" size={16} />
                    {copy.readingTime(readingMinutes)}
                  </p>
                </div>
              </div>
            </Container>
          </header>

          <Container size="wide">
            <div className="grid gap-12 pt-10 pb-16 md:pt-14 md:pb-24 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-12 xl:gap-24">
              <div className="flex max-w-180 min-w-0 flex-col">
                {/* Portada arriba del cuerpo, al ancho de la columna y en
                    16:9 (el marco reserva el alto: sin CLS). `eager` y no
                    `preload`: en desktop es la LCP, pero en mobile queda
                    debajo del pliegue y la LCP es el `h1`, y un `preload`
                    en el <head> competiría con las fuentes del título. La
                    doc de `next/image` y AGENTS.md piden `eager` para una
                    LCP que cambia según el viewport. */}
                {post.coverImage ? (
                  <div className="relative mb-8 aspect-video overflow-clip rounded-card bg-surface-muted lg:mb-10">
                    <Image
                      src={post.coverImage.url}
                      alt={post.coverAlt}
                      fill
                      sizes={COVER_SIZES}
                      loading="eager"
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="lg:hidden">
                  <ArticleTocMobile items={toc} />
                </div>

                {/* El primer bloque del cuerpo no suma margen arriba: el aire
                    ya lo da el contenedor. */}
                <div className=":first:mt-0 max-lg:mt-8">
                  <RichText content={post.content} references={post.references} />
                </div>

                {/* Tags como texto, sin link: todavía no hay páginas de tag. */}
                {post.tags.length > 0 ? (
                  <ul aria-label={copy.tags} className="mt-10 flex flex-wrap gap-2.5">
                    {post.tags.map((tag) => (
                      <li
                        key={tag.slug}
                        className="inline-flex min-h-9 items-center rounded-full border border-line bg-surface-subtle px-4 text-sm font-medium text-ink"
                      >
                        {tag.name}
                      </li>
                    ))}
                  </ul>
                ) : null}

                <ArticleAppCta />
              </div>

              <aside className="hidden flex-col gap-10 lg:sticky lg:top-24 lg:flex lg:w-64 xl:w-75">
                <ArticleTocDesktop items={toc} />

                {sameTopic.length > 0 ? (
                  <div className="flex flex-col gap-3 border-t border-line pt-6">
                    <p className="text-label font-semibold text-ink">{copy.sameTopic}</p>
                    {sameTopic.map((item) => (
                      <Link
                        key={item.id}
                        href={postPath(item)}
                        className="text-[0.9375rem] leading-snug font-medium text-brand-hover hover:text-brand"
                      >
                        {item.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </aside>
            </div>
          </Container>
        </article>

        {related.length > 0 ? (
          <Section tone="subtle" spacing="md" aria-labelledby="relacionadas">
            <h2 id="relacionadas" className="text-3xl leading-tight text-ink md:text-4xl">
              {copy.related}
            </h2>
            <ul className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <li key={item.id}>
                  <PostCard post={item} />
                </li>
              ))}
            </ul>
          </Section>
        ) : null}
      </PageShell>

      {/* Reserva el alto de la barra fija de mobile DESPUÉS del footer: así
          el final de la página (footer incluido) no queda tapado por ella. */}
      <div aria-hidden="true" className="h-24 lg:hidden" />
      <MobileDownloadBar />

      <JsonLd schema={schema} />
    </>
  );
}
