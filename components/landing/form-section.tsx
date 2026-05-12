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

type SubmitState =
  | { kind: "idle" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "error"; message: string };

export default function FormSection({ content }: FormSectionProps) {
  const [wantsScanner, setWantsScanner] = useState(false);
  const [reasons, setReasons] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  function toggleReason(option: string) {
    setReasons((prev) =>
      prev.includes(option)
        ? prev.filter((r) => r !== option)
        : [...prev, option],
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Silently discard bot submissions (honeypot field filled)
    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    try {
      // TODO: replace with real API call
      // Simulate duplicate check (hardcoded for demo)
      const REGISTERED_EMAILS = new Set<string>();
      if (REGISTERED_EMAILS.has(email)) {
        setSubmitState({ kind: "duplicate" });
        return;
      }
      REGISTERED_EMAILS.add(email);
      setSubmitState({ kind: "success" });
    } catch {
      setSubmitState({
        kind: "error",
        message: "Algo salió mal. Por favor intentá de nuevo.",
      });
    }
  }

  return (
    <div className="al-form-grid">
      <div>
        <BrandHeading
          eyebrow={content.tag}
          title={content.heading}
          highlight={content.headingHighlight}
        />
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
        {submitState.kind === "success" ? (
          <div className="al-form-success">
            <div className="al-form-success-icon">
              <CheckCircle2 size={40} aria-hidden />
            </div>
            <h3>¡Ya estás adentro!</h3>
            <p>
              Te avisamos en cuanto abramos la beta. Gracias por sumarte a Auto
              Libre.
            </p>
          </div>
        ) : submitState.kind === "duplicate" ? (
          <div className="al-form-success">
            <div className="al-form-success-icon">
              <CheckCircle2 size={40} aria-hidden />
            </div>
            <h3>¡Ya estás en la lista!</h3>
            <p>
              Tu email ya está registrado. Te avisamos cuando abramos la beta.
            </p>
          </div>
        ) : (
          <>
            <h3>Early Access</h3>
            <p>Dejanos tus datos y te avisamos cuando abramos la beta.</p>
            <form className="al-signup-form" onSubmit={handleSubmit}>
              {/* Honeypot — hidden from real users, traps bots */}
              <input
                type="text"
                name="_hp_email"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{
                  position: "absolute",
                  left: "-9999px",
                  width: "1px",
                  height: "1px",
                  opacity: 0,
                }}
              />

              {/* Required fields */}
              <div className="al-form-row">
                <div className="al-form-field">
                  <label htmlFor="landing-name">
                    Nombre <span className="al-required">*</span>
                  </label>
                  <input
                    id="landing-name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    required
                  />
                </div>
                <div className="al-form-field">
                  <label htmlFor="landing-email">
                    Email <span className="al-required">*</span>
                  </label>
                  <input
                    id="landing-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="al-form-field">
                <label>
                  ¿Qué te atrajo? <span className="al-required">*</span>
                </label>
                <div className="al-reason-group">
                  {content.reasonOptions.map((option) => (
                    <div key={option}>
                      <label className="al-reason-option">
                        <input
                          type="checkbox"
                          name="reason"
                          value={option}
                          checked={reasons.includes(option)}
                          onChange={() => toggleReason(option)}
                          className="al-checkbox-input reasonOption"
                        />
                        <span>{option}</span>
                      </label>
                      {option === "Otra" && reasons.includes("Otra") && (
                        <input
                          name="reason_other"
                          type="text"
                          placeholder="¿Qué te trajo hasta acá?"
                          className="al-form-field-nested reasonOption"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="al-form-field">
                <label htmlFor="landing-patente">
                  Patente <span className="al-required">*</span>
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
                  className="al-checkbox-input reasonOption"
                />
              </div>

              {submitState.kind === "error" && (
                <div role="alert" className="al-form-error">
                  <p>{submitState.message}</p>
                  <button
                    type="button"
                    className="al-form-retry"
                    onClick={() => setSubmitState({ kind: "idle" })}
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

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
