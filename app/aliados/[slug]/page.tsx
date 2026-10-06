import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { safeHttpUrl } from "@/components/aliados/partner-monogram";
import { PartnerProfileBody } from "@/components/aliados/profile/partner-profile-body";
import { PartnerProfileHead } from "@/components/aliados/profile/partner-profile-head";
import { PartnerRelated } from "@/components/aliados/profile/partner-related";
import { PartnerStickyBar } from "@/components/aliados/profile/partner-sticky-bar";
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
import { partnerFamilies, partnerFaqs, partnerServiceGroups } from "@/lib/aliados/profile";
import { ALIADOS_PATH, partnerPath } from "@/lib/aliados/query";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";
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
  return aliadoPerfilContent.metaDescription({
    name: partner.name,
    families: familyNames,
    coverageZone: partner.coverageZone,
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [partner, catalog] = await Promise.all([getPartner(slug), getCatalog()]);

  if (!partner) return { title: aliadoPerfilContent.notFound.meta.title, robots: { index: false } };

  const families = partnerFamilies(partner, catalog ?? []).map((family) => family.name);
  const logoUrl = safeHttpUrl(partner.logoUrl);

  return createMetadata({
    title: partner.name,
    description: profileDescription(partner, families),
    path: partnerPath(partner.slug),
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
    console.error("[aliado] no se pudieron leer los negocios relacionados:", error);
    return [];
  }
}

/**
 * `/aliados/[slug]`: el perfil público de un negocio de la red.
 *
 * Todo se pide ANTES de renderizar, sin `<Suspense>`: un slug desconocido
 * responde un 404 de verdad (con streaming el status ya habría salido 200,
 * ver `loading.md` › Status Codes), igual que `/aliados`.
 */
export default async function PartnerProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [partner, catalog] = await Promise.all([getPartner(slug), getCatalog()]);

  if (!partner) notFound();

  const families = partnerFamilies(partner, catalog ?? []);
  const familyNames = families.map((family) => family.name);
  const serviceGroups = partnerServiceGroups(partner, catalog ?? []);
  const faqs = partnerFaqs(partner);
  const firstFamily = families[0] ?? null;
  const related = firstFamily ? await loadRelated(firstFamily.slug, partner.slug) : [];
  const categoryNames = new Map((catalog ?? []).map((family) => [family.slug, family.name]));

  const path = partnerPath(partner.slug);
  const description = profileDescription(partner, familyNames);
  const { breadcrumb } = aliadoPerfilContent;
  const crumbs = [
    { name: breadcrumb.home, path: "/" },
    { name: breadcrumb.aliados, path: ALIADOS_PATH },
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
      {/* `currentPath` es el perfil y no `/aliados`: el link "Aliados" del
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
