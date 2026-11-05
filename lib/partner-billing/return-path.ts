/**
 * Ida y vuelta entre la contratación y el reclamo del taller (spec 212, US2):
 * la parte pura, para `node --test`. Sin alias `@/` (type stripping de Node):
 * las rutas llegan por parámetro desde `lib/proveedores/query.ts`.
 */

/** Origen ficticio para resolver rutas relativas sin depender de `window`. */
const PLACEHOLDER_ORIGIN = "https://autolibre.invalid";

/**
 * `?next=` de `/proveedores/reclamar`. Devuelve la ruta (pathname + query,
 * normalizados y sin hash) SOLO si es relativa, del mismo origen y queda en
 * `allowedPrefix` o debajo; si no, `null` (research D10, anti open redirect).
 *
 * Rechaza: absolutas (`https://…`), protocol-relative (`//evil.com`), con
 * barra invertida (`/\evil.com`, que algunos browsers leen como `//`),
 * caracteres de control, y rutas que tras normalizar salen del prefijo
 * (`/proveedores/contratar/../../x`) o solo lo comparten como texto
 * (`/proveedores/contratarX`).
 */
export function safeContinuePath(
  raw: string | readonly string[] | undefined,
  allowedPrefix: string,
): string | null {
  const value = typeof raw === "string" ? raw : raw?.[0];
  if (!value || value.length > 512) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  // Caracteres de control (U+0000–U+001F y DEL): un salto de línea o un tab
  // pueden cambiar cómo un browser interpreta la ruta.
  if (value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) return null;

  let url: URL;
  try {
    url = new URL(value, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;
  if (url.pathname !== allowedPrefix && !url.pathname.startsWith(`${allowedPrefix}/`)) return null;

  return `${url.pathname}${url.search}`;
}

/** `/proveedores/contratar?plan=plus`: la URL de contratar un plan. */
export function checkoutHref(contratarPath: string, planCode: string): string {
  return `${contratarPath}?${new URLSearchParams({ plan: planCode }).toString()}`;
}

/**
 * `<ruta>?next=<ruta codificada>`: ir a otra pantalla y ofrecer volver. La
 * pantalla de destino SIEMPRE revalida `next` con `safeContinuePath`.
 */
export function withReturnHref(path: string, next: string): string {
  return `${path}?${new URLSearchParams({ next }).toString()}`;
}

/** `/proveedores/reclamar?next=<ruta codificada>`: reclamar y volver. */
export function claimWithReturnHref(reclamarPath: string, next: string): string {
  return withReturnHref(reclamarPath, next);
}
