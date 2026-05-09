"use client";

import { useState } from "react";
import type { LandingPageContent } from "@/lib/landing-types";
import { CheckCircle2 } from "lucide-react";
import BrandButton from "@/components/landing/brand-button";
import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";

type FormSectionProps = {
  readonly content: LandingPageContent["sections"]["form"];
};

export default function FormSection({ content }: FormSectionProps) {
  const [wantsScanner, setWantsScanner] = useState(false);

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
        <p>Dejanos tus datos y te avisamos cuando abramos la beta.</p>
        <form className="al-signup-form">
          {/* Required fields */}
          <div className="al-form-row">
            <div className="al-form-field">
              <label htmlFor="landing-name">
                Nombre <span className="al-required">*</span>
              </label>
              <input id="landing-name" name="name" type="text" placeholder="Tu nombre" required />
            </div>
            <div className="al-form-field">
              <label htmlFor="landing-email">
                Email <span className="al-required">*</span>
              </label>
              <input id="landing-email" name="email" type="email" placeholder="tu@email.com" required />
            </div>
          </div>

          {/* Optional fields */}
          <div className="al-form-row">
            <div className="al-form-field">
              <label htmlFor="landing-whatsapp">WhatsApp</label>
              <input id="landing-whatsapp" name="whatsapp" type="tel" placeholder="+54 11 1234 5678" />
            </div>
            <div className="al-form-field">
              <label htmlFor="landing-reason">Que te atrajo?</label>
              <select id="landing-reason" name="reason" defaultValue="">
                <option value="" disabled>Selecciona una opcion</option>
                {content.reasonOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="al-form-field">
            <label htmlFor="landing-patente">Patente del auto</label>
            <input 
              id="landing-patente" 
              name="patente" 
              type="text" 
              placeholder="O ingresa el modelo si no la recordas" 
            />
          </div>

          <div className="al-form-toggle">
            <label htmlFor="landing-scanner" className="al-toggle-label">
              <span className="al-toggle-text">Te interesa comprar escaner?</span>
              <button
                type="button"
                id="landing-scanner"
                role="switch"
                aria-checked={wantsScanner}
                className={`al-toggle-switch ${wantsScanner ? "al-toggle-active" : ""}`}
                onClick={() => setWantsScanner(!wantsScanner)}
              >
                <span className="al-toggle-thumb" />
              </button>
              <span className="al-toggle-value">{wantsScanner ? "Si" : "No"}</span>
            </label>
          </div>

          <BrandButton type="submit" showArrow={false}>
            Unirme a la lista
          </BrandButton>
          
          <p className="al-form-microcopy">{content.microcopy}</p>
        </form>
      </BrandCard>
    </div>
  );
}
