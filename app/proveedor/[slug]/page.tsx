import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { AboutSection } from "@/components/sections/provider-profile/about";
import { Breadcrumb } from "@/components/sections/provider-profile/breadcrumb";
import { ContactSection } from "@/components/sections/provider-profile/contact";
import { ProfileFaqSection } from "@/components/sections/provider-profile/faq";
import { FooterBand } from "@/components/sections/provider-profile/footer-band";
import { HoursSection } from "@/components/sections/provider-profile/hours";
import { LocationSection } from "@/components/sections/provider-profile/location";
import { MetricsSection } from "@/components/sections/provider-profile/metrics";
import { ProfileHeader } from "@/components/sections/provider-profile/profile-header";
import { ProposalCard } from "@/components/sections/provider-profile/proposal-card";
import { ReviewsSection } from "@/components/sections/provider-profile/reviews";
import { ServicesSection } from "@/components/sections/provider-profile/services";
import { WorksSection } from "@/components/sections/provider-profile/works";
import { Container } from "@/components/ui/container";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import {
  getProviderProfile,
  listAllProviderSummaries,
} from "@/lib/provider-profile/api";
import { buildFaq } from "@/lib/provider-profile/faq";
import { isIndexable } from "@/lib/provider-profile/indexability";
import {
  profileDescription,
  profileTitle,
  profileTrail,
} from "@/lib/provider-profile/present";
import { providerOgPath, providerPath } from "@/lib/provider-profile/routes";
import { PROVIDER_PROFILES_PUBLIC } from "@/lib/provider-profile/visibility";
import { siteConfig } from "@/lib/seo/config";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  localBusinessSchema,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

type PageProps = {
  readonly params: Promise<{ slug: string }>;
};

/**
 * Prerenderiza los perfiles publicados al buildear. Los que se aprueben
 * después se generan en el primer request (`dynamicParams` es `true` por
 * defecto) y quedan cacheados. Si el backend no responde, el listado devuelve
 * `[]` y LOGUEA: el build no falla porque el backend esté caído.
 */
export async function generateStaticParams() {
  const summaries = await listAllProviderSummaries();
  return summaries.map((summary) => ({ slug: summary.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getProviderProfile(slug);
  if (result.status !== "ok") return {};

  const { profile } = result;
  const title = profileTitle(profile);

  return createMetadata({
    title,
    description: profileDescription(profile),
    path: providerPath(profile.slug),
    // Indexa solo con el interruptor encendido Y un perfil con contenido
    // suficiente (la web recalcula la regla aunque el backend mande `indexable`).
    index: PROVIDER_PROFILES_PUBLIC && isIndexable(profile),
    image: {
      url: providerOgPath(profile.slug),
      width: 1200,
      height: 630,
      alt: title,
    },
  });
}

/**
 * Perfil público de un proveedor: `/proveedor/<slug>`. Server Component; las únicas
 * islas de cliente son hojas (`OpenStatusBadge`, `WeeklyHours`, `ShareButton`).
 * Todo el contenido indexable sale en el HTML del servidor.
 *
 * - Slug histórico → `permanentRedirect` (308) al vigente, sin cadenas.
 * - Slug inexistente, de un partner no publicado o con formato inválido → 404.
 * - Header global del sitio (decisión de la spec 210) y banda de pie propia.
 * - Outline: `h1` (nombre) → `h2` por sección → `h3` por familia/trabajo.
 * - Datos estructurados: se emiten SOLO si el perfil es indexable y salen de
 *   los mismos objetos que pinta la página (lo declarado es lo visible).
 */
export default async function ProviderProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const result = await getProviderProfile(slug);

  if (result.status === "not_found") notFound();
  if (result.status === "moved") permanentRedirect(providerPath(result.slug));

  const { profile } = result;
  const publicUrl = `${siteConfig.url}${providerPath(profile.slug)}`;
  const trail = profileTrail(profile);
  const faqItems = buildFaq(profile, copy.faq);
  const indexable = isIndexable(profile);

  const path = providerPath(profile.slug);
  const schema = graph(
    organizationSchema(),
    webPageSchema({
      name: profileTitle(profile),
      description: profileDescription(profile),
      path,
    }),
    ...(indexable ? [localBusinessSchema(profile)] : []),
    ...(indexable && faqItems.length > 0 ? [faqPageSchema(faqItems)] : []),
    breadcrumbSchema(trail),
  );

  return (
    <>
      <SiteHeader />

      <main className="bg-canvas">
        <Container size="wide" className="py-4 md:py-8">
          <Breadcrumb trail={trail} />

          {/* Dos columnas desde `lg`; debajo, la derecha pasa DEBAJO de la
              principal (el orden del DOM es el de lectura). */}
          <div className="grid gap-5 lg:grid-cols-3 lg:items-start">
            <div className="lg:col-span-2">
              <ProfileHeader profile={profile} publicUrl={publicUrl} />
              <AboutSection profile={profile} />
              <ServicesSection profile={profile} />
              <WorksSection profile={profile} />
              <ReviewsSection profile={profile} />
              <MetricsSection profile={profile} />
              <ProfileFaqSection items={faqItems} />
            </div>

            <aside className="flex flex-col gap-5">
              <ProposalCard profile={profile} />
              <HoursSection profile={profile} />
              <LocationSection profile={profile} />
              <ContactSection profile={profile} />
            </aside>
          </div>
        </Container>
      </main>

      <FooterBand publicUrl={publicUrl} />
      <JsonLd schema={schema} />
    </>
  );
}
