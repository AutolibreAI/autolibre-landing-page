import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogHref } from "@/lib/blog/query";
import type { BlogCategory } from "@/lib/hygraph/posts";

type CategoryChipsProps = {
  readonly categories: readonly BlogCategory[];
  /** Slug de la categoría activa, o `""` para "Todas". */
  readonly active: string;
  /** Búsqueda activa: se preserva al cambiar de categoría. */
  readonly q: string;
};

const chip =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap transition-colors";
const chipOn = "border-ink bg-ink text-white";
const chipOff = "border-line bg-surface-subtle text-ink hover:border-brand-soft";

/**
 * Filtro de categorías del listado. Son links, no botones con estado de
 * cliente: cada chip es una URL (`/blog?category=...`) que funciona sin JS,
 * se puede compartir y respeta el botón "atrás" del navegador.
 */
export function CategoryChips({ categories, active, q }: CategoryChipsProps) {
  return (
    <nav
      aria-label="Temas del blog"
      className="-mx-[6%] overflow-x-auto px-[6%] pb-1 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex w-max gap-2.5 lg:w-auto lg:flex-wrap">
        <li>
          <Link
            href={blogHref({ q })}
            aria-current={active === "" ? "page" : undefined}
            className={cn(chip, active === "" ? chipOn : chipOff)}
          >
            Todas
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={blogHref({ category: category.slug, q })}
              aria-current={active === category.slug ? "page" : undefined}
              className={cn(chip, active === category.slug ? chipOn : chipOff)}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
