import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ProvidersPlansHeroSection } from "@/components/sections/providers/plans-hero";
import {
  PlansCompareSection,
  PlansFaqSection,
  PlansRulesSection,
} from "@/components/sections/providers/plans-sections";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { PROVEEDORES_PATH, PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
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

/** La MISMA lista alimenta las migas visibles y el `BreadcrumbList`. */
const breadcrumbs = [
  { name: "Inicio", path: "/" },
  { name: "Proveedores", path: PROVEEDORES_PATH },
  { name: providersPlansContent.breadcrumb.current, path: PATH },
];

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema(breadcrumbs),
  providerPlansOfferCatalogSchema(paidPlans),
  faqPageSchema(providersPlansContent.faq.items),
);

/**
 * `/proveedores/planes` (rediseño 2026-11, lienzo `Planes`). Server
 * Component entero, sin islas ni Clerk: los links a la contratación van sin
 * prefetch. Outline: h1 → h2 "Planes disponibles" (h3 por plan y ventas) →
 * h2 "Lo mismo en todos los planes" (h3 por regla) → h2 "Compará los planes"
 * (desde `md`) → h2 "Preguntas sobre los planes" → h2 del cierre.
 */
export default function ProveedoresPlanesPage() {
  return (
    <>
      <PageShell cta={false} currentPath={PATH}>
        <ProvidersPlansHeroSection breadcrumbs={breadcrumbs} />
        <PlansRulesSection />
        <PlansCompareSection />
        <PlansFaqSection />
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
