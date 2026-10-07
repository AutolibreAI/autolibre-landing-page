import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { siteContent } from "@/lib/content/site";

/**
 * Pedido de presupuesto de la home, más abajo en la página. Server component
 * y SIN isla de cliente: el botón es un link a `/pedido`, igual que los del
 * header, el hero y el footer (misma etiqueta, mismo destino). Ya no abre un
 * formulario en una ventana superpuesta.
 *
 * Banda ink a todo el ancho. Sin imagen a propósito: la captura del chat ya
 * está en el hero y en `DiagnosticsSection`.
 *
 * Alineación: el título arranca en el borde izquierdo del contenedor (el
 * mismo eje que el `<h1>`) y el CTA cierra contra el borde derecho.
 */
export function QuotesSection() {
  const { titleLines, subtitle, whatsapp } = presupuestoContent.section;
  const { quoteLink } = siteContent.nav;

  return (
    <Section
      id="presupuesto"
      tone="ink"
      spacing="sm"
      aria-labelledby="quotes-title"
      className="selection:bg-brand selection:text-white"
    >
      <div className="reveal-group flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-16">
        <SectionHeading
          as="h2"
          size="md"
          onDark
          id="quotes-title"
          title={
            <>
              {titleLines[0]}
              <br />
              {titleLines[1]}
            </>
          }
          subtitle={subtitle}
          className="max-w-140"
        />

        <div className="flex shrink-0 flex-wrap gap-3">
          {/* `data-analytics-*`: lo mide `AnalyticsEvents` con un listener
              delegado, así esta sección sigue siendo server. */}
          <ButtonLink
            href={quoteLink.href}
            size="lg"
            data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
            data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.homeQuotes}
          >
            {quoteLink.label}
          </ButtonLink>
          {/* `<a>` nativo y no `ButtonLink`: sale del sitio, el router de
              `next/link` no aporta nada (mismo criterio que `StoreLinks`).
              Sin `lead_source`: en Meta es `Contact`, no `Lead`. */}
          <a
            href={whatsapp.href}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement="home_quotes"
            className={buttonVariants({
              variant: "outlineInverse",
              size: "lg",
            })}
          >
            {whatsapp.label}
          </a>
        </div>
      </div>
    </Section>
  );
}
