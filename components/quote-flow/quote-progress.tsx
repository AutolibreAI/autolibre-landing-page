import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";

const flowCopy = presupuestoContent.flow;

type QuoteProgressProps = {
  readonly step: number;
  readonly total: number;
  readonly layout: "modal" | "page";
};

/**
 * Progreso segmentado: un tramo por paso en vez de una barra continua. Un
 * porcentaje no dice cuánto falta — cuatro tramos sí, y de paso el label
 * adelanta qué viene después, que es la pregunta real de quien completa un
 * formulario en varios pasos.
 */
export function QuoteProgress({ step, total, layout }: QuoteProgressProps) {
  const nextName = flowCopy.stepNames[step];

  return (
    <div className={cn(layout === "page" ? "mb-7" : "mb-6")}>
      <div
        aria-live="polite"
        className="flex items-center justify-between gap-3 text-xs font-medium text-ink/65"
      >
        <span>
          {flowCopy.stepLabel
            .replace("{step}", String(step))
            .replace("{total}", String(total))}
        </span>
        {nextName ? (
          <span className="truncate">
            {flowCopy.nextLabel.replace("{next}", nextName)}
          </span>
        ) : null}
      </div>

      <div className="mt-2 flex gap-1.5">
        {Array.from({ length: total }, (_, index) => (
          <span
            key={index}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              index < step ? "bg-brand" : "bg-surface-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
