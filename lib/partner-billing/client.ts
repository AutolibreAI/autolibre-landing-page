import {
  buildCheckoutBody,
  ownerMemberships,
  parseCheckoutResponse,
  parsePlans,
  parseTerms,
  type BillingPlan,
  type CheckoutInput,
  type CheckoutResult,
  type PartnerTerms,
} from "@/lib/partner-billing/checkout";
import {
  parsePendingCheckout,
  parseSubscriptionResponse,
  PENDING_CHECKOUT_STORAGE_KEY,
  serializePendingCheckout,
  type PendingCheckout,
  type SubscriptionResult,
} from "@/lib/partner-billing/subscription";
import { apiBaseUrl, readJson, type GetToken } from "@/lib/partner-claims/client";
import { parseMemberships, type Membership } from "@/lib/partner-claims/redeem";

/**
 * Llamadas de la contratación DESDE EL BROWSER (spec 212, research D1), como
 * el canje de la 211: Bearer de Clerk, sin cookies (`credentials: "omit"`) y
 * la URL de `NEXT_PUBLIC_AUTOLIBRE_API_URL`. Ninguna función tira: red caída,
 * CORS, falta de configuración o una respuesta rara terminan en un resultado.
 *
 * NUNCA se loguea el email del pagador (dato personal, Ley 25.326).
 */

const LOG = "[contratar]";

export type PlansResult = { readonly ok: true; readonly plans: BillingPlan[] } | { readonly ok: false };

/** `GET /billing/plans` (público, sin token): precio y prueba de cada plan. */
export async function fetchBillingPlans(): Promise<PlansResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se pueden leer los planes.`);
    return { ok: false };
  }
  try {
    const response = await fetch(`${base}/billing/plans`, { credentials: "omit", cache: "no-store" });
    if (!response.ok) {
      console.error(`${LOG} no se pudieron leer los planes (${response.status})`, {
        requestId: response.headers.get("x-request-id"),
      });
      return { ok: false };
    }
    return { ok: true, plans: parsePlans(await readJson(response)) };
  } catch (error) {
    console.error(`${LOG} no se pudieron leer los planes:`, error);
    return { ok: false };
  }
}

export type TermsResult = { readonly ok: true; readonly terms: PartnerTerms } | { readonly ok: false };

/**
 * `GET /billing/terms` (público, sin token): el texto y la versión vigentes de
 * los términos comerciales. Única fuente: no hay copia local.
 */
export async function fetchBillingTerms(): Promise<TermsResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se pueden leer los términos.`);
    return { ok: false };
  }
  try {
    const response = await fetch(`${base}/billing/terms`, { credentials: "omit", cache: "no-store" });
    const terms = response.ok ? parseTerms(await readJson(response)) : null;
    if (!terms) {
      console.error(`${LOG} no se pudieron leer los términos (${response.status})`, {
        requestId: response.headers.get("x-request-id"),
      });
      return { ok: false };
    }
    return { ok: true, terms };
  } catch (error) {
    console.error(`${LOG} no se pudieron leer los términos:`, error);
    return { ok: false };
  }
}

export type OwnersResult =
  | { readonly kind: "ok"; readonly owners: Membership[] }
  | { readonly kind: "unauthenticated" | "unknown" };

/** `GET /partners/me/memberships`, filtrado a los talleres de los que es dueño. */
export async function fetchOwnerPartners(getToken: GetToken): Promise<OwnersResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se pueden leer los talleres.`);
    return { kind: "unknown" };
  }
  try {
    const token = await getToken();
    if (!token) return { kind: "unauthenticated" };

    const response = await fetch(`${base}/partners/me/memberships`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
      cache: "no-store",
    });
    if (response.status === 401) return { kind: "unauthenticated" };
    if (!response.ok) {
      console.error(`${LOG} no se pudieron leer las membresías (${response.status})`, {
        requestId: response.headers.get("x-request-id"),
      });
      return { kind: "unknown" };
    }
    return { kind: "ok", owners: ownerMemberships(parseMemberships(await readJson(response))) };
  } catch (error) {
    console.error(`${LOG} no se pudieron leer las membresías:`, error);
    return { kind: "unknown" };
  }
}

/** `POST /partners/{partnerId}/subscription/checkouts`. */
export async function startCheckout(
  partnerId: string,
  input: CheckoutInput,
  getToken: GetToken,
): Promise<CheckoutResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se puede iniciar el pago.`);
    return { kind: "unknown" };
  }
  try {
    const token = await getToken();
    if (!token) return { kind: "unauthenticated" };

    const response = await fetch(`${base}/partners/${encodeURIComponent(partnerId)}/subscription/checkouts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: buildCheckoutBody(input),
      credentials: "omit",
      cache: "no-store",
    });
    const result = parseCheckoutResponse({
      status: response.status,
      body: await readJson(response),
      requestId: response.headers.get("x-request-id"),
    });
    if (result.kind !== "success") {
      console.error(`${LOG} checkout rechazado (${response.status}, ${result.kind})`, {
        requestId: result.requestId,
      });
    }
    return result;
  } catch (error) {
    console.error(`${LOG} no se pudo iniciar el pago:`, error);
    return { kind: "unknown" };
  }
}

/** `GET /partners/{partnerId}/subscription`: el estado real, para el polling. */
export async function fetchSubscription(partnerId: string, getToken: GetToken): Promise<SubscriptionResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se puede consultar el estado.`);
    return { kind: "unknown" };
  }
  try {
    const token = await getToken();
    if (!token) return { kind: "unauthenticated" };

    const response = await fetch(`${base}/partners/${encodeURIComponent(partnerId)}/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "omit",
      cache: "no-store",
    });
    const result = parseSubscriptionResponse({
      status: response.status,
      body: await readJson(response),
      requestId: response.headers.get("x-request-id"),
    });
    if (result.kind !== "ok") {
      console.error(`${LOG} no se pudo consultar el estado (${response.status}, ${result.kind})`, {
        requestId: result.requestId,
      });
    }
    return result;
  } catch (error) {
    console.error(`${LOG} no se pudo consultar el estado:`, error);
    return { kind: "unknown" };
  }
}

/*
 * Checkout en curso, para la pantalla de resultado (research D7): MP vuelve a
 * una URL fija sin decir de qué taller. Solo esta pestaña (`sessionStorage`)
 * y sin datos personales. Sin storage (modo privado, bloqueado), la pantalla
 * de resultado cae a las membresías.
 */

export function savePendingCheckout(checkout: PendingCheckout): void {
  try {
    sessionStorage.setItem(PENDING_CHECKOUT_STORAGE_KEY, serializePendingCheckout(checkout));
  } catch {
    // Sin storage: el resultado se resuelve por membresías.
  }
}

export function readPendingCheckout(): PendingCheckout | null {
  try {
    return parsePendingCheckout(sessionStorage.getItem(PENDING_CHECKOUT_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function clearPendingCheckout(): void {
  try {
    sessionStorage.removeItem(PENDING_CHECKOUT_STORAGE_KEY);
  } catch {
    // Nada que limpiar.
  }
}
