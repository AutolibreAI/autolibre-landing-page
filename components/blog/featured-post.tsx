import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { PostCover } from "@/components/blog/post-cover";
import { Icon } from "@/components/ui/icon";
import { blogContent } from "@/lib/content/blog";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type FeaturedPostProps = {
  readonly post: BlogPostSummary;
};

/**
 * Nota destacada del listado (la más reciente sin filtrar). Su portada es la
 * imagen LCP de `/blog`: por eso es la única del sitio del blog con `preload`.
 *
 * La portada es horizontal (la misma proporción que sube Hygraph): meterla en
 * un marco de teléfono vertical la recortaba. Sin imagen, la ficha con el
 * ícono de la categoría.
 */
export function FeaturedPost({ post }: FeaturedPostProps) {
  const date = formatPostDate(post.date);

  return (
    <article>
      <Link href={postPath(post)} className="group flex flex-col gap-6">
        <div className="relative">
          <PostCover
            post={post}
            sizes="(min-width: 1024px) 60vw, 100vw"
            preload
            iconSize="lg"
            className="aspect-video rounded-panel"
          />
          <p className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-label font-semibold text-brand-hover md:top-6 md:left-6">
            <Icon name="check" size={16} />
            {blogContent.featured.badge}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-label font-semibold text-brand-hover">{post.category.name}</p>
          <h3 className="max-w-180 text-3xl leading-tight text-ink transition-colors group-hover:text-brand-hover md:text-4xl">
            {post.title}
          </h3>
          {post.excerpt ? (
            <p className="max-w-170 text-lead leading-relaxed text-ink/70 md:text-lead-lg">
              {post.excerpt}
            </p>
          ) : null}
          <p className="text-label text-ink/60">
            {post.authorName}
            {date ? (
              <>
                {" · "}
                <time dateTime={post.updatedAt || post.date}>
                  {post.updatedAt
                    ? blogContent.article.updated(formatPostDate(post.updatedAt))
                    : date}
                </time>
              </>
            ) : null}
          </p>
        </div>
      </Link>
    </article>
  );
}
