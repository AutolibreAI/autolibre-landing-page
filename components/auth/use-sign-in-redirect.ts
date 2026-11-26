"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";

/**
 * Respaldo del login dedicado en las islas privadas: si Clerk ya cargó y NO
 * hay sesión, manda a `/ingresar?redirect=<destination>` (reemplazando la
 * entrada del historial: "atrás" no vuelve a una pantalla que rebota).
 *
 * Casos: la sesión venció o se cerró en otra pestaña con la página abierta,
 * una navegación del cliente que el proxy dejó pasar por el token vencido
 * (ver `proxy.ts`), y el alta de `/proveedores/registro?alta=1`, que el proxy
 * no cubre (la landing es pública). Así hay UN solo login: `/ingresar`.
 */
export function useSignInRedirect(signedOut: boolean, destination: string) {
  const router = useRouter();

  useEffect(() => {
    if (signedOut) router.replace(buildSignInHref(destination));
  }, [signedOut, destination, router]);
}
