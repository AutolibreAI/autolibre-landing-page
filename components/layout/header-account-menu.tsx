"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { useAccountHint } from "@/lib/auth/use-session-hint";
import type { AccountHint } from "@/lib/auth/role-hint";
import type { NavLink } from "@/lib/content/types";
import {
  announceHeaderDisclosure,
  onOtherHeaderDisclosure,
} from "@/lib/navigation/header-disclosure";
import { navCurrent, navCurrentPage } from "@/lib/navigation/nav-current";
import { cn } from "@/lib/utils";

/** `data-analytics-*` que arma el header (Server Component) para el listener delegado. */
export type AnalyticsAttrs = Readonly<Record<`data-${string}`, string>>;

/** Opción del menú, ya resuelta por el header. */
export type HeaderMenuItem =
  | {
      readonly kind: "link";
      readonly label: string;
      readonly href: string;
      readonly sub?: string;
      readonly strong?: boolean;
      /** Destinos que cargan Clerk (`/cuenta`, el alta): sin prefetch. */
      readonly noPrefetch?: boolean;
      readonly analytics?: AnalyticsAttrs;
    }
  | { readonly kind: "rule" }
  | { readonly kind: "group"; readonly label: string };

/**
 * Link de sección para el menú mobile, ya resuelto por el header. `sub`: los
 * links de su submenú que NO repiten el destino de la sección (el header saca
 * el del directorio: la fila "Proveedores" ya lleva ahí).
 */
export type HeaderSectionLink = NavLink & {
  readonly sub?: readonly (NavLink & {
    readonly noPrefetch?: boolean;
    readonly analytics?: AnalyticsAttrs;
  })[];
};

type HeaderAccountMenuProps = {
  /** Nombre de la cookie `__client_uat` de la instancia (calculado en el server). */
  readonly sessionCookie: string | null;
  /** Nombre accesible del botón: en celular abre también la navegación. */
  readonly buttonLabel: { readonly mobile: string; readonly desktop: string };
  /** Landmark de los links de página (solo en el menú mobile). */
  readonly sectionsLabel: string;
  /** Landmark de las opciones de cuenta. */
  readonly accountLabel: string;
  /** Links de página del header (con sus sublinks): debajo de `lg` viven acá. */
  readonly links: readonly HeaderSectionLink[];
  /** Opciones de cuenta por estado. */
  readonly items: Readonly<Record<AccountHint, readonly HeaderMenuItem[]>>;
  /**
   * "Hacé tu pedido" al pie del menú mobile. `null` en las páginas que piden
   * el header sin acción principal (`SiteHeader cta={false}`).
   */
  readonly cta: (NavLink & { readonly analytics?: AnalyticsAttrs }) | null;
  /** Ruta real de la página (ver `SiteHeader`). */
  readonly currentPath?: string;
};

/**
 * Id del panel. Lo buscan con `html:has(#…)` el botón flotante de WhatsApp y
 * las barras fijas al pie, que se esconden mientras el menú está abierto.
 */
const PANEL_ID = "menu-del-encabezado";
/** Debajo de `lg` el panel ocupa la pantalla: ahí se bloquea el scroll del fondo. */
const MOBILE_QUERY = "(width < 64rem)";

/**
 * Botón de cuenta del header y su panel. Una sola isla para los dos anchos:
 *
 * - Desde `lg`: el botón (hamburguesa + avatar) abre un desplegable con las
 *   opciones de cuenta, alineado al borde derecho del contenido.
 * - Debajo de `lg`: el mismo botón es "Menú y cuenta" y abre un panel de
 *   pantalla completa con los links de página, las opciones de cuenta y
 *   "Hacé tu pedido". Los sublinks de una sección ("Proveedores": alta y
 *   precios) van debajo de su fila, indentados y siempre a la vista: sin
 *   acordeón, porque son dos links y esconderlos suma un toque. La fila
 *   "Proveedores" sigue siendo el link al directorio (y la que queda marcada
 *   en toda la sección); por eso el sublink del directorio no se repite acá.
 *   En desktop esos links están en `HeaderNavSubmenu`.
 *
 * Patrón ARIA: DISCLOSURE (botón con `aria-expanded` + `aria-controls` que
 * muestra un panel con links), no `role="menu"`. Son links de navegación,
 * no comandos de una aplicación: `menu` obliga a manejar el foco con
 * flechas, saca a los links del modo de lectura normal y los lectores de
 * pantalla los anuncian como "elemento de menú". Con disclosure se navega
 * con Tab como en el resto de la página (es lo que recomienda la APG de la
 * W3C para navegación de sitios). Además:
 * - Escape cierra y devuelve el foco al botón.
 * - Un click o toque afuera cierra (sin mover el foco).
 * - Si el foco sale del botón y del panel (Tab después del último link),
 *   se cierra: el panel no queda abierto tapando lo que ahora tiene foco.
 * - Elegir un link cierra.
 * - Abrir el submenú de "Proveedores" cierra este panel, y al revés: un solo
 *   panel del header a la vez (`lib/navigation/header-disclosure.ts`).
 *
 * Sesión SIN Clerk: el estado (sin sesión, cliente, proveedor) sale de las
 * pistas de `useAccountHint`. El server y la hidratación pintan "sin
 * sesión"; el avatar cambia de color en el mismo lugar y con el mismo
 * tamaño (sin CLS), y las opciones solo se ven con el panel abierto.
 */
export function HeaderAccountMenu({
  sessionCookie,
  buttonLabel,
  sectionsLabel,
  accountLabel,
  links,
  items,
  cta,
  currentPath,
}: HeaderAccountMenuProps) {
  const hint = useAccountHint(sessionCookie);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    announceHeaderDisclosure(PANEL_ID);
    const stopListening = onOtherHeaderDisclosure(PANEL_ID, () => close(false));

    // Bloquear el scroll del fondo solo en celular (el panel ocupa la
    // pantalla). Va en `<html>` y NO en `<body>`: el `overflow` del elemento
    // raíz es el del viewport; en `<body>` (con `overflow-x: hidden` en
    // `<html>`) lo convertiría en otro contenedor de scroll y el header
    // `sticky` se despegaría.
    const root = document.documentElement;
    const previous = root.style.overflow;
    if (window.matchMedia(MOBILE_QUERY).matches) root.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
      stopListening();
      root.style.overflow = previous;
    };
  }, [open, close]);

  function onBlur(event: React.FocusEvent<HTMLDivElement>) {
    const next = event.relatedTarget;
    // `null`: el foco se fue a la nada (click en un área no enfocable, otra
    // ventana). Ese caso lo maneja el click afuera.
    if (open && next instanceof Node && !event.currentTarget.contains(next)) close(false);
  }

  const signedIn = hint !== "anon";
  // Opciones de cuenta: coincidencia exacta (no son secciones con páginas
  // adentro). Los links de sección usan `navCurrent`.
  const isCurrent = (href: string) => (href === currentPath ? "page" : undefined);

  return (
    <div ref={rootRef} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={PANEL_ID}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 items-center gap-2.5 rounded-full border border-control-line bg-card pr-1.5 pl-3.5 text-fg transition-colors hover:border-fg-subtle motion-reduce:transition-none"
      >
        {/* Nombre accesible según el ancho: `display: none` saca al que no
            corresponde del árbol de accesibilidad. */}
        <span className="sr-only lg:hidden">{buttonLabel.mobile}</span>
        <span className="sr-only max-lg:hidden">{buttonLabel.desktop}</span>
        <svg
          aria-hidden="true"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
        >
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
        {/* Avatar: mismo tamaño con y sin sesión. Con sesión va en `action`
            con el ícono en `card`; no hay inicial porque el header no sabe
            el nombre (no carga Clerk y la pista no guarda datos personales). */}
        <span
          aria-hidden="true"
          className={cn(
            "flex size-8 items-center justify-center rounded-full",
            signedIn ? "bg-action text-card" : "bg-canvas text-fg-muted",
          )}
        >
          <Icon name="user" size={18} strokeWidth={2} />
        </span>
      </button>

      {open ? (
        <div
          id={PANEL_ID}
          className={cn(
            "z-40 bg-card",
            // Celular: pantalla completa debajo del header (68px = `h-17`).
            // El header no tiene `backdrop-filter` ni `transform`, así que
            // `fixed` se resuelve contra el viewport.
            "max-lg:fixed max-lg:inset-x-0 max-lg:top-17 max-lg:bottom-0 max-lg:overflow-y-auto max-lg:overscroll-contain max-lg:border-t max-lg:border-card-line max-lg:px-[6%] max-lg:pt-2 max-lg:pb-[calc(1.5rem+env(safe-area-inset-bottom))]",
            // Desktop: desplegable alineado al borde derecho del contenido.
            "lg:absolute lg:top-full lg:right-0 lg:mt-1.5 lg:w-75 lg:rounded-card lg:border lg:border-control-line lg:py-2",
          )}
        >
          <nav aria-label={sectionsLabel} className="border-b border-card-line pb-1.5 lg:hidden">
            <ul>
              {links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={navCurrent(link.href, currentPath)}
                    onClick={() => close(false)}
                    // `aria-[current]`: igual para `page` y para `true` (una
                    // página de adentro de la sección), como en desktop.
                    className="flex min-h-12 items-center font-medium text-fg aria-[current]:font-semibold aria-[current]:underline aria-[current]:decoration-action aria-[current]:decoration-2 aria-[current]:underline-offset-8"
                  >
                    {link.label}
                  </Link>
                  {link.sub?.length ? (
                    // Indentados con una línea guía: se leen como parte de
                    // la sección. Página actual: solo coincidencia exacta.
                    <ul className="mb-1.5 ml-0.5 border-l border-card-line pl-4">
                      {link.sub.map((sub) => (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            prefetch={sub.noPrefetch ? false : undefined}
                            aria-current={navCurrentPage(sub.href, currentPath)}
                            onClick={() => close(false)}
                            {...sub.analytics}
                            className="flex min-h-11 items-center text-control text-fg-muted aria-[current=page]:font-semibold aria-[current=page]:text-fg aria-[current=page]:underline aria-[current=page]:decoration-action aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
                          >
                            {sub.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={accountLabel} className="max-lg:pt-1.5">
            <ul>
              {items[hint].map((item, index) =>
                item.kind === "rule" ? (
                  <li key={`rule-${index}`} aria-hidden="true" className="my-1.5 h-px bg-card-line" />
                ) : item.kind === "group" ? (
                  <li
                    key={`group-${item.label}`}
                    className="pt-2 pb-0.5 text-xs font-semibold tracking-wider text-fg-muted uppercase lg:px-4"
                  >
                    {item.label}
                  </li>
                ) : (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      prefetch={item.noPrefetch ? false : undefined}
                      aria-current={isCurrent(item.href)}
                      onClick={() => close(false)}
                      {...item.analytics}
                      className={cn(
                        "flex min-h-11 flex-col justify-center py-2 text-control leading-snug text-fg transition-colors motion-reduce:transition-none lg:px-4 lg:hover:bg-canvas",
                        item.strong ? "font-semibold" : "font-normal",
                      )}
                    >
                      <span>{item.label}</span>
                      {item.sub ? (
                        <span className="text-label font-normal text-fg-muted">{item.sub}</span>
                      ) : null}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </nav>

          {cta ? (
            <div className="pt-3 lg:hidden">
              <ButtonLink
                href={cta.href}
                variant="primary"
                size="52"
                block
                onClick={() => close(false)}
                {...cta.analytics}
              >
                {cta.label}
              </ButtonLink>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
