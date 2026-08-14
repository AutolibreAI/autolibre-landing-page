"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Honeypot } from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { ChoicePill } from "@/components/ui/choice";
import {
  EARLY_ACCESS_REASONS,
  OTHER_REASON,
  earlyAccessCopy,
} from "@/lib/content/forms";
import { cn } from "@/lib/utils";

type SubmitState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success" }
  | { kind: "duplicate" }
  | { kind: "error"; message: string };

type EarlyAccessFormProps = {
  /** `brand` = sobre la sección verde de cierre. `light` = sobre blanco. */
  readonly tone?: "light" | "brand";
  readonly note?: string;
  readonly className?: string;
};

/**
 * Formulario de early access. Aparece dos veces en la home (hero y cierre)
 * con la misma lógica y distinta piel.
 *
 * Contrato con la API (no cambiar sin migrar `/api/early-access`):
 * POST { name, email, reasons: string[], reason_other: string }
 * 409 => el email ya está registrado.
 */
export function EarlyAccessForm({
  tone = "light",
  note,
  className,
}: EarlyAccessFormProps) {
  const fieldId = useId();
  const [honeypot, setHoneypot] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [reasonOther, setReasonOther] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  const onBrand = tone === "brand";

  function toggleReason(reason: string) {
    setReasons((current) =>
      current.includes(reason)
        ? current.filter((value) => value !== reason)
        : [...current, reason],
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Trampa de bots: fingimos éxito y no mandamos nada.
    if (honeypot) {
      setSubmitState({ kind: "success" });
      return;
    }

    const form = event.currentTarget;
    const name = (form.elements.namedItem("name") as HTMLInputElement).value;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;

    setSubmitState({ kind: "loading" });

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          reasons,
          reason_other: reasons.includes(OTHER_REASON) ? reasonOther : "",
        }),
      });

      if (response.status === 409) {
        setSubmitState({ kind: "duplicate" });
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? earlyAccessCopy.genericError);
      }

      setSubmitState({ kind: "success" });
    } catch (error) {
      setSubmitState({
        kind: "error",
        message:
          error instanceof Error && error.message
            ? error.message
            : earlyAccessCopy.genericError,
      });
    }
  }

  if (submitState.kind === "success" || submitState.kind === "duplicate") {
    const copy =
      submitState.kind === "success"
        ? earlyAccessCopy.success
        : earlyAccessCopy.duplicate;

    return (
      <FormSuccess
        title={copy.title}
        description={copy.description}
        onDark={onBrand}
        className={className}
      />
    );
  }

  const inputClass = cn(
    "min-w-[10rem] flex-1 rounded-field border px-4 py-3.5 text-[0.9375rem] outline-none transition-colors",
    onBrand
      ? "border-white/25 bg-white/10 text-white placeholder:text-white/70 focus-visible:border-white"
      : "border-line bg-surface-subtle text-ink placeholder:text-ink/40 focus-visible:border-brand",
  );

  return (
    <form onSubmit={handleSubmit} className={className} noValidate>
      <Honeypot value={honeypot} onChange={setHoneypot} />

      <div className="flex flex-wrap gap-2.5">
        <label htmlFor={`${fieldId}-name`} className="sr-only">
          Nombre
        </label>
        <input
          id={`${fieldId}-name`}
          name="name"
          type="text"
          placeholder="Nombre"
          autoComplete="name"
          required
          className={inputClass}
        />

        <label htmlFor={`${fieldId}-email`} className="sr-only">
          Email
        </label>
        <input
          id={`${fieldId}-email`}
          name="email"
          type="email"
          placeholder="Email"
          autoComplete="email"
          required
          className={inputClass}
        />

        <Button
          type="submit"
          size="lg"
          variant={onBrand ? "inverse" : "primary"}
          disabled={submitState.kind === "loading"}
        >
          {submitState.kind === "loading"
            ? earlyAccessCopy.submitLoadingLabel
            : earlyAccessCopy.submitLabel}
        </Button>
      </div>

      <fieldset className="mt-5 border-0 p-0">
        <legend
          className={cn(
            "mb-2.5 text-[0.8125rem] font-semibold",
            onBrand ? "text-white/80" : "text-ink/70",
          )}
        >
          {earlyAccessCopy.reasonsLabel}
        </legend>
        <div className="flex flex-wrap gap-2">
          {EARLY_ACCESS_REASONS.map((reason) => (
            <ChoicePill
              key={reason}
              type="checkbox"
              label={reason}
              checked={reasons.includes(reason)}
              onChange={() => toggleReason(reason)}
              className={cn(
                onBrand &&
                  (reasons.includes(reason)
                    ? "border-white bg-white/20 text-white"
                    : "border-white/25 bg-white/5 text-white hover:border-white/60"),
              )}
            />
          ))}
        </div>
        {reasons.includes(OTHER_REASON) ? (
          <>
            <label htmlFor={`${fieldId}-other`} className="sr-only">
              {earlyAccessCopy.otherPlaceholder}
            </label>
            <input
              id={`${fieldId}-other`}
              type="text"
              placeholder={earlyAccessCopy.otherPlaceholder}
              value={reasonOther}
              onChange={(event) => setReasonOther(event.target.value)}
              className={cn(inputClass, "mt-2.5 w-full")}
            />
          </>
        ) : null}
      </fieldset>

      {submitState.kind === "error" ? (
        <div className="mt-3">
          <FormError message={submitState.message} onDark={onBrand} />
        </div>
      ) : null}

      {note ? (
        <p
          className={cn(
            "mt-3 text-[0.8125rem]",
            onBrand ? "text-white/70" : "text-ink/55",
          )}
        >
          {note}
        </p>
      ) : null}
    </form>
  );
}
