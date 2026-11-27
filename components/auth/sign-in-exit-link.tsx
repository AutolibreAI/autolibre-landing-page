"use client";

import Link from "next/link";
import { signInExitHistoryIndex, type HistoryEntryLike } from "@/lib/auth/sign-in-redirect";
import { cn } from "@/lib/utils";

/** Lo mínimo de la Navigation API que usa la cruz (no depende de los tipos de `lib.dom`). */
type NavigationEntry = HistoryEntryLike & { readonly key: string; readonly index: number };
type NavigationLike = {
  readonly currentEntry: NavigationEntry | null;
  entries(): NavigationEntry[];
  traverseTo(key: string): { readonly committed: Promise<unknown> };
};

type SignInExitLinkProps = {
  /** Salida segura del mismo sitio, calculada en el server (`signInExitPath`). */
  readonly href: string;
  readonly label: string;
  readonly className?: string;
  /** El ícono, renderizado en el server. */
  readonly children: React.ReactNode;
};

/**
 * La cruz de `/ingresar`. Isla hoja: es un link real (`<a href>`) a la salida
 * que calculó el server, así que funciona sin JS, con click del medio y con
 * "abrir en otra pestaña".
 *
 * Mejora progresiva: si el browser tiene Navigation API y la entrada anterior
 * del historial es una página pública de este sitio, vuelve a ESA entrada
 * (la página de la que vino la persona, con su scroll). La decisión es de
 * `signInExitHistoryIndex`; en cualquier otro caso (sin Navigation API,
 * entrada directa, pestaña nueva, vuelta de Google, la anterior pide sesión)
 * no se toca el historial y navega el `href`.
 *
 * No usa `history.back()` ni `document.referrer`: los pasos `#/...` de Clerk
 * suman entradas, así que "atrás" podía quedar en el propio login, y el
 * referrer no cambia con las navegaciones del cliente.
 */
export function SignInExitLink({ href, label, className, children }: SignInExitLinkProps) {
  function onClick(event: React.MouseEvent<HTMLAnchorElement>) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const navigation = (window as unknown as { readonly navigation?: NavigationLike }).navigation;
    if (!navigation?.currentEntry) return;
    try {
      const entries = navigation.entries();
      const target = entries[signInExitHistoryIndex(entries, navigation.currentEntry.index, window.location.origin)];
      if (!target) return;
      event.preventDefault();
      // Si el browser no puede volver a esa entrada, queda la salida segura.
      navigation.traverseTo(target.key).committed.catch(() => window.location.assign(href));
    } catch {
      // Sin `preventDefault`: navega el `href`.
    }
  }

  return (
    <Link href={href} aria-label={label} onClick={onClick} className={cn("group", className)}>
      {/* Gira el ÍCONO sobre su eje (el `<span>` mide lo que el svg, cuadrado),
          no el área táctil ni el anillo de foco. Solo con `motion-safe`: con
          `prefers-reduced-motion` no hay giro ni transición (AGENTS.md §3). */}
      <span className="flex origin-center motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-safe:group-hover:rotate-90 motion-safe:group-focus-visible:rotate-90">
        {children}
      </span>
    </Link>
  );
}
