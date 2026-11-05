import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { partnerCheckoutContent, type LandingPlan } from "@/lib/content/partner-checkout";
import { cn } from "@/lib/utils";

const { planCard } = partnerCheckoutContent;

type PlanSummaryCardProps = {
  readonly plan: LandingPlan;
  /** `false` en el resultado: ahí ya no se cambia de plan. */
  readonly showChange?: boolean;
  /** Nota al pie. Por defecto, que el precio final se ve antes de pagar. */
  readonly note?: string | null;
  readonly className?: string;
};

/**
 * El plan elegido, siempre a la vista durante la contratación y su resultado
 * (al costado en desktop, arriba en mobile: ver `FlowLayout`). Sin estado:
 * lo renderiza el server en `/contratar` y la isla en `/resultado`.
 *
 * Nombre, bajada y beneficios salen de la página de planes (FR-013), así la
 * persona reconoce lo que eligió. El precio NO va acá: el que vale es el del
 * backend y aparece en el paso "Plan" del formulario.
 */
export function PlanSummaryCard({ plan, showChange = true, note = planCard.note, className }: PlanSummaryCardProps) {
  const titleId = `plan-${plan.id}-resumen`;

  return (
    <aside
      aria-labelledby={titleId}
      className={cn("flex flex-col gap-4 rounded-card border border-line bg-surface p-6", className)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h2 id={titleId} className="font-display text-xl font-bold text-ink">
            {planCard.title(plan.name)}
          </h2>
          <p className="text-[0.9375rem] leading-relaxed text-ink/70">{plan.description}</p>
        </div>
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
        >
          <Icon name="receipt" size={20} strokeWidth={1.8} />
        </span>
      </div>

      <ul aria-label={planCard.featuresLabel(plan.name)} className="flex flex-col gap-2.5 border-t border-line pt-4">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5">
            <Icon name="check" size={16} strokeWidth={2} className="mt-1 shrink-0 text-brand-hover" />
            <span className="text-sm leading-relaxed text-ink/80">{feature}</span>
          </li>
        ))}
      </ul>

      {note ? <p className="text-label leading-relaxed text-ink/65">{note}</p> : null}

      {showChange ? (
        <Link
          href={planCard.change.href}
          className="-my-2 inline-flex min-h-11 items-center gap-1.5 self-start text-sm font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          <Icon name="arrow-left" size={16} strokeWidth={2} />
          {planCard.change.label}
        </Link>
      ) : null}
    </aside>
  );
}
