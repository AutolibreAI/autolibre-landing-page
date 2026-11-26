import { Icon } from "@/components/ui/icon";
import { blogHref } from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";
import { cn } from "@/lib/utils";

type BlogSearchFormProps = {
  readonly defaultValue: string;
  /** Categoría de la página: la búsqueda se hace dentro de ella. */
  readonly category: string;
  readonly className?: string;
};

/**
 * Form GET nativo: sin JS, el buscador funciona igual (`/blog?q=...` o
 * `/blog/mantenimiento?q=...`) y queda en el historial y compartible como
 * cualquier URL. `page` no viaja a propósito: una búsqueda nueva siempre
 * arranca en la página 1.
 *
 * Campo en píldora del rediseño: 52px, 16px de texto (sin zoom en iOS) y
 * borde `control-line-strong` (4.79:1 sobre `card`, WCAG 1.4.11). El foco es
 * el anillo global.
 */
export function BlogSearchForm({ defaultValue, category, className }: BlogSearchFormProps) {
  return (
    <form role="search" action={blogHref({ category })} className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor="blog-q" className="text-label font-semibold text-fg">
        {blogContent.search.label}
      </label>
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute top-1/2 left-4.5 -translate-y-1/2 text-fg-muted"
        />
        <input
          id="blog-q"
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={blogContent.search.placeholder}
          className="h-13 w-full rounded-full border border-control-line-strong bg-card pr-5 pl-12 text-base text-fg transition-colors placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action motion-reduce:transition-none"
        />
      </div>
    </form>
  );
}
