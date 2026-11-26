/**
 * Detalles opcionales del pedido (mismos campos que el pedido de la app,
 * `POST /quote-requests/app`): para cuándo, quién pone los repuestos y
 * kilometraje. Reglas puras, compartidas por el form del Home y por
 * `app/api/presupuesto/route.ts`, con los mismos límites que el DTO del
 * backend (`POST /api/v1/quote-requests`).
 */

export const QUOTE_TIMINGS = {
  asap: "asap",
  thisWeek: "this_week",
  date: "date",
} as const;
export type QuoteTiming = (typeof QUOTE_TIMINGS)[keyof typeof QUOTE_TIMINGS];

export const PARTS_SUPPLY = {
  workshop: "workshop",
  customer: "customer",
} as const;
export type PartsSupply = (typeof PARTS_SUPPLY)[keyof typeof PARTS_SUPPLY];

/** Tope del backend para `mileageKm` (entero, 0 a 2.000.000). */
export const MILEAGE_MAX_KM = 2_000_000;

const TIMING_VALUES = new Set<string>(Object.values(QUOTE_TIMINGS));
const PARTS_VALUES = new Set<string>(Object.values(PARTS_SUPPLY));
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Fecha de HOY en Buenos Aires (`YYYY-MM-DD`). Nunca `toISOString()`: eso es
 * la fecha en UTC, que entre las 21 y las 24 de Argentina ya es mañana.
 */
export function todayInBuenosAires(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** `YYYY-MM-DD` que existe en el calendario (sin `2026-02-30`). */
export function isCalendarDate(value: string): boolean {
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

export type QuoteDetails = {
  readonly timing?: QuoteTiming;
  readonly preferredDate?: string;
  readonly partsSupply?: PartsSupply;
  readonly mileageKm?: number;
};

export type QuoteDetailsError =
  | "timing"
  | "preferred_date_missing"
  | "preferred_date_invalid"
  | "preferred_date_past"
  | "preferred_date_forbidden"
  | "parts_supply"
  | "mileage";

export type QuoteDetailsResult =
  | { readonly ok: true; readonly details: QuoteDetails }
  | { readonly ok: false; readonly error: QuoteDetailsError };

const absent = (raw: unknown) => raw === undefined || raw === null || raw === "";

/**
 * Valida los cuatro campos como el backend. Ausente (o `null`) es "no lo
 * dijo" y no viaja; presente y mal formado es error (400). `preferredDate`
 * es obligatoria con `timing: "date"` y está prohibida con cualquier otro.
 */
export function parseQuoteDetails(
  raw: {
    readonly timing?: unknown;
    readonly preferredDate?: unknown;
    readonly partsSupply?: unknown;
    readonly mileageKm?: unknown;
  },
  today: string = todayInBuenosAires(),
): QuoteDetailsResult {
  const details: {
    timing?: QuoteTiming;
    preferredDate?: string;
    partsSupply?: PartsSupply;
    mileageKm?: number;
  } = {};

  if (!absent(raw.timing)) {
    if (typeof raw.timing !== "string" || !TIMING_VALUES.has(raw.timing)) {
      return { ok: false, error: "timing" };
    }
    details.timing = raw.timing as QuoteTiming;
  }

  if (details.timing === QUOTE_TIMINGS.date) {
    if (absent(raw.preferredDate)) return { ok: false, error: "preferred_date_missing" };
    if (typeof raw.preferredDate !== "string" || !isCalendarDate(raw.preferredDate)) {
      return { ok: false, error: "preferred_date_invalid" };
    }
    // `YYYY-MM-DD` se compara bien como texto. Hoy vale.
    if (raw.preferredDate < today) return { ok: false, error: "preferred_date_past" };
    details.preferredDate = raw.preferredDate;
  } else if (!absent(raw.preferredDate)) {
    return { ok: false, error: "preferred_date_forbidden" };
  }

  if (!absent(raw.partsSupply)) {
    if (typeof raw.partsSupply !== "string" || !PARTS_VALUES.has(raw.partsSupply)) {
      return { ok: false, error: "parts_supply" };
    }
    details.partsSupply = raw.partsSupply as PartsSupply;
  }

  if (!absent(raw.mileageKm)) {
    const km = raw.mileageKm;
    if (typeof km !== "number" || !Number.isInteger(km) || km < 0 || km > MILEAGE_MAX_KM) {
      return { ok: false, error: "mileage" };
    }
    details.mileageKm = km;
  }

  return { ok: true, details };
}
