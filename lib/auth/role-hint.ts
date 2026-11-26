/**
 * Pista de ROL para el header público: ¿la persona con sesión es dueña de un
 * negocio? Igual que la pista de sesión (`use-session-hint.ts`), sirve SOLO
 * para elegir qué se pinta en el header. Nunca autoriza nada: `/cuenta` y
 * los flujos privados verifican todo contra el backend con Clerk.
 *
 * Cómo funciona:
 * - La escribe `/cuenta` (la única pantalla que ya sabe si la persona es
 *   dueña de un negocio: `GET /partners/me/memberships`) en una cookie de
 *   primer partido, legible por JS, sin datos personales: el rol y el valor
 *   de `__client_uat` (un timestamp del último login, no identifica a nadie).
 * - Vale solo mientras `__client_uat` sea el mismo: si se cierra sesión (la
 *   cookie de Clerk pasa a `"0"`) o entra otra cuenta (otro timestamp), la
 *   pista deja de coincidir y el header vuelve a "cliente" o "sin sesión" sin
 *   que nadie tenga que borrarla. Igual se borra al cerrar sesión desde
 *   `/cuenta` (prolijidad, no seguridad).
 *
 * Sin `"use client"` y sin imports: lo usan la isla del header y la de
 * `/cuenta`. Solo se llama en el browser (lee `document.cookie`).
 */

/** Nombre de la cookie de la pista de rol. */
export const ROLE_HINT_COOKIE = "al_role";
/** Único rol que se guarda: la ausencia de pista es "cliente". */
const PROVIDER_ROLE = "proveedor";
/** 30 días: si vence, el header muestra "cliente" hasta volver a `/cuenta`. */
const ROLE_HINT_MAX_AGE = 60 * 60 * 24 * 30;
/** La cookie sin sufijo: respaldo si clerk-js no escribió la sufijada. */
const UNSUFFIXED_CLIENT_UAT = "__client_uat";

/** Estado de la cuenta que pinta el header. */
export type AccountHint = "anon" | "cliente" | "proveedor";

export function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  for (const part of document.cookie.split(";")) {
    const cookie = part.trim();
    if (cookie.startsWith(prefix)) return decodeURIComponent(cookie.slice(prefix.length));
  }
  return null;
}

/**
 * Valor de `__client_uat` de la instancia, o `null` si no hay sesión
 * (ausente, vacía o `"0"`). Si la sufijada no existe, cae a la sin sufijo,
 * igual que el backend de Clerk.
 */
export function readClientUat(cookieName: string | null): string | null {
  if (!cookieName) return null;
  const value = readCookie(cookieName) ?? readCookie(UNSUFFIXED_CLIENT_UAT);
  return value !== null && value !== "" && value !== "0" ? value : null;
}

/** Estado de la cuenta según las dos pistas (sesión y rol). */
export function readAccountHint(cookieName: string | null): AccountHint {
  const uat = readClientUat(cookieName);
  if (!uat) return "anon";
  return readCookie(ROLE_HINT_COOKIE) === `${PROVIDER_ROLE}.${uat}` ? "proveedor" : "cliente";
}

/**
 * La misma pista, calculada en el server con las cookies del request (para
 * que el HTML de `/cuenta` ya traiga el esqueleto correcto). `getCookie` es
 * `(name) => cookies().get(name)?.value`.
 */
export function accountHintFromCookies(
  cookieName: string | null,
  getCookie: (name: string) => string | undefined,
): AccountHint {
  if (!cookieName) return "anon";
  const uat = getCookie(cookieName) ?? getCookie(UNSUFFIXED_CLIENT_UAT);
  if (!uat || uat === "0") return "anon";
  return getCookie(ROLE_HINT_COOKIE) === `${PROVIDER_ROLE}.${uat}` ? "proveedor" : "cliente";
}

function writeCookie(value: string, maxAge: number) {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${ROLE_HINT_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Guarda (o borra) la pista según lo que `/cuenta` acaba de saber del
 * backend. Sin sesión de Clerk en el browser no escribe nada.
 */
export function syncRoleHint(cookieName: string | null, isProvider: boolean) {
  const uat = readClientUat(cookieName);
  if (isProvider && uat) writeCookie(`${PROVIDER_ROLE}.${uat}`, ROLE_HINT_MAX_AGE);
  else clearRoleHint();
}

/** Borra la pista (al cerrar sesión, o cuando la cuenta no tiene negocios). */
export function clearRoleHint() {
  if (readCookie(ROLE_HINT_COOKIE) === null) return;
  writeCookie("", 0);
}
