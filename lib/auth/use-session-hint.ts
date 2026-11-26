"use client";

import { useSyncExternalStore } from "react";
import { readAccountHint, readClientUat, type AccountHint } from "@/lib/auth/role-hint";

// Las cookies solo cambian en las pantallas privadas (que cargan Clerk) o en
// otra pestaña: se releen al volver a la pestaña. No hay evento de cookies
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
 * mostrar el menú con sesión de más; `/cuenta` igual pide el login.
 *
 * En el server y en la hidratación devuelve `false` (`getServerSnapshot`):
 * el HTML no cambia y no hay error de hidratación.
 */
export function useSessionHint(cookieName: string | null): boolean {
  return useSyncExternalStore(
    subscribe,
    () => readClientUat(cookieName) !== null,
    () => false,
  );
}

/**
 * Estado de la cuenta para el header: `anon`, `cliente` o `proveedor`. Suma a
 * la pista de sesión la de rol (`lib/auth/role-hint.ts`, la escribe
 * `/cuenta`). En el server y en la hidratación devuelve `anon`: el HTML
 * siempre es el de "sin sesión" y el cambio llega después, sin error de
 * hidratación.
 */
export function useAccountHint(cookieName: string | null): AccountHint {
  return useSyncExternalStore(
    subscribe,
    () => readAccountHint(cookieName),
    () => "anon",
  );
}
