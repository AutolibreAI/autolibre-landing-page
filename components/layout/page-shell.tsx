import { MobileActionBar, type MobileActionBarProps } from "@/components/layout/mobile-action-bar";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PageShellProps = {
  readonly children: React.ReactNode;
  /**
   * `false`: header sin la acción principal "Hacé tu pedido" (ver
   * `SiteHeader`).
   */
  readonly cta?: false;
  /** Ruta de la página: marca su link del header con `aria-current`. */
  readonly currentPath?: string;
  /**
   * Barra fija inferior en celular con "Hacé tu pedido" y WhatsApp
   * (`MobileActionBar`). Solo en las páginas que la tienen en el diseño.
   */
  readonly actionBar?: boolean;
  /** Destino de "Hacé tu pedido" en la barra (ver `MobileActionBar`). */
  readonly actionBarQuoteHref?: string;
  /** Nombre del landmark de la barra (ver `MobileActionBar`). */
  readonly actionBarLabel?: string;
  /** El WhatsApp de la barra cuenta como `Lead` (solo `/pedido`). */
  readonly actionBarWhatsappLead?: boolean;
  /** Resto de las opciones de la barra (perfil de proveedor, entrada al scrollear). */
  readonly actionBarOptions?: Pick<MobileActionBarProps, "quoteLabel" | "provider" | "revealOnScroll">;
};

/** Header + main + footer (+ la barra fija en celular, si la página la pide). */
export function PageShell({
  children,
  cta,
  currentPath,
  actionBar = false,
  actionBarQuoteHref,
  actionBarLabel,
  actionBarWhatsappLead,
  actionBarOptions,
}: PageShellProps) {
  return (
    <>
      <SiteHeader cta={cta} currentPath={currentPath} />
      <main>{children}</main>
      <SiteFooter />
      {actionBar ? (
        <MobileActionBar
          quoteHref={actionBarQuoteHref}
          label={actionBarLabel}
          whatsappLead={actionBarWhatsappLead}
          {...actionBarOptions}
        />
      ) : null}
    </>
  );
}
