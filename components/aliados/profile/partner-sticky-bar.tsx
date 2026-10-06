import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";

type PartnerStickyBarProps = {
  /** wa.me del negocio (`redirectLink`), ya validado como http(s). */
  readonly whatsappHref: string | null;
};

/**
 * Barra fija al pie del perfil debajo de `md`, mismo patrón que
 * `MobileDownloadBar` del blog: Server Component, siempre visible, sin JS.
 * Va con un separador del mismo alto después del footer, así no tapa nada
 * al llegar al final de la página.
 */
export function PartnerStickyBar({ whatsappHref }: PartnerStickyBarProps) {
  const { head, stickyBar } = aliadoPerfilContent;

  return (
    <>
      <div aria-hidden="true" className="h-24 md:hidden" />
      <aside
        aria-label={stickyBar.label}
        // `data-bottom-bar`: oculta el botón flotante de WhatsApp (ver `WhatsappFab`).
        data-bottom-bar
        // `calc` con `env()`: no hay utility canónica para sumar el área segura
        // del iPhone. `px-[6%]`: el gutter de `Container`.
        className="fixed inset-x-0 bottom-0 z-40 flex gap-3 border-t border-line bg-surface/95 px-[6%] pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden [html:has(#mobile-nav-panel)_&]:invisible"
      >
        <ButtonLink href={head.primaryCta.href} size="lg" className="flex-1">
          {head.primaryCta.label}
        </ButtonLink>
        {whatsappHref ? (
          <ButtonLink
            href={whatsappHref}
            target="_blank"
            rel="noopener nofollow"
            variant="outline"
            size="lg"
            className="bg-surface"
          >
            <Icon name="whatsapp" size={20} strokeWidth={1.8} />
            {head.whatsapp}
            <span className="sr-only"> {head.externalHint}</span>
          </ButtonLink>
        ) : null}
      </aside>
    </>
  );
}
