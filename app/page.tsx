import Link from "next/link";
import { Zap } from "lucide-react";
import HeroSection from "@/components/landing/hero-section";
import FormSection from "@/components/landing/form-section";
import ProblemSection from "@/components/landing/problem-section";
import FeaturesSection from "@/components/landing/features-section";
import FAQSection from "@/components/landing/faq-section";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
import AIChatFab from "@/components/landing/ai-chat-fab";
import { landingPageContent } from "@/lib/landing-content";

export default function Home() {
  return (
    <div className="al-page">
      <div className="al-nav-shell">
        <header className="al-nav">
          <div className="al-nav-brand">
            <span className="al-nav-icon">
              <Zap size={12} aria-hidden />
            </span>
            <strong>{landingPageContent.brand.name}</strong>
            <span className="al-nav-badge">{landingPageContent.brand.badge}</span>
          </div>
          <nav className="al-nav-links" aria-label="Navegacion principal">
            <Link href="#hero">Inicio</Link>
            <Link href="#features">Producto</Link>
            <Link href="#form-section">Early Access</Link>
            <Link href="#faqs">FAQs</Link>
            <Link href="#footer">Contacto</Link>
          </nav>
        </header>
      </div>

      <main>
        <SectionContainer id="hero" className="al-section-hero">
          <HeroSection content={landingPageContent.sections.hero} />
        </SectionContainer>

        <SectionContainer id="problem" className="al-section-problem">
          <ProblemSection content={landingPageContent.sections.problem} />
        </SectionContainer>

        <SectionContainer id="features" className="al-section-features">
          <FeaturesSection content={landingPageContent.sections.features} />
        </SectionContainer>

        <SectionContainer id="form-section" className="al-section-form">
          <FormSection content={landingPageContent.sections.form} />
        </SectionContainer>

        <SectionContainer id="faqs" className="al-section-faqs">
          <FAQSection content={landingPageContent.sections.faqs} />
        </SectionContainer>
      </main>

      <LandingFooter brand={landingPageContent.brand} content={landingPageContent.sections.footer} />
      
      <AIChatFab config={landingPageContent.sections.chat} />
    </div>
  );
}
