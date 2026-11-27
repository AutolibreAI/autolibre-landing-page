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

/**
 * Rutas que piden sesión (rebotan a `/ingresar` sin ella): el `matcher` de
 * `proxy.ts`, sin `/ingresar`. Si se suma una pantalla privada allá, se suma
 * acá. `isUnder` cubre `/proveedores/contratar/resultado`.
 */
const SESSION_PATHS = ["/cuenta", "/proveedores/contratar", "/proveedores/reclamar"] as const;

/** La landing pública del alta y los parámetros que abren su flujo privado (`lib/proveedores/query.ts`). */
const REGISTRO_PATH = "/proveedores/registro";
const REGISTRO_FLOW_PARAMS = ["alta", "next"] as const;

/**
 * ¿Esta ruta (con su query) pide sesión? Sin sesión rebota a `/ingresar`, así
 * que la cruz del login nunca puede mandar ahí. Además del `matcher` de
 * `proxy.ts` cuenta el flujo del alta (`/proveedores/registro?alta=1` o
 * `?next=`), que se protege del lado del cliente.
 */
export function requiresSession(pathWithQuery: string): boolean {
  const { pathname, searchParams } = new URL(pathWithQuery, PLACEHOLDER_ORIGIN);
  if (SESSION_PATHS.some((base) => isUnder(pathname, base))) return true;
  return pathname === REGISTRO_PATH && REGISTRO_FLOW_PARAMS.some((param) => searchParams.has(param));
}

/**
 * Adónde lleva la cruz de `/ingresar`: el `href` real del link, calculado en
 * el server (2026-11-27). El `?redirect=` es el destino DESPUÉS de entrar y
 * casi siempre pide sesión, así que no sirve como salida: se mapea a la
 * página PÚBLICA desde la que se llega a ese flujo.
 * - alta (`/proveedores/registro?alta=1`, `?next=`) → `/proveedores/registro`
 *   sin query (la landing "Sumá tu negocio", sin reabrir el flujo).
 * - contratar y su resultado → `/proveedores/planes`.
 * - reclamar → `/proveedores/registro` ("¿Tu negocio ya aparece?").
 * - `/cuenta` y cualquier otro destino → `/` (el Home).
 *
 * Recibe un destino YA validado por `parseSafeRedirect`. Nunca devuelve una
 * ruta que pida sesión (ver `requiresSession`).
 */
export function signInExitPath(destination: string): string {
  switch (signInDestinationKind(destination)) {
    case "alta":
    case "reclamar":
      return REGISTRO_PATH;
    case "contratar":
    case "resultado":
      return "/proveedores/planes";
    default:
      return "/";
  }
}

/** Lo que se lee de cada entrada de `navigation.entries()` (Navigation API). */
export type HistoryEntryLike = { readonly url: string | null };

/**
 * Mejora progresiva de la cruz: a qué entrada del historial se puede volver
 * ("atrás" de verdad, con el scroll donde estaba). Devuelve su índice, o `-1`
 * si hay que seguir el `href` de `signInExitPath`.
 *
 * `entries` es `navigation.entries()`: SOLO las entradas contiguas del mismo
 * origen de esta pestaña. Por eso alcanza para descartar los casos en los que
 * `history.back()` saldría mal: entrada directa o pestaña nueva (no hay
 * entrada anterior) y la vuelta de Google (lo anterior es de otro origen y
 * corta la lista). Desde la entrada actual hacia atrás:
 * - se saltean las entradas de `/ingresar` (los pasos `#/...` de Clerk o un
 *   login anterior);
 * - la primera que no es `/ingresar` es el destino, salvo que pida sesión
 *   (rebotaría de vuelta al login), no tenga URL o sea de otro origen.
 */
export function signInExitHistoryIndex(
  entries: readonly HistoryEntryLike[],
  currentIndex: number,
  origin: string,
): number {
  for (let index = Math.min(currentIndex, entries.length) - 1; index >= 0; index--) {
    const raw = entries[index]?.url;
    if (!raw) return -1;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      return -1;
    }
    if (url.origin !== origin) return -1;
    if (isSignInPath(url.pathname)) continue;
    return requiresSession(`${url.pathname}${url.search}`) ? -1 : index;
  }
  return -1;
}
