import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { META_EVENTS } from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { whatsapp } = presupuestoContent.pedidoPage;

/** Dónde está el botón. Viaja como `placement` en el `Contact` del Pixel. */
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
  /** `pedido: true` en el `Contact`: el click vino después de dejar un pedido. */
  readonly afterOrder?: boolean;
  readonly className?: string;
};

/**
 * CTA principal de `/pedido`: abre el chat de WhatsApp de AutoLibre.
 *
 * `<a>` nativo y no `next/link`: sale del sitio, el router no aporta nada. Sin
 * "use client": el `Contact` del Pixel lo manda el listener delegado de
 * `MetaPixelEvents` leyendo `data-meta-event` y `data-meta-placement`, así que
 * puede vivir en secciones server (y también adentro de la isla del form).
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
      data-meta-event={META_EVENTS.contact}
      data-meta-placement={placement}
      data-meta-pedido={afterOrder ? "" : undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
    >
      <Icon name="whatsapp" size={size === "lg" ? 22 : 18} strokeWidth={1.8} />
      {label}
    </a>
  );
}
