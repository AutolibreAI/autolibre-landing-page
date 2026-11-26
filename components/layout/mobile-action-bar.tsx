import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  ANALYTICS_EVENTS,
  LAYOUT_PLACEMENTS,
  LEAD_SOURCES,
  PROVIDER_ACTIONS,
  QUOTE_CTA_PLACEMENTS,
} from "@/lib/analytics/events";
import { siteContent } from "@/lib/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

export type MobileActionBarProps = {
  /** Default: `/pedido`. Un ancla (`#pedido`) si la página ya tiene el módulo. */
  readonly quoteHref?: string;
  /** Texto del botón principal. Default: "Hacé tu pedido". */
  readonly quoteLabel?: string;
  /** Nombre del landmark. */
  readonly label?: string;
  /** El WhatsApp de AutoLibre cuenta como `Lead` (solo `/pedido`). */
  readonly whatsappLead?: boolean;
  /**
   * Perfil de un proveedor: su slug y su WhatsApp (`wa.me` ya validado, o
   * `null` si no tiene; entonces va el de AutoLibre). Cambia la medición: el
   * botón principal es `provider_action_clicked` (`proposal`) y el WhatsApp
   * lleva `provider`, como el resto del perfil.
   */
  readonly provider?: { readonly slug: string; readonly whatsappHref: string | null };
  /**
   * La barra entra al scrollear (en vez de estar desde la carga). Para las
   * páginas con el módulo de pedido arriba de todo (Home y `/pedido`): ahí
   * la barra repite la acción que ya está a la vista y, al cargar, tapaba los
   * chips de "Lo más pedido" (Lighthouse `target-size`, pendiente de la 4a).
   * Ver `[data-reveal-on-scroll]` en `app/globals.css`.
   */
  readonly revealOnScroll?: boolean;
};

/**
 * Barra fija inferior en celular (debajo de `lg`): "Hacé tu pedido"
 * (principal) y WhatsApp (secundario, con borde). Server Component, sin JS:
 * es CSS.
 *
 * Va DESPUÉS del footer y es `sticky bottom-0`, no `fixed`: mientras se
 * scrollea queda pegada al pie de la pantalla, y al llegar al final ocupa su
 * propio lugar debajo del footer. Así nunca tapa el footer ni el último
 * contenido, sin padding de reserva en `<main>`. El área segura del iPhone va
 * en el padding inferior.
 *
 * `data-bottom-bar`: esconde el botón flotante de WhatsApp debajo de `lg`
 * (ver `WhatsappFab`): la barra ya trae WhatsApp y no se duplica.
 *
 * La usan el Home, `/pedido` y el directorio (`PageShell actionBar`) y el
 * perfil de proveedor ("Pedir propuesta" + el WhatsApp del negocio).
 */
export function MobileActionBar({
  quoteHref,
  quoteLabel,
  label: labelOverride,
  whatsappLead = false,
  provider,
  revealOnScroll = false,
}: MobileActionBarProps = {}) {
  const { quoteLink, externalHint } = siteContent.nav;
  const { label: defaultLabel, whatsapp } = siteContent.mobileActionBar;
  const label = labelOverride ?? defaultLabel;
  const partnerWhatsapp = provider?.whatsappHref ?? null;

  const quoteAnalytics = provider
    ? {
        "data-analytics-event": ANALYTICS_EVENTS.providerActionClicked,
        "data-analytics-action": PROVIDER_ACTIONS.proposal,
        "data-analytics-provider": provider.slug,
        "data-analytics-placement": LAYOUT_PLACEMENTS.mobileBar,
      }
    : {
        "data-analytics-event": ANALYTICS_EVENTS.quoteCtaClicked,
        "data-analytics-quote-placement": QUOTE_CTA_PLACEMENTS.mobileBar,
      };

  return (
    <aside
      aria-label={label}
      data-bottom-bar
      data-reveal-on-scroll={revealOnScroll ? "" : undefined}
      // `calc` con `env()`: no hay utility canónica para sumar el área segura.
      // `px-[6%]`: el gutter de `Container`, alineado con el header y el footer.
      className="sticky bottom-0 z-40 flex gap-2.5 border-t border-control-line bg-card px-[6%] pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <ButtonLink href={quoteHref ?? quoteLink.href} variant="primary" size="52" className="flex-3 px-3" {...quoteAnalytics}>
        {quoteLabel ?? quoteLink.label}
      </ButtonLink>
      <ButtonAnchor
        href={partnerWhatsapp ?? whatsappUrl(whatsapp.text)}
        target="_blank"
        // El WhatsApp del negocio va `nofollow` (link a un tercero, como en la
        // cabecera del perfil); el de AutoLibre, `noreferrer`.
        rel={partnerWhatsapp ? "noopener nofollow" : "noopener noreferrer"}
        variant="outline"
        size="52"
        className="flex-2 px-3"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement={LAYOUT_PLACEMENTS.mobileBar}
        data-analytics-provider={partnerWhatsapp ? provider?.slug : undefined}
        data-analytics-lead-source={whatsappLead ? LEAD_SOURCES.whatsapp : undefined}
      >
        <Icon name="whatsapp" size={20} strokeWidth={2} className="text-status-ok" />
        {whatsapp.label}
        <span className="sr-only"> {externalHint}</span>
      </ButtonAnchor>
    </aside>
  );
}
