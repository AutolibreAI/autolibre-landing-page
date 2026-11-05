"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { accountContent } from "@/lib/content/account";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";

const { bar } = accountContent;

type AccountBarProps = {
  /** Esta misma URL (con su query): "Usar otra cuenta" vuelve acá, al login. */
  readonly selfPath: string;
  /**
   * Adónde va "Cerrar sesión". Por defecto, el hub de talleres: quien cierra
   * sesión se va del flujo, no quiere ver el login de nuevo.
   */
  readonly signOutUrl?: string;
  readonly className?: string;
};

const actionClass =
  "inline-flex min-h-11 items-center px-1 text-sm font-semibold text-brand-hover underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-60";

/**
 * "Sesión iniciada como …" con "Usar otra cuenta" y "Cerrar sesión": la
 * persona VE con qué cuenta está y puede salir. Va arriba del paso en todas
 * las pantallas privadas de talleres y en `/cuenta`.
 *
 * Componente propio y no el `<UserButton>` de Clerk: el UserButton esconde la
 * identidad detrás de un avatar y un menú (un click más para saber con qué
 * cuenta estás, que es justo lo que hay que ver), trae su propio estilo de
 * popover fuera de los tokens del sitio, y para dos acciones alcanza con dos
 * botones. Usa los hooks del `ClerkProvider` del segmento: nada nuevo viaja.
 *
 * Sin sesión (o mientras carga) no renderiza nada: ahí la pantalla muestra
 * el login.
 */
export function AccountBar({ selfPath, signOutUrl = PROVEEDORES_REGISTRO_PATH, className }: AccountBarProps) {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [leaving, setLeaving] = useState(false);

  if (!isSignedIn || !user) return null;

  const email = user.primaryEmailAddress?.emailAddress ?? null;
  const name = email ?? user.fullName ?? user.username ?? bar.fallbackName;
  const initial = (user.firstName ?? email ?? "?").trim().charAt(0).toLocaleUpperCase("es-AR");

  async function leave(redirectUrl: string) {
    setLeaving(true);
    await signOut({ redirectUrl });
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-card border border-line bg-surface px-4 py-2.5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3 py-1">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-muted font-display text-base font-bold text-brand-hover"
        >
          {initial}
        </span>
        <p className="flex min-w-0 flex-col leading-tight">
          <span className="text-label text-ink/65">{bar.signedInAs}</span>
          <span className="truncate font-semibold text-ink">{name}</span>
        </p>
      </div>
      <div className="flex items-center gap-x-3" aria-live="polite">
        {leaving ? (
          <span className="inline-flex min-h-11 items-center text-sm text-ink/65">{bar.signingOut}</span>
        ) : (
          <>
            <button type="button" className={actionClass} onClick={() => void leave(selfPath)}>
              {bar.switchAccount}
            </button>
            <span aria-hidden="true" className="h-4 w-px bg-ink/15" />
            <button type="button" className={actionClass} onClick={() => void leave(signOutUrl)}>
              {bar.signOut}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
