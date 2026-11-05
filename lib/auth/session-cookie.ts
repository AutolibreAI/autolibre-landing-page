import { createHash } from "node:crypto";

/**
 * Nombre de la cookie `__client_uat` de ESTA instancia de Clerk, para que el
 * header público sepa si hay sesión SIN cargar Clerk (las páginas públicas no
 * lo cargan: ver `components/auth/scoped-clerk-provider.tsx`).
 *
 * Cómo funciona `__client_uat` (verificado en `@clerk/backend`,
 * `initCookieValues` / `usesSuffixedCookies`, y `@clerk/shared/keys`):
 * - La escribe clerk-js EN EL BROWSER (no es `httpOnly`, se lee desde JS),
 *   con `path=/` en el dominio del sitio, cada vez que cambia la sesión:
 *   el timestamp del último login, o `"0"` al cerrar sesión.
 * - Viene en dos versiones: `__client_uat` y `__client_uat_<sufijo>`, donde el
 *   sufijo son los primeros 8 caracteres del SHA-1 en base64url de la
 *   publishable key. La sufijada es la de esta instancia; la sin sufijo la
 *   podría pisar otra app de Clerk en el mismo dominio (el admin, por ej.).
 *
 * Se calcula en el server (es la misma cuenta que `getCookieSuffix` de
 * `@clerk/shared/keys`, sin importar Clerk) y viaja como prop a la isla.
 * `null` sin publishable key: el header no muestra nada de la cuenta.
 */
export function clerkClientUatCookieName(): string | null {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!publishableKey) return null;
  const suffix = createHash("sha1")
    .update(publishableKey)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .slice(0, 8);
  return `__client_uat_${suffix}`;
}
