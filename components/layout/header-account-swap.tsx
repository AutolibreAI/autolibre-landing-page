"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { useSessionHint } from "@/lib/auth/use-session-hint";
import type { NavLink } from "@/lib/content/types";

type HeaderAccountSwapProps = {
  /** Nombre de la cookie `__client_uat` de la instancia (calculado en el server). */
  readonly sessionCookie: string | null;
  /** "Soy proveedor": lo que se ve sin sesión, y lo que sale en el HTML del server. */
  readonly providerLink: NavLink;
  /** "Mi cuenta": lo que se ve con sesión. */
  readonly accountLink: NavLink;
  readonly currentPath?: string;
  /** Las clases de los links de página del header (las pasa el header). */
  readonly className: string;
};

/**
 * El lugar de "Soy proveedor" en el header (desde `lg`). Con sesión de Clerk
 * en el browser, lo ocupa "Mi cuenta" → `/cuenta`.
 *
 * NO importa nada de Clerk: la sesión es una pista que sale de la cookie
 * `__client_uat` (`useSessionHint`). El server y la hidratación siempre
 * pintan "Soy proveedor" (sin sesión el HTML es exactamente el de antes) y
 * recién después, si hay sesión, se cambia. Es un REEMPLAZO en el mismo
 * lugar y con anchos casi iguales ("Soy proveedor" vs. ícono + "Mi cuenta"),
 * no un elemento que aparece y empuja: el corrimiento es de unos px y solo
 * para quien tiene sesión.
 */
export function HeaderAccountSwap({
  sessionCookie,
  providerLink,
  accountLink,
  currentPath,
  className,
}: HeaderAccountSwapProps) {
  const signedIn = useSessionHint(sessionCookie);
  const link = signedIn ? accountLink : providerLink;

  return (
    <Link
      href={link.href}
      aria-current={link.href === currentPath ? "page" : undefined}
      // `/cuenta` carga Clerk: sin prefetch, esta página pública no lo baja.
      prefetch={signedIn ? false : undefined}
      className={className}
    >
      {signedIn ? <Icon name="user" size={18} strokeWidth={1.8} className="mr-1.5" /> : null}
      {link.label}
    </Link>
  );
}
