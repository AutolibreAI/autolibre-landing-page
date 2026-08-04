import type { Metadata } from "next";
import LandingNav from "@/components/landing/landing-nav";
import LandingFooter from "@/components/landing/landing-footer";
import SectionContainer from "@/components/landing/section-container";
import AccountDeletionForm from "@/components/landing/account-deletion-form";
import { landingPageContent } from "@/lib/landing-content";

export const metadata: Metadata = {
  title: "Eliminar cuenta · AutoLibre",
  description: "Pedí la eliminación definitiva de tu cuenta de AutoLibre y de todos los datos asociados.",
  robots: { index: true, follow: true },
};

export default function EliminarCuentaPage() {
  return (
    <div className="al-page">
      <LandingNav brand={landingPageContent.brand} />

      <main>
        <SectionContainer id="eliminar-cuenta" className="al-section-form">
          <AccountDeletionForm />
        </SectionContainer>
      </main>

      <LandingFooter
        brand={landingPageContent.brand}
        content={landingPageContent.sections.footer}
      />
    </div>
  );
}
