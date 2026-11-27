/**
 * CUIT/CUIL argentino: 11 dígitos, el último es el verificador (módulo 11
 * con los pesos 5-4-3-2-7-6-5-4-3-2 sobre los primeros diez).
 */

const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Solo los dígitos: acepta el CUIT con guiones, puntos o espacios. */
export function cuitDigits(raw: string): string {
  return raw.replace(/\D/g, "");
}

/** Lo que se ve en el input mientras la persona escribe: dígitos y guiones, 13 como máximo. */
export function normalizeCuitInput(raw: string): string {
  return raw.replace(/[^\d-]/g, "").slice(0, 13);
}

/** `true` si tiene 11 dígitos y el verificador coincide. */
export function isValidCuit(raw: string): boolean {
  const digits = cuitDigits(raw);
  if (digits.length !== 11) return false;
  const sum = CUIT_WEIGHTS.reduce((total, weight, index) => total + weight * Number(digits[index]), 0);
  const rest = 11 - (sum % 11);
  // Un resto de 10 no tiene verificador posible: ese CUIT no existe.
  if (rest === 10) return false;
  return (rest === 11 ? 0 : rest) === Number(digits[10]);
}

/** `20-12345678-9`. Sin 11 dígitos, devuelve lo que vino. */
export function formatCuit(raw: string): string {
  const digits = cuitDigits(raw);
  if (digits.length !== 11) return raw;
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}
