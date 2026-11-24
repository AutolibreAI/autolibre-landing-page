import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/**
 * Banda oscura "¿Tenés un taller o prestás un servicio?" al pie del perfil de
 * un proveedor (rediseño 2026-11): fondo `action`, texto `on-dark` (11:1) y
 * "Sumate a AutoLibre" en `accent`. El alta carga Clerk: sin prefetch.
 */
export function ProviderBandSection({ placement }: { readonly placement: string }) {
  const { title, subtitle, register: cta } = homeContent.providerBand;

  return (
    <Section tone="action" spacing="sm" aria-labelledby="banda-negocios" className="border-b border-action-hover py-11 md:py-11">
      <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-5">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 id="banda-negocios" className="font-display text-xl font-bold text-white md:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 text-on-dark">{subtitle}</p>
        </div>
        <ButtonLink
          href={cta.href}
          prefetch={false}
          variant="accent"
          size="48"
          data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
          data-analytics-placement={placement}
        >
          {cta.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
