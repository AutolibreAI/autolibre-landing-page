/**
 * Elección "Soy cliente / Tengo un taller" al crear una cuenta (decisión de
 * producto del 2026-11-24). Fuente ÚNICA de la clave y los valores del
 * contrato con el backend: si el backend pide otro nombre, se cambia acá.
 *
 * Contrato:
 * - Vive en `publicMetadata[SIGNUP_INTENT_KEY]` del usuario de Clerk, con
 *   `"partner"` (se registró como proveedor) o `"customer"` (cliente).
 *   NUNCA en `unsafeMetadata`: esa la puede editar el usuario desde el
 *   navegador.
 * - La escribe SOLO el server de la landing (`POST /api/account/intent`),
 *   después de verificar el token de Clerk, si todavía no existe y si la
 *   cuenta se creó hace menos de `SIGNUP_INTENT_WINDOW_MS`. Nunca la pisa.
 * - Sin intent (cuenta vieja) = cliente. Los permisos sobre un taller siguen
 *   saliendo de la membresía: la membresía siempre manda.
 *
 * Autocontenido (sin imports) para que lo usen el route handler, las islas
 * de Clerk y las pruebas de `scripts/signup-intent` con `node --test`.
 */

/** Clave de `publicMetadata` (contrato con el backend). */
export const SIGNUP_INTENT_KEY = "signupIntent";

export const SIGNUP_INTENTS = {
  partner: "partner",
  customer: "customer",
} as const;

export type SignupIntent = (typeof SIGNUP_INTENTS)[keyof typeof SIGNUP_INTENTS];

/** Ruta de la landing que guarda el intent. */
export const SIGNUP_INTENT_ENDPOINT = "/api/account/intent";

/**
 * Ventana desde la creación de la cuenta en la que se acepta guardar el
 * intent: 30 minutos. Cubre el registro con verificación por email y el de
 * Google; una cuenta vieja no puede autoasignarse un intent después.
 */
export const SIGNUP_INTENT_WINDOW_MS = 30 * 60 * 1000;

export function isSignupIntent(value: unknown): value is SignupIntent {
  return value === SIGNUP_INTENTS.partner || value === SIGNUP_INTENTS.customer;
}

/** El intent guardado en la metadata pública, o `null` si no hay uno válido. */
export function readSignupIntent(publicMetadata: unknown): SignupIntent | null {
  if (typeof publicMetadata !== "object" || publicMetadata === null) return null;
  const value = (publicMetadata as Record<string, unknown>)[SIGNUP_INTENT_KEY];
  return isSignupIntent(value) ? value : null;
}

/** ¿La cuenta todavía está dentro de la ventana para guardar el intent? */
export function isWithinSignupWindow(createdAtMs: number, nowMs: number): boolean {
  return Number.isFinite(createdAtMs) && nowMs - createdAtMs <= SIGNUP_INTENT_WINDOW_MS;
}

/** El `Bearer` del header `Authorization`, o `null` si no vino bien formado. */
export function bearerToken(header: string | null | undefined): string | null {
  if (typeof header !== "string") return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

/** Errores de la ruta: códigos cerrados, sin detalles internos. */
export type SignupIntentError =
  | "invalid_intent"
  | "unauthenticated"
  | "window_closed"
  | "unavailable";

/** Respuesta de `POST /api/account/intent`. */
export type SignupIntentResponseBody =
  | {
      /** El intent vigente (el recién guardado o el que ya estaba). */
      readonly intent: SignupIntent;
      /** `false` si ya había uno: no se pisó. */
      readonly saved: boolean;
    }
  | { readonly error: SignupIntentError };

export type SignupIntentResult = {
  readonly status: number;
  readonly body: SignupIntentResponseBody;
};

/** Lo que el handler necesita de Clerk: inyectado para poder probarlo sin red. */
export type SignupIntentDeps = {
  /** Verifica el token de sesión EN EL SERVER y devuelve el `userId` (`sub`), o `null`. */
  readonly verifySessionToken: (token: string) => Promise<string | null>;
  readonly getUser: (
    userId: string,
  ) => Promise<{ readonly createdAt: number; readonly publicMetadata: unknown }>;
  /** Merge de `publicMetadata` (`updateUserMetadata`), nunca un reemplazo. */
  readonly writeIntent: (userId: string, intent: SignupIntent) => Promise<void>;
  readonly now: () => number;
  /** Log corto, sin datos personales ni tokens. */
  readonly logError?: (message: string) => void;
};

/**
 * Lógica de `POST /api/account/intent`, sin Next ni Clerk:
 * 1. Valida `intent` contra los dos valores (400 `invalid_intent`).
 * 2. Verifica el token del header (401 `unauthenticated`). El `userId` sale
 *    del token, nunca del cuerpo.
 * 3. Si ya hay intent, lo devuelve sin pisarlo (200, `saved: false`).
 * 4. Si la cuenta tiene más de 30 minutos, no escribe (403 `window_closed`).
 * 5. Escribe con merge y devuelve el intent (200, `saved: true`).
 * Cualquier error de Clerk es 502 `unavailable`: el cliente reintenta en la
 * próxima carga.
 */
export async function handleSignupIntentRequest(
  input: { readonly authorization: string | null; readonly body: unknown },
  deps: SignupIntentDeps,
): Promise<SignupIntentResult> {
  const intent =
    typeof input.body === "object" && input.body !== null
      ? (input.body as Record<string, unknown>).intent
      : undefined;
  if (!isSignupIntent(intent)) return { status: 400, body: { error: "invalid_intent" } };

  const token = bearerToken(input.authorization);
  if (!token) return { status: 401, body: { error: "unauthenticated" } };

  let userId: string | null;
  try {
    userId = await deps.verifySessionToken(token);
  } catch {
    userId = null;
  }
  if (!userId) return { status: 401, body: { error: "unauthenticated" } };

  try {
    const user = await deps.getUser(userId);
    const current = readSignupIntent(user.publicMetadata);
    if (current) return { status: 200, body: { intent: current, saved: false } };
    if (!isWithinSignupWindow(user.createdAt, deps.now())) {
      return { status: 403, body: { error: "window_closed" } };
    }
    await deps.writeIntent(userId, intent);
    return { status: 200, body: { intent, saved: true } };
  } catch (error) {
    deps.logError?.(`[signup-intent] no se pudo leer o escribir la metadata (${errorName(error)})`);
    return { status: 502, body: { error: "unavailable" } };
  }
}

/** Solo el tipo de error, nunca el mensaje (puede traer datos de la cuenta). */
function errorName(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
