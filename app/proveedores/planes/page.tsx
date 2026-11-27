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
  providerPricingOfferCatalogSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = providersPlansContent.meta;
const PATH = PROVEEDORES_PLANES_PATH;

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

/**
 * Sólo lo que se paga (trabajo suelto y pack): el primer trabajo, gratis, no
 * es una `Offer`. El precio sale del número del contenido (`priceArs`), no de
 * parsear el texto de la tarjeta.
 */
const paidOffers = providersPlansContent.plans.flatMap((plan) =>
  plan.priceArs === null
    ? []
    : [
        {
          name: plan.name,
          description: plan.offerDescription,
          priceArs: plan.priceArs,
          jobs: plan.jobs,
        },
      ],
);

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
  providerPricingOfferCatalogSchema(paidOffers),
  faqPageSchema(providersPlansContent.faq.items),
);

/**
 * `/proveedores/planes` (rediseño 2026-11, lienzo `Planes`): los precios
 * para proveedores. Desde el 2026-11-26 se cobra por trabajo confirmado y la
 * URL conserva `/planes`. Server Component entero, sin islas ni Clerk; nada
 * enlaza a la contratación. Outline: h1 → h2 "Precios por trabajo" (h3 por
 * tarjeta y ventas) → h2 "Lo mismo para todos los negocios" (h3 por regla) →
 * h2 "Compará las opciones" (desde `md`) → h2 "Preguntas sobre los precios"
 * → h2 del cierre.
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
