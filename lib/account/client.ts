import { parsePartnerDetailResponse, type PartnerProfileResult } from "@/lib/account/partner-profile";
import { parsePlanLimits } from "@/lib/account/plan-state";
import { parsePlans, type BillingPlan } from "@/lib/partner-billing/checkout";
import { apiBaseUrl, readJson } from "@/lib/partner-claims/client";

/**
 * Lecturas de "Mi negocio" DESDE EL BROWSER, como las de la contratación
 * (`lib/partner-billing/client.ts`): `NEXT_PUBLIC_AUTOLIBRE_API_URL`, sin
 * cookies y nunca tiran. Las dos de acá son públicas (sin token); las que
 * piden la cuenta (membresías, suscripción, baja) viven en
 * `lib/partner-billing/client.ts` y se reusan tal cual.
 */

const LOG = "[cuenta]";

/** `GET /partners/{partnerId}`: el perfil que ve la app (ver `partner-profile.ts`). */
export async function fetchPartnerProfile(partnerId: string): Promise<PartnerProfileResult> {
  const base = apiBaseUrl();
  if (!base) {
    console.error(`${LOG} falta NEXT_PUBLIC_AUTOLIBRE_API_URL: no se puede leer el perfil.`);
    return { kind: "unknown" };
  }
  try {
    const response = await fetch(`${base}/partners/${encodeURIComponent(partnerId)}`, {
      credentials: "omit",
      cache: "no-store",
    });
    const result = parsePartnerDetailResponse(response.status, await readJson(response));
    if (result.kind === "unknown") {
      console.error(`${LOG} no se pudo leer el perfil (${response.status})`, {
        requestId: response.headers.get("x-request-id"),
      });
    }
    return result;
  } catch (error) {
    console.error(`${LOG} no se pudo leer el perfil:`, error);
    return { kind: "unknown" };
  }
}

export type PlanCatalog = {
  readonly plans: readonly BillingPlan[];
  /** Tope mensual de pedidos por WhatsApp por código de plan pago. */
  readonly limits: Readonly<Record<string, number>>;
};

/** `GET /billing/plans` (público): precio, prueba y tope de cada plan pago. `null` si falla. */
export async function fetchPlanCatalog(): Promise<PlanCatalog | null> {
  const base = apiBaseUrl();
  if (!base) return null;
  try {
    const response = await fetch(`${base}/billing/plans`, { credentials: "omit", cache: "no-store" });
    if (!response.ok) {
      console.error(`${LOG} no se pudieron leer los planes (${response.status})`);
      return null;
    }
    const body = await readJson(response);
    return { plans: parsePlans(body), limits: parsePlanLimits(body) };
  } catch (error) {
    console.error(`${LOG} no se pudieron leer los planes:`, error);
    return null;
  }
}
