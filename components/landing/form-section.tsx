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

const OTHER_REASON = "Otra";

export default function FormSection({ content }: FormSectionProps) {
  const [honeypot, setHoneypot] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonOther, setReasonOther] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  function toggleReason(reason: string) {
    setReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          reasons,
          reason_other: reasons.includes(OTHER_REASON) ? reasonOther : "",
        }),
      });

      if (res.status === 409) {
        setSubmitState({ kind: "duplicate" });
        return;
      }
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error desconocido");
      }
      setSubmitState({ kind: "success" });
    } catch (err) {
      setSubmitState({
        kind: "error",
        message: err instanceof Error ? err.message : "Algo salió mal. Por favor intentá de nuevo.",
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

              <div className="al-form-field">
                <label>¿Qué te interesa de AutoLibre?</label>
                <div className="al-reason-group">
                  {content.reasonOptions.map((reason) => (
                    <label key={reason} className="al-reason-option">
                      <input
                        type="checkbox"
                        className="al-checkbox-input"
                        checked={reasons.includes(reason)}
                        onChange={() => toggleReason(reason)}
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
                {reasons.includes(OTHER_REASON) && (
                  <input
                    type="text"
                    className="al-form-field-nested"
                    placeholder="Contanos qué te interesa"
                    value={reasonOther}
                    onChange={(e) => setReasonOther(e.target.value)}
                  />
                )}
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
