/**
 * Estado de la suscripción al volver de Mercado Pago (spec 212, FR-008,
 * FR-018): la parte pura, para `node --test`. Sin alias `@/` ni imports de
 * la app (type stripping de Node).
 *
 * Regla de oro: un pago se muestra como confirmado SOLO si el backend lo dice
 * con un estado de esta lista. Nunca por los query params que agrega MP.
 */

/**
 * Estados de `GET /partners/{partnerId}/subscription` (DTO del backend,
 * `VISIBLE_STATUSES`: `pending`, `trialing`, `active`, `paused`; sin
 * suscripción viva, `null`). Viven en UN solo lugar a propósito: si el
 * backend suma o renombra un estado, se cambia acá. Un estado que no está en
 * ninguna lista NUNCA se muestra como confirmado (research D8).
 */
/** Suscripción viva y con acceso al plan: pago (o prueba) confirmado. */
export const CONFIRMED_SUBSCRIPTION_STATUSES: readonly string[] = ["active", "trialing"];
/** El checkout todavía no se autorizó en MP: se sigue consultando. */
export const PENDING_SUBSCRIPTION_STATUSES: readonly string[] = ["pending"];

/** Cada cuánto se consulta y hasta cuándo (contrato: cada 2 s durante 30 s). */
export const POLL_INTERVAL_MS = 2_000;
export const POLL_TIMEOUT_MS = 30_000;

export type SubscriptionView = {
  readonly planCode: string;
  /** `null` = Gratis: no hay suscripción viva. */
  readonly status: string | null;
  readonly trialEndsAt: string | null;
  /** Fin del período pago en curso (sin prueba). Hasta ahí llega una baja pedida hoy. */
  readonly currentPeriodEnd: string | null;
  readonly accessUntil: string | null;
  /** La baja está pedida: el acceso sigue hasta `accessUntil`. */
  readonly cancelAtPeriodEnd: boolean;
  /**
   * Si al taller todavía le corresponde la prueba (una vez en su vida).
   * `null` si el backend no lo manda (campo nuevo, research D15).
   */
  readonly trialEligible: boolean | null;
};

export type SubscriptionResult =
  | { readonly kind: "ok"; readonly view: SubscriptionView }
  | { readonly kind: "unauthenticated" | "not-found" | "unknown"; readonly requestId?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  return typeof value === "string" && value !== "" ? value : null;
}

/**
 * Respuesta del GET ⇒ resultado. Un 200 sin `planCode` o con un `status` que
 * no es string ni `null` es una respuesta rota: `unknown`. Un 404 es el
 * uniforme del backend (no es dueño, no existe) o la ruta todavía no está
 * desplegada: para la pantalla, los dos son "no pudimos consultar".
 */
export function parseSubscriptionResponse({
  status,
  body,
  requestId,
}: {
  readonly status: number;
  readonly body: unknown;
  readonly requestId: string | null;
}): SubscriptionResult {
  const meta = requestId ? { requestId } : {};

  if (status === 200) {
    if (
      isRecord(body) &&
      typeof body.planCode === "string" &&
      (typeof body.status === "string" || body.status === null)
    ) {
      return {
        kind: "ok",
        view: {
          planCode: body.planCode,
          status: body.status,
          trialEndsAt: optionalString(body.trialEndsAt),
          currentPeriodEnd: optionalString(body.currentPeriodEnd),
          accessUntil: optionalString(body.accessUntil),
          cancelAtPeriodEnd: body.cancelAtPeriodEnd === true,
          trialEligible: typeof body.trialEligible === "boolean" ? body.trialEligible : null,
        },
      };
    }
    return { kind: "unknown", ...meta };
  }
  if (status === 401) return { kind: "unauthenticated", ...meta };
  if (status === 404) return { kind: "not-found", ...meta };
  return { kind: "unknown", ...meta };
}

export type SubscriptionClass = "confirmed" | "pending" | "free" | "unconfirmed";

/**
 * - `confirmed`: estado vivo con acceso (`active`, `trialing`).
 * - `pending`: el checkout sigue sin autorizar en MP.
 * - `free`: sin suscripción viva (se canceló o nunca se pagó).
 * - `unconfirmed`: cualquier otro (`paused` o un estado nuevo): no se confirma.
 */
export function classifySubscription(view: SubscriptionView): SubscriptionClass {
  if (view.status === null) return "free";
  if (CONFIRMED_SUBSCRIPTION_STATUSES.includes(view.status)) return "confirmed";
  if (PENDING_SUBSCRIPTION_STATUSES.includes(view.status)) return "pending";
  return "unconfirmed";
}

/**
 * El taller ya tiene un plan pago con acceso (se avisa ANTES del resumen y no
 * se ofrece pagar: el checkout respondería 409 `SUBSCRIPTION_ALREADY_LIVE`).
 * Conservador: solo con un estado confirmado y un plan que no es `free`.
 */
export function hasActivePlan(view: SubscriptionView): boolean {
  return view.planCode !== "free" && classifySubscription(view) === "confirmed";
}

/**
 * Se ofrece "Cancelar suscripción": plan pago con acceso y sin baja pedida.
 * Con la baja ya pedida no se ofrece nada más (ni cancelar de nuevo ni volver
 * a contratar: el checkout respondería 409 `SUBSCRIPTION_ALREADY_LIVE` hasta
 * `accessUntil`).
 */
export function canCancelSubscription(view: SubscriptionView): boolean {
  return hasActivePlan(view) && !view.cancelAtPeriodEnd;
}

/**
 * Hasta cuándo mantendría el plan si cancela hoy (lo que el backend
 * devolverá como `accessUntil`): el fin de la prueba si está en prueba; si
 * no, el fin del período pago en curso. `null` si el GET no lo trae.
 */
export function cancellationAccessDate(view: SubscriptionView): string | null {
  return view.status === "trialing" ? view.trialEndsAt : view.currentPeriodEnd;
}

/**
 * Resultado de `POST /partners/{partnerId}/subscription/cancellation`.
 *
 * - `success`: la baja quedó pedida (idempotente: repetirla devuelve el mismo
 *   `accessUntil`). `accessUntil: null` = solo había un checkout pendiente y
 *   se canceló.
 * - `unauthenticated`: 401 (o no hay token).
 * - `not-found`: 404 uniforme (no existe, no es dueño, está en Gratis o la
 *   baja ya venció) o 400 (id con mala forma). Para la pantalla: "actualizá".
 * - `retryable`: 503, 5xx o la red. No cambió nada; reintentar es seguro
 *   porque el POST es idempotente.
 */
export type CancellationResult =
  | { readonly kind: "success"; readonly accessUntil: string | null }
  | { readonly kind: "unauthenticated" | "not-found" | "retryable"; readonly requestId?: string };

export function parseCancellationResponse({
  status,
  body,
  requestId,
}: {
  readonly status: number;
  readonly body: unknown;
  readonly requestId: string | null;
}): CancellationResult {
  const meta = requestId ? { requestId } : {};

  if (status >= 200 && status < 300) {
    // Un 2xx ya canceló: aunque el body venga raro, no se ofrece reintentar.
    return { kind: "success", accessUntil: isRecord(body) ? optionalString(body.accessUntil) : null };
  }
  if (status === 401) return { kind: "unauthenticated", ...meta };
  if (status === 400 || status === 404) return { kind: "not-found", ...meta };
  return { kind: "retryable", ...meta };
}

/** Qué texto de prueba mostrar en el resumen (research D15). */
export type TrialNote = "eligible" | "used" | "conditional" | "none";

/**
 * - Sin días de prueba en el plan: nada.
 * - `trialEligible === true`: "Incluye N días de prueba".
 * - `trialEligible === false`: "ya usó su prueba".
 * - Sin el dato (campo ausente o el GET falló): el texto condicional (FR-017).
 */
export function trialNoteFor(trialDays: number, trialEligible: boolean | null | undefined): TrialNote {
  if (trialDays <= 0) return "none";
  if (trialEligible === true) return "eligible";
  if (trialEligible === false) return "used";
  return "conditional";
}

/**
 * ¿Se programa otra consulta? Solo mientras está pendiente y la próxima
 * consulta cae dentro de la ventana de 30 s.
 */
export function shouldKeepPolling(classification: SubscriptionClass, elapsedMs: number): boolean {
  return classification === "pending" && elapsedMs + POLL_INTERVAL_MS <= POLL_TIMEOUT_MS;
}

/** Lo que se guarda en `sessionStorage` antes de ir a MP (research D7). */
export type PendingCheckout = {
  readonly partnerId: string;
  readonly planCode: string;
  readonly subscriptionId: string;
};

export const PENDING_CHECKOUT_STORAGE_KEY = "autolibre:contratar:checkout";

export function serializePendingCheckout(checkout: PendingCheckout): string {
  return JSON.stringify({
    partnerId: checkout.partnerId,
    planCode: checkout.planCode,
    subscriptionId: checkout.subscriptionId,
  });
}

/** Lo guardado, o `null` si no hay nada o no tiene forma (storage editable). */
export function parsePendingCheckout(raw: string | null): PendingCheckout | null {
  if (!raw) return null;
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return null;
  }
  if (
    isRecord(value) &&
    typeof value.partnerId === "string" &&
    isPartnerId(value.partnerId) &&
    typeof value.planCode === "string" &&
    typeof value.subscriptionId === "string"
  ) {
    return { partnerId: value.partnerId, planCode: value.planCode, subscriptionId: value.subscriptionId };
  }
  return null;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** El backend valida el `partnerId` con `ParseUUIDPipe`: acá, la misma forma. */
export function isPartnerId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

/**
 * `?partnerId=` de la vuelta de MP (si backend lo agrega a la `back_url`).
 * Solo dice QUÉ taller consultar: el estado lo confirma el backend, que
 * responde 404 si la cuenta no es dueña.
 */
export function parsePartnerIdParam(raw: string | readonly string[] | undefined): string | null {
  const first = (typeof raw === "string" ? raw : raw?.[0])?.trim() ?? "";
  return isPartnerId(first) ? first.toLowerCase() : null;
}
