/**
 * Rutas públicas del perfil de proveedor: UNA sola fuente para que cambiar la
 * URL (se pasó de `/p/<slug>` a `/proveedor/<slug>` por claridad: "/p" no dice
 * nada, "proveedor" sí) no obligue a tocar diez archivos. Módulo puro.
 *
 * Ojo con la cercanía de nombres: `/proveedores` (plural) es la landing para
 * que un negocio se sume a AutoLibre; `/proveedor` (singular) es el índice y
 * los perfiles de los negocios que ya están.
 */

/** Índice de perfiles. */
export const PROVIDER_INDEX_PATH = "/proveedor";

/** Perfil de un proveedor por su slug vigente. */
export function providerPath(slug: string): string {
  return `${PROVIDER_INDEX_PATH}/${slug}`;
}

/** Imagen de vista previa (Open Graph) de un perfil. */
export function providerOgPath(slug: string): string {
  return `${providerPath(slug)}/og`;
}
