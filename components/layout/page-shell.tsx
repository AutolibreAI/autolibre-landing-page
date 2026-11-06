import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

type PageShellProps = {
  readonly children: React.ReactNode;
  /**
   * `false`: header sin CTA (ver `SiteHeader`). Sin la prop, "Descargar la
   * app" como en todo el sitio.
   */
  readonly cta?: false;
  /** Ruta de la página: marca su link del header con `aria-current`. */
  readonly currentPath?: string;
};

/** Header + main + footer. El header es el mismo en todas las páginas. */
export function PageShell({ children, cta, currentPath }: PageShellProps) {
  return (
    <>
      <SiteHeader cta={cta} currentPath={currentPath} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
