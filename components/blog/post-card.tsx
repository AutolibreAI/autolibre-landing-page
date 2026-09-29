import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { PostCover } from "@/components/blog/post-cover";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type PostCardProps = {
  readonly post: BlogPostSummary;
  /**
   * Nivel del título. La card no decide su lugar en el outline: bajo un
   * `h2` de sección ("Guías por tema", "Seguí leyendo") es un `h3`.
   */
  readonly headingLevel?: "h2" | "h3";
};

/**
 * Card de la grilla: portada, categoría y fecha, título y bajada. Sin borde
 * ni sombra (el diseño es plano): la separación la dan la portada y el aire.
 * Todo el bloque es un solo link, pero su texto accesible es el título.
 */
export function PostCard({ post, headingLevel: Heading = "h3" }: PostCardProps) {
  const date = formatPostDate(post.date);

  return (
    <article className="h-full">
      <Link href={postPath(post)} className="group flex h-full flex-col gap-4">
        <PostCover
          post={post}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="aspect-video"
        />

        <p className="text-label font-semibold text-brand-hover">
          {post.category.name}
          {date ? (
            <span className="font-normal text-ink/60">
              {" · "}
              <time dateTime={post.date}>{date}</time>
            </span>
          ) : null}
        </p>

        <Heading className="text-xl leading-snug text-ink transition-colors group-hover:text-brand-hover md:text-2xl">
          {post.title}
        </Heading>

        {post.excerpt ? (
          <p className="line-clamp-3 text-base leading-relaxed text-ink/70">{post.excerpt}</p>
        ) : null}
      </Link>
    </article>
  );
}
