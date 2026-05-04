import Link from "next/link";
import { Zap } from "lucide-react";
import HeroSection from "@/components/landing/hero-section";
import FormSection from "@/components/landing/form-section";
import VerticalsSection from "@/components/landing/verticals-section";
import FinalCtaSection from "@/components/landing/final-cta-section";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
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
            <Link href="#form-section">Early Access</Link>
            <Link href="#verticals">Producto</Link>
            <Link href="#footer">Contacto</Link>
          </nav>
        </header>
      </div>
      <main>
        <SectionContainer id="hero" className="al-section-hero">
          <HeroSection content={landingPageContent.sections.hero} />
        </SectionContainer>
        <SectionContainer id="form-section" className="al-section-form">
          <FormSection content={landingPageContent.sections.form} />
        </SectionContainer>
        <SectionContainer id="verticals" className="al-section-verticals">
          <VerticalsSection content={landingPageContent.sections.verticals} />
        </SectionContainer>
        <SectionContainer id="final-cta" className="al-section-final">
          <FinalCtaSection content={landingPageContent.sections.finalCta} />
        </SectionContainer>
      </main>
      <LandingFooter brand={landingPageContent.brand} content={landingPageContent.sections.footer} />
    </div>
  );
}
