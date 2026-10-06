"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { NavCtaLink } from "@/components/layout/nav-cta";
import { Icon } from "@/components/ui/icon";
import { StoreLinks } from "@/components/ui/store-links";
import { cn } from "@/lib/utils";
import type { NavCta, NavEntry, NavGroupItem } from "@/lib/content/types";
import { siteContent } from "@/lib/content/site";

type MobileNavProps = {
  /** Las mismas entradas del nav de desktop (`siteContent.nav.entries`). */
  readonly entries: readonly NavEntry[];
  /** Etiqueta del `<nav>` (la misma que el de desktop). */
  readonly label: string;
  readonly cta: NavCta;
  /**
   * Es el CTA de descarga: el pie del menú muestra sólo las tiendas. Si la
   * página lo pisa (WhatsApp en `/pedido`, "Sumar mi negocio" en
   * `/proveedores`), ese CTA va arriba de las tiendas.
   */
  readonly isDownloadCta?: boolean;
  /** Ruta actual: su link lleva `aria-current="page"`. */
  readonly currentPath?: string;
};

/** Link del panel; la página actual con color Y subrayado (WCAG 1.4.1). */
const panelLink =
  "flex min-h-11 items-center gap-3 py-2 font-display text-lg font-semibold text-ink aria-[current=page]:text-brand-hover aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8";

/** Ícono de un item de grupo: mismo trazo que en el desplegable de desktop. */
function ItemIcon({ item }: { readonly item: NavGroupItem }) {
  return item.icon ? (
    <Icon
      name={item.icon}
      size={22}
      strokeWidth={1.8}
      className={cn("shrink-0", !item.comingSoon && "text-brand-hover")}
    />
  ) : null;
}

/**
 * Menú para pantallas chicas y tablets (hasta `xl`, donde entran los
 * desplegables). Muestra las mismas entradas que el nav de desktop, en el
 * mismo orden: los links sueltos como items y los grupos como listas con
 * etiqueta, todas abiertas: nada de acordeones, el contenido no se esconde
 * detrás de otra interacción. Única parte del header que se
 * hidrata junto con los botones de `NavDropdown`.
 *
 * "Pedir presupuesto" NO está acá: queda siempre visible en la barra del
 * header, al lado de este botón. Al pie, separadas por una línea fina, las
 * tiendas (la otra conversión del sitio).
 */
export function MobileNav({
  entries,
  label,
  cta,
  isDownloadCta = false,
  currentPath,
}: MobileNavProps) {
  // El cierre al navegar lo maneja el `onClick` de cada enlace, no un
  // efecto sobre `pathname`: así no hay render en cascada al cambiar de ruta.
  const [open, setOpen] = useState(false);

  // Bloquear el scroll del fondo mientras el menú está abierto. Va en
  // `<html>` y NO en `<body>`: el `overflow` del elemento raíz se aplica al
  // viewport (que es el que scrollea) y lo frena de verdad. En `<body>`, como
  // `<html>` ya tiene `overflow-x: hidden`, no se propaga: convierte al body
  // en un contenedor de scroll propio, el header `sticky` se despega (quedaba
  // en `top: -scrollY`, fuera de pantalla, sin botón de cerrar) y la página
  // seguía scrolleando por detrás.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, [open]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((value) => !value)}
        /* 44px es el mínimo táctil de WCAG 2.5.5 y de la HIG de Apple. El
           ícono sigue siendo de 18px: lo que crece es el área de toque, que
           es lo que el dedo necesita. */
        className="flex size-11 items-center justify-center rounded-field border border-ink/15 text-ink transition-colors hover:border-brand hover:text-brand xl:hidden"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </>
          ) : (
            <>
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </>
          )}
        </svg>
      </button>

      {/*
        El panel se monta con portal en `document.body` a propósito, NO por
        prolijidad: el header tiene `backdrop-blur`, y `backdrop-filter`
        convierte al elemento en containing block de sus descendientes
        `fixed`. Renderizado dentro del header, este panel resolvía su
        `top/bottom` contra los 73px del header en vez de contra el viewport
        y quedaba de 64px de alto con scroll interno. Mismo efecto tienen
        `transform`, `filter`, `perspective`, `contain` y `will-change`.

        No hace falta guardar contra SSR: `open` arranca en false y sólo pasa
        a true por un click, así que `document` siempre existe acá.
      */}
      {open
        ? createPortal(
            <div
              id="mobile-nav-panel"
              className="fixed inset-x-0 top-18 bottom-0 z-40 flex flex-col gap-2 overflow-y-auto overscroll-contain bg-surface px-[6%] pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] xl:hidden"
            >
              <nav aria-label={label} className="flex flex-col">
                {entries.map((entry) => {
                  if (entry.kind === "link") {
                    return (
                      <Link
                        key={entry.href}
                        href={entry.href}
                        onClick={() => setOpen(false)}
                        aria-current={
                          entry.href === currentPath ? "page" : undefined
                        }
                        className={cn(panelLink, "border-b border-line py-3 last:border-b-0")}
                      >
                        {entry.label}
                      </Link>
                    );
                  }
                  const labelId = `mobile-nav-${entry.id}`;
                  const { footerLink } = entry;
                  return (
                    <div key={entry.id} className="border-b border-line py-3 last:border-b-0">
                      {/* Etiqueta del grupo: un `<p>`, no un heading (es
                          navegación, no parte del outline de la página). */}
                      <p
                        id={labelId}
                        className="text-label font-semibold tracking-wider text-ink/60 uppercase"
                      >
                        {entry.label}
                      </p>
                      <ul aria-labelledby={labelId} className="mt-1">
                        {entry.items.map((item) => (
                          <li key={item.label}>
                            {item.comingSoon ? (
                              // No operativo: ni link ni foco (ver
                              // `NavComingSoonItem`). La marca va en el mismo
                              // elemento para que se lea junto con el label.
                              <div className={cn(panelLink, "flex-wrap text-ink/60")}>
                                <ItemIcon item={item} />
                                {item.label}
                                <span className="sr-only">:</span>
                                <span className="rounded-full bg-surface-muted px-2 py-0.5 font-sans text-label text-brand-hover">
                                  {siteContent.nav.comingSoonLabel}
                                </span>
                              </div>
                            ) : item.external ? (
                              <a
                                href={item.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setOpen(false)}
                                className={panelLink}
                              >
                                <ItemIcon item={item} />
                                {item.label}
                                <span className="sr-only">
                                  {" "}
                                  {siteContent.nav.externalHint}
                                </span>
                              </a>
                            ) : (
                              <Link
                                href={item.href}
                                onClick={() => setOpen(false)}
                                aria-current={
                                  item.href === currentPath
                                    ? "page"
                                    : undefined
                                }
                                className={panelLink}
                              >
                                <ItemIcon item={item} />
                                {item.label}
                              </Link>
                            )}
                          </li>
                        ))}
                      </ul>
                      {footerLink ? (
                        <Link
                          href={footerLink.href}
                          onClick={() => setOpen(false)}
                          aria-current={
                            footerLink.href === currentPath ? "page" : undefined
                          }
                          className="mt-1 flex min-h-11 flex-wrap items-center gap-x-1 text-sm text-ink/70 aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-4"
                        >
                          {footerLink.lead ? <span>{footerLink.lead}</span> : null}
                          <span className="font-semibold text-brand-hover">
                            {footerLink.label}
                          </span>
                        </Link>
                      ) : null}
                    </div>
                  );
                })}
              </nav>
              {/*
                `mt-auto` ancla el pie al fondo del panel. Si los links llenan
                el alto, el auto colapsa a 0 y el `pt-6` garantiza que nunca
                quede pegado al último link.
              */}
              <div className="mt-auto flex flex-col gap-6 pt-6">
                {/*
                  El CTA propio de la página (WhatsApp en `/pedido`, "Sumar
                  mi negocio" en `/proveedores`). `text-xl` pisa el
                  `text-base` de `size="lg"` (tailwind-merge dentro de `cn`):
                  igualado a los links, la conversión no puede pesar menos
                  que el menú.
                */}
                {isDownloadCta ? null : (
                  <NavCtaLink
                    cta={cta}
                    placement={cta.tracking?.menuPlacement}
                    size="lg"
                    block
                    onClick={() => setOpen(false)}
                    className="text-xl"
                  />
                )}
                {/*
                  Las dos tiendas, siempre (no según la plataforma como
                  `DownloadCta`): en el menú hay lugar, y quien entra desde
                  una tablet o una PC angosta también puede querer la app.
                  La línea de arriba es la ÚNICA entre el nav y las tiendas:
                  la última entrada va con `last:border-b-0` para no sumar
                  una segunda.
                */}
                <div className="border-t border-line pt-6">
                  <StoreLinks placement="header_menu" />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
