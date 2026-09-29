import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogHref, type BlogFilters } from "@/lib/blog/query";
import { Icon } from "@/components/ui/icon";

type BlogPaginationProps = {
  readonly page: number;
  readonly totalPages: number;
  readonly filters: Pick<BlogFilters, "q" | "category">;
};

const pageLink =
  "inline-flex min-h-11 min-w-11 items-center justify-center rounded-field border border-line px-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-brand-soft";

export function BlogPagination({ page, totalPages, filters }: BlogPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Paginación" className="flex justify-center">
      <ul className="flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((n) => (
          <li key={n}>
            <Link
              href={blogHref({ ...filters, page: n })}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                pageLink,
                n === page && "border-ink bg-ink text-white hover:border-ink",
              )}
            >
              {n}
            </Link>
          </li>
        ))}
        {page < totalPages ? (
          <li>
            <Link
              href={blogHref({ ...filters, page: page + 1 })}
              className={cn(pageLink, "gap-1.5 px-4")}
            >
              Siguiente
              <Icon name="arrow-right" size={16} />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
