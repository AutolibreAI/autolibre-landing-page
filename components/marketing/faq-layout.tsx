import Link from "next/link";
import { ButtonAnchor } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { faqContent } from "@/lib/content/faq";
import { siteContent } from "@/lib/content/site";
import { siteConfig } from "@/lib/seo/config";
import { inlineLink } from "./styles";

type FaqLayoutProps = {
  /** Columna izquierda, arriba: eyebrow, título y bajada (o el índice). */
  readonly intro: React.ReactNode;
  /** Columna derecha: los grupos de preguntas. */
  readonly children: React.ReactNode;
  /** Columna izquierda, debajo de la intro: la tarjeta de contacto. */
  readonly aside: React.ReactNode;
};

/**
 * Grilla de la FAQ (Home y `/preguntas-frecuentes`). Sin JS.
 *
 * El orden del DOM es intro → preguntas → tarjeta: es el orden de lectura y
 * de foco, y en celular (una columna) la tarjeta queda al final sin trucos.
 * Desde `lg`, dos columnas: la intro y la tarjeta a la izquierda y las
 * preguntas a la derecha, ocupando las dos filas. La tarjeta es `sticky`
 * (solo CSS) mientras corre la lista; la intro sube con la página.
 */
export function FaqLayout({ intro, children, aside }: FaqLayoutProps) {
  return (
    <div
      // Fila 1 al alto de la intro y fila 2 estirada (`auto 1fr`): así la
      // tarjeta arranca pegada a la intro y tiene recorrido para el sticky.
      // No hay utility canónica para esa plantilla de filas.
      className="flex flex-col gap-10 lg:grid lg:grid-cols-12 lg:grid-rows-[auto_1fr] lg:gap-x-12 lg:gap-y-8"
    >
      <div className="min-w-0 lg:col-span-4 lg:row-start-1">{intro}</div>
      <div className="min-w-0 lg:col-span-8 lg:col-start-5 lg:row-span-2 lg:row-start-1">
        {children}
      </div>
      <div className="min-w-0 lg:sticky lg:top-24 lg:col-span-4 lg:row-start-2 lg:self-start">
        {aside}
      </div>
    </div>
  );
}

type FaqContactCardProps = {
  /** Nivel del título según el outline de la página. */
  readonly headingAs: "h2" | "h3";
  readonly headingId: string;
  /** Pedido: el ancla del módulo en el Home, `/pedido` en el resto. */
  readonly pedidoHref: string;
  /** `data-analytics-placement` del WhatsApp y del link al pedido. */
  readonly placement:
    | typeof QUOTE_CTA_PLACEMENTS.homeFaq
    | typeof QUOTE_CTA_PLACEMENTS.faqPage;
};

/**
 * "¿Seguís con dudas?": WhatsApp (variante `whatsapp`, chat sin mensaje
 * precargado de `siteConfig`) y, como secundaria, el pedido. Es un `<aside>`
 * con su propio título.
 */
export function FaqContactCard({ headingAs, headingId, pedidoHref, placement }: FaqContactCardProps) {
  const { contactCard } = faqContent;
  const Heading = headingAs;
  return (
    <aside
      aria-labelledby={headingId}
      className="flex flex-col gap-4 rounded-3xl border border-card-line bg-card p-6 md:p-7"
    >
      <Heading id={headingId} className="font-display text-xl font-bold tracking-tight text-fg">
        {contactCard.title}
      </Heading>
      <p className="text-base text-fg-muted">{contactCard.body}</p>
      <ButtonAnchor
        href={siteConfig.contact.whatsappChat}
        target="_blank"
        rel="noopener noreferrer"
        variant="whatsapp"
        size="48"
        className="self-start max-sm:w-full"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement={placement}
      >
        <Icon name="whatsapp" size={20} strokeWidth={1.8} />
        {contactCard.whatsapp}
        <span className="sr-only"> {siteContent.nav.externalHint}</span>
      </ButtonAnchor>
      <Link
        href={pedidoHref}
        className={`flex min-h-11 items-center text-control ${inlineLink}`}
        data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
        data-analytics-quote-placement={placement}
      >
        {contactCard.pedido}
      </Link>
    </aside>
  );
}
