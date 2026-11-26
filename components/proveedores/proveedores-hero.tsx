import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { ProveedoresSearch } from "@/components/proveedores/proveedores-search";
import { Section } from "@/components/ui/section";
import type { PartnerZone } from "@/lib/autolibre-api";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import type { CategoryOption } from "@/lib/proveedores/directory";
import type { ProveedoresFilters } from "@/lib/proveedores/query";

type ProveedoresHeroProps = {
  readonly breadcrumbs: readonly Crumb[];
  /** Conteo real de la red; `null` si no se pudo leer (no se muestra). */
  readonly networkTotal: number | null;
  /** Familias con al menos un negocio; `null` si no se pudo calcular. */
  readonly activeCategoryCount: number | null;
  readonly filters: ProveedoresFilters;
  readonly zones: readonly PartnerZone[];
  readonly categories: readonly CategoryOption[];
};

const { hero, breadcrumb } = providersDirectoryContent;

/**
 * Cabecera de `/proveedores`: migas, el único `h1`, la bajada (solo desde
 * `md`, como el lienzo; en celular el `h1` y el conteo alcanzan), las cifras
 * reales de la red y el buscador. Banda `card` con filete abajo.
 *
 * Sin `reveal` ni imágenes: el `h1` es el LCP, texto del server.
 */
export function ProveedoresHero({
  breadcrumbs,
  networkTotal,
  activeCategoryCount,
  filters,
  zones,
  categories,
}: ProveedoresHeroProps) {
  const { facts } = hero;

  return (
    <Section
      tone="card"
      spacing="sm"
      aria-labelledby="proveedores-titulo"
      className="border-t-0 pt-5 pb-6 md:pt-7 md:pb-9"
    >
      <Breadcrumbs items={breadcrumbs} label={breadcrumb.label} />

      <div className="mt-2 max-w-190 md:mt-4">
        <h1
          id="proveedores-titulo"
          className="font-display text-display-xs font-bold tracking-tight text-balance text-fg sm:text-display-sm md:text-display-md"
        >
          {hero.title}
        </h1>
        <p className="mt-3 hidden text-lead text-fg-muted md:block">{hero.lead}</p>

        {/* Las cifras salen del backend: sin el dato, ese tramo no va. */}
        <p className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-control text-fg-muted">
          {networkTotal !== null ? (
            <>
              <span>
                <strong className="font-semibold text-fg tabular-nums">{networkTotal}</strong>{" "}
                {facts.partners(networkTotal)}
              </span>
              <span aria-hidden="true" className="size-1 rounded-full bg-fg-subtle" />
            </>
          ) : null}
          {activeCategoryCount ? (
            <>
              <span>
                <strong className="font-semibold text-fg tabular-nums">{activeCategoryCount}</strong>{" "}
                {facts.categories(activeCategoryCount)}
              </span>
              <span aria-hidden="true" className="size-1 rounded-full bg-fg-subtle" />
            </>
          ) : null}
          <span>
            {facts.zonePrefix} <strong className="font-semibold text-fg">{facts.zone}</strong>
          </span>
        </p>
      </div>

      <div className="mt-6">
        <ProveedoresSearch filters={filters} zones={zones} categories={categories} />
      </div>
    </Section>
  );
}
