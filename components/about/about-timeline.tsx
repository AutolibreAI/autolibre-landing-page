import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { aboutContent, type MilestoneStatus } from "@/lib/content/about";
import { cn } from "@/lib/utils";

/**
 * Marcador de cada hito sobre la línea vertical. Cumplido: punto en tinta.
 * Hoy: verde lleno con aro. Lo que viene: hueco, solo el contorno.
 */
const markers: Record<MilestoneStatus, string> = {
  done: "size-2.5 bg-ink",
  current: "size-3.5 bg-brand ring-4 ring-brand/20",
  next: "size-3 border-2 border-ink/40 bg-surface",
};

/**
 * Línea de tiempo en una `<ol>` vertical, todo en el DOM (sin carrusel ni
 * tabs). Desde `sm`, tres columnas: fecha · marcador · texto. En mobile el
 * bloque de texto (`sm:contents`) junta fecha, título y descripción en una
 * columna al lado del marcador; desde `sm` ese mismo bloque "desaparece" y
 * sus hijos se ordenan en la fila con `order`, sin duplicar la fecha.
 */
export function AboutTimeline() {
  const { title, intro, milestones, statusLabel } = aboutContent.timeline;

  return (
    <Section spacing="md" aria-labelledby="como-llegamos">
      {/* Regla gruesa en tinta bajo el encabezado, como "Últimas notas" del
          blog. La bajada se acota desde afuera (`[&>p]`): `SectionHeading`
          es compartido y no se toca para una página. */}
      <SectionHeading
        as="h2"
        size="md"
        id="como-llegamos"
        title={title}
        subtitle={intro}
        className="border-b border-ink pb-6 [&>p]:max-w-150"
      />

      <ol className="reveal-group">
        {milestones.map((milestone) => {
          const isFuture = milestone.status === "next";
          const dateClass =
            "font-display text-lg font-bold text-ink tabular-nums sm:order-1 sm:w-40 sm:shrink-0";

          return (
            <li
              key={milestone.id}
              className="group relative flex gap-5 border-b border-line py-8 last:border-b-0 sm:gap-8"
            >
              {/* Línea + marcador: decorativos, el estado va en texto (sr-only o visible). */}
              <div aria-hidden="true" className="relative -my-8 flex w-4 shrink-0 justify-center sm:order-2">
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-line group-first:top-10 group-last:bottom-auto group-last:h-10" />
                <span className={cn("relative mt-10 rounded-full", markers[milestone.status])} />
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:contents">
                {milestone.date ? (
                  <time dateTime={milestone.date} className={dateClass}>
                    {milestone.dateLabel}
                  </time>
                ) : (
                  <p className={cn(dateClass, "text-ink/60")}>{milestone.dateLabel}</p>
                )}

                <div className="sm:order-3 sm:min-w-0 sm:flex-1">
                  {milestone.status === "done" ? (
                    <p className="sr-only">{statusLabel.done}</p>
                  ) : (
                    <p className="mb-1 text-label font-semibold text-brand-hover">
                      {statusLabel[milestone.status]}
                    </p>
                  )}
                  <h3 className={cn("text-xl leading-snug", isFuture ? "text-ink/70" : "text-ink")}>
                    {milestone.title}
                  </h3>
                  <p className="mt-2 max-w-150 text-base leading-relaxed text-ink/70">
                    {milestone.description}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
