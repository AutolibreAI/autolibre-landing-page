import type { VariantProps } from "class-variance-authority";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { NavCta } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type NavCtaLinkProps = Pick<
  VariantProps<typeof buttonVariants>,
  "size" | "block"
> & {
  readonly cta: NavCta;
  /** `placement` del Pixel en este lugar (header o menú mobile). */
  readonly placement?: string;
  readonly className?: string;
  readonly onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

/**
 * CTA del header que no es el de descarga: un link interno (`ButtonLink`,
 * p. ej. "Sumar mi negocio" en `/proveedores`) o uno que sale del sitio
 * (`<a>` nativo con `target="_blank"`, p. ej. WhatsApp en `/pedido`, mismo
 * criterio que `WhatsappLink`).
 *
 * Sin "use client": el evento del Pixel lo manda el listener delegado de
 * `MetaPixelEvents` leyendo `data-meta-event`, `data-meta-placement` y, si
 * el CTA la define, `data-meta-lead-source`. Así lo
 * pueden renderizar el header (server) y `MobileNav` (client) por igual.
 */
export function NavCtaLink({
  cta,
  placement,
  size,
  block,
  className,
  onClick,
}: NavCtaLinkProps) {
  const tracking = cta.tracking
    ? {
        "data-meta-event": cta.tracking.event,
        "data-meta-placement": placement ?? cta.tracking.placement,
        "data-meta-lead-source": cta.tracking.leadSource,
      }
    : {};
  const content = (
    <>
      {cta.icon ? (
        <Icon
          name={cta.icon}
          size={size === "lg" ? 22 : 18}
          strokeWidth={1.8}
        />
      ) : null}
      {cta.label}
    </>
  );

  if (cta.external) {
    return (
      <a
        href={cta.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={cn(buttonVariants({ size, block }), className)}
        {...tracking}
      >
        {content}
      </a>
    );
  }

  return (
    <ButtonLink
      href={cta.href}
      size={size}
      block={block}
      onClick={onClick}
      className={className}
      {...tracking}
    >
      {content}
    </ButtonLink>
  );
}
