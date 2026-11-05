/**
 * Canje del código de reclamo de un taller (spec 211): la parte pura, sin red
 * ni React, para probarla con `node --test` (`npm run test:partner-claims`).
 *
 * Corre con el type stripping de Node: solo sintaxis TS borrable, sin alias
 * `@/` ni imports de la app. El copy de cada resultado vive en
 * `lib/content/partner-claim.ts`; acá solo se decide QUÉ pasó.
 *
 * Contrato: `specs/211-partner-claim-redemption/contracts/partner-claims-api.md`.
 */

/** Tope del backend para el código (DTO del canje). */
export const CLAIM_CODE_MAX_LENGTH = 32;

export type CodeValidation =
  | { readonly ok: true; readonly code: string }
  | { readonly ok: false; readonly reason: "empty" | "too-long" };

/**
 * Lo tipeado, con `trim()` y nada más: mayúsculas, guiones y espacios
 * internos los normaliza el backend (FR-007). Vacío o de más de 32
 * caracteres se rechaza acá, sin gastar un intento del rate limit (FR-008).
 */
export function validateCode(raw: string): CodeValidation {
  const code = raw.trim();
  if (code.length === 0) return { ok: false, reason: "empty" };
  if (code.length > CLAIM_CODE_MAX_LENGTH) return { ok: false, reason: "too-long" };
  return { ok: true, code };
}

/** Body del `POST /partner-claims/redemptions`: solo `code` (sin campos extra). */
export function buildRedeemBody(code: string): string {
  return JSON.stringify({ code });
}

/** Rechazos posibles del canje. Cada uno tiene su mensaje en el content. */
export type RedeemFailureKind =
  | "invalid-code"
  | "invalid-input"
  | "unauthenticated"
  | "rate-limited"
  | "unknown";

export type RedeemResult =
  | { readonly kind: "success"; readonly partnerId: string; readonly role: string }
  | { readonly kind: RedeemFailureKind; readonly requestId?: string };

export type RedeemResponse = {
  readonly status: number;
  /** El body ya parseado como JSON, o `null` si no era JSON. */
  readonly body: unknown;
  /** Header `x-request-id` (expuesto por CORS), solo para el log. */
  readonly requestId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * 404 uniforme del contrato de canje. El backend lo devuelve idéntico para
 * TODAS las causas (anti-enumeración) y lo cuida un e2e que lo compara byte
 * por byte. Cualquier otro 404 (ruta inexistente, URL del backend mal
 * configurada) NO es un código inválido: es un error de configuración.
 */
function isClaimCodeNotFound(body: unknown): boolean {
  return isRecord(body) && body.code === "NOT_FOUND" && body.message === "Claim code not found";
}

/**
 * Status HTTP ⇒ resultado. Solo el 404 del contrato es `invalid-code`, y la
 * UI no distingue causas (FR-010). Un 404 con otro body (ruta inexistente)
 * es `unknown`: si no, un error de configuración se disfraza de código
 * inválido. Un 201 sin `partnerId` es una respuesta rota: `unknown`.
 */
export function parseRedeemResponse({ status, body, requestId }: RedeemResponse): RedeemResult {
  const meta = requestId ? { requestId } : {};

  if (status === 201) {
    if (isRecord(body) && typeof body.partnerId === "string" && body.partnerId !== "") {
      return {
        kind: "success",
        partnerId: body.partnerId,
        role: typeof body.role === "string" ? body.role : "owner",
      };
    }
    return { kind: "unknown", ...meta };
  }
  if (status === 404) {
    return { kind: isClaimCodeNotFound(body) ? "invalid-code" : "unknown", ...meta };
  }
  if (status === 400) return { kind: "invalid-input", ...meta };
  if (status === 401) return { kind: "unauthenticated", ...meta };
  if (status === 429) return { kind: "rate-limited", ...meta };
  return { kind: "unknown", ...meta };
}

export type Membership = {
  readonly partnerId: string;
  readonly name: string;
  readonly role: string;
  readonly since: string;
};

/**
 * Body del `GET /partners/me/memberships`. Lo que no tiene forma de
 * membresía se descarta en lugar de tirar: la confirmación tiene fallback.
 */
export function parseMemberships(body: unknown): Membership[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((item): Membership[] =>
    isRecord(item) && typeof item.partnerId === "string" && typeof item.name === "string"
      ? [
          {
            partnerId: item.partnerId,
            name: item.name,
            role: typeof item.role === "string" ? item.role : "",
            since: typeof item.since === "string" ? item.since : "",
          },
        ]
      : [],
  );
}

/**
 * Nombre del taller recién reclamado: el de la membresía con el `partnerId`
 * del 201, nunca otro (el usuario puede administrar varios). `null` si no
 * aparece o no tiene nombre: la UI muestra el éxito sin nombre.
 */
export function pickPartnerName(memberships: readonly Membership[], partnerId: string): string | null {
  const name = memberships.find((membership) => membership.partnerId === partnerId)?.name.trim();
  return name ? name : null;
}
