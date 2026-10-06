import Image from "next/image";
import { Breadcrumbs, type Crumb } from "@/components/blog/breadcrumbs";
import { partnerMonogram, safeHttpUrl } from "@/components/aliados/partner-monogram";
import { ShareProfileButton } from "@/components/aliados/share-profile-button";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { PartnerDetail } from "@/lib/autolibre-api";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";

type PartnerProfileHeadProps = {
  readonly partner: PartnerDetail;
  readonly breadcrumbs: readonly Crumb[];
  /** Nombres de las familias del negocio, en el orden del catálogo. */
  readonly familyNames: readonly string[];
};

/**
 * Cabecera del perfil: migas, logo (o monograma), el único `h1`, la línea de
 * zona y modalidad, las familias, y las acciones. "Pedir presupuesto" es la
 * principal: el contacto pasa por AutoLibre. El WhatsApp del negocio aparece
 * solo si hay `redirectLink` (un wa.me con el texto de atribución ya armado);
 * nunca se arma un link desde el campo `whatsapp` crudo.
 *
 * Sin `reveal`: es lo que está en pantalla al cargar y el `h1` es la LCP.
 */
export function PartnerProfileHead({ partner, breadcrumbs, familyNames }: PartnerProfileHeadProps) {
  const { head } = aliadoPerfilContent;
  const logoUrl = safeHttpUrl(partner.logoUrl);
  const whatsappHref = safeHttpUrl(partner.redirectLink);
  const modality = partner.modality ? aliadoPerfilContent.modalityLabel(partner.modality) : null;

  return (
    <Section tone="muted" spacing="sm" aria-labelledby="perfil-titulo">
      <Breadcrumbs items={breadcrumbs} />

      <div className="mt-8 flex flex-wrap items-start gap-6 md:mt-10 md:gap-8">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-clip rounded-panel border border-ink/12 bg-surface">
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
            <span aria-hidden="true" className="font-display text-4xl font-bold text-brand-hover">
              {partnerMonogram(partner.name)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 grow basis-80 flex-col gap-3">
          <h1
            id="perfil-titulo"
            className="font-display text-3xl leading-tight font-bold text-balance text-ink md:text-5xl"
          >
            {partner.name}
          </h1>
          {partner.coverageZone || modality ? (
            <p className="flex items-start gap-1.5 text-ink/70">
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
                <li key={name} className="rounded-full bg-surface px-3.5 py-1.5 text-sm text-ink">
                  {name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="flex w-full flex-wrap items-start gap-3 lg:w-auto">
          <ButtonLink href={head.primaryCta.href} size="lg">
            {head.primaryCta.label}
          </ButtonLink>
          {whatsappHref ? (
            <ButtonLink
              href={whatsappHref}
              target="_blank"
              rel="noopener nofollow"
              variant="outline"
              size="lg"
            >
              <Icon name="whatsapp" size={20} strokeWidth={1.8} />
              {head.whatsapp}
              <span className="sr-only"> {head.externalHint}</span>
            </ButtonLink>
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
