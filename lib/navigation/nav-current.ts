/**
 * Valor de `aria-current` para un link de SECCIÓN del header
 * (Proveedores, Blog, Sobre nosotros).
 *
 * - `"page"`: el link apunta a la página que se está viendo.
 * - `"true"`: la página vive DENTRO de la sección del link
 *   (`/proveedores/planes` para "Proveedores", un post para "Blog"). No es
 *   `"page"` a propósito: decirle a un lector de pantalla "página actual" en
 *   un link que lleva a OTRA página (el índice de la sección) es mentirle.
 *   `"true"` marca "el ítem actual del conjunto" sin afirmar eso.
 * - `undefined`: el link no tiene que ver con la página.
 *
 * "Dentro" se decide por segmentos de ruta, no por prefijo de texto:
 * `/proveedores-filtros` no está dentro de `/proveedores`. La raíz (`/`)
 * nunca cuenta como sección: si no, "Inicio" quedaría marcado en todo el
 * sitio. Se ignoran la query, el hash y la barra final de los dos lados.
 *
 * Función pura y sin imports: la usan el header (Server Component) y la isla
 * del menú mobile, y se prueba con `node --test`.
 */
export type NavCurrent = "page" | "true" | undefined;

export function navCurrent(href: string, currentPath: string | undefined): NavCurrent {
  if (!currentPath) return undefined;

  const target = normalizePath(href);
  const current = normalizePath(currentPath);
  if (!target || !current) return undefined;

  if (target === current) return "page";
  if (target === "/") return undefined;
  return current.startsWith(`${target}/`) ? "true" : undefined;
}

/**
 * `aria-current` de un link de SUBMENÚ (los que cuelgan de "Proveedores"):
 * solo `"page"`, y solo si apunta a la página que se está viendo. Un sublink
 * no es una sección: "Proveedores de la red" (`/proveedores`) no queda
 * marcado en `/proveedores/planes`; ahí el marcado es "Precios".
 */
export function navCurrentPage(href: string, currentPath: string | undefined): "page" | undefined {
  return navCurrent(href, currentPath) === "page" ? "page" : undefined;
}

/** Solo el pathname: sin query ni hash, y sin barra final (salvo la raíz). */
function normalizePath(value: string): string {
  const path = value.split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, "") || "/" : path;
}
