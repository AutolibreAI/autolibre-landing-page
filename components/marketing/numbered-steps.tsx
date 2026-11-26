import { cn } from "@/lib/utils";

type Step = { readonly number: string; readonly title: string; readonly body: string };

/**
 * Tres pasos numerados con filete arriba, sin íconos (referencia del lienzo:
 * Beside y Escape Cafe). El número es decorativo (`aria-hidden`): el orden
 * ya lo da la `<ol>`. Cada paso es un `h3` (cuelga del `h2` de la sección).
 */
export function NumberedSteps({
  steps,
  className,
}: {
  readonly steps: readonly Step[];
  readonly className?: string;
}) {
  return (
    <ol className={cn("grid gap-x-10 gap-y-7 md:grid-cols-3", className)}>
      {steps.map((step) => (
        <li key={step.number} className="flex flex-col gap-1.5 border-t-2 border-action pt-4">
          <span aria-hidden="true" className="font-display text-sm font-semibold text-fg-muted">
            {step.number}
          </span>
          <h3 className="font-display text-xl font-semibold text-fg md:text-2xl">{step.title}</h3>
          <p className="text-base text-fg-muted">{step.body}</p>
        </li>
      ))}
    </ol>
  );
}
