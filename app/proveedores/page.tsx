import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProveedoresDirectory } from "@/components/proveedores/proveedores-directory";
import { ProveedoresHero } from "@/components/proveedores/proveedores-hero";
import { PageShell } from "@/components/layout/page-shell";
import { ProviderBandSection } from "@/components/sections/home/provider-band";
import { JsonLd } from "@/components/seo/json-ld";
import {
  fetchActivePartnerCategories,
  fetchPartnerZones,
  fetchPartners,
  fetchServiceCatalog,
  type PartnerZone,
  type PartnersPage,
} from "@/lib/autolibre-api";
import {
  PROVEEDORES_PAGE_SIZE,
  PROVEEDORES_PATH,
  parseProveedoresFilters,
  partnerPath,
  type ProveedoresFilters,
} from "@/lib/proveedores/query";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  itemListSchema,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = providersDirectoryContent.meta;

/**
 * Metadata estática: TODAS las variantes (`?rubro=`, `?zona=`, `?q=`,
 * `?pagina=`) llevan canonical `/proveedores`. Son recortes del mismo
 * directorio, no páginas con tema propio. Se quedan indexables (`index: true`) a propósito: un
 * `noindex` con canonical a otra URL son dos señales que se contradicen, y
 * `createMetadata` ata `follow` a `index`, así que un `noindex` también
 * cortaría el seguimiento de los links a los perfiles de los negocios.
 */
export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PROVEEDORES_PATH,
});

type PageProps = {
  readonly searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * Pide una página del directorio sin tirar: un backend caído es el estado de
 * error de la sección (`null`), no un 500 de la página entera. El `fetch`
 * lleva `revalidate`, así que un corte corto se tapa con la última respuesta
 * buena del Data Cache y este `catch` solo corre si no había ninguna.
 */
async function loadPartners(filters: ProveedoresFilters): Promise<PartnersPage | null> {
  try {
    return await fetchPartners({
      category: filters.rubro || undefined,
      q: filters.q || undefined,
      zone: filters.zona || undefined,
      page: filters.pagina,
      pageSize: PROVEEDORES_PAGE_SIZE,
    });
  } catch (error) {
    console.error("[proveedores] no se pudo leer el directorio:", error);
    return null;
  }
}

/**
 * Las zonas para el desplegable, sin tirar: si no se pueden leer (`null`) la
 * página no ofrece el filtro por zona y un `?zona=` se ignora (no hay con qué
 * validarlo), pero el directorio, la búsqueda y el rubro siguen andando.
 */
async function loadZones(): Promise<PartnerZone[] | null> {
  try {
    return await fetchPartnerZones();
  } catch (error) {
    console.error("[proveedores] no se pudieron leer las zonas:", error);
    return null;
  }
}

/**
 * `/proveedores`: el directorio de los negocios de la red.
 *
 * El directorio se pide ACÁ, antes de renderizar, y no dentro de un
 * `<Suspense>` que streamee: una `?pagina=` fuera de rango tiene que
 * responder un 404 de verdad, y una vez que el streaming empezó el status ya
 * salió como 200 (ver `loading.md` › Status Codes en la doc de Next). El
 * `ItemList` del JSON-LD también necesita la lista. Como el fetch va cacheado
 * (1 h), esperar no cuesta: no hay skeleton porque no hay espera que tapar.
 */
export default async function ProveedoresPage({ searchParams }: PageProps) {
  const [catalog, activeSlugs, zones] = await Promise.all([
    fetchServiceCatalog(),
    fetchActivePartnerCategories(),
    loadZones(),
  ]);
  const allCategories = (catalog ?? []).map(({ slug, name }) => ({ slug, name }));
  // Solo las familias con al menos un negocio, en el orden del catálogo. Sin
  // ese dato (falló la lectura agregada), todas: un filtro de más es mejor
  // que esconder rubros que sí tienen negocios.
  const categories = activeSlugs
    ? allCategories.filter((category) => activeSlugs.has(category.slug))
    : allCategories;
  const activeCategoryCount = catalog && activeSlugs ? categories.length : null;
  // Un `?rubro=` sin negocios pero del catálogo sigue siendo válido: muestra
  // el estado vacío (un link viejo o compartido no tiene que caer en "Todos").
  const filters = parseProveedoresFilters(
    await searchParams,
    new Set(allCategories.map((category) => category.slug)),
    zones ? new Set(zones.map((zone) => zone.slug)) : null,
  );
  const directoryCategories = categories.some((category) => category.slug === filters.rubro)
    ? categories
    : [...categories, ...allCategories.filter((category) => category.slug === filters.rubro)];

  const result = await loadPartners(filters);

  // Fuera de rango es 404 y no la última página con otro número: si no,
  // `?pagina=99` sería una URL duplicada (y hay infinitas). Un rubro sin
  // negocios (`totalPages` 0) igual tiene su página 1: el estado vacío.
  if (result && filters.pagina > Math.max(1, result.totalPages)) notFound();

  const schema = graph(
    organizationSchema(),
    webPageSchema({ name: TITLE, description: DESCRIPTION, path: PROVEEDORES_PATH, type: "CollectionPage" }),
    breadcrumbSchema([
      { name: providersDirectoryContent.breadcrumb.home, path: "/" },
      { name: providersDirectoryContent.breadcrumb.proveedores, path: PROVEEDORES_PATH },
    ]),
    ...(result && result.data.length > 0
      ? [
          itemListSchema({
            name: providersDirectoryContent.directory.title,
            path: PROVEEDORES_PATH,
            items: result.data.map((partner) => ({
              name: partner.name,
              path: partnerPath(partner.slug),
            })),
            startPosition: (filters.pagina - 1) * PROVEEDORES_PAGE_SIZE + 1,
            numberOfItems: result.total,
          }),
        ]
      : []),
  );

  return (
    <>
      <PageShell currentPath={PROVEEDORES_PATH}>
        <ProveedoresHero activeCategoryCount={activeCategoryCount} />
        <ProveedoresDirectory
          filters={filters}
          categories={directoryCategories}
          zones={zones ?? []}
          result={result}
        />
        <ProviderBandSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
