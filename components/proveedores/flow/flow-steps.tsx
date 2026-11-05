import { Icon } from "@/components/ui/icon";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { cn } from "@/lib/utils";

export type FlowStep = {
  readonly id: string;
  readonly label: string;
  /** Solo en la variante vertical: qué pasa en ese paso. */
  readonly description?: string;
};

type StepState = "done" | "current" | "upcoming";

type FlowStepsProps = {
  /** Nombre del indicador para lectores de pantalla ("Pasos de la contratación"). */
  readonly label: string;
  readonly steps: readonly FlowStep[];
  /**
   * Índice del paso actual. Los anteriores quedan completados y los
   * siguientes, pendientes. Con `steps.length` todos quedan completados.
   */
  readonly current: number;
  /**
   * `horizontal`: la tira compacta arriba de un flujo (contratación).
   * `vertical`: una línea de tiempo con la explicación de cada paso (la
   * solicitud de alta en revisión).
   */
  readonly orientation?: "horizontal" | "vertical";
  /** Rótulo visible junto al paso actual (solo vertical), p. ej. "Ahora". */
  readonly currentBadge?: string;
  readonly className?: string;
};

const { stepStatus } = partnerAccountContent;

function stateOf(index: number, current: number): StepState {
  if (index < current) return "done";
  if (index === current) return "current";
  return "upcoming";
}

/**
 * Indicador de progreso de los flujos de talleres. Sin estado ni efectos:
 * sirve igual en un Server Component y adentro de una isla client (que le
 * pasa el paso según lo que va pasando).
 *
 * `<ol>` con `aria-current="step"` en el paso actual, y el estado de cada
 * paso también en texto (`sr-only`): el color nunca es la única señal.
 * Completado: disco verde con el check. Actual: aro verde con el número.
 * Pendiente: aro neutro.
 */
export function FlowSteps({
  label,
  steps,
  current,
  orientation = "horizontal",
  currentBadge,
  className,
}: FlowStepsProps) {
  if (orientation === "vertical") {
    return (
      <ol aria-label={label} className={cn("flex flex-col", className)}>
        {steps.map((step, index) => {
          const state = stateOf(index, current);
          const last = index === steps.length - 1;
          return (
            <li
              key={step.id}
              aria-current={state === "current" ? "step" : undefined}
              className="flex gap-4"
            >
              <div className="flex flex-col items-center">
                <StepMarker state={state} index={index} />
                {last ? null : (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "my-1 w-0.5 flex-1 rounded-full",
                      state === "done" ? "bg-brand-hover" : "bg-ink/12",
                    )}
                  />
                )}
              </div>
              <div className={cn("flex flex-col gap-1 pt-1", last ? "pb-0" : "pb-7")}>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span
                    className={cn(
                      "font-display text-base font-bold",
                      state === "upcoming" ? "text-ink/60" : "text-ink",
                    )}
                  >
                    {step.label}
                  </span>
                  <span className="sr-only">({stepStatus[state]})</span>
                  {state === "current" && currentBadge ? (
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-brand/10 px-2.5 py-0.5 text-label font-semibold text-brand-hover"
                    >
                      {currentBadge}
                    </span>
                  ) : null}
                </p>
                {step.description ? (
                  <p
                    className={cn(
                      "text-[0.9375rem] leading-relaxed",
                      state === "upcoming" ? "text-ink/60" : "text-ink/72",
                    )}
                  >
                    {step.description}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol aria-label={label} className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        const last = index === steps.length - 1;
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("flex min-w-0 items-center gap-2 sm:gap-3", !last && "flex-1")}
          >
            <StepMarker state={state} index={index} compact />
            <span
              className={cn(
                "truncate text-sm",
                state === "current" ? "font-semibold text-ink" : "",
                state === "done" ? "font-medium text-ink/80" : "",
                state === "upcoming" ? "text-ink/60" : "",
              )}
            >
              {step.label}
              <span className="sr-only"> ({stepStatus[state]})</span>
            </span>
            {last ? null : (
              <span
                aria-hidden="true"
                className={cn(
                  "h-0.5 min-w-3 flex-1 rounded-full",
                  state === "done" ? "bg-brand-hover" : "bg-ink/12",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepMarker({
  state,
  index,
  compact = false,
}: {
  readonly state: StepState;
  readonly index: number;
  readonly compact?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display font-bold tabular-nums",
        compact ? "size-7 text-label" : "size-9 text-sm",
        state === "done" && "bg-brand-hover text-white",
        state === "current" && "border-2 border-brand-hover bg-surface text-brand-hover",
        state === "upcoming" && "border border-ink/20 bg-surface text-ink/60",
      )}
    >
      {state === "done" ? <Icon name="check" size={compact ? 15 : 18} strokeWidth={2.4} /> : index + 1}
    </span>
  );
}
