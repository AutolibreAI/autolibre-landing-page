import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  ANALYTICS_EVENTS,
  LAYOUT_PLACEMENTS,
  QUOTE_CTA_PLACEMENTS,
} from "@/lib/analytics/events";
import { siteContent } from "@/lib/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Barra fija inferior en celular (debajo de `lg`): "Hacé tu pedido"
 * (principal) y WhatsApp (secundario). Server Component, sin JS: es CSS.
 *
 * Va DESPUÉS del footer y es `sticky bottom-0`, no `fixed`: mientras se
 * scrollea queda pegada al pie de la pantalla, y al llegar al final ocupa su
 * propio lugar debajo del footer. Así nunca tapa el footer ni el último
 * contenido, sin padding de reserva en `<main>` (que habría que mantener
 * sincronizado con el alto de la barra). El área segura del iPhone va en el
 * padding inferior.
 *
 * `data-bottom-bar`: esconde el botón flotante de WhatsApp debajo de `lg`
 * (ver `WhatsappFab`): la barra ya trae WhatsApp y no se duplica.
 *
 * La usan las páginas que la tienen en el diseño con estas dos acciones: la
 * home y el directorio (`PageShell actionBar`). `/pedido`, el perfil de un
 * proveedor y el blog tienen su propia barra hasta que se rehagan.
 */
export function MobileActionBar() {
  const { quoteLink, externalHint } = siteContent.nav;
  const { label, whatsapp } = siteContent.mobileActionBar;

  return (
    <aside
      aria-label={label}
      data-bottom-bar
      // `calc` con `env()`: no hay utility canónica para sumar el área segura.
      // `px-[6%]`: el gutter de `Container`, alineado con el header y el footer.
      className="sticky bottom-0 z-40 flex gap-2.5 border-t border-control-line bg-card px-[6%] pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] lg:hidden"
    >
      <ButtonLink
        href={quoteLink.href}
        variant="primary"
        size="52"
        className="flex-3 px-3"
        data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
        data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.mobileBar}
      >
        {quoteLink.label}
      </ButtonLink>
      <ButtonAnchor
        href={whatsappUrl(whatsapp.text)}
        target="_blank"
        rel="noopener noreferrer"
        variant="outline"
        size="52"
        className="flex-2 px-3"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement={LAYOUT_PLACEMENTS.mobileBar}
      >
        <Icon name="whatsapp" size={20} strokeWidth={2} className="text-status-ok" />
        {whatsapp.label}
        <span className="sr-only"> {externalHint}</span>
      </ButtonAnchor>
    </aside>
  );
}
