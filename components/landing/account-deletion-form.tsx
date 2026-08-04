"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import BrandButton from "@/components/landing/brand-button";
import BrandCard from "@/components/landing/brand-card";
import BrandHeading from "@/components/landing/brand-heading";
import { EMAIL_REGEX } from "@/lib/validation";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

const INVALID_EMAIL_ERROR = "Ingresá un email válido.";
const GENERIC_ERROR = "Algo salió mal. Por favor intentá de nuevo.";

const DELETION_INFO = [
  "Un miembro de nuestro equipo revisa cada solicitud manualmente.",
  "Te contactamos al email registrado para confirmar la baja.",
  "La eliminación incluye vehículos, documentos e historial guardado.",
];

export default function AccountDeletionForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value.trim();
    const reason = (form.elements.namedItem("reason") as HTMLTextAreaElement).value.trim();

    if (!EMAIL_REGEX.test(email)) {
      setSubmitState({ kind: "error", message: INVALID_EMAIL_ERROR });
      return;
    }

    setSubmitState({ kind: "loading" });

    try {
      const res = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: reason || null }),
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
          eyebrow="ELIMINAR CUENTA"
          title="Eliminar tu cuenta de"
          highlight="AutoLibre"
          description="Pedí la baja definitiva de tu cuenta y de todos los datos asociados. Un miembro de nuestro equipo se va a comunicar para completarla."
        />
        <ul className="al-benefit-list">
          {DELETION_INFO.map((item) => (
            <li key={item} className="al-benefit-item">
              <AlertTriangle size={18} aria-hidden />
              <span>{item}</span>
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
            <h3>¡Solicitud recibida!</h3>
            <p>
              Recibimos tu solicitud, un miembro de nuestro equipo se va a
              comunicar para completar la eliminación de tu cuenta.
            </p>
          </div>
        ) : (
          <>
            <h3>
              <ShieldAlert size={18} aria-hidden style={{ verticalAlign: "-3px", marginRight: "0.4rem" }} />
              Solicitar eliminación
            </h3>
            <p>Ingresá el email con el que te registraste en AutoLibre.</p>
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
                <label htmlFor="deletion-email">
                  Email de tu cuenta <span className="al-required">*</span>
                </label>
                <input
                  id="deletion-email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="al-form-field">
                <label htmlFor="deletion-reason">Motivo (opcional)</label>
                <textarea
                  id="deletion-reason"
                  name="reason"
                  placeholder="Contanos por qué querés eliminar tu cuenta (opcional)..."
                  rows={4}
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
                {submitState.kind === "loading" ? "Enviando..." : "Solicitar eliminación"}
              </BrandButton>
            </form>
          </>
        )}
      </BrandCard>
    </div>
  );
}
