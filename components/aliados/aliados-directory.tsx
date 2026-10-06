import Link from "next/link";
import { PartnerCard } from "@/components/aliados/partner-card";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { PartnersPage } from "@/lib/autolibre-api";
import { ALIADOS_PAGE_SIZE, aliadosHref, type AliadosFilters } from "@/lib/aliados/query";
import { aliadosContent } from "@/lib/content/aliados";
import { cn } from "@/lib/utils";

type CategoryOption = { readonly slug: string; readonly name: string };

type AliadosDirectoryProps = {
  readonly filters: AliadosFilters;
  /** Familias del catálogo, en su orden. Vacío si el catálogo no cargó. */
  readonly categories: readonly CategoryOption[];
  /** `null`: el backend falló y no había nada en caché. */
  readonly result: PartnersPage | null;
};

const { directory } = aliadosContent;
const HEADING_ID = "red-titulo";

// 15px (`text-[0.9375rem]`): el mismo tamaño que los chips del blog y el
// botón `md`; la escala de Tailwind no tiene un paso entre 14 y 16px.
const pill =
  "inline-flex min-h-11 items-center rounded-full border px-4 text-[0.9375rem] font-medium whitespace-nowrap text-ink transition-colors";
const pillOn = "border-brand bg-brand/8";
const pillOff = "border-line bg-surface-subtle hover:border-brand-soft";

/**
 * Rubros como links (`?rubro=`), no como estado de cliente: cada filtro es
 * una URL que funciona sin JS y se comparte. En mobile la fila scrollea de
 * costado dentro del gutter; desde `lg` hace wrap.
 */
function CategoryFilter({
  categories,
  active,
}: {
  readonly categories: readonly CategoryOption[];
  readonly active: string;
}) {
  return (
    <nav aria-label={directory.filter.label} className="overflow-x-auto pb-1 lg:overflow-visible">
      <ul className="flex w-max gap-2.5 lg:w-auto lg:flex-wrap">
        <li>
          <Link
            href={aliadosHref({})}
            aria-current={active === "" ? "page" : undefined}
            className={cn(pill, active === "" ? pillOn : pillOff)}
          >
            {directory.filter.all}
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={aliadosHref({ rubro: category.slug }, directory.id)}
              aria-current={active === category.slug ? "page" : undefined}
              className={cn(pill, active === category.slug ? pillOn : pillOff)}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

const pageLink =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-field border px-3 text-[0.9375rem] font-semibold transition-colors";

/**
 * Links numerados (`?pagina=n`, conservando el rubro) y no "cargar más": un
 * crawler sigue un `<a href>`, no aprieta un botón. Anterior/Siguiente quedan
 * a la vista pero apagados en los bordes (no son links: no hay a dónde ir).
 */
function Pagination({
  page,
  totalPages,
  rubro,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly rubro: string;
}) {
  if (totalPages <= 1) return null;

  const { pagination } = directory;
  const edge = (label: string, icon: "arrow-left" | "arrow-right", target: number | null) => {
    const content =
      icon === "arrow-left" ? (
        <>
          <Icon name={icon} size={16} />
          {label}
        </>
      ) : (
        <>
          {label}
          <Icon name={icon} size={16} />
        </>
      );

    return target === null ? (
      <span aria-disabled="true" className={cn(pageLink, "border-line px-4 text-ink/40")}>
        {content}
      </span>
    ) : (
      <Link
        href={aliadosHref({ rubro, pagina: target }, directory.id)}
        rel={icon === "arrow-left" ? "prev" : "next"}
        className={cn(pageLink, "border-line px-4 text-ink hover:border-brand-soft")}
      >
        {content}
      </Link>
    );
  };

  return (
    <nav aria-label={pagination.label} className="mt-12 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-2">
        <li>{edge(pagination.previous, "arrow-left", page > 1 ? page - 1 : null)}</li>
        {Array.from({ length: totalPages }, (_, index) => index + 1).map((n) => (
          <li key={n}>
            <Link
              href={aliadosHref({ rubro, pagina: n }, directory.id)}
              aria-current={n === page ? "page" : undefined}
              aria-label={pagination.page(n)}
              className={cn(
                pageLink,
                n === page
                  ? "border-ink bg-ink text-white"
                  : "border-line text-ink hover:border-brand-soft",
              )}
            >
              {n}
            </Link>
          </li>
        ))}
        <li>{edge(pagination.next, "arrow-right", page < totalPages ? page + 1 : null)}</li>
      </ul>
    </nav>
  );
}

/** Rubro sin negocios: la salida es pedir igual, o volver a todos. */
function EmptyState({ category }: { readonly category: CategoryOption }) {
  const { empty } = directory;

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-ink/20 px-6 py-12 text-center">
      <h3 className="font-display text-xl font-bold text-balance text-ink">
        {empty.title(category.name)}
      </h3>
      <p className="max-w-120 text-ink/70">{empty.body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {/* `/pedido` pelado: sus valores de `?servicio=` son verticales
            (talleres, seguros…), no familias del catálogo. */}
        <ButtonLink href={empty.primaryCta.href} className="min-h-11">
          {empty.primaryCta.label}
        </ButtonLink>
        <ButtonLink href={empty.secondaryCta.href} variant="outline" className="min-h-11">
          {empty.secondaryCta.label}
        </ButtonLink>
      </div>
    </div>
  );
}

/**
 * El backend no contestó y no había respuesta en caché. Es un aviso de la
 * sección, no de la página: el hero y la banda de abajo siguen ahí.
 */
function ErrorState({ retryHref }: { readonly retryHref: string }) {
  const { error } = directory;

  return (
    <div role="status" className="flex items-start gap-4 rounded-card bg-alert-bg p-6">
      <Icon name="alert" size={24} strokeWidth={1.8} className="mt-0.5 shrink-0 text-alert-fg" />
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold text-ink">{error.title}</h3>
        <p className="text-ink/80">{error.body}</p>
        <Link
          href={retryHref}
          className="inline-flex min-h-11 items-center self-start font-semibold text-ink underline decoration-2 underline-offset-4 hover:text-brand-hover"
        >
          {error.retry}
        </Link>
      </div>
    </div>
  );
}

/**
 * "Toda la red": filtro por rubro, grilla de negocios y paginación. Server
 * Component: todo el directorio va en el HTML inicial.
 */
export function AliadosDirectory({ filters, categories, result }: AliadosDirectoryProps) {
  const activeCategory = categories.find((category) => category.slug === filters.rubro);
  const partners = result?.data ?? [];
  const categoryNames = new Map(categories.map((category) => [category.slug, category.name]));

  const from = (filters.pagina - 1) * (result?.pageSize || ALIADOS_PAGE_SIZE) + 1;
  const count =
    result && result.total > 0
      ? directory.count({ from, to: from + partners.length - 1, total: result.total })
      : null;

  return (
    <Section id={directory.id} tone="surface" spacing="md" aria-labelledby={HEADING_ID}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-8">
        <SectionHeading
          as="h2"
          id={HEADING_ID}
          title={directory.title}
          subtitle={directory.subtitle}
          className="max-w-160"
        />
        {count ? <p className="shrink-0 text-sm font-medium text-ink/70 tabular-nums">{count}</p> : null}
      </div>

      {categories.length > 0 ? (
        <div className="mt-8">
          <CategoryFilter categories={categories} active={filters.rubro} />
        </div>
      ) : null}

      <div className="mt-10">
        {result === null ? (
          <ErrorState retryHref={aliadosHref(filters, directory.id)} />
        ) : partners.length === 0 && activeCategory ? (
          <EmptyState category={activeCategory} />
        ) : (
          <>
            {partners.length > 0 ? (
              <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {partners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} categoryNames={categoryNames} />
                ))}
              </ul>
            ) : null}
            <Pagination page={filters.pagina} totalPages={result.totalPages} rubro={filters.rubro} />
          </>
        )}
      </div>
    </Section>
  );
}
