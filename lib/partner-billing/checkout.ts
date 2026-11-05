/**
 * Contratación de un plan pago (spec 212): la parte pura, sin red ni React,
 * para probarla con `node --test` (`npm run test:partner-billing`).
 *
 * Corre con el type stripping de Node: solo sintaxis TS borrable, sin alias
 * `@/` ni imports de la app. El copy de cada resultado vive en
 * `lib/content/partner-checkout.ts`; acá solo se decide QUÉ pasó.
 *
 * Contrato: `specs/212-partner-plan-checkout/contracts/billing-api.md`.
 */

/** Planes que se compran online. `free` no se compra: es no tener plan. */
export const PAID_PLAN_CODES = ["plus", "plus_max"] as const;
export type PaidPlanCode = (typeof PAID_PLAN_CODES)[number];

/** Ids de los planes en la landing (`providers-plans.ts`) ⇒ `code` del backend. */
export const LANDING_PLAN_ID_TO_CODE = {
  "plan-plus": "plus",
  "plan-plus-max": "plus_max",
} as const satisfies Record<string, PaidPlanCode>;

export function isPaidPlanCode(value: string): value is PaidPlanCode {
  return (PAID_PLAN_CODES as readonly string[]).includes(value);
}

/**
 * `?plan=` de la URL. Solo un plan pago; `free`, vacío o cualquier otra cosa
 * es `null` (la página manda a la de planes). Con el parámetro repetido vale
 * el primero, como en el resto de las URLs del sitio.
 */
export function parsePlanParam(raw: string | readonly string[] | undefined): PaidPlanCode | null {
  const first = typeof raw === "string" ? raw : raw?.[0];
  const code = first?.trim().toLowerCase() ?? "";
  return isPaidPlanCode(code) ? code : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Un plan de `GET /billing/plans`, con lo que usa el resumen. */
export type BillingPlan = {
  readonly code: string;
  readonly name: string;
  /** Precio mensual NETO, salvo `priceIncludesVat`. */
  readonly priceAmount: number;
  /** ISO 4217. */
  readonly currency: string;
  readonly priceIncludesVat: boolean;
  /** Días de prueba del primer checkout (una sola vez por taller). */
  readonly trialDays: number;
};

/** Body de `GET /billing/plans`. Lo que no tiene forma de plan se descarta. */
export function parsePlans(body: unknown): BillingPlan[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((item): BillingPlan[] =>
    isRecord(item) &&
    typeof item.code === "string" &&
    typeof item.priceAmount === "number" &&
    Number.isFinite(item.priceAmount) &&
    typeof item.currency === "string" &&
    item.currency !== ""
      ? [
          {
            code: item.code,
            name: typeof item.name === "string" ? item.name : item.code,
            priceAmount: item.priceAmount,
            currency: item.currency,
            priceIncludesVat: item.priceIncludesVat === true,
            trialDays:
              typeof item.trialDays === "number" && Number.isInteger(item.trialDays) && item.trialDays > 0
                ? item.trialDays
                : 0,
          },
        ]
      : [],
  );
}

export function findPlan(plans: readonly BillingPlan[], code: string): BillingPlan | null {
  return plans.find((plan) => plan.code === code) ?? null;
}

/**
 * "ARS 20.000": el mismo formato que la página de planes. Con decimales, hasta
 * dos. Si la moneda no es un código válido, cae a "<moneda> <número>".
 */
export function formatPlanPrice(plan: Pick<BillingPlan, "priceAmount" | "currency">): string {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: plan.currency,
      currencyDisplay: "code",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })
      .format(plan.priceAmount)
      .replace(/\s/g, " ");
  } catch {
    return `${plan.currency} ${plan.priceAmount}`;
  }
}

/**
 * Fecha para mostrar ("4 de diciembre de 2026"), en la zona horaria de
 * Argentina. `null` si no hay fecha o no se puede leer.
 */
export function formatDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  }).format(date);
}

/** Tope de una dirección de email (RFC 5321), el mismo que valida el backend. */
export const PAYER_EMAIL_MAX_LENGTH = 254;

export type PayerEmailValidation =
  | { readonly ok: true; readonly email: string }
  | { readonly ok: false; readonly reason: "empty" | "invalid" };

/**
 * Email de la cuenta de Mercado Pago. Solo forma (la coincidencia con la
 * cuenta que paga la valida MP en su pantalla): sin espacios, una `@`, un
 * punto en el dominio y hasta 254 caracteres.
 */
export function validatePayerEmail(raw: string): PayerEmailValidation {
  const email = raw.trim();
  if (email === "") return { ok: false, reason: "empty" };
  if (email.length > PAYER_EMAIL_MAX_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, reason: "invalid" };
  }
  return { ok: true, email };
}

export type CheckoutInput = {
  readonly planCode: PaidPlanCode;
  readonly termsVersion: string;
  readonly payerEmail: string;
};

/**
 * Body del `POST /partners/{partnerId}/subscription/checkouts`: exactamente
 * estos tres campos (el backend rechaza cualquier campo de más) y NUNCA un
 * monto (FR-007).
 */
export function buildCheckoutBody({ planCode, termsVersion, payerEmail }: CheckoutInput): string {
  return JSON.stringify({ planCode, termsVersion, payerEmail });
}

/** Rechazos posibles del checkout. Cada uno tiene su mensaje en el content. */
export type CheckoutFailureKind =
  | "payer-email-rejected"
  | "invalid-input"
  | "unauthenticated"
  | "disabled"
  | "not-found"
  | "terms-outdated"
  | "already-live"
  | "in-progress"
  | "rate-limited"
  | "unavailable"
  | "unknown";

export type CheckoutResult =
  | { readonly kind: "success"; readonly subscriptionId: string; readonly initPointUrl: string }
  | {
      readonly kind: "already-live";
      /** Hasta cuándo sigue el acceso si la baja está pedida; `null` si no. */
      readonly accessUntil: string | null;
      readonly requestId?: string;
    }
  | { readonly kind: Exclude<CheckoutFailureKind, "already-live">; readonly requestId?: string };

export type HttpResponse = {
  readonly status: number;
  /** El body ya parseado como JSON, o `null` si no era JSON. */
  readonly body: unknown;
  /** Header `x-request-id` (expuesto por CORS), solo para el log. */
  readonly requestId: string | null;
};

/** `code` del body de error del backend (`{ ...details, statusCode, message, code }`). */
export function errorCode(body: unknown): string | null {
  return isRecord(body) && typeof body.code === "string" ? body.code : null;
}

/** Solo un link `https:` de verdad: nunca se redirige a otra cosa. */
function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * `accessUntil` del 409 `SUBSCRIPTION_ALREADY_LIVE`. El filtro de errores del
 * backend esparce los `details` en el nivel superior del body; el contrato
 * lo documenta como `details.accessUntil`. Se leen los dos (research D9).
 */
function readAccessUntil(body: unknown): string | null {
  if (!isRecord(body)) return null;
  if (typeof body.accessUntil === "string" && body.accessUntil !== "") return body.accessUntil;
  const details = body.details;
  if (isRecord(details) && typeof details.accessUntil === "string" && details.accessUntil !== "") {
    return details.accessUntil;
  }
  return null;
}

const CONFLICT_KINDS: Readonly<Record<string, "terms-outdated" | "in-progress">> = {
  TERMS_VERSION_OUTDATED: "terms-outdated",
  CHECKOUT_IN_PROGRESS: "in-progress",
};

/**
 * Status HTTP + `code` ⇒ resultado (research D9). Conservador: un 403, 404
 * o 409 sin el `code` del contrato es `unknown` (ruta inexistente, URL mal
 * configurada), nunca se disfraza de otro caso.
 */
export function parseCheckoutResponse({ status, body, requestId }: HttpResponse): CheckoutResult {
  const meta = requestId ? { requestId } : {};
  const code = errorCode(body);

  if (status === 200 || status === 201) {
    if (
      isRecord(body) &&
      typeof body.subscriptionId === "string" &&
      body.subscriptionId !== "" &&
      isHttpsUrl(body.initPointUrl)
    ) {
      return { kind: "success", subscriptionId: body.subscriptionId, initPointUrl: body.initPointUrl };
    }
    return { kind: "unknown", ...meta };
  }
  if (status === 400) {
    return { kind: code === "PAYER_EMAIL_REJECTED" ? "payer-email-rejected" : "invalid-input", ...meta };
  }
  if (status === 401) return { kind: "unauthenticated", ...meta };
  if (status === 403) return { kind: code === "FEATURE_DISABLED" ? "disabled" : "unknown", ...meta };
  if (status === 404) return { kind: code === "NOT_FOUND" ? "not-found" : "unknown", ...meta };
  if (status === 409) {
    if (code === "SUBSCRIPTION_ALREADY_LIVE") {
      return { kind: "already-live", accessUntil: readAccessUntil(body), ...meta };
    }
    const kind = code ? CONFLICT_KINDS[code] : undefined;
    return { kind: kind ?? "unknown", ...meta };
  }
  if (status === 429) return { kind: "rate-limited", ...meta };
  if (status === 503) return { kind: "unavailable", ...meta };
  return { kind: "unknown", ...meta };
}

/**
 * Términos comerciales para talleres, de `GET /billing/terms` (público). Es
 * la ÚNICA fuente del texto y de la versión: la landing muestra ese `text` y
 * manda esa misma `version` como `termsVersion` en el checkout.
 */
export type PartnerTerms = {
  readonly version: string;
  readonly text: string;
};

/** Body de `GET /billing/terms`, o `null` si no tiene la forma esperada. */
export function parseTerms(body: unknown): PartnerTerms | null {
  if (
    isRecord(body) &&
    typeof body.version === "string" &&
    body.version.trim() !== "" &&
    typeof body.text === "string" &&
    body.text.trim() !== ""
  ) {
    return { version: body.version, text: body.text };
  }
  return null;
}

/**
 * El texto de los términos en párrafos (separados por una línea en blanco).
 * Se renderiza como texto, nunca como HTML; los saltos simples quedan dentro
 * del párrafo.
 */
export function termsParagraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph !== "");
}

/** Lo mínimo de una membresía (`GET /partners/me/memberships`, spec 211). */
export type MembershipLike = {
  readonly partnerId: string;
  readonly name: string;
  readonly role: string;
};

/** Rol que puede contratar. Admins u otros roles no ven el taller (FR-003). */
export const OWNER_ROLE = "owner";

/** Solo los talleres de los que la cuenta es dueña, en el orden del backend. */
export function ownerMemberships<T extends MembershipLike>(memberships: readonly T[]): T[] {
  return memberships.filter((membership) => membership.role === OWNER_ROLE);
}
