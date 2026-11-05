"use client";

import { useSyncExternalStore } from "react";

/** La cookie sin sufijo: respaldo si clerk-js no escribió la sufijada. */
const UNSUFFIXED_CLIENT_UAT = "__client_uat";

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return decodeURIComponent(cookie.slice(prefix.length));
  }
  return null;
}

/** Presente y distinta de `"0"` (y de vacía) = hay una sesión iniciada. */
function signedIn(value: string | null): boolean {
  return value !== null && value !== "" && value !== "0";
}

// La cookie solo cambia en las pantallas privadas (que cargan Clerk) o en
// otra pestaña: se relee al volver a la pestaña. No hay evento de cookies
// confiable en todos los browsers, y no hace falta más.
function subscribe(onChange: () => void): () => void {
  document.addEventListener("visibilitychange", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    document.removeEventListener("visibilitychange", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

/**
 * ¿Hay sesión de Clerk en este browser? Una PISTA para el header público, que
 * no carga Clerk: lee la cookie `__client_uat` de la instancia (nombre
 * calculado en el server, `lib/auth/session-cookie.ts`). Si la sufijada no
 * existe, cae a la sin sufijo, igual que el backend de Clerk.
 *
 * Es una pista y no una verificación: si la sesión venció sin pasar por una
 * pantalla con Clerk, la cookie puede seguir diciendo "sí". El costo es
 * mostrar "Mi cuenta" de más; `/cuenta` igual pide el login.
 *
 * En el server y en la hidratación devuelve `false` (`getServerSnapshot`):
 * el HTML no cambia y no hay error de hidratación.
 */
export function useSessionHint(cookieName: string | null): boolean {
  return useSyncExternalStore(
    subscribe,
    () => {
      if (!cookieName) return false;
      const suffixed = readCookie(cookieName);
      return signedIn(suffixed ?? readCookie(UNSUFFIXED_CLIENT_UAT));
    },
    () => false,
  );
}
