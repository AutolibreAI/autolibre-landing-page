import type { LandingPageContent } from "@/lib/landing-types";
import { CheckCircle2 } from "lucide-react";
import BrandButton from "@/components/landing/brand-button";
import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";
type FormSectionProps = {
  readonly content: LandingPageContent["sections"]["form"];
};
export default function FormSection({ content }: FormSectionProps) {
  return (
    <div className="al-form-grid">
      <div>
        <BrandHeading eyebrow={content.tag} title={content.heading} highlight={content.headingHighlight} />
        <ul className="al-benefit-list">
          {content.benefits.map((benefit) => (
            <li key={benefit.id} className="al-benefit-item">
              <CheckCircle2 size={18} aria-hidden />
              <span>{benefit.text}</span>
            </li>
          ))}
        </ul>
      </div>
      <BrandCard className="al-signup-card">
        <h3>Acceso anticipado</h3>
        <p>Dejanos tu email y te avisamos cuando abramos la beta.</p>
        <form className="al-signup-form">
          <label htmlFor="landing-name">Nombre</label>
          <input id="landing-name" name="name" type="text" placeholder="Tu nombre" />
          <label htmlFor="landing-email">Email</label>
          <input id="landing-email" name="email" type="email" placeholder="tu@email.com" />
          <BrandButton type="button">Unirme a la lista</BrandButton>
        </form>
      </BrandCard>
    </div>
  );
}
