"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import type { NavLink } from "@/lib/content/types";

type MobileNavProps = {
  readonly links: readonly NavLink[];
  readonly secondary: NavLink;
  readonly cta: NavLink;
};

/**
 * Menú desplegable para pantallas chicas. Única parte del header que se
 * hidrata: todo lo demás es HTML estático.
 */
export function MobileNav({ links, secondary, cta }: MobileNavProps) {
  // El cierre al navegar lo maneja el `onClick` de cada enlace, no un
  // efecto sobre `pathname`: así no hay render en cascada al cambiar de ruta.
  const [open, setOpen] = useState(false);

  // Bloquear el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
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

  const allLinks: readonly NavLink[] = [...links, secondary];

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={open}
        aria-controls="mobile-nav-panel"
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 items-center justify-center rounded-field border border-ink/15 text-ink transition-colors hover:border-brand hover:text-brand lg:hidden"
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

      {open ? (
        <div
          id="mobile-nav-panel"
          className="fixed inset-x-0 top-[4.5rem] bottom-0 z-40 flex flex-col gap-2 overflow-y-auto bg-surface px-[6%] pt-8 pb-[calc(2rem+env(safe-area-inset-bottom))] lg:hidden"
        >
          <nav aria-label="Menú principal" className="flex flex-col">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 font-display text-xl font-semibold text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ButtonLink
            href={cta.href}
            size="lg"
            block
            onClick={() => setOpen(false)}
            className="mt-6"
          >
            {cta.label}
          </ButtonLink>
        </div>
      ) : null}
    </>
  );
}
