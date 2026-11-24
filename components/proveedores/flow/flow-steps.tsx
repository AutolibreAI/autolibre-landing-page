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
   * `horizontal`: la tira compacta (encabezado de los flujos, arriba del
   * login del alta). `vertical`: una línea de tiempo con la explicación de
   * cada paso (columna del alta, solicitud en revisión).
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
 * Indicador de progreso de los flujos de negocios (sistema AutoLibre AI).
 * Sin estado ni efectos: sirve igual en un Server Component y adentro de una
 * isla client (que le pasa el paso según lo que va pasando).
 *
 * `<ol>` con `aria-current="step"` en el paso actual, y el estado de cada
 * paso también en texto (`sr-only`): el color nunca es la única señal.
 * Completado: disco `action` con el check. Actual: aro `action` (con el
 * número en la tira, relleno en la línea de tiempo). Pendiente: aro
 * `control-line-strong` (4.79:1).
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
            <li key={step.id} aria-current={state === "current" ? "step" : undefined} className="flex gap-3.5">
              <div className="flex flex-col items-center">
                <span
                  aria-hidden="true"
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    state === "done" && "bg-action text-white",
                    state === "current" && "border-7 border-action bg-card",
                    state === "upcoming" && "border border-control-line-strong bg-card",
                  )}
                >
                  {state === "done" ? <Icon name="check" size={13} strokeWidth={3} /> : null}
                </span>
                {last ? null : (
                  <span
                    aria-hidden="true"
                    className={cn("my-1 w-px flex-1", state === "done" ? "bg-action" : "bg-control-line-strong")}
                  />
                )}
              </div>
              <div className={cn("flex flex-col gap-0.5", last ? "pb-0" : "pb-6")}>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                  <span className={cn("text-control", state === "current" ? "font-semibold text-fg" : "font-medium text-fg")}>
                    {step.label}
                  </span>
                  <span className="sr-only">({stepStatus[state]})</span>
                  {state === "current" && currentBadge ? (
                    <span
                      aria-hidden="true"
                      className="rounded-full bg-canvas px-2.5 py-0.5 text-label font-semibold text-fg-muted"
                    >
                      {currentBadge}
                    </span>
                  ) : null}
                </p>
                {step.description ? <p className="text-label text-fg-muted">{step.description}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol aria-label={label} className={cn("flex items-center gap-2.5", className)}>
      {steps.map((step, index) => {
        const state = stateOf(index, current);
        const last = index === steps.length - 1;
        return (
          <li
            key={step.id}
            aria-current={state === "current" ? "step" : undefined}
            className="flex min-w-0 items-center gap-2.5"
          >
            <span
              aria-hidden="true"
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                state === "done" && "bg-action text-white",
                state === "current" && "border-2 border-action text-fg",
                state === "upcoming" && "border border-control-line-strong text-fg-muted",
              )}
            >
              {state === "done" ? <Icon name="check" size={13} strokeWidth={3} /> : index + 1}
            </span>
            <span
              className={cn(
                "truncate text-sm",
                state === "upcoming" ? "font-medium text-fg-muted" : "font-semibold text-fg",
              )}
            >
              {step.label}
              <span className="sr-only"> ({stepStatus[state]})</span>
            </span>
            {last ? null : <span aria-hidden="true" className="h-px w-8 shrink-0 bg-control-line-strong" />}
          </li>
        );
      })}
    </ol>
  );
}
