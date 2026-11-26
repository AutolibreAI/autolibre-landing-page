/**
 * Contrato del login dedicado `/ingresar?redirect=<ruta>` (2026-11-26).
 *
 * Toda pantalla privada que pide la cuenta manda a `/ingresar` con la URL a
 * la que hay que volver (ruta + query) en `?redirect=`. La redirección la
 * arman `proxy.ts` (sin sesión en una ruta protegida) y las islas (la sesión
 * venció con la página abierta, o el alta de `/proveedores/registro`).
 *
 * `parseSafeRedirect` es la ÚNICA puerta de entrada del parámetro: solo
 * acepta rutas relativas del mismo origen (anti open redirect). Cualquier otra
 * cosa vuelve a `/cuenta`.
 *
 * Sin imports a propósito: lo usan `proxy.ts`, el server, las islas y las
 * pruebas de `scripts/sign-in-redirect` (corren con `node --test`).
 */

/** Ruta del login dedicado. Privada: `noindex`, fuera del sitemap y de `llms.txt`. */
export const SIGN_IN_PATH = "/ingresar";

/** Parámetro con la URL de vuelta (ruta relativa, con su query). */
export const SIGN_IN_REDIRECT_PARAM = "redirect";

/** Vuelta por defecto: "Mi cuenta" (`ACCOUNT_PATH` de `lib/account/paths.ts`). */
export const DEFAULT_SIGN_IN_DESTINATION = "/cuenta";

/** Tope del parámetro: ninguna URL propia se le acerca. */
const MAX_REDIRECT_LENGTH = 2048;

/** Origen ficticio para normalizar la ruta con `URL` sin depender del host. */
const PLACEHOLDER_ORIGIN = "https://autolibre.invalid";

/** Caracteres de control (C0 y DEL) y la barra invertida, que algunos browsers leen como `/`. */
const FORBIDDEN_CHARS = /[\u0000-\u001f\u007f\\]/;

/**
 * Valida la URL de vuelta. Acepta SOLO una ruta relativa del mismo origen:
 * empieza con UNA `/`, sin `//` ni `/\` (protocol-relative), sin esquema
 * (`https:`, `javascript:`), sin caracteres de control ni `\`, y que no sea
 * el propio `/ingresar` (bucle). La ruta se normaliza (`/a/../b` → `/b`) y se
 * vuelve a chequear después: `/.//evil.com` normaliza a `//evil.com`. El
 * `#fragmento` se descarta. Cualquier rechazo cae en `/cuenta`.
 */
export function parseSafeRedirect(value: string | readonly string[] | null | undefined): string {
  const raw = typeof value === "string" ? value : value?.[0];
  if (!raw || raw.length > MAX_REDIRECT_LENGTH) return DEFAULT_SIGN_IN_DESTINATION;
  if (!raw.startsWith("/") || raw.startsWith("//")) return DEFAULT_SIGN_IN_DESTINATION;
  if (FORBIDDEN_CHARS.test(raw)) return DEFAULT_SIGN_IN_DESTINATION;

  let url: URL;
  try {
    url = new URL(raw, PLACEHOLDER_ORIGIN);
  } catch {
    return DEFAULT_SIGN_IN_DESTINATION;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return DEFAULT_SIGN_IN_DESTINATION;

  const { pathname, search } = url;
  if (pathname.startsWith("//")) return DEFAULT_SIGN_IN_DESTINATION;
  if (isSignInPath(pathname)) return DEFAULT_SIGN_IN_DESTINATION;
  return `${pathname}${search}`;
}

/** `/ingresar?redirect=<destino>`, con el destino ya validado y codificado. */
export function buildSignInHref(destination: string): string {
  const safe = parseSafeRedirect(destination);
  return `${SIGN_IN_PATH}?${SIGN_IN_REDIRECT_PARAM}=${encodeURIComponent(safe)}`;
}

function isSignInPath(pathname: string): boolean {
  return pathname === SIGN_IN_PATH || pathname.startsWith(`${SIGN_IN_PATH}/`);
}

function pathOf(destination: string): string {
  return new URL(destination, PLACEHOLDER_ORIGIN).pathname;
}

function isUnder(pathname: string, base: string): boolean {
  return pathname === base || pathname.startsWith(`${base}/`);
}

/**
 * Qué cuenta se crea según adónde vuelve la persona (ver `SignupIntentMode`):
 * - `/proveedores/*` (alta, reclamo, contratar): `partner`, sin preguntar.
 * - Lo demás (`/cuenta`): `ask`, "Ingresar" / "Crear cuenta" y, al crear,
 *   "Soy cliente / Tengo un taller".
 *
 * Recibe un destino YA validado por `parseSafeRedirect`.
 */
export function signupIntentForDestination(destination: string): "ask" | "partner" {
  return isUnder(pathOf(destination), "/proveedores") ? "partner" : "ask";
}

/** A qué flujo vuelve la persona: elige la bajada del login (`lib/content/partner-account.ts`). */
export type SignInDestinationKind = "account" | "alta" | "contratar" | "resultado" | "reclamar" | "other";

/** Recibe un destino YA validado por `parseSafeRedirect`. */
export function signInDestinationKind(destination: string): SignInDestinationKind {
  const pathname = pathOf(destination);
  if (isUnder(pathname, "/cuenta")) return "account";
  if (pathname === "/proveedores/registro") return "alta";
  if (isUnder(pathname, "/proveedores/contratar/resultado")) return "resultado";
  if (isUnder(pathname, "/proveedores/contratar")) return "contratar";
  if (isUnder(pathname, "/proveedores/reclamar")) return "reclamar";
  return "other";
}
