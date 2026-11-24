import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { AlliesSection } from "@/components/sections/home/allies";
import { AppPanelSection } from "@/components/sections/home/app-panel";
import { FaqSection, homeFaqItems } from "@/components/sections/home/faq";
import { GuidesSection } from "@/components/sections/home/guides";
import { HOME_PEDIDO_ID, HomeHero } from "@/components/sections/home/home-hero";
import { HowItWorksSection } from "@/components/sections/home/how-it-works";
import { PartnerBandSection } from "@/components/sections/home/partner-band";
import { ServicesSection } from "@/components/sections/home/services";
import { homeContent } from "@/lib/content/home";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo/schema";

const { meta } = homeContent;

/**
 * El Home es el único `page.tsx` del segmento raíz: no recibe el template
 * `%s · AutoLibre` del layout, así que su `title` trae la marca.
 */
export const metadata: Metadata = createMetadata({
  title: meta.title,
  description: meta.description,
  path: "/",
});

const schema = graph(
  organizationSchema(),
  websiteSchema(),
  webPageSchema({ name: meta.title, description: meta.description, path: "/" }),
  breadcrumbSchema([{ name: meta.breadcrumb, path: "/" }]),
  softwareApplicationSchema(),
  faqPageSchema(homeFaqItems),
);

/**
 * Home (rediseño 2026-11, fase 4a): hecho para que la visita pida
 * propuestas. Server Component; las únicas islas de cliente son las del
 * módulo de pedido (pestañas y form de Taller).
 *
 * Outline: h1 (hero) → h2 de los paneles del módulo → h2 por sección → h3
 * por paso, aliado, función de la app, nota del blog y "Más guías".
 *
 * Enlazado interno: `/pedido` (header, servicios, barra fija), las notas del
 * blog, `/blog`, `/proveedores` (banda para negocios), alta y planes.
 */
export default function HomePage() {
  return (
    <>
      <PageShell currentPath="/" actionBar actionBarQuoteHref={`#${HOME_PEDIDO_ID}`}>
        <HomeHero />
        <ServicesSection />
        <HowItWorksSection />
        <AlliesSection />
        <AppPanelSection />
        <GuidesSection />
        <FaqSection />
        <PartnerBandSection />
      </PageShell>
      <JsonLd schema={schema} />
    </>
  );
}
