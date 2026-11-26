import Image from "next/image";
import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { partnerMonogram, safeHttpUrl } from "@/components/proveedores/partner-monogram";
import { ShareProfileButton } from "@/components/proveedores/share-profile-button";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import type { PartnerDetail } from "@/lib/autolibre-api";
import { partnerProfileContent } from "@/lib/content/partner-profile";

type PartnerProfileHeadProps = {
  readonly partner: PartnerDetail;
  readonly breadcrumbs: readonly Crumb[];
  /** Nombres de las familias del negocio, en el orden del catálogo. */
  readonly familyNames: readonly string[];
};

/** Lugar de la cabecera en la medición (`placement`). */
const PLACEMENT = "profile_head";

/**
 * Cabecera del perfil (rediseño 2026-11, parte del perfil de la spec 209):
 * banda `brand-50`, migas, logo (o monograma), el único `h1`, zona y
 * modalidad, las familias y las acciones.
 *
 * Acciones, en orden de conversión: "Pedile una propuesta" (principal, a
 * `/pedido`: el pedido también les llega a otros negocios de la zona),
 * WhatsApp del negocio (secundaria, con borde; solo si hay `redirectLink`,
 * un wa.me con la atribución ya armada) y compartir (isla hoja).
 *
 * Sin `reveal`: es lo primero en pantalla y el `h1` es el LCP (texto del
 * server). El logo es chico (112 px) y va `eager`, sin `preload`: no es el LCP.
 */
export function PartnerProfileHead({ partner, breadcrumbs, familyNames }: PartnerProfileHeadProps) {
  const { head, breadcrumb } = partnerProfileContent;
  const logoUrl = safeHttpUrl(partner.logoUrl);
  const whatsappHref = safeHttpUrl(partner.redirectLink);
  const modality = partner.modality ? partnerProfileContent.modalityLabel(partner.modality) : null;

  return (
    <Section tone="mint" spacing="sm" aria-labelledby="perfil-titulo" className="pt-5 pb-8 md:pt-7 md:pb-12">
      <Breadcrumbs items={breadcrumbs} label={breadcrumb.label} />

      <div className="mt-4 flex flex-wrap items-start gap-x-8 gap-y-6 md:mt-6">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-clip rounded-panel border border-control-line bg-card">
          {logoUrl ? (
            // `unoptimized`: el logo es una URL libre cargada en el admin, sin
            // host fijo para `remotePatterns` (mismo criterio que la tarjeta).
            // `alt=""`: el nombre está al lado, en el `h1`.
            <Image
              src={logoUrl}
              alt=""
              width={112}
              height={112}
              sizes="112px"
              unoptimized
              loading="eager"
              className="size-full object-contain p-2"
            />
          ) : (
            <span aria-hidden="true" className="font-display text-4xl font-bold text-action">
              {partnerMonogram(partner.name)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 grow basis-80 flex-col gap-3">
          <h1
            id="perfil-titulo"
            className="font-display text-3xl leading-tight font-bold tracking-tight text-balance text-fg md:text-5xl"
          >
            {partner.name}
          </h1>
          {partner.coverageZone || modality ? (
            <p className="flex items-start gap-1.5 text-fg-muted">
              <Icon name="pin" size={20} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand-hover" />
              <span>
                {partner.coverageZone ? (
                  <>
                    <span className="sr-only">{head.zoneLabel} </span>
                    {partner.coverageZone}
                  </>
                ) : null}
                {partner.coverageZone && modality ? <span aria-hidden="true"> · </span> : null}
                {modality}
              </span>
            </p>
          ) : null}
          {familyNames.length > 0 ? (
            <ul aria-label={head.familiesLabel} className="mt-1 flex flex-wrap gap-2">
              {familyNames.map((name) => (
                <li key={name} className="rounded-full bg-card px-3.5 py-1.5 text-sm text-fg">
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-center gap-2.5 lg:w-auto">
          <ButtonLink
            href="/pedido"
            variant="primary"
            size="52"
            data-analytics-event={ANALYTICS_EVENTS.providerActionClicked}
            data-analytics-action={PROVIDER_ACTIONS.proposal}
            data-analytics-provider={partner.slug}
            data-analytics-placement={PLACEMENT}
          >
            {head.quote}
          </ButtonLink>
          {whatsappHref ? (
            <ButtonAnchor
              href={whatsappHref}
              target="_blank"
              rel="noopener nofollow"
              variant="outline"
              size="52"
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-provider={partner.slug}
              data-analytics-placement={PLACEMENT}
            >
              <Icon name="whatsapp" size={20} strokeWidth={2} className="text-status-ok" />
              {head.whatsapp}
              <span className="sr-only"> {head.externalHint}</span>
            </ButtonAnchor>
          ) : null}
          <ShareProfileButton
            label={head.share.label}
            copiedLabel={head.share.copied}
            failedLabel={head.share.failed}
            title={partner.name}
          />
        </div>
      </div>
    </Section>
  );
}
