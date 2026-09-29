import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/form-controls";

type BlogSearchFormProps = {
  readonly defaultValue: string;
  /** Categoría activa: viaja como campo oculto para no perderla al buscar. */
  readonly category: string;
  readonly className?: string;
};

/**
 * Form GET nativo: sin JS, el buscador funciona igual (`/blog?q=...`) y
 * queda en el historial y compartible como cualquier URL. `page` no se
 * incluye a propósito — una búsqueda nueva siempre arranca en la página 1.
 */
export function BlogSearchForm({
  defaultValue,
  category,
  className,
}: BlogSearchFormProps) {
  return (
    <form role="search" action="/blog" className={className}>
      <label
        htmlFor="blog-q"
        className="mb-2 block text-[0.8125rem] font-semibold text-ink"
      >
        Buscar en el blog
      </label>
      {category ? (
        <input type="hidden" name="category" value={category} />
      ) : null}
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/50"
        />
        <Input
          id="blog-q"
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder="Ej.: VTV, cambio de aceite, cédula"
          className="h-12 pl-11"
        />
      </div>
    </form>
  );
}
