/**
 * Secciones de "Mi negocio" (`/cuenta`): Resumen, Pedidos, Perfil y Plan.
 *
 * Cada sección es una URL (`/cuenta?seccion=plan`, más `&negocio=<id>` con
 * varios negocios), no una pestaña ARIA que cambia contenido en el lugar:
 * - Se puede llegar directo desde el menú de cuenta del header y desde
 *   cualquier link ("Ver mi plan", "Ver todos"), y el botón Atrás funciona.
 * - Son links comunes: Tab los recorre, Enter los sigue y el lector de
 *   pantalla anuncia la actual con `aria-current="page"`. El patrón `tablist`
 *   obliga a manejar flechas y Home/End, y anuncia "pestaña 2 de 4" para algo
 *   que en realidad navega.
 * - Funcionan sin JS (la página los resuelve en el server).
 *
 * Módulo puro (sin alias `@/` ni imports de la app): lo prueban los tests
 * de `scripts/partner-billing/` con `node --test`.
 */

export const ACCOUNT_SECTIONS = ["resumen", "pedidos", "perfil", "plan"] as const;
export type AccountSection = (typeof ACCOUNT_SECTIONS)[number];

/** Parámetro de la sección. Sin él (o con uno raro), el Resumen. */
export const ACCOUNT_SECTION_PARAM = "seccion";
/** Parámetro del negocio elegido cuando la cuenta tiene más de uno. */
export const ACCOUNT_PARTNER_PARAM = "negocio";

/** Un proveedor con sesión cae en el Resumen (supuesto de DECISIONES.md). */
export const DEFAULT_ACCOUNT_SECTION: AccountSection = "resumen";

function first(raw: string | readonly string[] | undefined): string {
  return ((typeof raw === "string" ? raw : raw?.[0]) ?? "").trim().toLowerCase();
}

/** `?seccion=` ⇒ la sección; cualquier otro valor cae en el Resumen. */
export function parseAccountSection(raw: string | readonly string[] | undefined): AccountSection {
  const value = first(raw);
  return (ACCOUNT_SECTIONS as readonly string[]).includes(value)
    ? (value as AccountSection)
    : DEFAULT_ACCOUNT_SECTION;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `?negocio=` ⇒ el id, o `null`. Solo dice QUÉ negocio mostrar: si la cuenta
 * no es dueña de ese id, la pantalla cae en el primero de sus negocios.
 */
export function parseAccountPartnerParam(raw: string | readonly string[] | undefined): string | null {
  const value = first(raw);
  return UUID_PATTERN.test(value) ? value : null;
}

/**
 * El negocio a mostrar: el pedido por la URL si la cuenta es dueña; si no,
 * el primero. `null` sin negocios.
 */
export function pickAccountPartner<T extends { readonly partnerId: string }>(
  partners: readonly T[],
  requested: string | null,
): T | null {
  if (partners.length === 0) return null;
  if (requested) {
    const match = partners.find((partner) => partner.partnerId.toLowerCase() === requested);
    if (match) return match;
  }
  return partners[0] ?? null;
}

/**
 * Href de una sección. El Resumen va sin `?seccion` (es el default) y el
 * negocio solo se agrega si hace falta elegirlo (cuenta con varios).
 */
export function accountSectionHref(
  basePath: string,
  section: AccountSection,
  partnerId: string | null = null,
): string {
  const params = new URLSearchParams();
  if (section !== DEFAULT_ACCOUNT_SECTION) params.set(ACCOUNT_SECTION_PARAM, section);
  if (partnerId) params.set(ACCOUNT_PARTNER_PARAM, partnerId);
  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
