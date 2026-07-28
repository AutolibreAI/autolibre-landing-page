import type { Metadata } from "next";
import LandingNav from "@/components/landing/landing-nav";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
import SupportForm from "@/components/landing/support-form";
import { landingPageContent } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Soporte · AutoLibre",
  description: "¿Tenés un problema con AutoLibre? Escribinos y te respondemos por email.",
  robots: { index: true, follow: true },
};

export default function SupportPage() {
  return (
    <div className="al-page">
      <LandingNav brand={landingPageContent.brand} />

      <main>
        <SectionContainer id="support" className="al-section-form">
          <SupportForm />
        </SectionContainer>
      </main>

      <LandingFooter
        brand={landingPageContent.brand}
        content={landingPageContent.sections.footer}
      />
    </div>
  );
}
