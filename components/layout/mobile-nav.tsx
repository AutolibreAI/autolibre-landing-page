"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { NavCtaLink } from "@/components/layout/nav-cta";
import { DownloadCta } from "@/components/ui/download-cta";
import { cn } from "@/lib/utils";
import type { NavCta, NavLink } from "@/lib/content/types";

type MobileNavProps = {
  /** Anclas de sección (solo en la home). */
  readonly links: readonly NavLink[];
  /** Links a páginas ("Pedir presupuesto" y el secundario). */
  readonly pageLinks: readonly NavLink[];
  readonly cta: NavCta;
  /** Si es el CTA de descarga, apunta a la tienda según la plataforma. */
  readonly isDownloadCta?: boolean;
  /** Ruta actual: su link lleva `aria-current="page"`. */
  readonly currentPath?: string;
  /**
   * Desde qué breakpoint el header muestra todo y el menú sobra. Con anclas
   * de sección (home) recién en `xl`; en páginas internas, en `lg`.
   */
  readonly hideFrom?: "lg" | "xl";
};

/** Clases estáticas (Tailwind no ve clases armadas con template strings). */
const hideClass = { lg: "lg:hidden", xl: "xl:hidden" } as const;

/**
 * Menú desplegable para pantallas chicas. Única parte del header que se
 * hidrata: todo lo demás es HTML estático.
 */
export function MobileNav({
  links,
  pageLinks,
  cta,
  isDownloadCta = false,
  currentPath,
  hideFrom = "lg",
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

  const allLinks: readonly NavLink[] = [...links, ...pageLinks];

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
        className={cn(
          "flex size-11 items-center justify-center rounded-field border border-ink/15 text-ink transition-colors hover:border-brand hover:text-brand",
          hideClass[hideFrom],
        )}
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
              className={cn(
                "fixed inset-x-0 top-18 bottom-0 z-40 flex flex-col gap-2 overflow-y-auto overscroll-contain bg-surface px-[6%] pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))]",
                hideClass[hideFrom],
              )}
            >
              <nav aria-label="Menú principal" className="flex flex-col">
                {allLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={
                      link.href === currentPath ? "page" : undefined
                    }
                    className="border-b border-line py-4 font-display text-xl font-semibold text-ink aria-[current=page]:text-brand-hover aria-[current=page]:underline aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              {/*
                `mt-auto` ancla el CTA al fondo del panel. Va en un wrapper y
                no en el botón para no tocarle el padding propio. Si algún día
                los links llenan el alto, el auto colapsa a 0 y el `pt-6`
                garantiza que el botón nunca quede pegado al último link.
              */}
              <div className="mt-auto pt-6">
                {/*
                  `text-xl` pisa el `text-base` que trae `size="lg"` (lo
                  resuelve tailwind-merge dentro de `cn`). Va igualado a los
                  links de navegación a propósito: el CTA es la conversión de
                  la landing, no puede pesar visualmente menos que "FAQ".
                */}
                {isDownloadCta ? (
                  <DownloadCta
                    size="lg"
                    block
                    onClick={() => setOpen(false)}
                    linkClassName="text-xl"
                  />
                ) : (
                  <NavCtaLink
                    cta={cta}
                    placement={cta.tracking?.menuPlacement}
                    size="lg"
                    block
                    onClick={() => setOpen(false)}
                    className="text-xl"
                  />
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
