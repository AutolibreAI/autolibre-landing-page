import Image from "next/image";
import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { Icon } from "@/components/ui/icon";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type FeaturedPostProps = {
  readonly post: BlogPostSummary;
};

/**
 * Nota destacada del listado (siempre la más reciente sin filtrar): la
 * portada va en un marco tipo teléfono cuando hay imagen, el mismo lenguaje
 * visual que el resto del sitio usa para mostrar pantallas de la app —
 * refuerza que el blog es de AutoLibre sin copiar el componente
 * `PhoneFrame` (ese es específico para capturas simuladas de la app).
 */
export function FeaturedPost({ post }: FeaturedPostProps) {
  const date = formatPostDate(post.date);

  return (
    <article>
      <Link href={postPath(post)} className="group flex flex-col gap-6">
        <div className="relative flex h-[260px] items-center justify-center overflow-clip rounded-panel bg-surface-muted sm:h-[340px] lg:h-[420px]">
          <div className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full bg-surface px-3.5 py-1.5 text-[0.8125rem] font-semibold text-brand-hover">
            <Icon name="check" size={16} />
            Guía esencial
          </div>

          {post.coverImage ? (
            <div className="mt-14 aspect-[9/16] w-[180px] overflow-clip rounded-[2.5rem] border-[7px] border-ink bg-ink shadow-[0_24px_48px_-24px_rgba(28,43,28,0.45)] sm:w-[220px] lg:mt-0 lg:w-[280px]">
              <Image
                src={post.coverImage.url}
                alt=""
                width={post.coverImage.width ?? 560}
                height={post.coverImage.height ?? 1000}
                sizes="280px"
                priority
                className="h-full w-full object-cover"
              />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-[0.8125rem] font-semibold text-brand-hover">
            {post.category.name}
            {date ? (
              <span className="font-normal text-ink/50"> · {date}</span>
            ) : null}
          </p>
          <h2 className="font-display text-[1.75rem] leading-[1.15] font-bold text-ink group-hover:text-brand-hover md:text-[2.25rem]">
            {post.title}
          </h2>
          {post.excerpt ? (
            <p className="max-w-[42rem] text-[1.0625rem] leading-relaxed text-ink/70">
              {post.excerpt}
            </p>
          ) : null}
          <p className="text-[0.8125rem] text-ink/50">
            {post.authorName}
            {date ? ` · Actualizado el ${date}` : ""}
          </p>
        </div>
      </Link>
    </article>
  );
}
