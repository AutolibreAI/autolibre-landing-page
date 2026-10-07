import Image from "next/image";
import Link from "next/link";
import { DownloadCta } from "@/components/ui/download-cta";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavCtaLink } from "@/components/layout/nav-cta";
import { Container } from "@/components/ui/container";
import { ANALYTICS_EVENTS, QUOTE_CTA_PLACEMENTS } from "@/lib/analytics/events";
import { siteContent } from "@/lib/content/site";
import type { NavCta } from "@/lib/content/types";

type SiteHeaderProps = {
  /**
   * Botón de la derecha. Default: descarga. Es la ÚNICA variación que una
   * página puede pedir (`/proveedores` y `/pedido` tienen su propia
   * conversión): los links del header son los mismos en todo el sitio y por
   * eso este componente no acepta props para cambiarlos.
   */
  readonly cta?: NavCta;
  /**
   * Ruta de la página que renderiza el header. Marca con
   * `aria-current="page"` el link que apunta a ella. Viaja como prop (y no
   * con `usePathname`) para que el header siga siendo un Server Component.
   */
  readonly currentPath?: string;
};

/**
 * Clases de los links de texto del header. `min-h-11`: 44px de área táctil
 * (tablets) sin cambiar el alto del header. La página actual se marca con
 * color Y subrayado: el color solo no alcanza como señal (WCAG 1.4.1).
 */
const headerLink =
  "inline-flex min-h-11 items-center font-medium whitespace-nowrap transition-colors hover:text-brand aria-[current=page]:text-ink aria-[current=page]:underline aria-[current=page]:decoration-brand aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";
/** Anclas de la home y Blog: el tamaño de siempre. */
const sectionLink = `${headerLink} text-[0.9375rem] text-ink`;
/** "Pedí tu presupuesto" y "Soy proveedor": más livianos que las anclas. */
const pageLink = `${headerLink} text-sm text-ink/70`;

/**
 * Header sticky. Es un Server Component: sólo el menú mobile necesita
 * estado, y ese es el único pedazo que se hidrata en el cliente.
 *
 * Es IGUAL en todas las páginas (contrato: `specs/210-header-hero-clarity/
 * contracts/header-nav.md`). Qué se ve en cada ancho (lo que se oculta, está
 * en el menú mobile):
 * - < sm: logo + botón de menú.
 * - sm: + CTA.
 * - md: + "Pedí tu presupuesto".
 * - lg: + "Soy proveedor".
 * - xl: + anclas de sección y Blog, y recién ahí se va el menú.
 */
export function SiteHeader({
  cta = siteContent.nav.cta,
  currentPath,
}: SiteHeaderProps) {
  const { links, quoteLink, providerLink } = siteContent.nav;
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

        <nav
          aria-label="Secciones"
          className="hidden items-center gap-7 xl:flex"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={current(link.href)}
              className={sectionLink}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 lg:gap-6">
          <nav aria-label="Páginas" className="hidden md:block">
            <ul className="flex items-center gap-6">
              <li>
                <Link
                  href={quoteLink.href}
                  aria-current={current(quoteLink.href)}
                  data-analytics-event={ANALYTICS_EVENTS.quoteCtaClicked}
                  data-analytics-quote-placement={QUOTE_CTA_PLACEMENTS.header}
                  className={pageLink}
                >
                  {quoteLink.label}
                </Link>
              </li>
              <li className="hidden lg:block">
                <Link
                  href={providerLink.href}
                  aria-current={current(providerLink.href)}
                  className={pageLink}
                >
                  {providerLink.label}
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
            pageLinks={[quoteLink, providerLink]}
            quoteHref={quoteLink.href}
            cta={cta}
            isDownloadCta={isDownloadCta}
            currentPath={currentPath}
          />
        </div>
      </Container>
    </header>
  );
}
