import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS, LEAD_SOURCES } from "@/lib/analytics/events";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { whatsapp } = presupuestoContent.pedidoPage;

/**
 * Dónde está el botón. Viaja como `placement` en `whatsapp_clicked` (y en su
 * equivalente de Meta: el `Lead` de WhatsApp, o el `Contact` en
 * `confirmation`).
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
   * El click vino después de dejar un pedido: sale con `pedido: true` y sin
   * `lead_source`, así en Meta es `Contact` y NO `Lead` (esa persona ya contó
   * como `Lead`).
   */
  readonly afterOrder?: boolean;
  readonly className?: string;
};

/**
 * CTA principal de `/pedido`: abre el chat de WhatsApp de AutoLibre.
 *
 * Medición: `whatsapp_clicked` con el `placement`. Abrir el chat es una de
 * las dos conversiones de la campaña, así que lleva `lead_source:
 * "whatsapp"` (el form manda el suyo con `"form"`) y en Meta sale como
 * `Lead`. La excepción es `afterOrder` (el botón de la confirmación): esa
 * persona ya contó como `Lead` al enviar el form, y otro `Lead` la contaría
 * dos veces; va sin `lead_source` y con `pedido: true` (en Meta, `Contact`).
 *
 * `<a>` nativo y no `next/link`: sale del sitio, el router no aporta nada. Sin
 * "use client": el evento lo manda el listener delegado de `AnalyticsEvents`
 * leyendo los `data-analytics-*`, así que puede vivir en secciones server (y
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
      data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
      data-analytics-lead-source={afterOrder ? undefined : LEAD_SOURCES.whatsapp}
      data-analytics-placement={placement}
      data-analytics-pedido={afterOrder ? "" : undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
    >
      <Icon name="whatsapp" size={size === "lg" ? 22 : 18} strokeWidth={1.8} />
      {label}
    </a>
  );
}
