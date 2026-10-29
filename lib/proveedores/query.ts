/**
 * Filtros de `/proveedores` en la URL:
 * `?rubro=<slug de familia>&zona=<slug de zona>&q=<texto>&pagina=<n>`.
 *
 * Son links y no estado de cliente: cada combinación es una URL que funciona
 * sin JS, se comparte y la sigue un crawler. La búsqueda (`q`) y la zona
 * entran igual que el rubro: por la URL, con un formulario GET, nunca como
 * estado local de un input. Los nombres de los parámetros van en español,
 * como las rutas del sitio.
 */

export const PROVEEDORES_PATH = "/proveedores";
/** Alta de negocios: el formulario vive bajo el directorio. */
export const PROVEEDORES_REGISTRO_PATH = `${PROVEEDORES_PATH}/registro`;
/** Precios y planes pagos para proveedores: vive bajo el directorio. */
export const PROVEEDORES_PLANES_PATH = `${PROVEEDORES_PATH}/planes`;
/**
 * Slugs que un perfil no puede tener: son rutas estáticas hermanas de
 * `[slug]`, y la estática gana. Un negocio con uno de estos quedaría
 * inalcanzable y su URL del sitemap llevaría a otra página.
 */
export const RESERVED_PROFILE_SLUGS: readonly string[] = ["registro", "planes"];
/** Negocios por página: 8 filas de 3 en desktop, sin cortar una fila. */
export const PROVEEDORES_PAGE_SIZE = 24;
/** Largo máximo de la búsqueda: el mismo tope que valida el backend. */
export const PROVEEDORES_Q_MAX_LENGTH = 80;

export type ProveedoresFilters = {
  /** Slug de familia del catálogo, o `""` para todos. */
  readonly rubro: string;
  /** Slug de zona de la faceta del backend, o `""` para todas. */
  readonly zona: string;
  /** Texto a buscar en el nombre del negocio, o `""` si no hay búsqueda. */
  readonly q: string;
  readonly pagina: number;
};

type SearchParams = { readonly [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * La búsqueda como la escribió la persona, sin tocar las tildes (se muestra
 * tal cual), pero con los espacios colapsados y el largo acotado. Se cuenta
 * por caracteres y no por unidades UTF-16 para no cortar un emoji a la mitad.
 */
function normalizeQuery(value: string | undefined): string {
  const collapsed = (value ?? "").replace(/\s+/g, " ").trim();

  return Array.from(collapsed).slice(0, PROVEEDORES_Q_MAX_LENGTH).join("").trim();
}

/**
 * Lee los `searchParams`. Nunca tira: un `rubro` que no está en el catálogo
 * (o el catálogo caído, sin con qué validarlo) se lee como "Todos", una
 * `zona` que no está entre las zonas conocidas (o sin lista con qué
 * validarla: `knownZonas` en `null`) como "Todas", un `q` vacío como sin
 * búsqueda, y una `pagina` que no es un entero positivo, como la primera.
 */
export function parseProveedoresFilters(
  searchParams: SearchParams,
  knownRubros: ReadonlySet<string>,
  knownZonas: ReadonlySet<string> | null = null,
): ProveedoresFilters {
  const rawRubro = firstValue(searchParams.rubro)?.trim() ?? "";
  const rubro = knownRubros.has(rawRubro) ? rawRubro : "";
  const rawZona = firstValue(searchParams.zona)?.trim() ?? "";
  const zona = knownZonas?.has(rawZona) ? rawZona : "";
  const q = normalizeQuery(firstValue(searchParams.q));
  const rawPagina = Number(firstValue(searchParams.pagina));
  const pagina = Number.isInteger(rawPagina) && rawPagina > 1 ? rawPagina : 1;

  return { rubro, zona, q, pagina };
}

/** Hay algún filtro puesto (la página no cuenta: no recorta el resultado). */
export function hasActiveFilters({ rubro, zona, q }: ProveedoresFilters): boolean {
  return rubro !== "" || zona !== "" || q !== "";
}

/**
 * URL de una combinación de filtros. Sin parámetros por defecto (`pagina=1`
 * no se escribe) y siempre en el mismo orden (rubro, zona, q, pagina), para
 * que una misma combinación tenga una sola URL. `hash` lleva la vista
 * directo al directorio.
 */
export function proveedoresHref(
  { rubro = "", zona = "", q = "", pagina = 1 }: Partial<ProveedoresFilters>,
  hash?: string,
): string {
  const params = new URLSearchParams();
  if (rubro) params.set("rubro", rubro);
  if (zona) params.set("zona", zona);
  if (q) params.set("q", q);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();

  return `${PROVEEDORES_PATH}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

/** Perfil público de un negocio. */
export function partnerPath(slug: string): string {
  return `${PROVEEDORES_PATH}/${encodeURIComponent(slug)}`;
}
