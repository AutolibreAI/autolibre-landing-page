"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Honeypot } from "@/components/ui/form-controls";
import { FormError, FormSuccess } from "@/components/ui/form-feedback";
import { earlyAccessCopy } from "@/lib/content/forms";
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
 * POST { name, email } — 409 significa que el email ya está registrado.
 *
 * Las columnas `reasons` y `reason_other` siguen existiendo en Supabase pero
 * ya no se envían: el endpoint las completa con `[]` y `null`.
 */
export function EarlyAccessForm({
  tone = "light",
  note,
  className,
}: EarlyAccessFormProps) {
  const fieldId = useId();
  const [honeypot, setHoneypot] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ kind: "idle" });

  const onBrand = tone === "brand";

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
        body: JSON.stringify({ name, email }),
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
    "rounded-field border px-4 py-3.5 text-[0.9375rem] outline-none transition-colors",
    onBrand
      ? "border-white/25 bg-white/10 text-white placeholder:text-white/70 focus-visible:border-white"
      : "border-line bg-surface-subtle text-ink placeholder:text-ink/40 focus-visible:border-brand",
  );

  /**
   * El email necesita el doble de ancho que el nombre: un nombre son ~10
   * caracteres y un email ~30. Con `flex-1` en los dos entraban 23 y se
   * cortaban casi todos los correos reales.
   *
   * El `min-w` del email es alto a propósito: cuando la fila no da, preferimos
   * que baje el botón (que es el último) antes que achicar el campo.
   */
  const nameClass = cn(inputClass, "min-w-[7rem] flex-[1]");
  const emailClass = cn(inputClass, "min-w-[15rem] flex-[2]");

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
          className={nameClass}
        />

        <label htmlFor={`${fieldId}-email`} className="sr-only">
          Email
        </label>
        <input
          id={`${fieldId}-email`}
          name="email"
          type="email"
          placeholder="tu@email.com"
          autoComplete="email"
          inputMode="email"
          required
          className={emailClass}
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
