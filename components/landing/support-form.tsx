"use client";

import { useState } from "react";
import { CheckCircle2, LifeBuoy } from "lucide-react";
import BrandButton from "@/components/landing/brand-button";
import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const SUBJECTS = [
  "Problema técnico",
  "Cuenta o acceso",
  "Facturación",
  "Sugerencia",
  "Otro",
];

const SUPPORT_BENEFITS = [
  "Te respondemos en menos de 24hs hábiles.",
  "Un humano lee cada mensaje, no un bot.",
  "Guardá el link de esta página para futuros reclamos.",
];

const CONTACT_ERROR = "Dejanos un email o un teléfono para poder contactarte.";
const GENERIC_ERROR = "Algo salió mal. Por favor intentá de nuevo.";

export default function SupportForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = e.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const phone = (form.elements.namedItem("phone") as HTMLInputElement).value.trim();
    const subject = (form.elements.namedItem("subject") as HTMLSelectElement).value;
    const message = (form.elements.namedItem("message") as HTMLTextAreaElement).value;

    if (!email && !phone) {
      setSubmitState({ kind: "error", message: CONTACT_ERROR });
      return;
    }

    setSubmitState({ kind: "loading" });

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || null,
          phone: phone || null,
          subject,
          message,
        }),
      });

      if (!res.ok) throw new Error();
      setSubmitState({ kind: "success" });
    } catch {
      setSubmitState({ kind: "error", message: GENERIC_ERROR });
    }
  }

  return (
    <div className="al-form-grid">
      <div>
        <BrandHeading
          eyebrow="SOPORTE"
          title="¿Necesitás"
          highlight="ayuda?"
          description="Contanos qué te está pasando y te respondemos lo antes posible."
        />
        <ul className="al-benefit-list">
          {SUPPORT_BENEFITS.map((benefit) => (
            <li key={benefit} className="al-benefit-item">
              <CheckCircle2 size={18} aria-hidden />
              <span>{benefit}</span>
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
            <h3>¡Mensaje enviado!</h3>
            <p>Te vamos a responder a la brevedad.</p>
          </div>
        ) : (
          <>
            <h3>
              <LifeBuoy size={18} aria-hidden style={{ verticalAlign: "-3px", marginRight: "0.4rem" }} />
              Escribinos
            </h3>
            <p>Completá el formulario y te contactamos.</p>
            <form className="al-signup-form" onSubmit={handleSubmit} noValidate>
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
                <label htmlFor="support-name">
                  Nombre <span className="al-required">*</span>
                </label>
                <input id="support-name" name="name" type="text" placeholder="Tu nombre" required />
              </div>

              <div className="al-form-row">
                <div className="al-form-field">
                  <label htmlFor="support-email">Email</label>
                  <input
                    id="support-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="al-form-field">
                  <label htmlFor="support-phone">Teléfono</label>
                  <input
                    id="support-phone"
                    name="phone"
                    type="tel"
                    placeholder="+54 9 11 1234-5678"
                  />
                </div>
              </div>
              <p className="al-form-microcopy">
                Dejanos al menos un dato de contacto (email o teléfono) <span className="al-required">*</span>
              </p>

              <div className="al-form-field">
                <label htmlFor="support-subject">
                  Motivo <span className="al-required">*</span>
                </label>
                <select id="support-subject" name="subject" defaultValue="" required>
                  <option value="" disabled>
                    Seleccioná una opción
                  </option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="al-form-field">
                <label htmlFor="support-message">
                  Mensaje <span className="al-required">*</span>
                </label>
                <textarea
                  id="support-message"
                  name="message"
                  placeholder="Contanos el problema con el mayor detalle posible..."
                  rows={5}
                  required
                />
              </div>

              {submitState.kind === "error" && (
                <p role="alert" className="al-form-error-text">
                  {submitState.message}
                </p>
              )}

              <BrandButton
                type="submit"
                showArrow={false}
                disabled={submitState.kind === "loading"}
                className="w-full justify-center"
              >
                {submitState.kind === "loading" ? "Enviando..." : "Enviar mensaje"}
              </BrandButton>
            </form>
          </>
        )}
      </BrandCard>
    </div>
  );
}
