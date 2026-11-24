import Link from "next/link";
import { FiltersToggle } from "@/components/proveedores/filters-toggle";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { PartnerZone } from "@/lib/autolibre-api";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import type { CategoryOption } from "@/lib/proveedores/directory";
import {
  hasActiveFilters,
  PROVEEDORES_PATH,
  PROVEEDORES_Q_MAX_LENGTH,
  proveedoresHref,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";

const { directory } = providersDirectoryContent;
const IDS = { q: "proveedores-q", zona: "proveedores-zona", rubro: "proveedores-rubro", panel: "proveedores-filtros" };

type ProveedoresSearchProps = {
  readonly filters: ProveedoresFilters;
  /** Zonas con negocios. Vacío: el backend no las devolvió y no se ofrece el filtro. */
  readonly zones: readonly PartnerZone[];
  /** Familias para el desplegable. Vacío: sin catálogo, no se ofrece. */
  readonly categories: readonly CategoryOption[];
};

/**
 * Celda del buscador: en celular, una píldora propia con borde; desde `md`,
 * un tramo de la píldora compartida (sin borde, con el rótulo arriba).
 */
const cell =
  "relative flex min-w-0 flex-col justify-center rounded-full border border-control-line-strong bg-card px-5 max-md:h-13 md:rounded-none md:border-0 md:bg-transparent";
const cellLabel = "text-xs font-semibold text-fg";
const control = "h-6.5 w-full min-w-0 appearance-none bg-transparent text-base text-fg";
const divider = "hidden h-8.5 w-px shrink-0 bg-control-line md:block";

/** Desplegable nativo con su chevron (el nativo se oculta con `appearance-none`). */
function SelectCell({
  id,
  name,
  label,
  value,
  children,
  className,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly value: string;
  readonly children: React.ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={cn(cell, className)}>
      <label htmlFor={id} className={cellLabel}>
        {label}
      </label>
      <div className="relative">
        <select id={id} name={name} defaultValue={value} className={cn(control, "pr-7")}>
          {children}
        </select>
        <Icon
          name="chevron-down"
          size={18}
          strokeWidth={2}
          className="pointer-events-none absolute top-1/2 right-0 -translate-y-1/2 text-fg"
        />
      </div>
    </div>
  );
}

/**
 * Buscador del directorio: nombre, zona y rubro. Form GET nativo: sin JS
 * funciona igual (`/proveedores?q=…&zona=…&rubro=…#red`), queda en el
 * historial y se comparte como cualquier URL. Un filtro nuevo siempre
 * arranca en la página 1 (`pagina` no viaja).
 *
 * Escritorio: una sola píldora con las tres celdas y "Buscar" (como el
 * lienzo). Celular: el nombre en su píldora + el botón "Filtros" (isla hoja),
 * que muestra zona, rubro y "Buscar" debajo. El rubro dejó de ser una fila de
 * links: los filtros llevan canonical `/proveedores`, y los perfiles ya se
 * descubren por el sitemap y la paginación.
 */
export function ProveedoresSearch({ filters, zones, categories }: ProveedoresSearchProps) {
  const initiallyOpen = filters.zona !== "" || filters.rubro !== "";
  const showZones = zones.length > 0;
  const showCategories = categories.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <form
        role="search"
        aria-label={directory.search.formLabel}
        method="get"
        action={`${PROVEEDORES_PATH}#${directory.id}`}
        data-filters-open={String(initiallyOpen)}
        className="group/buscador flex max-w-245 flex-col gap-2 md:h-17 md:flex-row md:items-center md:rounded-full md:border md:border-control-line-strong md:bg-card md:pr-2 md:pl-2"
      >
        <div className="flex gap-2 md:min-w-0 md:flex-[1.3_1_0]">
          <div className={cn(cell, "flex-1 max-md:flex-row max-md:items-center max-md:gap-2.5")}>
            <Icon name="search" size={20} strokeWidth={2} className="shrink-0 text-fg-muted md:hidden" />
            <label htmlFor={IDS.q} className={cn(cellLabel, "max-md:sr-only")}>
              {directory.search.label}
            </label>
            <input
              id={IDS.q}
              type="search"
              name="q"
              defaultValue={filters.q}
              maxLength={PROVEEDORES_Q_MAX_LENGTH}
              placeholder={directory.search.placeholder}
              autoComplete="off"
              className={cn(control, "placeholder:text-fg-subtle max-md:h-11")}
            />
          </div>
          {showZones || showCategories ? (
            <FiltersToggle label={directory.search.filters} controls={IDS.panel} initiallyOpen={initiallyOpen} />
          ) : null}
        </div>

        {/* Abierto/cerrado en celular según `data-filters-open` del form (lo
            marca `FiltersToggle`). Desde `md` siempre en línea (`contents`). */}
        <div
          id={IDS.panel}
          className="hidden flex-col gap-2 group-data-[filters-open=true]/buscador:flex md:contents! md:flex-row"
        >
          {showZones ? (
            <>
              <span aria-hidden="true" className={divider} />
              <SelectCell id={IDS.zona} name="zona" label={directory.zone.label} value={filters.zona} className="md:flex-1">
                <option value="">{directory.zone.all}</option>
                {zones.map((zone) => (
                  <option key={zone.slug} value={zone.slug}>
                    {zone.name}
                  </option>
                ))}
              </SelectCell>
            </>
          ) : null}
          {showCategories ? (
            <>
              <span aria-hidden="true" className={divider} />
              <SelectCell
                id={IDS.rubro}
                name="rubro"
                label={directory.filter.label}
                value={filters.rubro}
                className="md:flex-[1.2_1_0]"
              >
                <option value="">{directory.filter.all}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name}
                  </option>
                ))}
              </SelectCell>
            </>
          ) : null}
          <Button type="submit" variant="primary" size="52" className="shrink-0 px-7 max-md:w-full">
            {directory.search.submit}
          </Button>
        </div>
        {/* Sin filtros que mostrar, "Buscar" va siempre a la vista. */}
        {showZones || showCategories ? null : (
          <Button type="submit" variant="primary" size="52" className="shrink-0 px-7 md:hidden">
            {directory.search.submit}
          </Button>
        )}
      </form>

      <ActiveFilters
        filters={filters}
        categoryName={categories.find((category) => category.slug === filters.rubro)?.name}
        zoneName={zones.find((zone) => zone.slug === filters.zona)?.name}
      />
    </div>
  );
}

const removeLink =
  "inline-flex min-h-11 items-center rounded-full border border-control-line bg-card px-4 text-control font-medium text-fg transition-colors hover:border-action motion-reduce:transition-none";

/**
 * Los filtros puestos, cada uno con su link para quitarlo (conserva los demás
 * y vuelve a la página 1) y uno para quitar todos. Links y no botones: una
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
              <span aria-hidden="true" className="ml-2 text-lg leading-none text-fg-muted">
                ×
              </span>
            </Link>
          </li>
        ))}
        <li>
          <Link
            href={proveedoresHref({}, directory.id)}
            className="inline-flex min-h-11 items-center font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
          >
            {activeFilters.removeAll}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
