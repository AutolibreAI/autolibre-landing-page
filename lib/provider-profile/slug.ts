/**
 * Validación del slug público de un perfil. Módulo PURO: sin imports y solo
 * sintaxis TS borrable, así lo corre `node --test` (patrón de `lib/blog/faq.ts`).
 *
 * La web valida el slug ANTES de llamar al backend: uno con formato inválido
 * es un 404 sin consulta (no se le da al backend entrada arbitraria de la URL).
 */

export const MAX_SLUG_LENGTH = 120;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidSlug(value: string): boolean {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    value.length <= MAX_SLUG_LENGTH &&
    SLUG_PATTERN.test(value)
  );
}

/** Normaliza un texto a slug: sin tildes, minúsculas y separado por guiones. */
export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
