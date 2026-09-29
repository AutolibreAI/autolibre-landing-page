import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/form-controls";
import { blogHref } from "@/lib/blog/query";
import { blogContent } from "@/lib/content/blog";

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
 */
export function BlogSearchForm({ defaultValue, category, className }: BlogSearchFormProps) {
  return (
    <form role="search" action={blogHref({ category })} className={className}>
      <label htmlFor="blog-q" className="mb-2 block text-label font-semibold text-ink">
        {blogContent.search.label}
      </label>
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/60"
        />
        <Input
          id="blog-q"
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={blogContent.search.placeholder}
          className="h-12 pl-11"
        />
      </div>
    </form>
  );
}
