"use client";

import Link from "next/link";
import { useAccountHint } from "@/lib/auth/use-session-hint";
import type { NavLink } from "@/lib/content/types";
import { cn } from "@/lib/utils";

type HeaderBusinessLinkProps = {
  /** Nombre de la cookie `__client_uat` de la instancia (calculado en el server). */
  readonly sessionCookie: string | null;
  /** "Sumá tu negocio": sin sesión o con sesión de cliente. Es lo que sale en el HTML del server. */
  readonly join: NavLink;
  /** "Ir a mi negocio": con la pista de rol de proveedor. */
  readonly manage: NavLink;
  /** `data-analytics-*` del link de alta (los arma el header, Server Component). */
  readonly joinAnalytics?: Readonly<Record<`data-${string}`, string>>;
  readonly currentPath?: string;
  readonly className?: string;
};

/**
 * Enlace discreto del header para la otra punta del mercado: "Sumá tu
 * negocio" o, si la pista de rol dice que la persona es dueña de un negocio,
 * "Ir a mi negocio" (`/cuenta`).
 *
 * NO importa nada de Clerk: lee las pistas de sesión y de rol
 * (`useAccountHint`). El server y la hidratación siempre pintan "Sumá tu
 * negocio" y el cambio llega después. Sin CLS: los dos textos ocupan la
 * misma celda de una grilla y el que no se ve queda `invisible`, así el
 * ancho es siempre el del más largo.
 */
export function HeaderBusinessLink({
  sessionCookie,
  join,
  manage,
  joinAnalytics,
  currentPath,
  className,
}: HeaderBusinessLinkProps) {
  const isProvider = useAccountHint(sessionCookie) === "proveedor";
  const link = isProvider ? manage : join;
  const other = isProvider ? join : manage;

  return (
    <Link
      href={link.href}
      aria-current={link.href === currentPath ? "page" : undefined}
      // Los dos destinos cargan Clerk (el alta y `/cuenta`): sin prefetch,
      // esta página no lo baja.
      prefetch={false}
      {...(isProvider ? {} : joinAnalytics)}
      className={cn(
        "inline-grid h-11 items-center rounded-full px-3 font-semibold whitespace-nowrap text-control text-fg transition-colors hover:bg-canvas motion-reduce:transition-none aria-[current=page]:underline aria-[current=page]:decoration-action aria-[current=page]:decoration-2 aria-[current=page]:underline-offset-8",
        className,
      )}
    >
      <span className="col-start-1 row-start-1">{link.label}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {other.label}
      </span>
    </Link>
  );
}
