import Link from "next/link";
import { QuoteRequestModal } from "@/components/quote-modal/quote-request-modal";
import { buttonVariants } from "@/components/ui/button";
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
  const { titleLines, subtitle, ctaLabel, whatsapp, pageLink } =
    presupuestoContent.section;

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

        <div className="flex shrink-0 flex-col gap-4">
          <div className="flex flex-wrap gap-3">
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
              className={buttonVariants({
                variant: "outlineInverse",
                size: "lg",
              })}
            >
              {whatsapp.label}
            </a>
          </div>
          {/* Salida terciaria a `/pedido`: link de texto, no botón, para no
            competir con el modal ni con WhatsApp. `min-h-11` es el área
            táctil; `self-start` evita que el link ocupe todo el ancho. */}
          <Link
            href={pageLink.href}
            className="inline-flex min-h-11 items-center self-start text-sm font-medium text-white/80 underline decoration-white/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white"
          >
            {pageLink.label}
          </Link>
        </div>
      </div>
    </Section>
  );
}
