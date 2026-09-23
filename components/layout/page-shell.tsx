import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { NavCta, NavLink } from "@/lib/content/types";

type PageShellProps = {
  readonly children: React.ReactNode;
  /** Los anchors de sección sólo existen en la home. */
  readonly showSectionLinks?: boolean;
  readonly secondary?: NavLink;
  readonly cta?: NavCta;
  /** Ruta de la página: marca su link del header con `aria-current`. */
  readonly currentPath?: string;
};

/** Header + main + footer para las páginas que no son la home. */
export function PageShell({
  children,
  showSectionLinks = false,
  secondary,
  cta,
  currentPath,
}: PageShellProps) {
  return (
    <>
      <SiteHeader
        showSectionLinks={showSectionLinks}
        secondary={secondary}
        cta={cta}
        currentPath={currentPath}
      />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
