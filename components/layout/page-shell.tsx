import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCta } from "@/lib/content/types";

type PageShellProps = {
  readonly children: React.ReactNode;
  readonly cta?: NavCta;
  /** Ruta de la página: marca su link del header con `aria-current`. */
  readonly currentPath?: string;
  /**
   * "Pedir presupuesto" en el header. Default `true`; sólo `/proveedores` lo
   * apaga (ver `SiteHeader`).
   */
  readonly showQuoteLink?: boolean;
};

/**
 * Header + main + footer para las páginas que no son la home. El nav del
 * header es el mismo en todas; la página sólo ajusta las acciones de la
 * derecha (`cta`, `showQuoteLink`).
 */
export function PageShell({
  children,
  cta,
  currentPath,
  showQuoteLink,
}: PageShellProps) {
  return (
    <>
      <SiteHeader
        cta={cta}
        currentPath={currentPath}
        showQuoteLink={showQuoteLink}
      />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
