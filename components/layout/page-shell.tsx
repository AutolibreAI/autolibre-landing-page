import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCta } from "@/lib/content/types";

type PageShellProps = {
  readonly children: React.ReactNode;
  /** Botón de la derecha del header (única variación permitida). */
  readonly cta?: NavCta;
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
