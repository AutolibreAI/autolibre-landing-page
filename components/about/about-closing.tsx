import { aboutSectionTitle } from "@/components/about/styles";
import { inlineLink } from "@/components/marketing/styles";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS, APP_STORES, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { aboutContent } from "@/lib/content/about";
import { siteContent } from "@/lib/content/site";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

/**
 * Cierre de "Sobre nosotros": la frase de la marca, la app (links de texto a
 * las tiendas) y las dos acciones del sitio, "Hacé tu pedido" (principal) y
 * "Sumá tu negocio". Reemplaza a la banda verde de cierre
 * (`ClosingCtaSection`).
 *
 * Medición: las tiendas mantienen `app_store_clicked` con `placement:
 * "closing_cta"` (lo que medía la banda vieja en esta página); el pedido es
 * `quote_cta_clicked` `about_closing` y el negocio,
 * `partner_register_started` `about_closing`.
 */
export function AboutClosing() {
  const { title, appText, quoteCta, partnerCta } = aboutContent.closing;
  const { stores, nav } = siteContent;

  return (
    <Section
      spacing="sm"
      aria-labelledby="sobre-nosotros-cierre"
      className="bg-card pt-0 pb-10 md:pt-0 md:pb-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-6 border-t border-fg pt-7 md:pt-12">
        <div className="min-w-0 flex-[1_1_26rem]">
          <h2 id="sobre-nosotros-cierre" className={`max-w-175 ${aboutSectionTitle}`}>
            {title}
          </h2>
          <p className="mt-3 text-fg-muted">
            {appText}{" "}
            {stores.map((store, index) => (
              <span key={store.id}>
                {index > 0 ? <span aria-hidden="true"> · </span> : null}
                <a
                  href={store.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={inlineLink}
                  data-analytics-event={ANALYTICS_EVENTS.appStoreClicked}
                  data-analytics-store={APP_STORES[store.id]}
                  data-analytics-placement="closing_cta"
                >
                  {store.name}
                  <span className="sr-only"> {nav.externalHint}</span>
                </a>
              </span>
            ))}
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2.5 sm:w-auto">
          <ButtonLink
            href={nav.quoteLink.href}
            variant="primary"
            size="52"
            className="max-sm:flex-1"
            data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
            data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.aboutClosing}
          >
            {quoteCta}
          </ButtonLink>
          <ButtonLink
            href={PROVEEDORES_REGISTRO_PATH}
            variant="outline"
            size="52"
            className="max-sm:flex-1"
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
            data-analytics-placement="about_closing"
          >
            {partnerCta}
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
