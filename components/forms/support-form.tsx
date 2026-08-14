"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  Honeypot,
  Input,
  Select,
  Textarea,
} from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { SUPPORT_SUBJECTS, supportCopy } from "@/lib/content/forms";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Contacto de soporte.
 *
 * Contrato con la API (no cambiar sin migrar `/api/support`):
 * POST { name, email|null, phone|null, subject, message }.
 * El backend exige nombre, motivo, mensaje y al menos un contacto; acá se
 * valida lo mismo antes de mandar para dar feedback inmediato.
 */
export function SupportForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = event.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const phone = (
      form.elements.namedItem("phone") as HTMLInputElement
    ).value.trim();
    const subject = (form.elements.namedItem("subject") as HTMLSelectElement)
      .value;
    const message = (
      form.elements.namedItem("message") as HTMLTextAreaElement
    ).value;

    if (!email && !phone) {
      setSubmitState({ kind: "error", message: supportCopy.contactError });
      return;
    }

    setSubmitState({ kind: "loading" });

    try {
      const response = await fetch("/api/support", {
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

      if (!response.ok) throw new Error();
      setSubmitState({ kind: "success" });
    } catch {
      setSubmitState({ kind: "error", message: supportCopy.genericError });
    }
  }

  if (submitState.kind === "success") {
    return (
      <Card variant="solid" className="p-8">
        <FormSuccess
          title={supportCopy.success.title}
          description={supportCopy.success.description}
        />
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card variant="solid" className="p-6 md:p-8">
        <div className="flex flex-col gap-5">
          <Honeypot value={honeypot} onChange={setHoneypot} />

          <Field label="Nombre" htmlFor="support-name" required>
            <Input
              id="support-name"
              name="name"
              type="text"
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="support-email">
              <Input
                id="support-email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Teléfono" htmlFor="support-phone">
              <Input
                id="support-phone"
                name="phone"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                autoComplete="tel"
              />
            </Field>
          </div>
          <p className="-mt-2 text-xs text-ink/55">{supportCopy.contactHint}</p>

          <Field label="Motivo" htmlFor="support-subject" required>
            <Select id="support-subject" name="subject" defaultValue="" required>
              <option value="" disabled>
                Seleccioná una opción
              </option>
              {SUPPORT_SUBJECTS.map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Mensaje" htmlFor="support-message" required>
            <Textarea
              id="support-message"
              name="message"
              rows={5}
              placeholder="Contanos el problema con el mayor detalle posible..."
              required
            />
          </Field>

          {submitState.kind === "error" ? (
            <FormError message={submitState.message} />
          ) : null}

          <Button
            type="submit"
            size="lg"
            block
            disabled={submitState.kind === "loading"}
          >
            {submitState.kind === "loading"
              ? supportCopy.submitLoadingLabel
              : supportCopy.submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}
