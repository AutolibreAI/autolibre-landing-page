import "server-only";
import { timingSafeEqual } from "node:crypto";

/**
 * Comparación en tiempo constante de un secreto de webhook: `===` filtra por
 * timing cuántos caracteres coinciden. La usan las rutas de
 * `app/api/revalidate/**` (Hygraph y perfiles de proveedor), cada una con su
 * propio secreto.
 */
export function secretMatches(received: string | null, expected: string): boolean {
  if (!received) return false;

  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
