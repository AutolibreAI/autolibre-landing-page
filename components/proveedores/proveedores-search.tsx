import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import type { PartnerZone } from "@/lib/autolibre-api";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import {
  hasActiveFilters,
  PROVEEDORES_PATH,
  PROVEEDORES_Q_MAX_LENGTH,
  proveedoresHref,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";

const { directory } = providersDirectoryContent;
const INPUT_ID = "proveedores-q";
const ZONE_ID = "proveedores-zona";

type ProveedoresSearchProps = {
  readonly filters: ProveedoresFilters;
  /** Zonas con negocios. Vacío: el backend no las devolvió y no se ofrece el filtro. */
  readonly zones: readonly PartnerZone[];
  /** Nombre del rubro activo, para el link de quitarlo. */
  readonly categoryName: string | undefined;
};

/**
 * Buscador por nombre y recorte por zona del directorio. Form GET nativo: sin
 * JS funciona igual (`/proveedores?q=...&zona=...#red`), queda en el historial
 * y se comparte como cualquier URL; el texto y la zona son filtros de la URL,
 * no estado de un input.
 *
 * Lo que NO viaja a propósito: `pagina`. Un filtro nuevo siempre arranca en la
 * página 1. Lo que SÍ viaja como `hidden`: el rubro activo, para que buscar
 * dentro de "Frenos" no vuelva a "Todos".
 */
export function ProveedoresSearch({ filters, zones, categoryName }: ProveedoresSearchProps) {
  return (
    <div className="flex flex-col gap-3">
      <form
        role="search"
        method="get"
        action={`${PROVEEDORES_PATH}#${directory.id}`}
        className="flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        {filters.rubro ? <input type="hidden" name="rubro" value={filters.rubro} /> : null}

        <div className="flex flex-1 flex-col gap-2">
          <label htmlFor={INPUT_ID} className="text-label font-semibold text-ink">
            {directory.search.label}
          </label>
          <div className="relative">
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
        </div>

        {zones.length > 0 ? (
          <div className="flex flex-col gap-2 sm:w-64">
            <label htmlFor={ZONE_ID} className="text-label font-semibold text-ink">
              {directory.zone.label}
            </label>
            <Select id={ZONE_ID} name="zona" defaultValue={filters.zona} className="h-12">
              <option value="">{directory.zone.all}</option>
              {zones.map((zone) => (
                <option key={zone.slug} value={zone.slug}>
                  {zone.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        <Button type="submit" className="min-h-12 sm:w-auto">
          {directory.search.submit}
        </Button>
      </form>

      <ActiveFilters
        filters={filters}
        categoryName={categoryName}
        zoneName={zones.find((zone) => zone.slug === filters.zona)?.name}
      />
    </div>
  );
}

const removeLink =
  "inline-flex min-h-11 items-center rounded-full border border-line bg-surface-subtle px-4 text-[0.9375rem] font-medium text-ink transition-colors hover:border-brand-soft";

/**
 * Los filtros puestos, cada uno con su link para quitarlo (conserva los demás
 * y vuelve a la página 1) y uno para quitar todos. Son links y no botones: una
 * URL que se comparte y que un crawler puede seguir.
 */
function ActiveFilters({
  filters,
  categoryName,
  zoneName,
}: {
  readonly filters: ProveedoresFilters;
  readonly categoryName: string | undefined;
  readonly zoneName: string | undefined;
}) {
  if (!hasActiveFilters(filters)) return null;

  const { activeFilters } = directory;
  const active = [
    filters.rubro && categoryName
      ? { key: "rubro", text: activeFilters.category(categoryName), without: { rubro: "" } }
      : null,
    filters.zona && zoneName
      ? { key: "zona", text: activeFilters.zone(zoneName), without: { zona: "" } }
      : null,
    filters.q ? { key: "q", text: activeFilters.query(filters.q), without: { q: "" } } : null,
  ].filter((filter) => filter !== null);

  return (
    <nav aria-label={activeFilters.label}>
      <ul className="flex flex-wrap items-center gap-2.5">
        {active.map((filter) => (
          <li key={filter.key}>
            <Link
              href={proveedoresHref({ ...filters, ...filter.without, pagina: 1 }, directory.id)}
              aria-label={activeFilters.remove(filter.text)}
              className={removeLink}
            >
              {filter.text}
              <span aria-hidden="true" className="ml-2 text-lg leading-none text-ink/60">
                ×
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={proveedoresHref({}, directory.id)}
            className="inline-flex min-h-11 items-center font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-brand-hover"
          >
            {activeFilters.removeAll}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
