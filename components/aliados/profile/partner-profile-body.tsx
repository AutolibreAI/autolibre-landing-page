import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { PartnerDetail } from "@/lib/autolibre-api";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";

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

const { about, services, faq, aside } = aliadoPerfilContent;

const cardClass = "flex flex-col gap-3 rounded-card border border-line bg-surface p-6";
const cardTitleClass = "font-display text-lg font-bold text-ink";
const factLabelClass = "text-label font-semibold tracking-wider text-brand-hover uppercase";

/** Link a Google Maps: por coordenadas si hay, si no por la dirección. */
function mapsHref(partner: PartnerDetail): string | null {
  const query = partner.geo
    ? `${partner.geo.latitude},${partner.geo.longitude}`
    : partner.address;
  return query
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
    : null;
}

/**
 * Cuerpo del perfil: columna principal (sobre, servicios, preguntas) y una
 * columna lateral de contacto. Dos columnas con `flex-wrap` y bases (600 /
 * 340px) en lugar de breakpoints: la lateral baja sola cuando no entran.
 *
 * Una sola `<section>` (rotulada por su primer `h2`): los bloques de adentro
 * son `div` con su heading, para no anidar regiones con el mismo nombre. La
 * columna lateral es un `<aside>` con su propio rótulo.
 *
 * Cada bloque se renderiza solo si tiene datos. Nunca "Sin información": un
 * bloque vacío no le sirve a nadie y un LLM lo citaría como dato.
 */
export function PartnerProfileBody({ partner, serviceGroups, faqs }: PartnerProfileBodyProps) {
  const modality = partner.modality ? aliadoPerfilContent.modalityLabel(partner.modality) : null;
  const directions = mapsHref(partner);
  const hasContact = partner.links.length > 0 || partner.email !== null;

  const facts = [
    {
      id: "marcas",
      label: services.facts.brands,
      value:
        partner.brands.length > 0
          ? aliadoPerfilContent.joinList(partner.brands)
          : services.facts.allBrands,
    },
    {
      id: "combustible",
      label: services.facts.fuel,
      value:
        partner.fuelTypes.length > 0
          ? aliadoPerfilContent.joinList(partner.fuelTypes.map(aliadoPerfilContent.fuelLabel))
          : services.facts.allFuels,
    },
    ...(modality ? [{ id: "modalidad", label: services.facts.modality, value: modality }] : []),
  ];

  return (
    <Section tone="surface" spacing="md" aria-labelledby={partner.description ? "sobre-titulo" : "servicios-titulo"}>
      <div className="flex flex-wrap gap-12">
        <div className="flex min-w-0 grow-999 basis-150 flex-col gap-14">
          {partner.description ? (
            <div className="flex flex-col gap-4">
              <h2 id="sobre-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
                {about.title(partner.name)}
              </h2>
              <p className="max-w-170 text-lead leading-relaxed whitespace-pre-line text-ink/80">
                {partner.description}
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-8">
            <h2 id="servicios-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
              {services.title}
            </h2>

            {serviceGroups.length > 0 ? (
              <div className="grid gap-8 sm:grid-cols-2">
                {serviceGroups.map((group) => (
                  <div key={group.familySlug} className="flex flex-col gap-3">
                    <h3 className="font-display text-lg font-bold text-ink">{group.familyName}</h3>
                    <ul className="flex flex-col gap-2">
                      {group.services.map((name) => (
                        <li key={name} className="flex items-start gap-2 text-ink/80">
                          <Icon name="check" size={18} strokeWidth={2} className="mt-0.5 shrink-0 text-brand-hover" />
                          {name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}

            <dl className="grid border-t border-ink sm:auto-cols-fr sm:grid-flow-col sm:gap-x-8">
              {facts.map((fact) => (
                <div key={fact.id} className="flex flex-col gap-2 border-b border-line py-5">
                  <dt className={factLabelClass}>{fact.label}</dt>
                  <dd className="font-display text-lg leading-snug font-semibold text-ink">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {faqs.length > 0 ? (
            <div className="flex flex-col gap-6">
              <h2 id="preguntas-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
                {faq.title}
              </h2>
              {/* `<details>` nativo: la respuesta está en el HTML del server
                  aunque arranque cerrada. */}
              <div className="flex flex-col border-t border-line">
                {faqs.map((item) => (
                  <details key={item.question} className="group border-b border-line">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold text-ink [&::-webkit-details-marker]:hidden">
                      {item.question}
                      <Icon
                        name="arrow-right"
                        size={18}
                        strokeWidth={2}
                        className="shrink-0 text-brand-hover transition-transform group-open:rotate-90 motion-reduce:transition-none"
                      />
                    </summary>
                    <p className="pb-5 leading-relaxed whitespace-pre-line text-ink/80">{item.answer}</p>
                  </details>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <aside aria-label={aside.label} className="flex min-w-0 grow basis-85 flex-col gap-6">
          {partner.hours ? (
            <div className={cardClass}>
              <h2 id="horarios-titulo" className={cardTitleClass}>
                {aside.hours}
              </h2>
              <p className="leading-relaxed whitespace-pre-line text-ink/80">{partner.hours}</p>
            </div>
          ) : null}

          {partner.address || partner.coverageZone ? (
            <div className={cardClass}>
              <h2 id="ubicacion-titulo" className={cardTitleClass}>
                {aside.location}
              </h2>
              <address className="flex flex-col gap-1 leading-relaxed text-ink/80 not-italic">
                {partner.address ? <span>{partner.address}</span> : null}
                {partner.coverageZone ? <span>{partner.coverageZone}</span> : null}
              </address>
              {directions ? (
                <a
                  href={directions}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 self-start font-semibold text-brand-hover underline-offset-4 hover:underline"
                >
                  {aside.directions}
                  <Icon name="arrow-right" size={16} strokeWidth={2} />
                  <span className="sr-only"> {aliadoPerfilContent.head.externalHint}</span>
                </a>
              ) : null}
            </div>
          ) : null}

          {hasContact ? (
            <div className={cardClass}>
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
                      className="flex min-h-11 items-center justify-between gap-3 font-medium text-ink underline-offset-4 hover:text-brand-hover hover:underline"
                    >
                      {aliadoPerfilContent.linkLabel(link.kind)}
                      <Icon name="arrow-right" size={16} strokeWidth={2} className="shrink-0" />
                      <span className="sr-only"> {aliadoPerfilContent.head.externalHint}</span>
                    </a>
                  </li>
                ))}
                {partner.email ? (
                  <li>
                    <a
                      href={`mailto:${partner.email}`}
                      className="flex min-h-11 flex-col justify-center font-medium text-ink underline-offset-4 hover:text-brand-hover hover:underline"
                    >
                      <span className="text-sm text-ink/60">{aside.email}</span>
                      <span className="break-all">{partner.email}</span>
                    </a>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 rounded-card bg-ink p-6 text-white">
            <h2 id="presupuesto-titulo" className="font-display text-lg font-bold">
              {aside.quoteCard.title}
            </h2>
            <p className="leading-relaxed text-white/75">{aside.quoteCard.body}</p>
            <ButtonLink href={aside.quoteCard.cta.href} variant="inverse" size="lg" className="mt-2">
              {aside.quoteCard.cta.label}
            </ButtonLink>
          </div>
        </aside>
      </div>
    </Section>
  );
}
