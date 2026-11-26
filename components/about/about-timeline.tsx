import { aboutSectionTitle } from "@/components/about/styles";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";
import { cn } from "@/lib/utils";

/**
 * "Cómo llegamos hasta acá" (referencia Hims, "Company milestones"): título
 * fijo a la izquierda desde `lg` y, a la derecha, una `<ol>` sobre una línea
 * fina con fecha, título y texto. Todo en el DOM, sin carrusel ni tabs.
 *
 * Cada hito es un `h3` (cuelga del `h2`). El hito de hoy lleva el marcador
 * relleno y la etiqueta visible "Hoy"; los demás, el aro. Los marcadores son
 * decorativos. La línea es `control-line-strong` (4.79:1 sobre `card`).
 */
export function AboutTimeline() {
  const { title, intro, milestones, statusLabel } = aboutContent.timeline;

  return (
    <Section
      spacing="md"
      aria-labelledby="como-llegamos"
      className="bg-card pt-12 pb-6 md:pt-22 md:pb-10"
    >
      <div className="flex flex-wrap items-start gap-x-18 gap-y-8">
        <div className="min-w-0 flex-[1_1_20rem] lg:sticky lg:top-24">
          <h2 id="como-llegamos" className={aboutSectionTitle}>
            {title}
          </h2>
          <p className="mt-3.5 max-w-90 text-lead text-fg-muted">{intro}</p>
        </div>

        <ol className="mt-1.5 ml-1.5 min-w-0 flex-[1.5_1_28rem] border-l border-control-line-strong">
          {milestones.map((milestone) => {
            const isCurrent = milestone.status === "current";
            return (
              <li key={milestone.id} className="relative pb-7.5 pl-8">
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute top-1.5 -left-1.5 size-3 rounded-full",
                    isCurrent ? "bg-action" : "border-2 border-action bg-card",
                  )}
                />
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm font-semibold text-fg-muted">
                  {milestone.date ? (
                    <time dateTime={milestone.date}>{milestone.dateLabel}</time>
                  ) : (
                    milestone.dateLabel
                  )}
                  {isCurrent ? (
                    <span className="rounded-full bg-action px-2.5 py-0.5 text-xs font-semibold text-white">
                      {statusLabel.current}
                    </span>
                  ) : null}
                </p>
                <h3 className="mt-1 text-xl leading-snug text-fg">{milestone.title}</h3>
                <p className="mt-1 max-w-140 text-base text-fg-muted">{milestone.description}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </Section>
  );
}
