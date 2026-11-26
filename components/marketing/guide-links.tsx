import Link from "next/link";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";
import { cn } from "@/lib/utils";

/**
 * Lista de notas del blog como filas de texto con flecha (≥ 44px de alto).
 * La usan "Más guías" del Home y "Guías que te pueden servir" de `/pedido`.
 */
export function GuideLinks({
  posts,
  arrow = true,
  className,
  itemClassName,
}: {
  readonly posts: readonly BlogPostSummary[];
  readonly arrow?: boolean;
  readonly className?: string;
  readonly itemClassName?: string;
}) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {posts.map((post) => (
        <li key={post.id} className="border-b border-card-line last:border-b-0">
          <Link
            href={postPath(post)}
            className={cn(
              "flex min-h-11 items-center justify-between gap-4 py-2.5 font-medium text-fg transition-colors hover:text-brand-hover motion-reduce:transition-none",
              itemClassName,
            )}
          >
            {post.title}
            {arrow ? <span aria-hidden="true">→</span> : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
