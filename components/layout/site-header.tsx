import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { siteContent } from "@/lib/content/site";
import type { NavLink } from "@/lib/content/types";

type SiteHeaderProps = {
  /**
   * Enlaces de sección de la home. En páginas internas se omiten para no
   * ofrecer anclas que no existen en esa página.
   */
  readonly showSectionLinks?: boolean;
  /** Link secundario de la derecha (cambia entre home y /proveedores). */
  readonly secondary?: NavLink;
  readonly cta?: NavLink;
};

/**
 * Header sticky. Es un Server Component: sólo el menú mobile necesita
 * estado, y ese es el único pedazo que se hidrata en el cliente.
 */
export function SiteHeader({
  showSectionLinks = true,
  secondary = siteContent.nav.providerLink,
  cta = siteContent.nav.cta,
}: SiteHeaderProps) {
  const links = showSectionLinks ? siteContent.nav.links : [];

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/92 backdrop-blur-md">
      <div className="w-full px-[6%]">
        <div className="mx-auto flex h-[4.5rem] w-full max-w-[1440px] items-center justify-between gap-4">
        <Link href="/" aria-label="AutoLibre — inicio" className="shrink-0">
          <Image
            src="/brand/lockup-light.png"
            alt="AutoLibre.AI"
            width={676}
            height={132}
            priority
            /* Sin `sizes`, next/image arma el srcset en 1x/2x sobre `width`
               y el browser se baja la variante de 1920px para 123 de alto. */
            sizes="123px"
            className="h-6 w-auto"
          />
        </Link>

        {links.length > 0 ? (
          <nav
            aria-label="Secciones"
            className="hidden items-center gap-7 lg:flex"
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

        <div className="flex items-center gap-4">
          <Link
            href={secondary.href}
            className="hidden text-sm font-medium text-ink/70 transition-colors hover:text-brand sm:block"
          >
            {secondary.label}
          </Link>
          <ButtonLink href={cta.href} className="hidden sm:inline-flex">
            {cta.label}
          </ButtonLink>
          <MobileNav links={links} secondary={secondary} cta={cta} />
          </div>
        </div>
      </div>
    </header>
  );
}
