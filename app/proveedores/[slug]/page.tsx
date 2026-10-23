import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { cache } from "react";
import { safeHttpUrl } from "@/components/proveedores/partner-monogram";
import { PartnerProfileBody } from "@/components/proveedores/profile/partner-profile-body";
import { PartnerProfileHead } from "@/components/proveedores/profile/partner-profile-head";
import { PartnerRelated } from "@/components/proveedores/profile/partner-related";
import { PartnerStickyBar } from "@/components/proveedores/profile/partner-sticky-bar";
import { PageShell } from "@/components/layout/page-shell";
import { ProviderBandSection } from "@/components/sections/home/provider-band";
import { JsonLd } from "@/components/seo/json-ld";
import {
  fetchPartnerBySlug,
  fetchPartners,
  fetchServiceCatalog,
  type PartnerDetail,
  type PartnerSummary,
} from "@/lib/autolibre-api";
import { partnerFamilies, partnerFaqs, partnerServiceGroups } from "@/lib/proveedores/profile";
import { PROVEEDORES_PATH, partnerPath } from "@/lib/proveedores/query";
import { providerProfileContent } from "@/lib/content/provider-profile";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  localBusinessSchema,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

/** Otros negocios de la misma familia, abajo del perfil. */
const RELATED_COUNT = 3;

type PageProps = {
  readonly params: Promise<{ slug: string }>;
};

/**
 * Sin perfiles prerenderizados al buildear: el build no depende de que el
 * backend esté arriba. Con `[]` y `dynamicParams` en `true` (default), cada
 * perfil se genera en su primer request y queda cacheado (ISR), y un negocio
 * nuevo no exige deploy. Ver `generate-static-params.md` en la doc de Next.
 */
export async function generateStaticParams() {
  return [];
}

/**
 * Una sola lectura del perfil por request, compartida por `generateMetadata`
 * y la página. `fetch` ya memoiza; `cache()` lo deja explícito y cubre el
 * caso de que el cliente deje de usar `fetch`.
 */
const getPartner = cache(fetchPartnerBySlug);
const getCatalog = cache(fetchServiceCatalog);

/** Meta description: solo campos reales, única por negocio. */
function profileDescription(partner: PartnerDetail, familyNames: readonly string[]): string {
  return providerProfileContent.metaDescription({
    name: partner.name,
    families: familyNames,
    coverageZone: partner.coverageZone,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [lookup, catalog] = await Promise.all([getPartner(slug), getCatalog()]);

  // Un slug histórico (`moved`) redirige en la página: acá no hay nada que
  // indexar bajo la URL vieja.
  if (lookup?.status !== "found") {
    return { title: providerProfileContent.notFound.meta.title, robots: { index: false } };
  }

  const { partner } = lookup;
  const families = partnerFamilies(partner, catalog ?? []).map((family) => family.name);
  const logoUrl = safeHttpUrl(partner.logoUrl);

  return createMetadata({
    title: partner.name,
    description: profileDescription(partner, families),
    path: partnerPath(partner.slug),
    // El backend solo da por indexables los perfiles con horarios
    // estructurados; el resto sale con `noindex` (y fuera del sitemap).
    index: partner.indexable,
    // Medidas declaradas del logo: no se conocen (URL libre), así que se
    // declara el cuadrado en que se muestra. Sin logo, la OG del sitio.
    image: logoUrl ? { url: logoUrl, width: 512, height: 512, alt: partner.name } : undefined,
  });
}

/** Hasta tres negocios más de la familia, sin el actual. Falla en silencio. */
async function loadRelated(familySlug: string, currentSlug: string): Promise<PartnerSummary[]> {
  try {
    const result = await fetchPartners({ category: familySlug, page: 1, pageSize: RELATED_COUNT + 1 });
    return result.data.filter((partner) => partner.slug !== currentSlug).slice(0, RELATED_COUNT);
  } catch (error) {
    console.error("[proveedor] no se pudieron leer los negocios relacionados:", error);
    return [];
  }
}

/**
 * `/proveedores/[slug]`: el perfil público de un negocio de la red.
 *
 * Todo se pide ANTES de renderizar, sin `<Suspense>`: un slug desconocido
 * responde un 404 de verdad (con streaming el status ya habría salido 200,
 * ver `loading.md` › Status Codes), igual que `/proveedores`.
 */
export default async function PartnerProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [lookup, catalog] = await Promise.all([getPartner(slug), getCatalog()]);

  if (!lookup) notFound();
  // Slug histórico: el negocio cambió de slug y el backend informa el vigente.
  // Redirect permanente para que el link viejo (y su posicionamiento) pase al nuevo.
  if (lookup.status === "moved") permanentRedirect(partnerPath(lookup.slug));

  const { partner } = lookup;
  const families = partnerFamilies(partner, catalog ?? []);
  const familyNames = families.map((family) => family.name);
  const serviceGroups = partnerServiceGroups(partner, catalog ?? []);
  const faqs = partnerFaqs(partner);
  const firstFamily = families[0] ?? null;
  const related = firstFamily ? await loadRelated(firstFamily.slug, partner.slug) : [];
  const categoryNames = new Map((catalog ?? []).map((family) => [family.slug, family.name]));

  const path = partnerPath(partner.slug);
  const description = profileDescription(partner, familyNames);
  const { breadcrumb } = providerProfileContent;
  const crumbs = [
    { name: breadcrumb.home, path: "/" },
    { name: breadcrumb.proveedores, path: PROVEEDORES_PATH },
    { name: partner.name, path },
  ];

  const schema = graph(
    organizationSchema(),
    webPageSchema({ name: partner.name, description, path }),
    breadcrumbSchema(crumbs),
    localBusinessSchema({
      name: partner.name,
      path,
      description: partner.description ?? description,
      address: partner.address,
      areaServed: partner.coverageZone,
      sameAs: partner.links.map((link) => link.url),
      logoUrl: safeHttpUrl(partner.logoUrl),
      geo: partner.geo,
    }),
    ...(faqs.length > 0 ? [faqPageSchema(faqs)] : []),
  );

  return (
    <>
      {/* `currentPath` es el perfil y no `/proveedores`: el link "Proveedores" del
          header no es esta página, así que no lleva `aria-current="page"`. */}
      <PageShell currentPath={path}>
        <PartnerProfileHead partner={partner} breadcrumbs={crumbs} familyNames={familyNames} />
        <PartnerProfileBody partner={partner} serviceGroups={serviceGroups} faqs={faqs} />
        {firstFamily && related.length > 0 ? (
          <PartnerRelated family={firstFamily} partners={related} categoryNames={categoryNames} />
        ) : null}
        <ProviderBandSection />
      </PageShell>

      <PartnerStickyBar whatsappHref={safeHttpUrl(partner.redirectLink)} />
      <JsonLd schema={schema} />
    </>
  );
}
