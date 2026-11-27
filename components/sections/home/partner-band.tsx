import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/**
 * Tarjeta para negocios al pie del Home: alta, precios y la red. Enlaza a
 * `/proveedores` (el directorio) desde el Home. El alta carga Clerk: sin
 * prefetch.
 */
export function PartnerBandSection() {
  const { title, subtitle, register, plans, network } = homeContent.providerBand;

  return (
    <Section id="proveedor" tone="canvas" spacing="md" aria-labelledby="proveedor-title" className="pt-0 md:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-3xl border border-card-line bg-card p-6 md:p-10">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 id="proveedor-title" className="font-display text-2xl font-bold text-balance text-fg md:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-base text-fg-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <ButtonLink
            href={register.href}
            prefetch={false}
            variant="primary"
            size="48"
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
            data-analytics-placement="home_band"
          >
            {register.label}
          </ButtonLink>
          <ButtonLink href={plans.href} variant="outline" size="48">
            {plans.label}
          </ButtonLink>
          <ButtonLink href={network.href} variant="outline" size="48" className="border-control-line">
            {network.label}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
