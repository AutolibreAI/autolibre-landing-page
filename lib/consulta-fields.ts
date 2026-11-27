/**
 * Formatos de los campos de las pestañas de consulta del módulo de pedido
 * (`ModuloConsultaForm`): código postal argentino, edad, monto en pesos y
 * email.
 */

/** CPA completo: letra de provincia + 4 dígitos + 3 letras (`C1425ABC`). */
const CPA_PATTERN = /^[A-Z](\d{4})[A-Z]{3}$/;

/**
 * Lo que se ve en el input: letras y números en mayúscula, 8 como máximo (el
 * largo de un CPA). Las letras se dejan pasar para poder pegar un CPA.
 */
export function normalizePostalCodeInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
}

/**
 * Los 4 dígitos del código postal, o `null` si no es válido. Acepta el
 * clásico (`1425`) y un CPA (`C1425ABC`), del que toma sus 4 dígitos.
 */
export function postalCodeDigits(raw: string): string | null {
  const value = normalizePostalCodeInput(raw);
  if (/^\d{4}$/.test(value)) return value;
  return CPA_PATTERN.exec(value)?.[1] ?? null;
}

export const AGE_MIN = 18;
export const AGE_MAX = 99;

/** Lo que se ve en el input: solo dígitos, 2 como máximo. */
export function normalizeAgeInput(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 2);
}

/** `true` si es un entero entre 18 y 99. */
export function isValidAge(raw: string): boolean {
  if (!/^\d{1,2}$/.test(raw)) return false;
  const age = Number(raw);
  return age >= AGE_MIN && age <= AGE_MAX;
}

// ── Monto ────────────────────────────────────────────────────────────────

export const AMOUNT_MIN = 1;
export const AMOUNT_MAX = 999_999_999;
/** Dígitos de `AMOUNT_MAX`: el tope de lo que se puede escribir. */
const AMOUNT_MAX_DIGITS = 9;

/** `1500000` → `1.500.000` (separador de miles de es-AR). */
function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Saca los centavos de un monto pegado (`1.500,50` → `1.500`): sin esto, sus
 * dígitos se sumarían al entero y el monto quedaría cien veces más grande.
 */
function dropCents(raw: string): string {
  return raw.replace(/,\d{0,2}\s*$/, "");
}

/** Solo dígitos, sin ceros a la izquierda (un `0` solo queda vacío). */
function amountDigits(raw: string): string {
  return dropCents(raw).replace(/\D/g, "").replace(/^0+/, "");
}

/** Posición en `formatted` justo después de su dígito número `count`. */
function caretAfterDigits(formatted: string, count: number): number {
  if (count <= 0) return 0;
  let seen = 0;
  for (let index = 0; index < formatted.length; index += 1) {
    if (/\d/.test(formatted[index])) seen += 1;
    if (seen === count) return index + 1;
  }
  return formatted.length;
}

/**
 * Lo que se ve en el input: pesos enteros con separador de miles
 * (`1.500.000`), sin ceros a la izquierda y 9 dígitos como máximo.
 */
export function normalizeAmountInput(raw: string): string {
  return groupThousands(amountDigits(raw).slice(0, AMOUNT_MAX_DIGITS));
}

/**
 * `normalizeAmountInput` para escribir en el medio del valor: además del
 * texto devuelve dónde tiene que quedar el cursor (se cuenta en dígitos, así
 * los puntos que entran o salen no lo mueven). `previous` es el valor antes
 * de la tecla y `deletion` el sentido del borrado.
 *
 * - Borrar un punto borra el dígito de al lado (si no, el punto volvería a
 *   aparecer y la tecla no haría nada).
 * - Con los 9 dígitos puestos, un dígito más no entra: no se corre ni se
 *   pierde el último.
 */
export function formatAmountInput(
  raw: string,
  caret: number,
  { previous, deletion }: { readonly previous: string; readonly deletion?: "backward" | "forward" },
): { readonly value: string; readonly caret: number } {
  const previousDigits = previous.replace(/\D/g, "");
  const typed = dropCents(raw);
  let digits = typed.replace(/\D/g, "");
  let before = typed.slice(0, caret).replace(/\D/g, "").length;

  if (deletion && digits === previousDigits) {
    if (deletion === "backward" && before > 0) {
      digits = digits.slice(0, before - 1) + digits.slice(before);
      before -= 1;
    } else if (deletion === "forward") {
      digits = digits.slice(0, before) + digits.slice(before + 1);
    }
  }

  const zeros = digits.length - digits.replace(/^0+/, "").length;
  digits = digits.slice(zeros);
  before = Math.max(0, before - zeros);

  if (digits.length > AMOUNT_MAX_DIGITS) {
    if (previousDigits.length === AMOUNT_MAX_DIGITS) {
      const extra = digits.length - AMOUNT_MAX_DIGITS;
      return { value: previous, caret: caretAfterDigits(previous, Math.max(0, before - extra)) };
    }
    digits = digits.slice(0, AMOUNT_MAX_DIGITS);
    before = Math.min(before, AMOUNT_MAX_DIGITS);
  }

  const value = groupThousands(digits);
  return { value, caret: caretAfterDigits(value, before) };
}

/**
 * El monto como entero de pesos, o `null` si no es válido. Acepta los puntos
 * de miles del input (`1.500.000`); tiene que ser un entero entre 1 y
 * 999.999.999, sin ceros a la izquierda, decimales ni signo.
 */
export function parseAmount(raw: string): number | null {
  const value = raw.replace(/[.\s]/g, "");
  if (!/^[1-9]\d{0,8}$/.test(value)) return null;
  const amount = Number(value);
  return amount >= AMOUNT_MIN && amount <= AMOUNT_MAX ? amount : null;
}

/** `true` si es un monto válido (ver `parseAmount`). */
export function isValidAmount(raw: string): boolean {
  return parseAmount(raw) !== null;
}

// ── Email ────────────────────────────────────────────────────────────────

/** Largo máximo de una dirección (RFC 5321). */
const EMAIL_MAX = 254;
/** Largo máximo de la parte local (antes de la `@`). */
const EMAIL_LOCAL_MAX = 64;
/** Parte local: letras, dígitos y los símbolos habituales. Sin `<>`, comillas ni espacios. */
const EMAIL_LOCAL = /^[a-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
/** Etiqueta del dominio: letras, dígitos y guiones, sin guion en las puntas. */
const EMAIL_LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
/** TLD: solo letras, 2 como mínimo. */
const EMAIL_TLD = /^[a-z]{2,63}$/;

/** Trim + minúsculas: la forma en la que el email viaja. */
export function normalizeConsultaEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/**
 * Email de las consultas de Seguros y Financiación. Más estricto que el
 * `EMAIL_REGEX` general del sitio (`lib/validation.ts`): el backend valida
 * con `IsEmail` de class-validator, y lo que acá pasaba y allá no terminaba
 * en una consulta que no se guardaba sin avisarle a la persona. Regla
 * conservadora, no una copia de validator.js: una sola `@`, parte local sin
 * punto inicial, final ni doble, dominio con etiquetas válidas y TLD de 2
 * letras o más. La usan el form y `/api/consulta`.
 */
export function isValidConsultaEmail(raw: string): boolean {
  const email = normalizeConsultaEmail(raw);
  if (email.length === 0 || email.length > EMAIL_MAX) return false;
  const at = email.lastIndexOf("@");
  if (at <= 0 || at !== email.indexOf("@")) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length > EMAIL_LOCAL_MAX || !EMAIL_LOCAL.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  return (
    labels.every((label) => EMAIL_LABEL.test(label)) && EMAIL_TLD.test(labels[labels.length - 1])
  );
}
