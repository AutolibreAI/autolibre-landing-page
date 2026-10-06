import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { siteContent } from "@/lib/content/site";

/**
 * Pedido de presupuesto, justo debajo del hero. Server component puro, sin
 * islas de cliente: el CTA principal es un link a `/pedido` (el mismo destino
 * que el "Pedir presupuesto" del header) y WhatsApp es un `<a>` externo.
 *
 * Banda ink a todo el ancho: nace de la onda con la que termina el hero, así
 * que las dos secciones se leen unidas pero con fondo propio. Sin imagen a
 * propósito: la captura del chat ya está en el hero y en `DiagnosticsSection`.
 *
 * Alineación: el título arranca en el borde izquierdo del contenedor (el
 * mismo eje que el `<h1>`). Los dos botones van centrados en su bloque:
 * debajo del título en mobile/tablet, y en la columna derecha en desktop.
 */
export function QuotesSection() {
  const { titleLines, subtitle, ctaLabel, whatsapp } =
    presupuestoContent.section;
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

        <div className="flex flex-wrap justify-center gap-3 lg:flex-1">
          <ButtonLink href={quoteLink.href} size="lg">
            {ctaLabel}
          </ButtonLink>
          {/* `<a>` nativo y no `ButtonLink`: sale del sitio, el router de
            `next/link` no aporta nada (mismo criterio que `StoreLinks`).
            `data-analytics-event`: lo mide `AnalyticsEvents` con un
            listener delegado, así esta sección sigue siendo server. Sin
            `lead_source`: en Meta es `Contact`, no `Lead`. */}
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
