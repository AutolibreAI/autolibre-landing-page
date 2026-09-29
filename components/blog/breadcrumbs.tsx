import Link from "next/link";
import { blogContent } from "@/lib/content/blog";

export type Crumb = {
  readonly name: string;
  readonly path: string;
};

type BreadcrumbsProps = {
  /** Del inicio en adelante, en orden. */
  readonly items: readonly Crumb[];
  /**
   * `true` (default) si la última miga es la página actual: se muestra como
   * texto con `aria-current`. En la nota va `false`: las migas terminan en la
   * categoría (el título ya es el `h1` justo debajo) y todas son links.
   */
  readonly endsAtCurrent?: boolean;
};

/**
 * Migas de pan visibles. Salen de la misma lista que `breadcrumbSchema`, así
 * lo que ve el usuario y lo que lee Google no divergen.
 */
export function Breadcrumbs({ items, endsAtCurrent = true }: BreadcrumbsProps) {
  return (
    <nav aria-label={blogContent.breadcrumb.label}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink/60">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="flex items-center gap-2">
              {isLast && endsAtCurrent ? (
                <span aria-current="page" className="text-ink">
                  {item.name}
                </span>
              ) : (
                <>
                  <Link href={item.path} className="hover:text-ink">
                    {item.name}
                  </Link>
                  {isLast ? null : <span aria-hidden="true">/</span>}
                </>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
