import Image from "next/image";
import Link from "next/link";
import { sectionLead, sectionTitle } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/**
 * "Todo lo que podés pedir": seis servicios con su ícono 3D y una línea con
 * el resto. Todos llevan a `/pedido` (no hay páginas por servicio): es el
 * enlazado interno del Home al pedido, con el nombre del servicio como texto
 * del link. Server Component, sin JS.
 */
export function ServicesSection() {
  const { title, subtitle, items, alsoLabel, also, more, href } = homeContent.services;
  const trackProps = {
    "data-analytics-event": ANALYTICS_EVENTS.quoteCtaClicked,
    "data-analytics-quote-placement": QUOTE_CTA_PLACEMENTS.homeServices,
  };

  return (
    <Section id="servicios" tone="canvas" spacing="md" aria-labelledby="servicios-title">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 id="servicios-title" className={sectionTitle}>
          {title}
        </h2>
        <p className={sectionLead}>{subtitle}</p>
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={href}
              {...trackProps}
              className="flex h-full flex-col items-center gap-2 rounded-card border border-card-line bg-card px-2.5 pt-4.5 pb-3.5 text-center text-control font-medium text-fg transition-colors hover:border-action motion-reduce:transition-none"
            >
              <Image
                src={item.icon.src}
                alt=""
                width={item.icon.width}
                height={item.icon.height}
                sizes="64px"
                className="size-16"
              />
              {item.label}
            </Link>
          </li>
        ))}
      </ul>

      <p className="mx-auto mt-5 max-w-215 text-center text-control leading-loose text-fg-muted">
        {alsoLabel}{" "}
        {also.map((label) => (
          <span key={label}>
            <Link href={href} {...trackProps} className="font-medium text-fg underline underline-offset-4 hover:text-brand-hover">
              {label}
            </Link>
            {" · "}
          </span>
        ))}
        <Link href={href} {...trackProps} className="font-medium text-fg underline underline-offset-4 hover:text-brand-hover">
          {more}
        </Link>
      </p>
    </Section>
  );
}
