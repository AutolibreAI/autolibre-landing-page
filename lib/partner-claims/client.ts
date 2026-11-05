import {
  buildRedeemBody,
  parseMemberships,
  parseRedeemResponse,
  pickPartnerName,
  type RedeemResult,
} from "@/lib/partner-claims/redeem";

/**
 * Llamadas del canje DESDE EL BROWSER (research D1): el rate limit del
 * backend es por IP, así que cada persona tiene que pegarle con la suya. Un
 * route handler de Next haría que todos compartan la IP del server.
 *
 * Excepción acotada a este módulo (research D2): usa
 * `NEXT_PUBLIC_AUTOLIBRE_API_URL` (incluye `/api/v1`). Todo lo demás sigue
 * usando `AUTOLIBRE_API_URL`, server-only, desde `lib/autolibre-api.ts`.
 *
 * Sin cookies (`credentials: "omit"`): el backend autentica con el Bearer de
 * Clerk y su CORS no acepta credenciales.
 */

/** `getToken` de `useAuth()` de Clerk. */
export type GetToken = () => Promise<string | null>;

/**
 * Lectura literal: Next solo inlinea `process.env.NEXT_PUBLIC_*` escrito así.
 * También la usa la contratación de planes (`lib/partner-billing/client.ts`).
 */
export function apiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_AUTOLIBRE_API_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/** El body como JSON, o `null` si no lo es (nunca tira). */
export async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

/**
 * `POST /partner-claims/redemptions`. Nunca tira: red caída, CORS, falta de
 * configuración o una respuesta rara terminan en `unknown` (FR-013).
 */
export async function redeemClaimCode(code: string, getToken: GetToken): Promise<RedeemResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error("[reclamar] falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se puede canjear.");
    return { kind: "unknown" };
  }

  try {
    const token = await getToken();
    if (!token) return { kind: "unauthenticated" };

    const response = await fetch(`${base}/partner-claims/redemptions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: buildRedeemBody(code),
      credentials: "omit",
      cache: "no-store",
    });
    const result = parseRedeemResponse({
      status: response.status,
      body: await readJson(response),
      requestId: response.headers.get("x-request-id"),
    });

    if (result.kind !== "success") {
      // Nunca se loguea el código: es un secreto de un solo uso.
      console.error(`[reclamar] canje rechazado (${response.status}, ${result.kind})`, {
        requestId: result.requestId,
      });
    }
    return result;
  } catch (error) {
    console.error("[reclamar] no se pudo llamar al canje:", error);
    return { kind: "unknown" };
  }
}

/**
 * Nombre del taller recién reclamado, desde `GET /partners/me/memberships`.
 * `null` ante cualquier falla: el éxito se muestra igual, sin nombre.
 */
export async function fetchClaimedPartnerName(
  partnerId: string,
  getToken: GetToken,
): Promise<string | null> {
  const base = apiBaseUrl();
  if (!base) return null;

  try {
    const token = await getToken();
    if (!token) return null;

    const response = await fetch(`${base}/partners/me/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[reclamar] no se pudieron leer las membresías (${response.status})`, {
        requestId: response.headers.get("x-request-id"),
      });
      return null;
    }
    return pickPartnerName(parseMemberships(await readJson(response)), partnerId);
  } catch (error) {
    console.error("[reclamar] no se pudieron leer las membresías:", error);
    return null;
  }
}
