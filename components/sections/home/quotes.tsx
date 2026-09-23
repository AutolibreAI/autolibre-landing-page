import { QuoteRequestModal } from "@/components/quote-modal/quote-request-modal";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { META_EVENTS } from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";

/**
 * Pedido de presupuesto, justo debajo del hero. Server component — la única
 * isla de cliente es `QuoteRequestModal`, que ya trae su propio "use client".
 *
 * Banda ink a todo el ancho: nace de la onda con la que termina el hero, así
 * que las dos secciones se leen unidas pero con fondo propio. Sin imagen a
 * propósito: la captura del chat ya está en el hero y en `DiagnosticsSection`.
 *
 * Alineación: el título arranca en el borde izquierdo del contenedor (el
 * mismo eje que el `<h1>`) y el CTA cierra contra el borde derecho.
 */
export function QuotesSection() {
  const { titleLines, subtitle, ctaLabel, whatsapp } = presupuestoContent.section;

  return (
    <Section
      id="presupuesto"
      tone="ink"
      spacing="sm"
      aria-labelledby="quotes-title"
      className="selection:bg-brand selection:text-white"
    >
      <Container size="wide">
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
            <QuoteRequestModal size="lg">{ctaLabel}</QuoteRequestModal>
            {/* `<a>` nativo y no `ButtonLink`: sale del sitio, el router de
                `next/link` no aporta nada (mismo criterio que `StoreLinks`).
                `data-meta-event`: lo mide `MetaPixelEvents` con un listener
                delegado, así esta sección sigue siendo server. */}
            <a
              href={whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              data-meta-event={META_EVENTS.contact}
              className={buttonVariants({ variant: "outlineInverse", size: "lg" })}
            >
              {whatsapp.label}
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
}
