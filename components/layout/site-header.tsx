import Image from "next/image";
import Link from "next/link";
import { DownloadCta } from "@/components/ui/download-cta";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavCtaLink } from "@/components/layout/nav-cta";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import {
  navEntryAriaCurrentClass,
  navEntryClass,
} from "@/components/layout/nav-styles";
import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { siteContent } from "@/lib/content/site";
import type {
  NavComingSoonItem,
  NavCta,
  NavGroup,
  NavItem,
  NavLink,
} from "@/lib/content/types";
import { cn } from "@/lib/utils";

/** Lo que se puede comparar contra la página actual: un link interno. */
type CurrentCandidate = NavLink & { readonly external?: boolean };

type SiteHeaderProps = {
  /**
   * Acción secundaria de la derecha. Default: descarga; `/pedido` manda
   * WhatsApp y `/proveedores` "Sumar mi negocio".
   */
  readonly cta?: NavCta;
  /**
   * Ruta de la página que renderiza el header. Marca con
   * `aria-current="page"` el link que apunta a ella (y su grupo). Viaja como
   * prop (y no con `usePathname`) para que el header siga siendo un Server
   * Component.
   */
  readonly currentPath?: string;
  /**
   * Muestra el botón "Pedir presupuesto" (el principal). Default `true`;
   * `/proveedores` lo apaga porque esa página le habla a negocios, no a
   * dueños de auto: ahí su `cta` pasa a ser el botón principal. El footer
   * sigue linkeando `/pedido` en todas las páginas.
   */
  readonly showQuoteLink?: boolean;
};

/**
 * Alto de los botones de la derecha. `size="sm"` (14px, como las entradas del
 * nav) con `min-h-11`: 44px de área táctil en mobile sin cambiar el alto del
 * header, y los dos botones parejos al lado del botón de menú (`size-11`).
 */
const headerButtonClass = "min-h-11";

/** Item de un desplegable: ícono opcional, label y una línea de descripción. */
function NavItemLink({
  item,
  current,
}: {
  readonly item: NavItem;
  readonly current: boolean;
}) {
  const className =
    "group flex min-h-11 items-start gap-3 rounded-field px-3 py-2.5 transition-colors hover:bg-surface-muted aria-[current=page]:bg-surface-muted";
  const content = (
    <>
      {item.icon ? (
        <Icon
          name={item.icon}
          size={20}
          strokeWidth={1.8}
          className="mt-px shrink-0 text-brand-hover"
        />
      ) : null}
      <span className="flex flex-col">
        <span className="text-sm font-semibold text-ink group-aria-[current=page]:underline group-aria-[current=page]:decoration-brand group-aria-[current=page]:decoration-2 group-aria-[current=page]:underline-offset-4">
          {item.label}
          {item.external ? (
            <span className="sr-only"> {siteContent.nav.externalHint}</span>
          ) : null}
        </span>
        {item.description ? (
          <span className="mt-0.5 text-sm text-ink/65">{item.description}</span>
        ) : null}
      </span>
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      className={className}
    >
      {content}
    </Link>
  );
}

/**
 * Item no operativo (Financiamiento): NO es un link ni recibe foco. Apagado
 * (`text-ink/60`, como las etiquetas de grupo) y con la marca "Próximamente"
 * dentro del mismo elemento, así el lector de pantalla lee las dos cosas
 * juntas al recorrer la lista. La marca va en `brand-hover` sobre
 * `surface-muted`: es texto de 13px y tiene que pasar AA.
 */
function NavComingSoon({ item }: { readonly item: NavComingSoonItem }) {
  return (
    <div className="flex min-h-11 items-start gap-3 px-3 py-2.5 text-ink/60">
      {item.icon ? (
        <Icon name={item.icon} size={20} strokeWidth={1.8} className="mt-px shrink-0" />
      ) : null}
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
        {item.label}
        <span className="sr-only">:</span>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-label text-brand-hover">
          {siteContent.nav.comingSoonLabel}
        </span>
      </span>
    </div>
  );
}

/**
 * Contenido de un desplegable: la lista de items y, si el grupo lo trae, el
 * link de pie separado por una línea fina. Server: llega a `NavDropdown` como
 * `children`, así todo está en el HTML inicial.
 */
function NavGroupPanel({
  group,
  isCurrent,
}: {
  readonly group: NavGroup;
  readonly isCurrent: (link: CurrentCandidate) => boolean;
}) {
  const { footerLink } = group;
  return (
    <>
      <ul className="flex flex-col gap-1">
        {group.items.map((item) => (
          <li key={item.label}>
            {item.comingSoon ? (
              <NavComingSoon item={item} />
            ) : (
              <NavItemLink item={item} current={isCurrent(item)} />
            )}
          </li>
        ))}
      </ul>
      {footerLink ? (
        <div className="mt-2 border-t border-line pt-2">
          <Link
            href={footerLink.href}
            aria-current={isCurrent(footerLink) ? "page" : undefined}
            className="flex min-h-11 flex-wrap items-center gap-x-1 rounded-field px-3 py-2 text-sm text-ink/70 transition-colors hover:bg-surface-muted aria-[current=page]:bg-surface-muted"
          >
            {footerLink.lead ? <span>{footerLink.lead}</span> : null}
            <span className="font-semibold text-brand-hover">
              {footerLink.label}
            </span>
          </Link>
        </div>
      ) : null}
    </>
  );
}

/**
 * Header sticky. Las entradas del nav principal son IDÉNTICAS en todas las
 * páginas; sólo cambia, por página, la zona de acciones de la derecha: la
 * acción secundaria (`cta`) y si se muestra el botón principal "Pedir
 * presupuesto" (`showQuoteLink`, apagado en `/proveedores`). Es un Server
 * Component: los links de los desplegables están en el HTML del server
 * (ocultos, no montados al abrir). Lo único que se hidrata son los botones de
 * cada desplegable (`NavDropdown`) y el menú mobile.
 *
 * Jerarquía de la derecha: "Pedir presupuesto" es el botón PRIMARIO (el
 * pedido es la conversión principal de la web) y va último, contra el borde;
 * la descarga (o el `cta` de la página) va antes, como `outline`.
 *
 * Qué se ve en cada ancho (lo que se oculta, está en el menú mobile):
 * - < sm: logo + "Pedir presupuesto" (con el texto corto
 *   `quoteShortLabel`) + botón de menú. A 360px: 123 + 16 + 117 + 8 + 44 =
 *   308px sobre 317 de contenido. Con el texto largo serían ~347 y no entra.
 * - sm: el primario pasa al texto largo. En `/proveedores` (sin primario)
 *   aparece su `cta`, ahora como principal.
 * - md: + la acción secundaria al lado del primario. OJO: `DownloadCta` sólo
 *   se ve en iOS y Android (en una PC no hay app que instalar), así que en
 *   desktop la descarga no ocupa lugar; sí el `cta` de `/pedido`.
 * - xl: + las entradas del nav principal (desplegables "Servicios" y
 *   "Empresa", y los links sueltos), y recién ahí se va el botón de menú.
 *   En `lg` no entran: medido con las métricas de DM Sans, logo (123) +
 *   `ml-6` (24) + entradas con el blog público y Aliados (~438) + el peor par de la
 *   derecha (`/pedido`: "Escribinos por WhatsApp" con ícono, 232, +
 *   "Pedir presupuesto", 156, + gap 12) + gaps (32) suman ~1017px, y a
 *   1024px el 6% de gutter deja ~901px de contenido. En `xl` (1280) el
 *   contenido mide ~1126: entra, con ~110px de margen para que crezca el nav.
 */
export function SiteHeader({
  cta = siteContent.nav.cta,
  currentPath,
  showQuoteLink = true,
}: SiteHeaderProps) {
  const { entries, quoteLink, quoteShortLabel, label } = siteContent.nav;
  /**
   * Sólo el CTA de descarga cambia de destino según la plataforma. Las
   * páginas que pisan `cta` con otra acción (p. ej. /proveedores, /pedido)
   * quedan con su link tal cual.
   */
  const isDownloadCta = cta.href === siteContent.nav.cta.href;
  const isCurrent = (link: CurrentCandidate) =>
    !link.external && link.href === currentPath;
  /**
   * Con "Pedir presupuesto" al lado, la acción de la página es secundaria
   * (`outline`). Sin él (`/proveedores`), pasa a ser la principal.
   */
  const ctaVariant = showQuoteLink ? "outline" : "primary";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface/92 backdrop-blur-md">
      <Container size="wide" className="flex h-18 items-center gap-4">
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

        <nav aria-label={label} className="ml-6 hidden xl:block">
          <ul className="flex items-center gap-1">
            {entries.map((entry) =>
              entry.kind === "link" ? (
                <li key={entry.href}>
                  <Link
                    href={entry.href}
                    aria-current={
                      entry.href === currentPath ? "page" : undefined
                    }
                    className={cn(navEntryClass, navEntryAriaCurrentClass)}
                  >
                    {entry.label}
                  </Link>
                </li>
              ) : (
                <li key={entry.id}>
                  <NavDropdown
                    label={entry.label}
                    containsCurrent={entry.items.some(
                      (item) => !item.comingSoon && isCurrent(item),
                    )}
                    /* Con íconos el texto arranca 32px más adentro: el panel
                       se ensancha para que las descripciones no se partan. */
                    panelClassName={
                      entry.items.some((item) => item.icon) ? "w-96" : undefined
                    }
                  >
                    <NavGroupPanel group={entry} isCurrent={isCurrent} />
                  </NavDropdown>
                </li>
              ),
            )}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/*
            Secundario desde `md` (con el primario al lado): en `/pedido` el
            CTA de WhatsApp (232) + el primario (156) + menú no entran a
            640px. Sin primario (`/proveedores`), el `cta` ES el principal y
            aparece desde `sm`, como antes.
          */}
          {isDownloadCta ? (
            <DownloadCta
              variant={ctaVariant}
              size="sm"
              className={showQuoteLink ? "hidden md:contents" : "hidden sm:contents"}
              linkClassName={headerButtonClass}
            />
          ) : (
            <NavCtaLink
              cta={cta}
              variant={ctaVariant}
              size="sm"
              className={cn(
                headerButtonClass,
                showQuoteLink ? "hidden md:inline-flex" : "hidden sm:inline-flex",
              )}
            />
          )}
          {showQuoteLink ? (
            <ButtonLink
              href={quoteLink.href}
              size="sm"
              /* Nombre accesible completo también debajo de `sm`, donde se
                 ve el texto corto (ver `quoteShortLabel`). */
              aria-label={quoteLink.label}
              aria-current={isCurrent(quoteLink) ? "page" : undefined}
              /* Página actual (`/pedido`): subrayado además del estado del
                 botón, mismo criterio que el resto del nav (WCAG 1.4.1). */
              className={cn(
                headerButtonClass,
                "aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4",
              )}
            >
              <span className="sm:hidden">{quoteShortLabel}</span>
              <span className="hidden sm:inline">{quoteLink.label}</span>
            </ButtonLink>
          ) : null}
          <MobileNav
            entries={entries}
            label={label}
            cta={cta}
            isDownloadCta={isDownloadCta}
            currentPath={currentPath}
          />
        </div>
      </Container>
    </header>
  );
}
