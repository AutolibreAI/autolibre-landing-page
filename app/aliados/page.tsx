import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AliadosDirectory } from "@/components/aliados/aliados-directory";
import { AliadosHero } from "@/components/aliados/aliados-hero";
import { PageShell } from "@/components/layout/page-shell";
import { ProviderBandSection } from "@/components/sections/home/provider-band";
import { JsonLd } from "@/components/seo/json-ld";
import {
  fetchActivePartnerCategories,
  fetchPartners,
  fetchServiceCatalog,
  type PartnersPage,
} from "@/lib/autolibre-api";
import {
  ALIADOS_PAGE_SIZE,
  ALIADOS_PATH,
  parseAliadosFilters,
  partnerPath,
  type AliadosFilters,
} from "@/lib/aliados/query";
import { aliadosContent } from "@/lib/content/aliados";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  itemListSchema,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = aliadosContent.meta;

/**
 * Metadata estática: TODAS las variantes (`?rubro=`, `?pagina=`) llevan
 * canonical `/aliados`. Son recortes del mismo directorio, no páginas con
 * tema propio. Se quedan indexables (`index: true`) a propósito: un
 * `noindex` con canonical a otra URL son dos señales que se contradicen, y
 * `createMetadata` ata `follow` a `index`, así que un `noindex` también
 * cortaría el seguimiento de los links a los perfiles de los negocios.
 */
export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: ALIADOS_PATH,
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
async function loadPartners(filters: AliadosFilters): Promise<PartnersPage | null> {
  try {
    return await fetchPartners({
      category: filters.rubro || undefined,
      page: filters.pagina,
      pageSize: ALIADOS_PAGE_SIZE,
    });
  } catch (error) {
    console.error("[aliados] no se pudo leer el directorio:", error);
    return null;
  }
}

/**
 * `/aliados`: el directorio de los negocios de la red.
 *
 * El directorio se pide ACÁ, antes de renderizar, y no dentro de un
 * `<Suspense>` que streamee: una `?pagina=` fuera de rango tiene que
 * responder un 404 de verdad, y una vez que el streaming empezó el status ya
 * salió como 200 (ver `loading.md` › Status Codes en la doc de Next). El
 * `ItemList` del JSON-LD también necesita la lista. Como el fetch va cacheado
 * (1 h), esperar no cuesta: no hay skeleton porque no hay espera que tapar.
 */
export default async function AliadosPage({ searchParams }: PageProps) {
  const [catalog, activeSlugs] = await Promise.all([
    fetchServiceCatalog(),
    fetchActivePartnerCategories(),
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
  const filters = parseAliadosFilters(
    await searchParams,
    new Set(allCategories.map((category) => category.slug)),
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
    webPageSchema({ name: TITLE, description: DESCRIPTION, path: ALIADOS_PATH, type: "CollectionPage" }),
    breadcrumbSchema([
      { name: aliadosContent.breadcrumb.home, path: "/" },
      { name: aliadosContent.breadcrumb.aliados, path: ALIADOS_PATH },
    ]),
    ...(result && result.data.length > 0
      ? [
          itemListSchema({
            name: aliadosContent.directory.title,
            path: ALIADOS_PATH,
            items: result.data.map((partner) => ({
              name: partner.name,
              path: partnerPath(partner.slug),
            })),
            startPosition: (filters.pagina - 1) * ALIADOS_PAGE_SIZE + 1,
            numberOfItems: result.total,
          }),
        ]
      : []),
  );

  return (
    <>
      <PageShell currentPath={ALIADOS_PATH}>
        <AliadosHero activeCategoryCount={activeCategoryCount} />
        <AliadosDirectory filters={filters} categories={directoryCategories} result={result} />
        <ProviderBandSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
