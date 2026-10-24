import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import {
  PROVEEDORES_PATH,
  PROVEEDORES_Q_MAX_LENGTH,
  proveedoresHref,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";

const { directory } = providersDirectoryContent;
const INPUT_ID = "proveedores-q";

type ProveedoresSearchProps = {
  readonly filters: ProveedoresFilters;
};

/**
 * Buscador por nombre del directorio. Form GET nativo: sin JS funciona igual
 * (`/proveedores?q=...#red`), queda en el historial y se comparte como
 * cualquier URL; el texto es un filtro de la URL, no estado de un input.
 *
 * Lo que NO viaja a propósito: `pagina`. Una búsqueda nueva siempre arranca
 * en la página 1. Lo que SÍ viaja como `hidden`: el rubro activo, para que
 * buscar dentro de "Frenos" no vuelva a "Todos".
 */
export function ProveedoresSearch({ filters }: ProveedoresSearchProps) {
  return (
    <form
      role="search"
      method="get"
      action={`${PROVEEDORES_PATH}#${directory.id}`}
      className="flex flex-col gap-2"
    >
      {filters.rubro ? <input type="hidden" name="rubro" value={filters.rubro} /> : null}

      <label htmlFor={INPUT_ID} className="text-label font-semibold text-ink">
        {directory.search.label}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Icon
            name="search"
            size={20}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink/60"
          />
          <Input
            id={INPUT_ID}
            type="search"
            name="q"
            defaultValue={filters.q}
            maxLength={PROVEEDORES_Q_MAX_LENGTH}
            placeholder={directory.search.placeholder}
            autoComplete="off"
            className="h-12 pl-11"
          />
        </div>
        <Button type="submit" className="min-h-12 sm:w-auto">
          {directory.search.submit}
        </Button>
      </div>

      {filters.q ? (
        <Link
          href={proveedoresHref({ ...filters, q: "", pagina: 1 }, directory.id)}
          className="inline-flex min-h-11 items-center self-start font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-brand-hover"
        >
          {directory.activeFilters.remove(directory.activeFilters.query(filters.q))}
        </Link>
      ) : null}
    </form>
  );
}
