/**
 * Parseo de los atributos `data-analytics-provider` y `data-analytics-action`
 * del listener delegado (`components/analytics/analytics-events.tsx`).
 * Módulo PURO: sin imports, así lo corre `node --test`.
 *
 * Misma filosofía que `lead_source` y `store`: lo que no está en la lista (o no
 * tiene el formato) se descarta y el evento sale igual, sin el prop. Nunca
 * datos personales: el slug es un identificador de negocio público.
 */

const PROVIDER_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_PROVIDER_LENGTH = 120;

/** Slug del proveedor, o `undefined` si el formato no es válido. */
export function parseProviderAttr(raw: string | undefined): string | undefined {
  if (!raw || raw.length > MAX_PROVIDER_LENGTH) return undefined;
  return PROVIDER_PATTERN.test(raw) ? raw : undefined;
}

/** Acción del perfil, o `undefined` si no está en la lista cerrada. */
export function parseProviderAction(
  raw: string | undefined,
  allowed: ReadonlySet<string>,
): string | undefined {
  return raw && allowed.has(raw) ? raw : undefined;
}
