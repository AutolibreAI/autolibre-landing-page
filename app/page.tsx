import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { ClosingCtaSection } from "@/components/sections/home/closing-cta";
import { CompatibilitySection } from "@/components/sections/home/compatibility";
import { DiagnosticsSection } from "@/components/sections/home/diagnostics";
import { FaqSection } from "@/components/sections/home/faq";
import { FeaturesSection } from "@/components/sections/home/features";
import { HeroSection } from "@/components/sections/home/hero";
import { HistorySection } from "@/components/sections/home/history";
import { HowItWorksSection } from "@/components/sections/home/how-it-works";
import { MarketplaceSection } from "@/components/sections/home/marketplace";
import { ProblemSection } from "@/components/sections/home/problem";
import { ProviderBandSection } from "@/components/sections/home/provider-band";
import { siteConfig } from "@/lib/seo/config";
import { createMetadata } from "@/lib/seo/metadata";
import {
  faqPageSchema,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
  websiteSchema,
} from "@/lib/seo/schema";

export const metadata: Metadata = createMetadata({
  title: siteConfig.title,
  description: siteConfig.description,
  path: "/",
});

const schema = graph(
  organizationSchema(),
  websiteSchema(),
  webPageSchema({
    name: siteConfig.title,
    description: siteConfig.description,
    path: "/",
  }),
  softwareApplicationSchema(),
  faqPageSchema(),
);

export default function HomePage() {
  return (
    <>
      <SiteHeader />

      <main>
        <HeroSection />
        <ProblemSection />
        <FeaturesSection />
        <MarketplaceSection />
        <HistorySection />
        <HowItWorksSection />
        <DiagnosticsSection />
        <CompatibilitySection />
        <ProviderBandSection />
        <FaqSection />
        <ClosingCtaSection />
      </main>

      <SiteFooter />
      <JsonLd schema={schema} />
    </>
  );
}
