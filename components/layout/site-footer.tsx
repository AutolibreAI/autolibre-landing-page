import Image from "next/image";
import Link from "next/link";
import { LAYOUT_IDS } from "@/components/layout/ids";
import { Container } from "@/components/ui/container";
import {
  ANALYTICS_EVENTS,
  LAYOUT_PLACEMENTS,
  QUOTE_CTA_PLACEMENTS,
} from "@/lib/analytics/events";
import { siteContent } from "@/lib/content/site";
import { siteConfig } from "@/lib/seo/config";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

/** Es un link externo si sale del sitio (redes, tiendas, WhatsApp). El mail no abre pestaña. */
function opensNewTab(href: string) {
  return /^https?:\/\//.test(href);
}

/** Medición de los links del footer, con el listener delegado (`data-analytics-*`). */
function analyticsFor(href: string): Record<`data-${string}`, string> {
  if (href === siteContent.nav.quoteLink.href) {
    return {
      "data-analytics-event": ANALYTICS_EVENTS.quoteCtaClicked,
      "data-analytics-quote-placement": QUOTE_CTA_PLACEMENTS.footer,
    };
  }
  if (href === PROVEEDORES_REGISTRO_PATH) {
    return {
      "data-analytics-event": ANALYTICS_EVENTS.partnerRegisterStarted,
      "data-analytics-placement": LAYOUT_PLACEMENTS.footer,
    };
  }
  if (href === siteConfig.contact.whatsappChat) {
    return {
      "data-analytics-event": ANALYTICS_EVENTS.whatsappClicked,
      "data-analytics-placement": LAYOUT_PLACEMENTS.footer,
    };
  }
  return {};
}

/**
 * Link del footer. Debajo de `lg`, `min-h-11`: 44px de área táctil (los
 * grupos van sin `gap` en celular para que el alto no se duplique).
 */
function FooterLink({ href, label, className }: { href: string; label: string; className: string }) {
  const external = opensNewTab(href);
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...analyticsFor(href)}
      className={className}
    >
      {label}
      {external ? <span className="sr-only"> {siteContent.nav.externalHint}</span> : null}
    </Link>
  );
}

/**
 * Pie del sistema "AutoLibre AI": fondo `action`, logo con su bajada, cuatro
 * grupos de links y la fila del copyright con las redes. Server Component.
 * Todo sale de `siteContent.footer` (que arma los links desde `siteConfig`).
 *
 * Contraste sobre `action`: títulos en `card` (17+:1), links en `on-dark`
 * (11.00:1), bajada, copyright y redes en `on-dark-muted` (7.74:1).
 */
export function SiteFooter() {
  const { tagline, groups, social, socialLabel, copyright } = siteContent.footer;

  return (
    <footer id={LAYOUT_IDS.footer} className="bg-action pt-10 pb-8 text-on-dark md:pt-16">
      <Container size="wide">
        {/* Desde `lg`, una fila: el logo con su bajada más ancho y los cuatro
            grupos parejos. Valor arbitrario porque no hay utility para una
            grilla de columnas desiguales. */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-8 md:grid-cols-3 lg:grid-cols-[minmax(0,1.6fr)_repeat(4,minmax(0,1fr))] lg:gap-x-12">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link href="/" aria-label="AutoLibre, inicio" className="inline-flex">
              <Image
                src="/brand/lockup-dark.png"
                alt="AutoLibre.AI"
                width={676}
                height={132}
                sizes="143px"
                className="h-7 w-auto"
              />
            </Link>
            <p className="mt-3.5 max-w-70 text-sm text-on-dark-muted">{tagline}</p>
          </div>

          {groups.map((group) => (
            <nav key={group.id} aria-label={group.title}>
              <p className="mb-1 text-sm font-semibold text-card lg:mb-3">{group.title}</p>
              <ul className="flex flex-col lg:gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <FooterLink
                      href={link.href}
                      label={link.label}
                      className="inline-flex items-center text-sm text-on-dark transition-colors hover:text-card hover:underline motion-reduce:transition-none max-lg:min-h-11"
                    />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-on-dark-subtle/40 pt-5 text-label text-on-dark-muted">
          <p>{copyright}</p>
          <nav aria-label={socialLabel}>
            <ul className="flex flex-wrap gap-x-5">
              {social.map((link) => (
                <li key={link.href}>
                  <FooterLink
                    href={link.href}
                    label={link.label}
                    className="inline-flex items-center underline underline-offset-4 transition-colors hover:text-card motion-reduce:transition-none max-lg:min-h-11"
                  />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
