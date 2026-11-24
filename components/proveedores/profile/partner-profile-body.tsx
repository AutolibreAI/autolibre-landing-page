import { partnerMonogram } from "@/components/proveedores/partner-monogram";
import { LazyMapImage } from "@/components/proveedores/lazy-map-image";
import { MapBackdrop } from "@/components/proveedores/map-backdrop";
import { QuotePrefillForm } from "@/components/pedido/quote-prefill-form";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import type { PartnerDetail } from "@/lib/autolibre-api";
import { partnerProfileContent } from "@/lib/content/partner-profile";
import { isGeoPoint, staticMapUrl } from "@/lib/proveedores/map";

export type ServiceGroup = {
  readonly familySlug: string;
  readonly familyName: string;
  readonly services: readonly string[];
};

export type ProfileFaq = { readonly question: string; readonly answer: string };

type PartnerProfileBodyProps = {
  readonly partner: PartnerDetail;
  /** Rubros del negocio agrupados por familia, en el orden del catálogo. */
  readonly serviceGroups: readonly ServiceGroup[];
  /** Preguntas armadas con campos reales; `[]` si no llegan a dos. */
  readonly faqs: readonly ProfileFaq[];
};

const { about, services, faq, aside } = partnerProfileContent;

const sectionTitle = "font-display text-2xl leading-tight font-bold text-fg md:text-3xl";
const cardClass = "flex flex-col gap-3 rounded-card border border-card-line bg-card p-5.5";
const cardTitleClass = "font-display text-lg font-semibold text-fg";
const factLabelClass = "text-xs font-semibold tracking-wider text-fg-muted uppercase";
const asideLink =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-fg underline-offset-4 hover:underline";

/** Link a Google Maps: por coordenadas si hay, si no por la dirección. */
function mapsHref(partner: PartnerDetail): string | null {
  const query = partner.geo ? `${partner.geo.latitude},${partner.geo.longitude}` : partner.address;
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : null;
}

/** Medidas del mapa (px CSS; Static Maps la devuelve al doble). 5:3, como el contenedor. */
const MAP_SIZE = { width: 400, height: 240 } as const;

/**
 * Mapa de la ubicación: fondo de referencia + imagen de Static Maps que se
 * pide al estar en pantalla y después de la primera interacción
 * (`LazyMapImage`): en la línea base este mapa, `loading="lazy"`, era el LCP de
 * escritorio. El marcador (monograma + localidad) va en HTML, centrado: el
 * mapa está centrado en el negocio. Solo con coordenadas y key pública.
 */
function LocationMap({ partner }: { readonly partner: PartnerDetail }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!apiKey || !isGeoPoint(partner.geo)) return null;
  const place = partner.coverageZone.split(",")[0]?.trim();

  return (
    <div
      role="img"
      aria-label={aside.mapAlt(partner.name)}
      className="relative aspect-5/3 overflow-hidden rounded-xl border border-card-line bg-brand-50"
    >
      <MapBackdrop />
      <LazyMapImage
        src={staticMapUrl({ center: partner.geo, zoom: 15, ...MAP_SIZE, apiKey })}
        width={MAP_SIZE.width}
        height={MAP_SIZE.height}
      />
      <span
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 inline-flex h-10 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-action pr-3.5 pl-1.5 font-display text-sm font-semibold text-white"
      >
        <span className="flex size-7 items-center justify-center rounded-full bg-card text-xs text-action">
          {partnerMonogram(partner.name)}
        </span>
        {place || partner.name}
      </span>
    </div>
  );
}

/**
 * Cuerpo del perfil: columna principal abierta (sobre, datos, servicios,
 * preguntas) y una columna lateral con tarjetas (pedir propuesta, horarios,
 * ubicación, contacto). Dos columnas con `flex-wrap` y bases (560 / 340px):
 * la lateral baja sola cuando no entran.
 *
 * Una sola `<section>` (rotulada por su primer `h2`); el costado es un
 * `<aside>` con su rótulo. Cada bloque se renderiza solo si tiene datos:
 * nunca "Sin información" (un LLM lo citaría como dato).
 */
export function PartnerProfileBody({ partner, serviceGroups, faqs }: PartnerProfileBodyProps) {
  const modality = partner.modality ? partnerProfileContent.modalityLabel(partner.modality) : null;
  const directions = mapsHref(partner);

  const facts = [
    {
      id: "marcas",
      label: services.facts.brands,
      value: partner.brands.length > 0 ? partnerProfileContent.joinList(partner.brands) : services.facts.allBrands,
    },
    {
      id: "combustible",
      label: services.facts.fuel,
      value:
        partner.fuelTypes.length > 0
          ? partnerProfileContent.joinList(partner.fuelTypes.map(partnerProfileContent.fuelLabel))
          : services.facts.allFuels,
    },
    ...(modality ? [{ id: "modalidad", label: services.facts.modality, value: modality }] : []),
  ];

  return (
    <Section
      tone="card"
      spacing="md"
      className="border-y-0 py-10 md:py-18"
      aria-labelledby={partner.description ? "sobre-titulo" : "servicios-titulo"}
    >
      <div className="flex flex-wrap gap-12">
        <div className="flex min-w-0 grow-999 basis-140 flex-col gap-13">
          {partner.description ? (
            <div className="flex flex-col gap-3.5">
              <h2 id="sobre-titulo" className={sectionTitle}>
                {about.title(partner.name)}
              </h2>
              <p className="max-w-170 text-lead leading-relaxed whitespace-pre-line text-fg-muted">
                {partner.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-8">
            <dl className="grid border-t border-fg sm:auto-cols-fr sm:grid-flow-col sm:gap-x-8">
              {facts.map((fact) => (
                <div key={fact.id} className="flex flex-col gap-1.5 border-b border-card-line py-4.5">
                  <dt className={factLabelClass}>{fact.label}</dt>
                  <dd className="font-display text-lg leading-snug font-semibold text-fg">{fact.value}</dd>
                </div>
              ))}
            </dl>

            <h2 id="servicios-titulo" className={sectionTitle}>
              {services.title}
            </h2>

            {serviceGroups.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2">
                {serviceGroups.map((group) => (
                  <div key={group.familySlug} className="flex flex-col gap-3">
                    <h3 className="font-display text-lg font-bold text-fg">{group.familyName}</h3>
                    <ul className="flex flex-col gap-2">
                      {group.services.map((name) => (
                        <li key={name} className="flex items-start gap-2 text-fg-muted">
                          <Icon name="check" size={18} strokeWidth={2.2} className="mt-0.5 shrink-0 text-brand" />
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {faqs.length > 0 ? (
            <div className="flex flex-col gap-5">
              <h2 id="preguntas-titulo" className={sectionTitle}>
                {faq.title}
              </h2>
              {/* `<details>` nativo: la respuesta está en el HTML del server
                  aunque arranque cerrada (y en el `FAQPage`). */}
              <div className="flex flex-col border-t border-card-line">
                {faqs.map((item) => (
                  <details key={item.question} className="group border-b border-card-line">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-fg [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <Icon
                        name="arrow-right"
                        size={16}
                        strokeWidth={2}
                        className="shrink-0 transition-transform group-open:rotate-90 motion-reduce:transition-none"
                      />
                    </summary>
                    <p className="pb-5 leading-relaxed whitespace-pre-line text-fg-muted">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside aria-label={aside.label} className="flex min-w-0 grow basis-85 flex-col gap-6">
          <div className={`${cardClass} border-action`}>
            <h2 id="pedir-titulo" className={cardTitleClass}>
              {aside.quote.title}
            </h2>
            <p className="text-control text-fg-muted">{aside.quote.body}</p>
            <QuotePrefillForm
              id="perfil-pedido"
              label={aside.quote.inputLabel}
              placeholder={aside.quote.placeholder}
              submitLabel={aside.quote.submit}
              tone="light"
              submitAttributes={{
                "data-analytics-event": ANALYTICS_EVENTS.providerActionClicked,
                "data-analytics-action": PROVIDER_ACTIONS.proposal,
                "data-analytics-provider": partner.slug,
                "data-analytics-placement": "profile_aside",
              }}
            />
          </div>

          {partner.hours ? (
            <div className={cardClass}>
              <h2 id="horarios-titulo" className={cardTitleClass}>
                {aside.hours}
              </h2>
              <p className="leading-relaxed whitespace-pre-line text-fg-muted">{partner.hours}</p>
            </div>
          ) : null}

          {partner.address || partner.coverageZone ? (
            <div className={cardClass}>
              <h2 id="ubicacion-titulo" className={cardTitleClass}>
                {aside.location}
              </h2>
              <LocationMap partner={partner} />
              <address className="flex flex-col leading-relaxed text-fg-muted not-italic">
                {partner.address ? <span>{partner.address}</span> : null}
                {partner.coverageZone ? <span>{partner.coverageZone}</span> : null}
              </address>
              {directions ? (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${asideLink} self-start underline`}
                  data-analytics-event={ANALYTICS_EVENTS.providerActionClicked}
                  data-analytics-action={PROVIDER_ACTIONS.directions}
                  data-analytics-provider={partner.slug}
                >
                  {aside.directions}
                  <Icon name="arrow-right" size={16} strokeWidth={2} />
                  <span className="sr-only"> {partnerProfileContent.head.externalHint}</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {partner.links.length > 0 ? (
            <div className={`${cardClass} gap-1`}>
              <h2 id="contacto-titulo" className={cardTitleClass}>
                {aside.contact}
              </h2>
              <ul className="flex flex-col">
                {partner.links.map((link) => (
                  <li key={link.url}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-11 items-center justify-between gap-3 font-medium text-fg underline-offset-4 hover:underline"
                    >
                      {partnerProfileContent.linkLabel(link.kind)}
                      <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
                      <span className="sr-only"> {partnerProfileContent.head.externalHint}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </Section>
  );
}
