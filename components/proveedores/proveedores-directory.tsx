import Link from "next/link";
import { DirectoryMapMarkers } from "@/components/proveedores/directory-map-markers";
import { LazyMapImage } from "@/components/proveedores/lazy-map-image";
import { MapBackdrop } from "@/components/proveedores/map-backdrop";
import { PartnerCard } from "@/components/proveedores/partner-card";
import { partnerMonogram } from "@/components/proveedores/partner-monogram";
import { QuotePrefillForm } from "@/components/pedido/quote-prefill-form";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import type { CategoryOption, DirectoryMapPoint } from "@/lib/proveedores/directory";
import { fitMapView, staticMapUrl } from "@/lib/proveedores/map";
import {
  hasActiveFilters,
  paginationItems,
  partnerPath,
  PROVEEDORES_PAGE_SIZE,
  proveedoresHref,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";
import type { PartnerZone, PartnersPage } from "@/lib/autolibre-api";
import { cn } from "@/lib/utils";

type ProveedoresDirectoryProps = {
  readonly filters: ProveedoresFilters;
  readonly categories: readonly CategoryOption[];
  readonly categoryNames: ReadonlyMap<string, string>;
  readonly zones: readonly PartnerZone[];
  /** `null`: el backend falló y no había nada en caché. */
  readonly result: PartnersPage | null;
  readonly mapPoints: readonly DirectoryMapPoint[];
};

const { directory, quoteBand, partnerCard, map } = providersDirectoryContent;
const HEADING_ID = "red-titulo";

/** Imagen del mapa (px CSS; Static Maps la devuelve al doble). Cuadrada: el contenedor también. */
const MAP_SIZE = 640;

const pageLink =
  "inline-flex h-11 min-w-11 items-center justify-center rounded-full px-3 text-control font-medium text-fg transition-colors hover:bg-card motion-reduce:transition-none";

/**
 * Links numerados (`?pagina=n`, con todos los filtros) y no "cargar más": un
 * crawler sigue un `<a href>`, no aprieta un botón. Ventana de páginas
 * (`paginationItems`): 1 2 3 … 18, como el lienzo. "Anterior" y "Siguiente"
 * solo cuando hay a dónde ir.
 */
function Pagination({
  page,
  totalPages,
  filters,
  className,
}: {
  readonly page: number;
  readonly totalPages: number;
  readonly filters: ProveedoresFilters;
  readonly className?: string;
}) {
  if (totalPages <= 1) return null;
  const { pagination } = directory;
  const edge = "inline-flex h-11 items-center gap-1.5 rounded-full border border-action px-4.5 font-display text-control font-semibold text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none";

  return (
    <nav aria-label={pagination.label} className={className}>
      <ul className="flex flex-wrap items-center justify-center gap-1.5">
        {page > 1 ? (
          <li>
            <Link href={proveedoresHref({ ...filters, pagina: page - 1 }, directory.id)} rel="prev" className={edge}>
              <Icon name="arrow-left" size={16} strokeWidth={2} />
              {pagination.previous}
            </Link>
          </li>
        ) : null}
        {paginationItems(page, totalPages).map((item, index) =>
          item === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="px-1 text-fg-muted">
              …
            </li>
          ) : (
            <li key={item}>
              <Link
                href={proveedoresHref({ ...filters, pagina: item }, directory.id)}
                aria-current={item === page ? "page" : undefined}
                aria-label={pagination.page(item)}
                className={cn(pageLink, item === page && "bg-action font-semibold text-white hover:bg-action")}
              >
                {item}
              </Link>
            </li>
          ),
        )}
        {page < totalPages ? (
          <li>
            <Link href={proveedoresHref({ ...filters, pagina: page + 1 }, directory.id)} rel="next" className={edge}>
              {pagination.next}
              <Icon name="arrow-right" size={16} strokeWidth={2} />
            </Link>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

/**
 * Filtros sin negocios: la salida es pedir igual, o quitar los filtros. Es el
 * "no hay resultados" de verdad: una falla del servicio es `ErrorState`.
 */
function EmptyState({
  filters,
  categoryName,
  zoneName,
}: {
  readonly filters: ProveedoresFilters;
  readonly categoryName: string | undefined;
  readonly zoneName: string | undefined;
}) {
  const { empty } = directory;
  const onlyCategory = categoryName !== undefined && filters.q === "" && filters.zona === "";
  const title = onlyCategory
    ? empty.title(categoryName)
    : empty.titleFor({ q: filters.q, category: categoryName ?? "", zone: zoneName ?? "" });
  const secondaryCta = onlyCategory ? empty.secondaryCta : empty.clearFilters;

  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-dashed border-control-line bg-card px-6 py-12 text-center">
      <h3 className="font-display text-xl font-bold text-balance text-fg">{title}</h3>
      <p className="max-w-120 text-fg-muted">{empty.body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        {/* La medición dice QUÉ filtros había (presencia), nunca su valor. */}
        <ButtonLink
          href={empty.primaryCta.href}
          variant="primary"
          size="48"
          data-analytics-event={ANALYTICS_EVENTS.directoryEmptyQuoteClicked}
          data-analytics-has-query={filters.q ? "" : undefined}
          data-analytics-has-zone={filters.zona ? "" : undefined}
          data-analytics-has-category={filters.rubro ? "" : undefined}
        >
          {empty.primaryCta.label}
        </ButtonLink>
        <ButtonLink href={`${secondaryCta.href}#${directory.id}`} variant="outline" size="48">
          {secondaryCta.label}
        </ButtonLink>
      </div>
    </div>
  );
}

/** El backend no contestó y no había respuesta en caché: aviso de la sección. */
function ErrorState({ retryHref }: { readonly retryHref: string }) {
  const { error } = directory;

  return (
    <div role="status" className="flex items-start gap-4 rounded-card border border-card-line bg-card p-6">
      <Icon name="alert" size={24} strokeWidth={1.8} className="mt-0.5 shrink-0 text-status-alert" />
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg font-bold text-fg">{error.title}</h3>
        <p className="text-fg-muted">{error.body}</p>
        <Link
          href={retryHref}
          className="inline-flex min-h-11 items-center self-start font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
        >
          {error.retry}
        </Link>
      </div>
    </div>
  );
}

/**
 * Mapa de los negocios de la página: imagen de Static Maps (sin librería de
 * mapas) que se pide al estar en pantalla y después de la primera
 * interacción (`LazyMapImage`), con los marcadores en HTML encima. Antes de
 * la imagen se ve el fondo de referencia con los marcadores ya en su lugar:
 * mismas medidas (cuadrado), CLS 0. Sin key de Google o sin negocios con
 * ubicación, no hay mapa (no se dibuja uno inventado).
 */
function DirectoryMap({
  points,
  pageCount,
  categoryNames,
  className,
}: {
  readonly points: readonly DirectoryMapPoint[];
  readonly pageCount: number;
  readonly categoryNames: ReadonlyMap<string, string>;
  readonly className?: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  const view = fitMapView(
    points.map((point) => point.geo),
    { width: MAP_SIZE, height: MAP_SIZE, padding: 0.1, insetBottom: 0.2 },
  );
  if (!apiKey || !view) return null;

  const markers = points.map(({ partner }, index) => ({
    slug: partner.slug,
    name: partner.name,
    monogram: partnerMonogram(partner.name),
    label: map.marker(partner.name),
    href: partnerPath(partner.slug),
    category: partner.categories[0] ? (categoryNames.get(partner.categories[0]) ?? null) : null,
    locality: partner.coverageZone || null,
    x: view.positions[index].x,
    y: view.positions[index].y,
  }));

  return (
    <aside aria-label={map.label} className={className}>
      <div className="relative aspect-square overflow-hidden rounded-panel border border-card-line bg-brand-50">
        <MapBackdrop />
        <LazyMapImage
          src={staticMapUrl({ center: view.center, zoom: view.zoom, width: MAP_SIZE, height: MAP_SIZE, apiKey })}
          width={MAP_SIZE}
          height={MAP_SIZE}
        />
        <p className="absolute top-3 right-3 z-30 rounded-lg bg-card px-2 py-1 text-xs text-fg-muted">{map.badge}</p>
        <DirectoryMapMarkers markers={markers} viewProfile={map.viewProfile} />
      </div>
      <p className="mt-2 text-sm text-fg-muted">{map.note(points.length, pageCount)}</p>
    </aside>
  );
}

/**
 * "Toda la red": banda de pedido, conteo, grilla de negocios con el mapa al
 * costado, paginación y tarjeta para negocios. Server Component: todo el
 * directorio va en el HTML inicial; las islas son el formulario de la banda y
 * los marcadores del mapa.
 *
 * Orden: el del lienzo de escritorio en el DOM (la banda de pedido primero:
 * es la conversión). En celular el lienzo pone el mapa antes de la lista y la
 * banda después: se reordena con `order` solo debajo de `lg`.
 */
export function ProveedoresDirectory({
  filters,
  categories,
  categoryNames,
  zones,
  result,
  mapPoints,
}: ProveedoresDirectoryProps) {
  const activeCategory = categories.find((category) => category.slug === filters.rubro);
  const activeZone = zones.find((zone) => zone.slug === filters.zona);
  const partners = result?.data ?? [];

  const from = (filters.pagina - 1) * (result?.pageSize || PROVEEDORES_PAGE_SIZE) + 1;
  const count =
    result && result.total > 0
      ? directory.count({ from, to: from + partners.length - 1, total: result.total })
      : null;
  const hasMap = partners.length > 0 && mapPoints.length > 0 && !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  return (
    <Section
      id={directory.id}
      tone="canvas"
      spacing="sm"
      aria-labelledby={HEADING_ID}
      className="scroll-mt-17 pt-6 md:pt-9"
      containerClassName="flex flex-col gap-6"
    >
      {/* Referencia del lienzo: Base44, "contanos qué necesitás": el pedido adentro del directorio. */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 rounded-panel bg-action p-5 text-white max-lg:order-2 md:p-7">
        <div className="min-w-0 flex-[1_1_18.75rem]">
          <h2 className="font-display text-xl font-bold md:text-2xl">{quoteBand.title}</h2>
          <p className="mt-1 text-on-dark">{quoteBand.body}</p>
        </div>
        <QuotePrefillForm
          id="directorio-pedido"
          label={quoteBand.inputLabel}
          placeholder={quoteBand.placeholder}
          submitLabel={quoteBand.submit}
          tone="dark"
          className="min-w-0 flex-[1.2_1_22.5rem]"
          submitAttributes={{
            "data-analytics-event": ANALYTICS_EVENTS.quoteCtaClicked,
            "data-analytics-quote-placement": QUOTE_CTA_PLACEMENTS.directoryBand,
          }}
        />
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1.5">
        <h2 id={HEADING_ID} className="font-display text-2xl font-bold text-fg md:text-3xl">
          {directory.title}
        </h2>
        {count ? <p className="text-control text-fg-muted tabular-nums">{count}</p> : null}
      </div>

      {result === null ? (
        <ErrorState retryHref={proveedoresHref(filters, directory.id)} />
      ) : partners.length === 0 && hasActiveFilters(filters) ? (
        <EmptyState filters={filters} categoryName={activeCategory?.name} zoneName={activeZone?.name} />
      ) : partners.length > 0 ? (
        <div className="flex flex-wrap items-start gap-5">
          <ul
            className={cn(
              "grid min-w-0 gap-3.5 sm:grid-cols-2",
              hasMap ? "flex-[1.5_1_30rem]" : "w-full lg:grid-cols-3",
            )}
          >
            {partners.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} categoryNames={categoryNames} />
            ))}
          </ul>
          {hasMap ? (
            <DirectoryMap
              points={mapPoints}
              pageCount={partners.length}
              categoryNames={categoryNames}
              className="min-w-0 flex-[1_1_21.25rem] max-lg:order-first max-lg:mx-auto max-lg:max-w-120 max-lg:basis-full lg:sticky lg:top-21"
            />
          ) : null}
        </div>
      ) : null}

      {result ? (
        <Pagination page={filters.pagina} totalPages={result.totalPages} filters={filters} className="max-lg:order-3" />
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-card-line bg-card p-6 max-lg:order-4 md:p-10">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 className="font-display text-2xl font-bold text-balance text-fg md:text-3xl">{partnerCard.title}</h2>
          <p className="mt-2 text-fg-muted">{partnerCard.body}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {/* El alta carga Clerk: sin prefetch. */}
          <ButtonLink
            href={partnerCard.register.href}
            prefetch={false}
            variant="primary"
            size="48"
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
            data-analytics-placement="directory_card"
          >
            {partnerCard.register.label}
          </ButtonLink>
          <ButtonLink href={partnerCard.plans.href} variant="outline" size="48">
            {partnerCard.plans.label}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
