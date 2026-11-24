"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useState } from "react";
import { clearRoleHint } from "@/lib/auth/role-hint";

/**
 * "Salir" del encabezado de los flujos (y "Usar otra cuenta"): borra la pista
 * de rol del header público (`lib/auth/role-hint.ts`) y cierra la sesión de
 * Clerk. Sin sesión devuelve `null` (no hay nada que cerrar).
 *
 * Solo en islas que viven dentro de un `ScopedClerkProvider`.
 */
export function useFlowSignOut() {
  const { isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const [pending, setPending] = useState(false);

  async function leave(redirectUrl: string) {
    setPending(true);
    clearRoleHint();
    await signOut({ redirectUrl });
  }

  return {
    signedIn: isSignedIn === true,
    pending,
    leave,
  };
}
