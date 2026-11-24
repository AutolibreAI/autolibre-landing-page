import "server-only";
import {
  fetchAllPartners,
  fetchPartnerBySlug,
  fetchPartnerZones,
  fetchPartners,
  fetchServiceCatalog,
  type PartnerSummary,
  type PartnerZone,
  type PartnersPage,
} from "@/lib/autolibre-api";
import { isGeoPoint, type GeoPoint } from "@/lib/proveedores/map";
import {
  PROVEEDORES_PAGE_SIZE,
  parseProveedoresFilters,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";

export type CategoryOption = { readonly slug: string; readonly name: string };

/** Un negocio de la página con ubicación cargada, para el mapa. */
export type DirectoryMapPoint = { readonly partner: PartnerSummary; readonly geo: GeoPoint };

export type DirectoryData = {
  readonly filters: ProveedoresFilters;
  /** Familias para el filtro (las que tienen negocios, más la elegida). */
  readonly categories: readonly CategoryOption[];
  /** Todas las familias del catálogo: nombre visible de cualquier slug. */
  readonly categoryNames: ReadonlyMap<string, string>;
  /** Zonas con negocios. Vacío si no se pudieron leer (no se ofrece el filtro). */
  readonly zones: readonly PartnerZone[];
  /** La página pedida. `null`: el backend falló y no había nada en caché. */
  readonly result: PartnersPage | null;
  /** Conteo REAL de la red (sin filtros), o `null` si no se pudo leer. */
  readonly networkTotal: number | null;
  /** Familias con al menos un negocio, o `null` si no se pudo calcular. */
  readonly activeCategoryCount: number | null;
  /** Negocios de la página con coordenadas (el resto no se dibuja). */
  readonly mapPoints: readonly DirectoryMapPoint[];
};

type SearchParams = { readonly [key: string]: string | string[] | undefined };

/** Nunca tira: un backend caído es el estado de error de la sección. */
async function safe<T>(label: string, load: () => Promise<T>): Promise<T | null> {
  try {
    return await load();
  } catch (error) {
    console.error(`[proveedores] no se pudo leer ${label}:`, error);
    return null;
  }
}

/** Lecturas de perfil en paralelo, como máximo (ver `loadMapPoints`). */
const PROFILE_READS_IN_FLIGHT = 4;

/**
 * Coordenadas de los negocios de la página, para el mapa.
 *
 * Si el listado ya las trae (`PartnerSummary.geo`), se usan esas. HOY el
 * backend no las manda en el listado: hay que leer el perfil de cada negocio
 * (`GET /partner-profiles/:slug`, la misma lectura que hace su página y con
 * el mismo Data Cache de 1 h). El backend limita a 60 pedidos por minuto por
 * IP y la landing sale de pocas IPs: 24 lecturas por render, en cada página
 * filtrada que pide un crawler, se comen ese cupo y dejan sin respuesta a los
 * perfiles (un 429 ahí es un 500). Por eso esas lecturas se hacen SOLO para
 * la página base (`readProfiles`), que es estática y se regenera a lo sumo una
 * vez por hora, y de a `PROFILE_READS_IN_FLIGHT`. Las páginas con filtros
 * muestran el mapa solo con lo que traiga el listado (hoy, nada: sin mapa).
 * Un perfil que falla no rompe nada: no va al mapa.
 *
 * Pendiente de backend: `address.latitude`/`longitude` en el listado.
 */
async function loadMapPoints(
  partners: readonly PartnerSummary[],
  readProfiles: boolean,
): Promise<DirectoryMapPoint[]> {
  const geos: (GeoPoint | null)[] = partners.map((partner) => partner.geo);

  if (readProfiles && !geos.some((geo) => geo !== null)) {
    for (let start = 0; start < partners.length; start += PROFILE_READS_IN_FLIGHT) {
      const batch = partners.slice(start, start + PROFILE_READS_IN_FLIGHT);
      const lookups = await Promise.all(
        batch.map((partner) => fetchPartnerBySlug(partner.slug).catch(() => null)),
      );
      lookups.forEach((lookup, offset) => {
        geos[start + offset] = lookup?.status === "found" ? lookup.partner.geo : null;
      });
    }
  }

  return partners.flatMap((partner, index) => {
    const geo = geos[index];
    return isGeoPoint(geo) ? [{ partner, geo }] : [];
  });
}

/**
 * Todo lo que necesita `/proveedores`, leído en el server ANTES de renderizar
 * (sin streaming: una `?pagina=` fuera de rango tiene que poder responder un
 * 404 real). `searchParams` en `null` es la página base, sin filtros: la
 * versión estática.
 */
export async function loadDirectory(searchParams: SearchParams | null): Promise<DirectoryData> {
  const [catalog, allPartners, zones] = await Promise.all([
    fetchServiceCatalog(),
    safe("el directorio completo", fetchAllPartners),
    safe("las zonas", fetchPartnerZones),
  ]);

  const allCategories = (catalog ?? []).map(({ slug, name }) => ({ slug, name }));
  const activeSlugs = allPartners ? new Set(allPartners.flatMap((partner) => partner.categories)) : null;
  // Solo las familias con al menos un negocio, en el orden del catálogo. Sin
  // ese dato, todas: un filtro de más es mejor que esconder rubros con negocios.
  const categories = activeSlugs
    ? allCategories.filter((category) => activeSlugs.has(category.slug))
    : allCategories;

  // Un `?rubro=` sin negocios pero del catálogo sigue siendo válido: muestra el
  // estado vacío (un link viejo o compartido no tiene que caer en "Todos").
  const filters = parseProveedoresFilters(
    searchParams ?? {},
    new Set(allCategories.map((category) => category.slug)),
    zones ? new Set(zones.map((zone) => zone.slug)) : null,
  );
  const filterCategories = categories.some((category) => category.slug === filters.rubro)
    ? categories
    : [...categories, ...allCategories.filter((category) => category.slug === filters.rubro)];

  const result = await safe("una página del directorio", () =>
    fetchPartners({
      category: filters.rubro || undefined,
      q: filters.q || undefined,
      zone: filters.zona || undefined,
      page: filters.pagina,
      pageSize: PROVEEDORES_PAGE_SIZE,
    }),
  );
  // Lee perfiles solo en la página base (estática): ver `loadMapPoints`.
  const mapPoints = result ? await loadMapPoints(result.data, searchParams === null) : [];

  return {
    filters,
    categories: filterCategories,
    categoryNames: new Map(allCategories.map((category) => [category.slug, category.name])),
    zones: zones ?? [],
    result,
    networkTotal: allPartners ? allPartners.length : null,
    activeCategoryCount: catalog && activeSlugs ? categories.length : null,
    mapPoints,
  };
}
