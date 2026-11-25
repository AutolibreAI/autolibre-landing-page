"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { SIGNUP_INTENTS, type SignupIntent } from "@/lib/auth/signup-intent";
import { cn } from "@/lib/utils";

const { intentChoice } = partnerAccountContent;

const OPTIONS: ReadonlyArray<{ readonly intent: SignupIntent; readonly icon: "user" | "wrench" }> = [
  { intent: SIGNUP_INTENTS.customer, icon: "user" },
  { intent: SIGNUP_INTENTS.partner, icon: "wrench" },
];

type SignupIntentChoiceProps = {
  /** Lo que eligió antes (al volver con "Cambiar"). */
  readonly initial?: SignupIntent | null;
  readonly submitLabel?: string;
  readonly onSubmit: (intent: SignupIntent) => void;
};

/**
 * "¿Cómo vas a usar AutoLibre?": dos tarjetas de radio ("Soy cliente" /
 * "Tengo un taller o negocio") en un `fieldset` con `legend`. Radios nativos
 * (flechas para moverse, espacio para elegir) escondidos con `sr-only`; la
 * tarjeta entera es el `<label>`, de 44px o más, con el foco visible en la
 * tarjeta. Sin elección, "Continuar" avisa con un error asociado al grupo.
 */
export function SignupIntentChoice({
  initial = null,
  submitLabel = intentChoice.continue,
  onSubmit,
}: SignupIntentChoiceProps) {
  const [selected, setSelected] = useState<SignupIntent | null>(initial);
  const [showError, setShowError] = useState(false);
  const name = useId();
  const hintId = useId();
  const errorId = useId();
  const firstRef = useRef<HTMLInputElement>(null);

  return (
    <form
      noValidate
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected) {
          setShowError(true);
          firstRef.current?.focus();
          return;
        }
        onSubmit(selected);
      }}
    >
      <fieldset
        className="flex flex-col gap-2.5"
        aria-describedby={showError ? `${hintId} ${errorId}` : hintId}
        aria-invalid={showError || undefined}
      >
        <legend className="mb-1 font-display text-lg font-bold text-fg">{intentChoice.legend}</legend>
        <p id={hintId} className="-mt-1 text-sm text-fg-muted">
          {intentChoice.hint}
        </p>
        {OPTIONS.map((option, index) => {
          const copy = intentChoice.options[option.intent];
          const checked = selected === option.intent;
          return (
            <label
              key={option.intent}
              className={cn(
                "flex min-h-11 cursor-pointer items-center gap-3 rounded-card border bg-card px-4 py-3 transition-colors motion-reduce:transition-none",
                "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand",
                checked ? "border-action bg-brand-50" : "border-control-line-strong hover:border-action",
              )}
            >
              <input
                ref={index === 0 ? firstRef : undefined}
                type="radio"
                name={name}
                value={option.intent}
                checked={checked}
                onChange={() => {
                  setSelected(option.intent);
                  setShowError(false);
                }}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-full",
                  checked ? "bg-action text-white" : "bg-canvas text-fg",
                )}
              >
                <Icon name={option.icon} size={20} strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-display text-base leading-snug font-bold text-fg">{copy.title}</span>
                <span className="text-sm text-fg-muted">{copy.body}</span>
              </span>
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
                  checked ? "border-action" : "border-control-line-strong",
                )}
              >
                {checked ? <span className="size-2.5 rounded-full bg-action" /> : null}
              </span>
            </label>
          );
        })}
        {showError ? (
          <p id={errorId} role="alert" className="flex items-center gap-2 font-medium text-status-alert">
            <Icon name="alert" size={18} strokeWidth={2} className="shrink-0" />
            {intentChoice.required}
          </p>
        ) : null}
      </fieldset>
      <Button type="submit" variant="primary" size="48" block>
        {submitLabel}
      </Button>
    </form>
  );
}
