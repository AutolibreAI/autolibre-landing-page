import Image from "next/image";
import Link from "next/link";
import { DownloadCta } from "@/components/ui/download-cta";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavCtaLink } from "@/components/layout/nav-cta";
import { Container } from "@/components/ui/container";
import { siteContent } from "@/lib/content/site";
import type { NavCta, NavLink } from "@/lib/content/types";

type SiteHeaderProps = {
  /**
   * Enlaces de sección de la home. En páginas internas se omiten para no
   * ofrecer anclas que no existen en esa página.
   */
  readonly showSectionLinks?: boolean;
  /** Link secundario de la derecha (cambia entre home y /proveedores). */
  readonly secondary?: NavLink;
  /** CTA de la derecha. Default: descarga; `/pedido` manda WhatsApp. */
  readonly cta?: NavCta;
  /**
   * Ruta de la página que renderiza el header. Marca con
   * `aria-current="page"` el link que apunta a ella. Viaja como prop (y no
   * con `usePathname`) para que el header siga siendo un Server Component.
   */
  readonly currentPath?: string;
};

/**
 * Clases de los dos links de texto de la derecha ("Pedir presupuesto" y el
 * secundario). `min-h-11`: 44px de área táctil (tablets) sin cambiar el alto
 * del header. La página actual se marca con color Y subrayado: el color solo
 * no alcanza como señal (WCAG 1.4.1).
 */
const headerTextLink =
  "inline-flex min-h-11 items-center text-sm font-medium whitespace-nowrap text-ink/70 transition-colors hover:text-brand aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

/**
 * Header sticky. Es un Server Component: sólo el menú mobile necesita
 * estado, y ese es el único pedazo que se hidrata en el cliente.
 *
 * Qué se ve en cada ancho (lo que se oculta, está en el menú mobile):
 * - < sm: logo + botón de menú.
 * - sm: + CTA.
 * - md: + "Pedir presupuesto".
 * - lg: + link secundario ("Soy proveedor"). En páginas internas acá ya está
 *   todo a la vista y el botón de menú se va.
 * - xl (solo home): + anclas de sección, y recién ahí se va el menú. En `lg`
 *   las cuatro anclas más los dos links y el CTA no entran en 1024px.
 */
export function SiteHeader({
  showSectionLinks = true,
  secondary = siteContent.nav.providerLink,
  cta = siteContent.nav.cta,
  currentPath,
}: SiteHeaderProps) {
  const links = showSectionLinks ? siteContent.nav.links : [];
  const { quoteLink } = siteContent.nav;
  /**
   * Sólo el CTA de descarga cambia de destino según la plataforma. Las
   * páginas que pisan `cta` con otra acción (p. ej. /proveedores, /pedido)
   * quedan con su link tal cual.
   */
  const isDownloadCta = cta.href === siteContent.nav.cta.href;
  const current = (href: string) => (href === currentPath ? "page" : undefined);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/92 backdrop-blur-md">
      <Container
        size="wide"
        className="flex h-18 items-center justify-between gap-4"
      >
        <Link href="/" aria-label="AutoLibre — inicio" className="shrink-0">
          {/* No es el LCP de ninguna página (mide 24px de alto): `eager`
              porque siempre está arriba de todo, sin `preload` (en Next 16
              `priority` está deprecado y `preload` es solo para la LCP). */}
          <Image
            src="/brand/lockup-light.png"
            alt="AutoLibre.AI"
            width={676}
            height={132}
            loading="eager"
            /* Sin `sizes`, next/image arma el srcset en 1x/2x sobre `width`
               y el browser se baja la variante de 1920px para 123 de alto. */
            sizes="123px"
            className="h-6 w-auto"
          />
        </Link>

        {links.length > 0 ? (
          <nav
            aria-label="Secciones"
            className="hidden items-center gap-7 xl:flex"
          >
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[0.9375rem] font-medium text-ink transition-colors hover:text-brand"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="flex items-center gap-4 lg:gap-6">
          <nav aria-label="Páginas" className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href={quoteLink.href}
                  aria-current={current(quoteLink.href)}
                  className={headerTextLink}
                >
                  {quoteLink.label}
                </Link>
              </li>
              <li className="hidden lg:block">
                <Link
                  href={secondary.href}
                  aria-current={current(secondary.href)}
                  className={headerTextLink}
                >
                  {secondary.label}
                </Link>
              </li>
            </ul>
          </nav>
          {isDownloadCta ? (
            <DownloadCta className="hidden sm:contents" />
          ) : (
            <NavCtaLink cta={cta} className="hidden sm:inline-flex" />
          )}
          <MobileNav
            links={links}
            pageLinks={[quoteLink, secondary]}
            cta={cta}
            isDownloadCta={isDownloadCta}
            currentPath={currentPath}
            hideFrom={links.length > 0 ? "xl" : "lg"}
          />
        </div>
      </Container>
    </header>
  );
}
