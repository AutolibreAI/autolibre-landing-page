import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersPlansContent } from "@/lib/content/providers-plans";

/**
 * Banda que promociona los planes pagos desde `/proveedores/registro`. Mismo
 * patrón que `QuotesSection` (home): banda `ink`, título + CTA, server
 * component sin isla de cliente.
 */
export function ProvidersPlansBannerSection() {
  const { title, subtitle, cta } = providersPlansContent.banner;

  return (
    <Section tone="ink" spacing="sm" aria-labelledby="plans-banner-title">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <SectionHeading
          as="h2"
          size="sm"
          onDark
          id="plans-banner-title"
          title={title}
          subtitle={subtitle}
          className="max-w-140"
        />
        <ButtonLink
          href={cta.href}
          size="lg"
          variant="inverse"
          className="shrink-0"
          data-analytics-event={ANALYTICS_EVENTS.providerPlansCtaClicked}
        >
          {cta.label}
        </ButtonLink>
      </div>
    </Section>
  );
}
