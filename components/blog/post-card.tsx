import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { Card } from "@/components/ui/card";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type PostCardProps = {
  readonly post: BlogPostSummary;
  /** `true` para la primera card visible: es candidata a LCP. */
  readonly priority?: boolean;
};

export function PostCard({ post, priority = false }: PostCardProps) {
  const date = formatPostDate(post.date);

  return (
    <Card
      as="article"
      className="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[0_20px_50px_rgba(28,43,28,0.10)]"
    >
      {post.coverImage ? (
        <Image
          src={post.coverImage.url}
          alt=""
          width={post.coverImage.width ?? 1200}
          height={post.coverImage.height ?? 630}
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="aspect-[1200/630] w-full object-cover"
        />
      ) : (
        <div aria-hidden className="aspect-[1200/630] w-full bg-surface-muted" />
      )}

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-2 text-[0.8125rem] font-semibold">
          <span className="text-brand">{post.category.name}</span>
          {date ? (
            <>
              <span aria-hidden className="text-ink/30">
                ·
              </span>
              <time dateTime={post.date} className="text-ink/50">
                {date}
              </time>
            </>
          ) : null}
        </div>

        <h2 className="mt-2 font-display text-[1.25rem] leading-snug font-bold text-ink">
          {/* El link cubre toda la card (::after) pero el texto accesible es solo el título. */}
          <Link
            href={postPath(post)}
            className="transition-colors after:absolute after:inset-0 group-hover:text-brand"
          >
            {post.title}
          </Link>
        </h2>

        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink/70">
            {post.excerpt}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
