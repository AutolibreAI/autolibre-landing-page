"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";
import type { LookupState } from "./use-quote-flow";

const copy = presupuestoContent.modal.steps.plate;

type PlateFieldProps = {
  readonly layout: "modal" | "page";
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly lookup: LookupState;
  readonly canSearchPlate: boolean;
  readonly onConfirm: () => void;
  readonly onReject: () => void;
  readonly onContinueAnyway: () => void;
};

/**
 * La patente no es "un input más": es el único dato que le pedimos a la
 * persona antes de darle algo a cambio, así que se dibuja como el objeto
 * principal de la pantalla — centrado, en display, con el tracking de una
 * chapa. `tracking` agrega aire DESPUÉS del último glifo, así que el texto
 * queda corrido a la izquierda; `indent` del mismo tamaño lo devuelve al
 * centro óptico.
 */
export function PlateField({
  layout,
  value,
  onChange,
  lookup,
  canSearchPlate,
  onConfirm,
  onReject,
  onContinueAnyway,
}: PlateFieldProps) {
  const isPage = layout === "page";

  const statusRegion = (
    <>
      {lookup.kind === "found" ? (
        <LookupFoundCard
          layout={layout}
          brand={lookup.brand}
          model={lookup.model}
          year={lookup.year}
          onConfirm={onConfirm}
          onReject={onReject}
        />
      ) : null}

      {lookup.kind === "not_found" || lookup.kind === "unavailable" ? (
        <div
          className={cn(
            "mt-4 rounded-card border border-line bg-surface-subtle",
            isPage ? "p-5" : "p-4",
          )}
        >
          <p className="text-sm text-ink/70">
            {lookup.kind === "not_found" ? copy.notFound : copy.unavailable}
          </p>
          <Button type="button" size="sm" className="mt-3" onClick={onContinueAnyway}>
            {copy.continueAnyway}
          </Button>
        </div>
      ) : null}
    </>
  );

  return (
    <>
      <Field
        label="Patente"
        htmlFor="quote-plate"
        required
        hint={value && !canSearchPlate ? copy.invalidHint : copy.hint}
      >
        <input
          id="quote-plate"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={copy.placeholder}
          maxLength={7}
          autoComplete="off"
          inputMode="text"
          autoCapitalize="characters"
          autoFocus={layout === "modal"}
          className={cn(
            "w-full rounded-field border-2 border-line bg-surface px-4 text-center font-display font-bold text-ink uppercase tabular-nums caret-brand outline-none transition-colors",
            "placeholder:font-medium placeholder:tracking-[0.2em] placeholder:text-ink/25 focus-visible:border-brand",
            isPage
              ? "py-5 text-[1.75rem] tracking-[0.3em] indent-[0.3em] sm:text-[2rem]"
              : "py-4 text-[1.375rem] tracking-[0.25em] indent-[0.25em]",
          )}
        />
      </Field>

      {/* En la página no hay `role="dialog"` que arrastre el foco: el cambio
          de "Buscando…" a "Encontramos tu auto" tiene que anunciarse solo. */}
      {isPage ? (
        <div aria-live="polite">{statusRegion}</div>
      ) : (
        statusRegion
      )}
    </>
  );
}

/**
 * El único momento de motion autorado del flujo. La tarjeta no aparece de
 * golpe: se revela. Sin librería (el repo no tiene ninguna) y sin keyframes —
 * una bandera de montaje + un rAF para que el browser pinte el estado inicial
 * antes de que las clases cambien. El bloque global de `prefers-reduced-motion`
 * en `globals.css` ya lo neutraliza para quien lo pidió.
 */
function LookupFoundCard({
  layout,
  brand,
  model,
  year,
  onConfirm,
  onReject,
}: {
  readonly layout: "modal" | "page";
  readonly brand: string;
  readonly model: string;
  readonly year: number | null;
  readonly onConfirm: () => void;
  readonly onReject: () => void;
}) {
  const isPage = layout === "page";
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setRevealed(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      className={cn(
        "mt-4 rounded-card transition-all duration-500 ease-out",
        isPage
          ? "border border-brand/25 bg-brand/5 p-5"
          : "border border-line bg-surface-subtle p-4",
        revealed ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
      )}
    >
      {isPage ? (
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand">
            <Icon name="car" size={20} />
          </span>
          <div>
            <p className="text-xs text-ink/65">{copy.foundLabel}</p>
            <p className="font-display text-lg font-bold text-ink">
              {brand} {model}
              {year ? ` · ${year}` : ""}
            </p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-ink/65">{copy.foundLabel}</p>
          <p className="font-display text-base font-bold text-ink">
            {brand} {model}
            {year ? ` · ${year}` : ""}
          </p>
        </>
      )}

      <div className={cn("flex flex-wrap gap-2", isPage ? "mt-4" : "mt-3")}>
        <Button type="button" size="sm" onClick={onConfirm}>
          {copy.foundConfirm}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onReject}>
          {copy.foundReject}
        </Button>
      </div>
    </div>
  );
}
