/**
 * Patentes argentinas. Una sola fuente para el browser (modal y `/pedido`) y
 * para las rutas de servidor (`/api/presupuesto`, `/api/vehicle-lookup`).
 *
 * Mismos 4 patrones que `Plate` en autolibre-backend-hex
 * (src/shared/domain/value-objects/plate.vo.ts): dos regímenes (auto/moto),
 * cada uno con su forma legacy y Mercosur.
 */
export const PLATE_PATTERNS: readonly RegExp[] = [
  /^[A-Z]{3}\d{3}$/, // auto legacy   - ABC123
  /^[A-Z]{2}\d{3}[A-Z]{2}$/, // auto Mercosur - AB123CD
  /^\d{3}[A-Z]{3}$/, // moto legacy   - 123ABC
  /^[A-Z]\d{3}[A-Z]{3}$/, // moto Mercosur - A123BCD
];

/** `value` ya tiene que venir normalizada (mayúsculas, sin espacios ni guiones). */
export function isValidPlate(value: string): boolean {
  return PLATE_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Lo que se ve en el input mientras la persona escribe: mayúsculas, solo
 * letras y números, 7 caracteres como máximo (el largo de una Mercosur).
 */
export function normalizePlateInput(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);
}

/**
 * Forma canónica que viaja al backend y a clasific.ar, o `null` si no es una
 * patente válida. Del lado del servidor el dato llega del cliente, así que se
 * vuelve a normalizar acá aunque el form ya lo haya hecho.
 */
export function canonicalPlate(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const stripped = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  return isValidPlate(stripped) ? stripped : null;
}
