/**
 * Alta de un taller CON DUEÑO (spec 212, US3; contrato `partner-onboarding-owner`).
 *
 * El formulario de `/proveedores/registro/formulario` exige sesión de Clerk y
 * manda el token como `Authorization: Bearer <token>` a `/api/provider`, que lo
 * reenvía TAL CUAL a `POST /partner-applications`. El backend guarda quién
 * pidió el alta y, cuando el equipo aprueba la solicitud, deja esa cuenta como
 * dueña del taller. Sin código de reclamo.
 *
 * Reglas (research D17):
 * - El browser SIEMPRE manda el header. Si `getToken()` no da token, no se
 *   manda nada: jamás se cae a un alta anónima.
 * - 401 ⇒ se renueva el token (`getToken({ skipCache: true })`) y se reintenta
 *   UNA vez, de nuevo con el header. Si vuelve a fallar ⇒ `unauthenticated` y
 *   el formulario pide volver a entrar, sin borrar lo que se escribió.
 * - El token nunca se loguea (ni acá, ni en la ruta, ni en `lib/autolibre-api.ts`).
 *
 * Autocontenido (sin `@/`) para poder testearlo con `node --test`.
 */

/** La ruta de la landing que recibe el alta. */
export const PROVIDER_APPLICATION_ENDPOINT = "/api/provider";

/** `getToken` de `useAuth()` de Clerk (acepta `{ skipCache }`). */
export type OwnerGetToken = (options?: { readonly skipCache?: boolean }) => Promise<string | null>;

export type OwnerSubmitOutcome =
  /** Cualquier respuesta que no sea 401: el formulario la lee como siempre. */
  | { readonly kind: "response"; readonly response: Response }
  /** Sin token, o 401 también después de renovarlo: hay que volver a entrar. */
  | { readonly kind: "unauthenticated" };

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * POST del alta con el token de la sesión, con un único reintento ante 401.
 *
 * No atrapa errores de red: el formulario ya los trata como "algo salió mal".
 */
export async function submitWithOwnerToken(
  body: string,
  getToken: OwnerGetToken,
  fetchImpl: FetchLike = fetch,
): Promise<OwnerSubmitOutcome> {
  const post = (token: string) =>
    fetchImpl(PROVIDER_APPLICATION_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body,
    });

  const cached = await getToken();
  if (cached) {
    const response = await post(cached);
    if (response.status !== 401) return { kind: "response", response };
  }

  // Sin token en cache, o el backend lo rechazó: uno nuevo y un solo reintento.
  const fresh = await getToken({ skipCache: true });
  if (!fresh) return { kind: "unauthenticated" };

  const retry = await post(fresh);
  return retry.status === 401 ? { kind: "unauthenticated" } : { kind: "response", response: retry };
}

/**
 * El header `Authorization` que la ruta reenvía al backend: el mismo string que
 * mandó el browser, o `undefined` si no vino (o vino vacío). No se valida ni se
 * decodifica: eso lo hace el backend.
 */
export function forwardableAuthorization(header: string | null | undefined): string | undefined {
  return typeof header === "string" && header.trim() !== "" ? header : undefined;
}
