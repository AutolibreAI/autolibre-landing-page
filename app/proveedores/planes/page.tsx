import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ProvidersPlansGrid } from "@/components/sections/providers/plans-grid";
import { ProvidersPlansHeroSection } from "@/components/sections/providers/plans-hero";
import { Section } from "@/components/ui/section";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { PROVEEDORES_PATH, PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  providerPlansOfferCatalogSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = providersPlansContent.meta;
const PATH = PROVEEDORES_PLANES_PATH;

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

/** Sólo los planes pagos: el plan gratuito no es una `Offer`. */
const paidPlans = providersPlansContent.plans
  .filter((plan) => plan.priceNote !== null)
  .map((plan) => ({
    name: plan.name,
    description: plan.description,
    priceArs: Number(plan.price.replace(/[^\d]/g, "")),
  }));

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Proveedores", path: PROVEEDORES_PATH },
    { name: "Planes", path: PATH },
  ]),
  providerPlansOfferCatalogSchema(paidPlans),
);

export default function ProveedoresPlanesPage() {
  return (
    <>
      <PageShell cta={{ label: "Sumar mi negocio", href: "#planes" }} currentPath={PATH}>
        <ProvidersPlansHeroSection />

        <Section id="planes" spacing="md" container="content" aria-labelledby="planes-titulo">
          <h2 id="planes-titulo" className="sr-only">
            Planes disponibles
          </h2>
          <ProvidersPlansGrid />
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
