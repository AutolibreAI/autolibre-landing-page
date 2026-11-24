/**
 * Qué plan tiene el negocio, para "Mi negocio": la suscripción de
 * `GET /partners/{id}/subscription` reducida a los estados que dibuja la
 * pantalla. La regla de oro es la de la contratación: un plan pago se
 * muestra como vigente SOLO con `active` o `trialing`.
 *
 * Módulo puro (sin alias `@/` ni imports de la app): lo prueban los tests de
 * `scripts/partner-billing/` con `node --test`.
 */

/** Lo que hace falta de `SubscriptionView` (`lib/partner-billing/subscription.ts`). */
export type PlanStateInput = {
  readonly planCode: string;
  readonly status: string | null;
  readonly trialEndsAt: string | null;
  readonly currentPeriodEnd: string | null;
  readonly accessUntil: string | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly trialEligible: boolean | null;
};

export type PlanState =
  /** Sin suscripción viva. */
  | { readonly kind: "free" }
  /** Checkout sin confirmar en Mercado Pago: rige Gratis hasta que se confirme. */
  | { readonly kind: "pending"; readonly requestedPlan: string }
  | { readonly kind: "trial"; readonly plan: string; readonly until: string | null }
  | { readonly kind: "active"; readonly plan: string; readonly periodEnd: string | null }
  /** Baja pedida: el plan sigue hasta `until`. */
  | { readonly kind: "canceling"; readonly plan: string; readonly until: string | null }
  /** `paused` u otro estado: no se muestra como vigente. */
  | { readonly kind: "other"; readonly plan: string };

export function planStateFor(view: PlanStateInput): PlanState {
  if (view.status === null || view.planCode === "free") return { kind: "free" };
  if (view.status === "pending") return { kind: "pending", requestedPlan: view.planCode };
  if (view.status === "trialing" || view.status === "active") {
    if (view.cancelAtPeriodEnd) {
      return {
        kind: "canceling",
        plan: view.planCode,
        until: view.accessUntil ?? (view.status === "trialing" ? view.trialEndsAt : view.currentPeriodEnd),
      };
    }
    return view.status === "trialing"
      ? { kind: "trial", plan: view.planCode, until: view.trialEndsAt }
      : { kind: "active", plan: view.planCode, periodEnd: view.currentPeriodEnd };
  }
  return { kind: "other", plan: view.planCode };
}

/** El plan pago vigente (con acceso), o `null`. */
export function livePlanCode(state: PlanState): string | null {
  return state.kind === "trial" || state.kind === "active" || state.kind === "canceling" ? state.plan : null;
}

/**
 * Tope mensual de pedidos por WhatsApp de cada plan pago
 * (`monthlyWhatsappRequestLimit` de `GET /billing/plans`), por código. Lo que
 * no tiene forma se descarta. El plan Gratis no viene en el catálogo.
 */
export function parsePlanLimits(body: unknown): Readonly<Record<string, number>> {
  if (!Array.isArray(body)) return {};
  const limits: Record<string, number> = {};
  for (const item of body) {
    if (
      typeof item === "object" &&
      item !== null &&
      typeof (item as Record<string, unknown>).code === "string" &&
      typeof (item as Record<string, unknown>).monthlyWhatsappRequestLimit === "number"
    ) {
      const record = item as { code: string; monthlyWhatsappRequestLimit: number };
      if (Number.isInteger(record.monthlyWhatsappRequestLimit) && record.monthlyWhatsappRequestLimit > 0) {
        limits[record.code] = record.monthlyWhatsappRequestLimit;
      }
    }
  }
  return limits;
}

/**
 * La prueba que se le puede prometer a un negocio en Gratis: los días del
 * plan si el backend confirma que le corresponde (`trialEligible === true`);
 * si no lo sabe (`null`), nada concreto (el texto condicional); si ya la usó,
 * nada.
 */
export function trialOfferFor(
  trialDays: number | null,
  trialEligible: boolean | null,
): { readonly kind: "days"; readonly days: number } | { readonly kind: "conditional" } | { readonly kind: "none" } {
  if (trialDays === null || trialDays <= 0 || trialEligible === false) return { kind: "none" };
  if (trialEligible === true) return { kind: "days", days: trialDays };
  return { kind: "conditional" };
}
