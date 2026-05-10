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
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

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
        {submitted ? (
          <div className="al-form-success">
            <div className="al-form-success-icon">
              <CheckCircle2 size={40} aria-hidden />
            </div>
            <h3>¡Ya estás adentro!</h3>
            <p>Te avisamos en cuanto abramos la beta. Gracias por sumarte a AutoLibre.</p>
          </div>
        ) : (
        <>
        <h3>Acceso anticipado</h3>
        <p>Dejanos tus datos y te avisamos cuando abramos la beta.</p>
        <form className="al-signup-form" onSubmit={handleSubmit}>
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
              <label htmlFor="landing-reason">
                ¿Qué te atrajo? <span className="al-required">*</span>
              </label>
              <select
                id="landing-reason"
                name="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="" disabled>Selecciona una opcion</option>
                {content.reasonOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          {reason === "Otra" && (
            <div className="al-form-field">
              <label htmlFor="landing-reason-other">
                Contanos más
              </label>
              <input
                id="landing-reason-other"
                name="reason_other"
                type="text"
                placeholder="¿Qué te trajo hasta acá?"
              />
            </div>
          )}

          <div className="al-form-field">
            <label htmlFor="landing-patente">
              Patente del auto <span className="al-required">*</span>
            </label>
            <input
              id="landing-patente"
              name="patente"
              type="text"
              placeholder="O ingresa el modelo si no la recordas"
              required
            />
          </div>

          <div className="al-form-checkbox">
            <label htmlFor="landing-scanner" className="al-checkbox-label">
              ¿Te interesa comprar un escáner?
            </label>
            <input
              type="checkbox"
              id="landing-scanner"
              name="scanner"
              checked={wantsScanner}
              onChange={(e) => setWantsScanner(e.target.checked)}
              className="al-checkbox-input"
            />
          </div>

          <BrandButton type="submit" showArrow={false}>
            Unirme a la lista
          </BrandButton>

          <p className="al-form-microcopy">{content.microcopy}</p>
        </form>
        </>
        )}
      </BrandCard>
    </div>
  );
}
