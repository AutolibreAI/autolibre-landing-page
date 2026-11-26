import Image from "next/image";
import Link from "next/link";
import {
  HeaderAccountMenu,
  type AnalyticsAttrs,
  type HeaderMenuItem,
} from "@/components/layout/header-account-menu";
import { HeaderBusinessLink } from "@/components/layout/header-business-link";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
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
import type { AccountMenuEntry } from "@/lib/content/types";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

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
   * Ruta de la página que renderiza el header. Marca con
   * `aria-current="page"` el link que apunta a ella. Viaja como prop (y no
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
 * Clases de los links de página. `h-11`: 44px de área táctil. La página
 * actual va con peso Y subrayado en `action`: el color solo no alcanza como
 * señal (WCAG 1.4.1).
 */
const pageLink =
  "inline-flex h-11 items-center text-control font-medium whitespace-nowrap text-fg-muted transition-colors hover:text-fg motion-reduce:transition-none aria-[current=page]:font-semibold aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:decoration-action aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

/**
 * Header sticky del sistema "AutoLibre AI". Server Component: lo único que
 * se hidrata son dos islas chicas que leen las pistas de sesión y de rol
 * (cookies, sin Clerk): el enlace "Sumá tu negocio" / "Ir a mi negocio" y
 * el botón de cuenta con su menú.
 *
 * Es IGUAL en todas las páginas. Qué se ve en cada ancho:
 * - < lg: logo + botón "Menú y cuenta" (links de página, opciones de cuenta
 *   y "Hacé tu pedido" van en el panel).
 * - lg+: logo, Proveedores · Blog · Sobre nosotros, "Sumá tu negocio",
 *   botón de cuenta con desplegable y "Hacé tu pedido".
 *
 * El HTML del server siempre es el estado "sin sesión"; con sesión cambian
 * el color del avatar, el texto del enlace de negocio (con el ancho
 * reservado) y las opciones del menú, que solo se ven abierto: sin CLS.
 */
export function SiteHeader({ cta, currentPath }: SiteHeaderProps) {
  const { links, quoteLink, businessLink, accountMenu } = siteContent.nav;
  /** Cookie de sesión de Clerk de esta instancia (ver `lib/auth/session-cookie.ts`). */
  const sessionCookie = clerkClientUatCookieName();
  const showCta = cta !== false;
  const current = (href: string) => (href === currentPath ? "page" : undefined);

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
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} aria-current={current(link.href)} className={pageLink}>
                  {link.label}
                </Link>
              </li>
            ))}
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
            links={links}
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
