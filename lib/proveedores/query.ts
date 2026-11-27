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
/**
 * Alta de negocios: el formulario (con su login de Clerk) vive bajo el
 * directorio. La vieja `/proveedores/registro/formulario` redirige acá
 * (301, `next.config.ts`).
 */
export const PROVEEDORES_REGISTRO_PATH = `${PROVEEDORES_PATH}/registro`;
/**
 * `?alta=1`: abre el flujo del alta (cuenta → datos del negocio) en la misma
 * ruta. Sin el parámetro, `/proveedores/registro` es la landing pública
 * "Sumá tu negocio", estática y sin Clerk (rediseño 2026-11, fase 5). La URL
 * con el parámetro tiene el mismo canonical (sin query): no se indexa aparte.
 */
export const PROVEEDORES_REGISTRO_FLOW_PARAM = "alta";
/** Link al flujo del alta (los CTA de la landing, `/cuenta`, la contratación sin taller). */
export const PROVEEDORES_REGISTRO_ALTA_PATH = `${PROVEEDORES_REGISTRO_PATH}?${PROVEEDORES_REGISTRO_FLOW_PARAM}=1`;
/**
 * `&otro=1`: la persona pidió EXPLÍCITAMENTE cargar un negocio más ("Cargar
 * otro taller" de `/cuenta`). El flujo abre el formulario directo, sin la
 * vista "Tu negocio ya está en AutoLibre" ni el "en revisión" de una
 * solicitud anterior (ver `resolveAltaEntry`). Solo vale junto a `?alta=1`.
 */
export const PROVEEDORES_REGISTRO_ANOTHER_PARAM = "otro";
/** Link directo al formulario del alta para una cuenta que ya tiene negocio. */
export const PROVEEDORES_REGISTRO_OTRO_PATH = `${PROVEEDORES_REGISTRO_ALTA_PATH}&${PROVEEDORES_REGISTRO_ANOTHER_PARAM}=1`;

/** Qué ve una cuenta con sesión al abrir el alta, antes del formulario. */
export type AltaEntryKind = "existing" | "pending" | "form";

/**
 * Decide la pantalla de entrada del alta para una cuenta con sesión:
 * - `another` (`&otro=1`, o "Registrar otro negocio"): siempre el formulario.
 *   Ni los negocios que ya tiene ni una solicitud anterior en revisión lo
 *   tapan: cargar OTRO negocio es justamente lo que pidió.
 * - dueña de al menos un negocio → `existing` (la membresía manda sobre la
 *   pista local de solicitud enviada).
 * - mandó una solicitud desde este navegador → `pending` ("en revisión").
 * - si no → `form`.
 */
export function resolveAltaEntry(input: {
  readonly another: boolean;
  readonly ownsBusiness: boolean;
  readonly applicationSent: boolean;
}): AltaEntryKind {
  if (input.another) return "form";
  if (input.ownsBusiness) return "existing";
  return input.applicationSent ? "pending" : "form";
}
/**
 * Precios para proveedores: vive bajo el directorio. Desde el 2026-11-26 se
 * cobra por trabajo confirmado (ya no hay planes), pero la URL se conserva.
 */
export const PROVEEDORES_PLANES_PATH = `${PROVEEDORES_PATH}/planes`;
/**
 * Canje del código de reclamo de un taller (spec 211). Privada (`noindex`) y
 * fuera del sitemap. Backend también reserva este slug (migración 0145).
 */
export const PROVEEDORES_RECLAMAR_PATH = `${PROVEEDORES_PATH}/reclamar`;
/**
 * Contratación de un plan pago (spec 212). Privada (`noindex`) y fuera del
 * sitemap. Backend tiene que reservar este slug (AGENTS.md). Desde el
 * 2026-11-26 ninguna página pública la enlaza (modelo por trabajo
 * confirmado); sigue viva para `/cuenta` y los flujos ya iniciados.
 */
export const PROVEEDORES_CONTRATAR_PATH = `${PROVEEDORES_PATH}/contratar`;
/**
 * Vuelta de Mercado Pago (la `back_url` del backend). Vive debajo de
 * `contratar`, así que no es hermana de `[slug]` y no se reserva aparte.
 */
export const PROVEEDORES_CONTRATAR_RESULTADO_PATH = `${PROVEEDORES_CONTRATAR_PATH}/resultado`;
/**
 * Slugs que un perfil no puede tener: son rutas estáticas hermanas de
 * `[slug]`, y la estática gana. Un negocio con uno de estos quedaría
 * inalcanzable y su URL del sitemap llevaría a otra página.
 */
export const RESERVED_PROFILE_SLUGS: readonly string[] = [
  "registro",
  "planes",
  "reclamar",
  "contratar",
];
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

/**
 * Qué páginas se muestran en la paginación: la primera, la última, la actual
 * y sus vecinas; el resto se resume en un `"gap"` ("…"). Con 7 páginas o
 * menos van todas. Ej.: página 1 de 7 → 1 2 3 … 7; página 4 de 9 → 1 … 3 4 5
 * … 9. Un hueco de una sola página se muestra como número: un "…" en lugar
 * de un número no ahorra lugar.
 */
export function paginationItems(page: number, totalPages: number): (number | "gap")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);

  const wanted = new Set([1, totalPages, page - 1, page, page + 1, ...(page <= 2 ? [2, 3] : [])]);
  const pages = [...wanted].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  const items: (number | "gap")[] = [];
  for (const n of pages) {
    const previous = items[items.length - 1];
    if (typeof previous === "number" && n - previous === 2) items.push(previous + 1);
    else if (typeof previous === "number" && n - previous > 2) items.push("gap");
    items.push(n);
  }
  return items;
}
