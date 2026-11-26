import { PageShell } from "@/components/layout/page-shell";
import { ProveedoresDirectory } from "@/components/proveedores/proveedores-directory";
import { ProveedoresHero } from "@/components/proveedores/proveedores-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { providersDirectoryContent } from "@/lib/content/providers-directory";
import type { DirectoryData } from "@/lib/proveedores/directory";
import { PROVEEDORES_PAGE_SIZE, PROVEEDORES_PATH, partnerPath } from "@/lib/proveedores/query";
import {
  breadcrumbSchema,
  graph,
  itemListSchema,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { meta, breadcrumb, directory } = providersDirectoryContent;

const CRUMBS = [
  { name: breadcrumb.home, path: "/" },
  { name: breadcrumb.proveedores, path: PROVEEDORES_PATH },
];

/**
 * La página `/proveedores` completa (rediseño 2026-11, fase 4b). La renderizan
 * dos rutas con el MISMO árbol:
 *
 * - `app/proveedores/page.tsx`: la versión base, sin filtros. Estática con
 *   revalidación (ISR, 1 h): sale del CDN.
 * - `app/proveedores-filtros/page.tsx`: cualquier `?rubro=`, `?zona=`, `?q=` o
 *   `?pagina=` (rewrite de `next.config.ts`, la URL visible sigue siendo
 *   `/proveedores?…`). Dinámica por request, con los `fetch` cacheados.
 *
 * Outline: h1 → h2 "¿No sabés a quién elegir?" → h2 "Toda la red" (h3 por
 * negocio) → h2 de la tarjeta para negocios.
 */
export function ProveedoresPageView({ data }: { readonly data: DirectoryData }) {
  const { filters, result } = data;

  const schema = graph(
    organizationSchema(),
    webPageSchema({ name: meta.title, description: meta.description, path: PROVEEDORES_PATH, type: "CollectionPage" }),
    breadcrumbSchema(CRUMBS),
    ...(result && result.data.length > 0
      ? [
          itemListSchema({
            name: directory.title,
            path: PROVEEDORES_PATH,
            items: result.data.map((partner) => ({ name: partner.name, path: partnerPath(partner.slug) })),
            startPosition: (filters.pagina - 1) * PROVEEDORES_PAGE_SIZE + 1,
            numberOfItems: result.total,
          }),
        ]
      : []),
  );

  return (
    <>
      <PageShell currentPath={PROVEEDORES_PATH} actionBar>
        <ProveedoresHero
          breadcrumbs={CRUMBS}
          networkTotal={data.networkTotal}
          activeCategoryCount={data.activeCategoryCount}
          filters={filters}
          zones={data.zones}
          categories={data.categories}
        />
        <ProveedoresDirectory
          filters={filters}
          categories={data.categories}
          categoryNames={data.categoryNames}
          zones={data.zones}
          result={result}
          mapPoints={data.mapPoints}
        />
      </PageShell>
      <JsonLd schema={schema} />
    </>
  );
}
