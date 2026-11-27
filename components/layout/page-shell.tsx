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
  /**
   * Ruta REAL de la página (no la de su sección): el header marca con
   * `aria-current` su link o el de la sección que la contiene (ver `SiteHeader`).
   */
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
  /**
   * Otra barra fija inferior en lugar de `MobileActionBar` (el blog lleva la
   * de descarga). Va en el mismo lugar: después del footer.
   */
  readonly bottomBar?: React.ReactNode;
};

/** Header + main + footer (+ una barra fija en celular, si la página la pide). */
export function PageShell({
  children,
  cta,
  currentPath,
  actionBar = false,
  actionBarQuoteHref,
  actionBarLabel,
  actionBarWhatsappLead,
  actionBarOptions,
  bottomBar,
}: PageShellProps) {
  // El footer arranca SIEMPRE después del primer `100dvh`: header + `<main>`
  // ocupan como mínimo la pantalla entera y el `<main>` crece para llenarla.
  // En páginas cortas (p. ej. "¿Cerrar sesión?" en `/cuenta?salir=1`) el
  // footer no aparece en la primera pantalla; con más contenido, baja solo.
  return (
    <>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader cta={cta} currentPath={currentPath} />
        <main className="flex-1">{children}</main>
      </div>
      <SiteFooter />
      {actionBar ? (
        <MobileActionBar
          quoteHref={actionBarQuoteHref}
          label={actionBarLabel}
          whatsappLead={actionBarWhatsappLead}
          {...actionBarOptions}
        />
      ) : (
        bottomBar
      )}
    </>
  );
}
