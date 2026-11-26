import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogHref, type BlogFilters } from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import { Icon } from "@/components/ui/icon";

type BlogPaginationProps = {
  readonly page: number;
  readonly totalPages: number;
  readonly filters: Pick<BlogFilters, "q" | "category">;
};

const pageLink =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-control font-semibold text-fg transition-colors hover:bg-card motion-reduce:transition-none";
/** "Anterior" / "Siguiente": píldora con borde `action`. */
const stepLink = "border border-action px-4.5 font-display";

/**
 * Links numerados y no "cargar más": un crawler sigue un `<a href>`, no
 * aprieta un botón. Cada página es una URL propia (`?page=2`) con su canonical.
 */
export function BlogPagination({ page, totalPages, filters }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label={blogContent.pagination.label} className="flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <li>
            <Link
              href={blogHref({ ...filters, page: page - 1 })}
              rel="prev"
              className={cn(pageLink, stepLink)}
            >
              <Icon name="arrow-left" size={16} />
              {blogContent.pagination.previous}
            </Link>
          </li>
        ) : null}
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((n) => (
          <li key={n}>
            <Link
              href={blogHref({ ...filters, page: n })}
              aria-current={n === page ? "page" : undefined}
              className={cn(pageLink, n === page && "bg-action text-white hover:bg-action-hover")}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages ? (
          <li>
            <Link
              href={blogHref({ ...filters, page: page + 1 })}
              rel="next"
              className={cn(pageLink, stepLink)}
            >
              {blogContent.pagination.next}
              <Icon name="arrow-right" size={16} />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
