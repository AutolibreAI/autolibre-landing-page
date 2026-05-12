import HeroSection from "@/components/landing/hero-section";
import LandingNav from "@/components/landing/landing-nav";
import FormSection from "@/components/landing/form-section";
import ProblemSection from "@/components/landing/problem-section";
import FAQSection from "@/components/landing/faq-section";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
import AIChatFab from "@/components/landing/ai-chat-fab";
import { landingPageContent } from "@/lib/landing-content";

export default function Home() {
  return (
    <div className="al-page">
      <LandingNav brand={landingPageContent.brand} />

      <main>
        <SectionContainer id="hero" className="al-section-hero">
          <HeroSection content={landingPageContent.sections.hero} />
        </SectionContainer>

        <SectionContainer id="problem" className="al-section-problem">
          <ProblemSection content={landingPageContent.sections.problem} />
        </SectionContainer>

        <SectionContainer id="form-section" className="al-section-form">
          <FormSection content={landingPageContent.sections.form} />
        </SectionContainer>

        <SectionContainer id="faqs" className="al-section-faqs">
          <FAQSection content={landingPageContent.sections.faqs} />
        </SectionContainer>
      </main>

      <LandingFooter
        brand={landingPageContent.brand}
        content={landingPageContent.sections.footer}
      />

      <AIChatFab config={landingPageContent.sections.chat} />
    </div>
  );
}
