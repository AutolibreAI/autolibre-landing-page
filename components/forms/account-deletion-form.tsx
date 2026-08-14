"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Field,
  Honeypot,
  Input,
  Textarea,
} from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { accountDeletionCopy } from "@/lib/content/forms";
import { EMAIL_REGEX } from "@/lib/validation";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "error"; message: string };

/**
 * Solicitud de baja de cuenta.
 *
 * Contrato con la API (no cambiar sin migrar `/api/account-deletion`):
 * POST { email, reason|null }. El backend re-valida el email con el mismo
 * `EMAIL_REGEX`, así que ambos lados aceptan exactamente lo mismo.
 *
 * El flujo es manual a propósito: el pedido llega por email al equipo, no
 * hay confirmación por token ni borrado automático.
 */
export function AccountDeletionForm() {
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = event.currentTarget;
    const email = (
      form.elements.namedItem("email") as HTMLInputElement
    ).value.trim();
    const reason = (
      form.elements.namedItem("reason") as HTMLTextAreaElement
    ).value.trim();

    if (!EMAIL_REGEX.test(email)) {
      setSubmitState({
        kind: "error",
        message: accountDeletionCopy.invalidEmail,
      });
      return;
    }

    setSubmitState({ kind: "loading" });

    try {
      const response = await fetch("/api/account-deletion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason: reason || null }),
      });

      if (!response.ok) throw new Error();
      setSubmitState({ kind: "success" });
    } catch {
      setSubmitState({
        kind: "error",
        message: accountDeletionCopy.genericError,
      });
    }
  }

  if (submitState.kind === "success") {
    return (
      <Card variant="solid" className="p-8">
        <FormSuccess
          title={accountDeletionCopy.success.title}
          description={accountDeletionCopy.success.description}
        />
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card variant="solid" className="p-6 md:p-8">
        <div className="flex flex-col gap-5">
          <Honeypot value={honeypot} onChange={setHoneypot} />

          <Field
            label="Email de tu cuenta"
            htmlFor="deletion-email"
            required
            hint="Usá el mismo email con el que te registraste en AutoLibre."
          >
            <Input
              id="deletion-email"
              name="email"
              type="email"
              placeholder="tu@email.com"
              autoComplete="email"
              required
            />
          </Field>

          <Field label="Motivo (opcional)" htmlFor="deletion-reason">
            <Textarea
              id="deletion-reason"
              name="reason"
              rows={4}
              placeholder="Contanos por qué querés eliminar tu cuenta (opcional)..."
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
              ? accountDeletionCopy.submitLoadingLabel
              : accountDeletionCopy.submitLabel}
          </Button>
        </div>
      </Card>
    </form>
  );
}
