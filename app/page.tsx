import HeroSection from "@/components/landing/hero-section";
import LandingNav from "@/components/landing/landing-nav";
import ProblemSection from "@/components/landing/problem-section";
import FAQSection from "@/components/landing/faq-section";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
// import DeferredChatFab from "@/components/landing/deferred-chat-fab";
import ClientFormSection from "@/components/landing/client-form-section";
import { landingPageContent } from "@/lib/landing-content";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "AutoLibre",
      description:
        "La app que traduce los datos OBD-II de tu auto a lenguaje simple. Diagnóstico inteligente, gestión de VTV, seguro y mantenimiento en Argentina.",
      applicationCategory: "AutomotiveApplication",
      operatingSystem: "iOS, Android",
      url: "https://autolibre.ai",
      inLanguage: "es-AR",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "ARS",
        availability: "https://schema.org/PreOrder",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: landingPageContent.sections.faqs.items.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: { "@type": "Answer", text: faq.answer },
      })),
    },
  ],
};

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
          <ClientFormSection content={landingPageContent.sections.form} />
        </SectionContainer>

        <SectionContainer id="faqs" className="al-section-faqs">
          <FAQSection content={landingPageContent.sections.faqs} />
        </SectionContainer>
      </main>

      <LandingFooter
        brand={landingPageContent.brand}
        content={landingPageContent.sections.footer}
      />

      {/* Chat de IA temporalmente oculto: no está funcionando */}
      {/* <DeferredChatFab config={landingPageContent.sections.chat} /> */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
