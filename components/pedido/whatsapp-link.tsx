import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { META_EVENTS, META_LEAD_SOURCES } from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { whatsapp } = presupuestoContent.pedidoPage;

/**
 * Dónde está el botón. Viaja como `placement` en el evento del Pixel: el
 * `Lead` de WhatsApp, o el `Contact` en `confirmation`.
 */
export type WhatsappPlacement =
  | "header"
  | "hero"
  | "sticky_bar"
  | "cta_band"
  | "confirmation";

type WhatsappLinkProps = {
  readonly placement: WhatsappPlacement;
  /** Default: el chat precargado de la página. La confirmación manda el suyo. */
  readonly href?: string;
  readonly label?: string;
  /** Variantes de `buttonVariants` (la home): `primary` sobre claro, `inverse` sobre ink. */
  readonly variant?: "primary" | "inverse";
  readonly size?: "sm" | "md" | "lg";
  readonly block?: boolean;
  /**
   * El click vino después de dejar un pedido: se mide como `Contact` con
   * `pedido: true` y NO como `Lead` (esa persona ya contó como `Lead`).
   */
  readonly afterOrder?: boolean;
  readonly className?: string;
};

/**
 * CTA principal de `/pedido`: abre el chat de WhatsApp de AutoLibre.
 *
 * Medición: abrir el chat es una de las dos conversiones de la campaña, así
 * que se manda como `Lead` con `lead_source: "whatsapp"` (el form manda el
 * suyo con `"form"`) y el `placement`. La excepción es `afterOrder` (el botón
 * de la confirmación): esa persona ya contó como `Lead` al enviar el form, y
 * otro `Lead` la contaría dos veces; va como `Contact` con `pedido: true`.
 *
 * `<a>` nativo y no `next/link`: sale del sitio, el router no aporta nada. Sin
 * "use client": el evento lo manda el listener delegado de `MetaPixelEvents`
 * leyendo los `data-meta-*`, así que puede vivir en secciones server (y
 * también adentro de la isla del form).
 */
export function WhatsappLink({
  placement,
  href = whatsappUrl(whatsapp.text),
  label = whatsapp.label,
  variant = "primary",
  size = "lg",
  block,
  afterOrder = false,
  className,
}: WhatsappLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      data-meta-event={afterOrder ? META_EVENTS.contact : META_EVENTS.lead}
      data-meta-lead-source={afterOrder ? undefined : META_LEAD_SOURCES.whatsapp}
      data-meta-placement={placement}
      data-meta-pedido={afterOrder ? "" : undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
    >
      <Icon name="whatsapp" size={size === "lg" ? 22 : 18} strokeWidth={1.8} />
      {label}
    </a>
  );
}
