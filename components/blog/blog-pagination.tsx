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
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-field border border-line px-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-brand-soft";

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
              className={cn(pageLink, "px-4")}
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
              className={cn(pageLink, n === page && "border-ink bg-ink text-white hover:border-ink")}
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
              className={cn(pageLink, "px-4")}
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
