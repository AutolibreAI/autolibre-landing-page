import Image from "next/image";
import Link from "next/link";
import {
  HeaderAccountMenu,
  type AnalyticsAttrs,
  type HeaderMenuItem,
  type HeaderSectionLink,
} from "@/components/layout/header-account-menu";
import { HeaderBusinessLink } from "@/components/layout/header-business-link";
import { HeaderNavSubmenu } from "@/components/layout/header-nav-submenu";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { ACCOUNT_PATH } from "@/lib/account/paths";
import {
  ANALYTICS_EVENTS,
  LAYOUT_PLACEMENTS,
  QUOTE_CTA_PLACEMENTS,
  type QuoteCtaPlacement,
} from "@/lib/analytics/events";
import { clerkClientUatCookieName } from "@/lib/auth/session-cookie";
import { SIGN_IN_PATH } from "@/lib/auth/sign-in-redirect";
import { siteContent } from "@/lib/content/site";
import type { AccountMenuEntry, NavSectionLink } from "@/lib/content/types";
import { navCurrent, navCurrentPage } from "@/lib/navigation/nav-current";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";

type SiteHeaderProps = {
  /**
   * `cta={false}`: el header va SIN la acción principal "Hacé tu pedido",
   * ni en desktop ni en el menú mobile. La piden las páginas que son una
   * conversión en sí mismas y no deben sacar a la persona de ahí: `/pedido`
   * (ES el pedido: repetir la acción sería un link a la misma página),
   * `/proveedores/planes` y `/proveedores/registro` (le hablan al negocio:
   * mandarlo a pedir para su auto lo distrae de su conversión).
   *
   * Es la ÚNICA variación que una página puede pedir: los links del header
   * son los mismos en todo el sitio y por eso este componente no acepta
   * props para cambiarlos.
   */
  readonly cta?: false;
  /**
   * Ruta REAL de la página que renderiza el header (la del perfil, la del
   * post), nunca la de su sección. Con ella se marca el link de sección
   * (`navCurrent`): `aria-current="page"` si apunta a esta página y
   * `aria-current="true"` si la página vive dentro de esa sección
   * (`/proveedores/planes` deja marcado "Proveedores"). El resto de los links
   * del header se marca solo por coincidencia exacta. Viaja como prop (y no
   * con `usePathname`) para que el header siga siendo un Server Component.
   */
  readonly currentPath?: string;
};

/**
 * Rutas que cargan Clerk: sus links van sin prefetch desde las páginas
 * públicas. `/proveedores/registro` ya no está: desde la fase 5 es una
 * landing estática sin Clerk (el flujo del alta lo carga recién con `?alta=1`).
 */
const CLERK_ROUTES = [
  ACCOUNT_PATH,
  SIGN_IN_PATH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_CONTRATAR_PATH,
];

function loadsClerk(href: string) {
  const path = href.split(/[?#]/)[0];
  return CLERK_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

function quoteAttrs(placement: QuoteCtaPlacement): AnalyticsAttrs {
  return {
    "data-analytics-event": ANALYTICS_EVENTS.quoteCtaClicked,
    "data-analytics-quote-placement": placement,
  };
}

function joinAttrs(placement: string): AnalyticsAttrs {
  return {
    "data-analytics-event": ANALYTICS_EVENTS.partnerRegisterStarted,
    "data-analytics-placement": placement,
  };
}

/** Opciones del menú de cuenta con prefetch y medición resueltos en el server. */
function resolveMenu(entries: readonly AccountMenuEntry[]): HeaderMenuItem[] {
  return entries.map((entry) =>
    entry.kind === "link"
      ? {
          ...entry,
          noPrefetch: loadsClerk(entry.href),
          analytics:
            entry.href === PROVEEDORES_REGISTRO_PATH
              ? joinAttrs(LAYOUT_PLACEMENTS.accountMenu)
              : undefined,
        }
      : entry,
  );
}

/**
 * Medición de un link del submenú: solo el alta la tiene, como el resto de
 * los "Sumá tu negocio" del layout. El directorio y los precios se ven por el
 * `$pageview` de destino.
 */
function submenuAttrs(href: string): AnalyticsAttrs | undefined {
  return href === PROVEEDORES_REGISTRO_PATH ? joinAttrs(LAYOUT_PLACEMENTS.navSubmenu) : undefined;
}

/**
 * Links de sección para el menú mobile, con los sublinks resueltos. El
 * sublink que apunta a la misma página que su sección (el directorio) NO
 * viaja: en el panel mobile la fila "Proveedores" ya es ese link, y dos
 * links seguidos al mismo destino con nombres distintos confunden.
 */
function resolveSections(links: readonly NavSectionLink[]): HeaderSectionLink[] {
  return links.map(({ label, href, submenu }) => ({
    label,
    href,
    sub: submenu?.links
      .filter((sub) => sub.href !== href)
      .map((sub) => ({
        label: sub.label,
        href: sub.href,
        noPrefetch: loadsClerk(sub.href),
        analytics: submenuAttrs(sub.href),
      })),
  }));
}

/** Id del panel del submenú de un link de sección: `submenu-proveedores`. */
function submenuId(href: string) {
  return `submenu${href.replaceAll("/", "-")}`;
}

/**
 * Clases de los links de sección. `h-11`: 44px de área táctil. La sección
 * actual va con peso Y subrayado en `action`: el color solo no alcanza como
 * señal (WCAG 1.4.1). `aria-[current]` compila a `[aria-current]` (presencia
 * del atributo): se ve igual en la página del link (`page`) y en las que
 * cuelgan de su sección (`true`).
 */
const pageLink =
  "inline-flex h-11 items-center text-control font-medium whitespace-nowrap text-fg-muted transition-colors hover:text-fg motion-reduce:transition-none aria-[current]:font-semibold aria-[current]:text-fg aria-[current]:underline aria-[current]:decoration-action aria-[current]:decoration-2 aria-[current]:underline-offset-8";

/**
 * Header sticky del sistema "AutoLibre AI". Server Component: lo único que
 * se hidrata son tres islas chicas. Dos leen las pistas de sesión y de rol
 * (cookies, sin Clerk): el enlace "Sumá tu negocio" / "Ir a mi negocio" y
 * el botón de cuenta con su menú. La tercera es el comportamiento del
 * submenú de "Proveedores" (`HeaderNavSubmenu`): el link y la lista de
 * sublinks se renderizan acá y viajan como `link` (con `key`) y `children`,
 * así están en el HTML del server aunque el panel arranque cerrado.
 *
 * Es IGUAL en todas las páginas. Qué se ve en cada ancho:
 * - < lg: logo + botón "Menú y cuenta" (links de página, opciones de cuenta
 *   y "Hacé tu pedido" van en el panel).
 * - lg+: logo, Proveedores (con submenú: directorio, alta y precios) ·
 *   Blog · Sobre nosotros, "Sumá tu negocio", botón de cuenta con
 *   desplegable y "Hacé tu pedido". "Sumá tu negocio" está dos veces a
 *   propósito (en el submenú y como enlace propio).
 *
 * El HTML del server siempre es el estado "sin sesión"; con sesión cambian
 * el color del avatar, el texto del enlace de negocio (con el ancho
 * reservado) y las opciones del menú, que solo se ven abierto: sin CLS.
 */
export function SiteHeader({ cta, currentPath }: SiteHeaderProps) {
  const { quoteLink, businessLink, accountMenu } = siteContent.nav;
  const links: readonly NavSectionLink[] = siteContent.nav.links;
  /** Cookie de sesión de Clerk de esta instancia (ver `lib/auth/session-cookie.ts`). */
  const sessionCookie = clerkClientUatCookieName();
  const showCta = cta !== false;

  return (
    <header className="sticky top-0 z-50 border-b border-card-line bg-card">
      <Container size="wide" className="flex h-17 items-center gap-6">
        <Link href="/" aria-label="AutoLibre, inicio" className="flex shrink-0">
          {/* No es el LCP de ninguna página (mide 26px de alto): `eager`
              porque siempre está arriba de todo, sin `preload` (en Next 16
              `priority` está deprecado y `preload` es solo para la LCP). */}
          <Image
            src="/brand/lockup-light.png"
            alt="AutoLibre.AI"
            width={676}
            height={132}
            loading="eager"
            /* Sin `sizes`, next/image arma el srcset en 1x/2x sobre `width`
               y el browser se baja la variante de 1920px para 133 de ancho. */
            sizes="133px"
            className="h-6.5 w-auto"
          />
        </Link>

        <nav aria-label="Principal" className="hidden min-w-0 flex-1 pl-4 lg:block">
          <ul className="flex items-center gap-7">
            {links.map((link) => {
              const sectionLink = (
                <Link
                  key="link"
                  href={link.href}
                  aria-current={navCurrent(link.href, currentPath)}
                  className={pageLink}
                >
                  {link.label}
                </Link>
              );
              if (!link.submenu) return <li key={link.href}>{sectionLink}</li>;

              return (
                <li key={link.href}>
                  <HeaderNavSubmenu
                    panelId={submenuId(link.href)}
                    toggleLabel={link.submenu.toggleLabel}
                    link={sectionLink}
                  >
                    <ul className="flex flex-col gap-0.5">
                      {link.submenu.links.map((sub) => {
                        const current = navCurrentPage(sub.href, currentPath);
                        return (
                          <li key={sub.href}>
                            {/* Fila "inset": el panel trae `p-2` y la fila su
                                propio radio, así el fondo del hover no toca el
                                borde de la tarjeta. `rounded-lg` (8px) es
                                concéntrico con `rounded-card` (16px) menos ese
                                padding. El foco de teclado usa el outline
                                global (2px + 2px de offset: entra en los 8px
                                del padding) y además pinta el mismo fondo. */}
                            <Link
                              href={sub.href}
                              prefetch={loadsClerk(sub.href) ? false : undefined}
                              aria-current={current}
                              {...submenuAttrs(sub.href)}
                              className="group flex min-h-11 items-center gap-2 rounded-lg px-3 py-2.5 transition-colors hover:bg-canvas focus-visible:bg-canvas motion-reduce:transition-none"
                            >
                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span
                                  className={cn(
                                    "text-control leading-snug text-fg",
                                    current ? "font-semibold" : "font-medium",
                                  )}
                                >
                                  {sub.label}
                                </span>
                                {/* `fg-subtle` da 4.79:1 sobre `card` pero
                                    4.30:1 sobre `canvas` (no llega a AA): con
                                    el fondo del hover o del foco pasa a
                                    `fg-muted` (9.18:1 sobre `canvas`). */}
                                <span className="text-label leading-normal text-fg-subtle transition-colors group-hover:text-fg-muted group-focus-visible:text-fg-muted motion-reduce:transition-none">
                                  {sub.description}
                                </span>
                              </span>
                              {/* Página actual: peso + tilde (el color solo no
                                  alcanza, WCAG 1.4.1). Sin subrayado: repetía
                                  el del link de sección que está justo arriba.
                                  La tilde es decorativa (`Icon` ya va con
                                  `aria-hidden`): el estado lo dice
                                  `aria-current`. `brand` sobre `card` 4.24:1 y
                                  sobre `canvas` 3.81:1 (ícono: pide 3:1). */}
                              {current ? (
                                <Icon
                                  name="check"
                                  size={16}
                                  strokeWidth={2}
                                  className="shrink-0 text-brand"
                                />
                              ) : null}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </HeaderNavSubmenu>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* `lg:relative`: el desplegable de cuenta se alinea al borde derecho
            de este grupo (el del contenido). Debajo de `lg` el panel es
            `fixed` y no depende de esto. */}
        <div className="ml-auto flex items-center gap-2 lg:relative">
          <HeaderBusinessLink
            sessionCookie={sessionCookie}
            join={businessLink.join}
            manage={businessLink.manage}
            joinAnalytics={joinAttrs(LAYOUT_PLACEMENTS.header)}
            currentPath={currentPath}
            className="max-lg:hidden"
          />
          <HeaderAccountMenu
            sessionCookie={sessionCookie}
            buttonLabel={accountMenu.buttonLabel}
            sectionsLabel={accountMenu.sectionsLabel}
            accountLabel={accountMenu.accountLabel}
            links={resolveSections(links)}
            items={{
              anon: resolveMenu(accountMenu.items.anon),
              cliente: resolveMenu(accountMenu.items.cliente),
              proveedor: resolveMenu(accountMenu.items.proveedor),
            }}
            cta={
              showCta
                ? { ...quoteLink, analytics: quoteAttrs(QUOTE_CTA_PLACEMENTS.headerMenu) }
                : null
            }
            currentPath={currentPath}
          />
          {showCta ? (
            <ButtonLink
              href={quoteLink.href}
              variant="primary"
              size="44"
              className="hidden lg:inline-flex"
              {...quoteAttrs(QUOTE_CTA_PLACEMENTS.header)}
            >
              {quoteLink.label}
            </ButtonLink>
          ) : null}
        </div>
      </Container>
    </header>
  );
}
