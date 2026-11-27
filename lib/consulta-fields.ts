/**
 * Formatos de los campos de las pestañas de consulta del módulo de pedido
 * (`ModuloConsultaForm`): código postal argentino y edad.
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
