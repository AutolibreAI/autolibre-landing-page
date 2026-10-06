/**
 * Filtros de `/aliados` en la URL: `?rubro=<slug de familia>&pagina=<n>`.
 *
 * Son links y no estado de cliente: cada combinación es una URL que funciona
 * sin JS, se comparte y la sigue un crawler. Los nombres de los parámetros
 * van en español, como las rutas del sitio.
 */

export const ALIADOS_PATH = "/aliados";
/** Negocios por página: 8 filas de 3 en desktop, sin cortar una fila. */
export const ALIADOS_PAGE_SIZE = 24;

export type AliadosFilters = {
  /** Slug de familia del catálogo, o `""` para todos. */
  readonly rubro: string;
  readonly pagina: number;
};

type SearchParams = { readonly [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Lee los `searchParams`. Nunca tira: un `rubro` que no está en el catálogo
 * (o el catálogo caído, sin con qué validarlo) se lee como "Todos", y una
 * `pagina` que no es un entero positivo, como la primera.
 */
export function parseAliadosFilters(
  searchParams: SearchParams,
  knownRubros: ReadonlySet<string>,
): AliadosFilters {
  const rawRubro = firstValue(searchParams.rubro)?.trim() ?? "";
  const rubro = knownRubros.has(rawRubro) ? rawRubro : "";
  const rawPagina = Number(firstValue(searchParams.pagina));
  const pagina = Number.isInteger(rawPagina) && rawPagina > 1 ? rawPagina : 1;

  return { rubro, pagina };
}

/**
 * URL de una combinación de filtros. Sin parámetros por defecto (`pagina=1`
 * no se escribe). `hash` lleva la vista directo al directorio.
 */
export function aliadosHref(
  { rubro = "", pagina = 1 }: Partial<AliadosFilters>,
  hash?: string,
): string {
  const params = new URLSearchParams();
  if (rubro) params.set("rubro", rubro);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();

  return `${ALIADOS_PATH}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}

/** Perfil público de un negocio. */
export function partnerPath(slug: string): string {
  return `${ALIADOS_PATH}/${encodeURIComponent(slug)}`;
}
