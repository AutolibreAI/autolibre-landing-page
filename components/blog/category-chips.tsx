import Link from "next/link";
import { cn } from "@/lib/utils";
import { blogHref } from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import type { BlogCategory } from "@/lib/hygraph/posts";

type CategoryChipsProps = {
  readonly categories: readonly BlogCategory[];
  /** Slug de la categoría activa, o `""` para "Todas". */
  readonly active: string;
};

const chip =
  "inline-flex h-11 items-center rounded-full border px-4.5 text-control whitespace-nowrap transition-colors motion-reduce:transition-none";
/** Elegido: `action` con texto blanco (14.88:1). */
const chipOn = "border-action bg-action font-semibold text-white";
/** En reposo: `card` con borde `control-line`, como los chips del módulo de pedido. */
const chipOff = "border-control-line bg-card font-medium text-fg hover:border-action";

/**
 * Temas del blog. Son links, no botones con estado de cliente: cada chip es
 * la URL de su categoría (`/blog/mantenimiento`), una página propia que
 * funciona sin JS, se comparte y se indexa. Cambiar de tema arranca una
 * lectura nueva, así que la búsqueda activa no viaja.
 *
 * En mobile la fila scrollea de costado (sangrada hasta el borde de la
 * pantalla); desde `lg` hace wrap dentro del contenedor.
 */
export function CategoryChips({ categories, active }: CategoryChipsProps) {
  return (
    <nav
      aria-label={blogContent.chips.label}
      className="-mx-[6%] overflow-x-auto px-[6%] pb-1 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex w-max gap-2.5 lg:w-auto lg:flex-wrap">
        <li>
          <Link
            href={blogHref({})}
            aria-current={active === "" ? "page" : undefined}
            className={cn(chip, active === "" ? chipOn : chipOff)}
          >
            {blogContent.chips.all}
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={blogHref({ category: category.slug })}
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
