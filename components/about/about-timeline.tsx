import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { aboutContent, type AboutMilestone, type MilestoneStatus } from "@/lib/content/about";
import { cn } from "@/lib/utils";

/**
 * Marcador de cada hito sobre la línea (el de `current` es el pin, aparte).
 * Cumplido: punto verde de 12px con un aro del color del fondo que lo
 * "recorta" de la ruta, como una parada. Lo que viene: hueco, solo el
 * contorno.
 */
const markers: Record<Exclude<MilestoneStatus, "current">, string> = {
  done: "size-3 bg-brand ring-4 ring-surface",
  next: "size-3 border-2 border-ink/40 bg-surface",
};

/**
 * Tramo de la ruta. Recorrido: 2px en `brand/60`, el mismo verde de la ruta
 * del hero de la home. Por recorrer: el hairline neutro de siempre.
 *
 * Liso y no punteado como en la home: cada tramo es un nodo propio por
 * renglón, y un punteado arrancaría su patrón en cada uno y dejaría puntos
 * pegados en las uniones. El punteado queda para la ilustración del hero.
 */
function segmentClass(travelled: boolean) {
  return travelled ? "w-0.5 bg-brand/60" : "w-px bg-line";
}

/** Un tramo está recorrido si el hito al que LLEGA ya se alcanzó. */
function isReached(milestone: AboutMilestone | undefined) {
  return milestone !== undefined && milestone.status !== "next";
}

/**
 * Línea de tiempo en una `<ol>` vertical, todo en el DOM (sin carrusel ni
 * tabs). La línea es la ruta de la home (decisión 2026-10-02): verde desde el
 * primer hito hasta el de hoy, que se marca con el pin donde termina la
 * ruta; si hay hitos `next`, su tramo sigue neutro. Cada renglón dibuja dos
 * tramos, del borde de arriba al marcador y del marcador al de abajo, así
 * el color cambia justo en el hito. Desde `sm`, tres columnas: fecha · marcador · texto. En mobile el
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
        {milestones.map((milestone, index) => {
          const isFuture = milestone.status === "next";
          const dateClass =
            "font-display text-lg font-bold text-ink tabular-nums sm:order-1 sm:w-40 sm:shrink-0";

          return (
            <li
              key={milestone.id}
              className="group relative flex gap-5 border-b border-line py-8 last:border-b-0 sm:gap-8"
            >
              {/* Ruta + marcador: decorativos, el estado va en texto (sr-only
                  o visible). El marcador se ancla a 44px (`top-11`) del
                  borde del renglón: con el `-my-8`, a la altura de la fecha. */}
              <div aria-hidden="true" className="relative -my-8 w-4 shrink-0 sm:order-2">
                <span
                  className={cn(
                    "absolute top-0 left-1/2 h-11 -translate-x-1/2 group-first:hidden",
                    segmentClass(isReached(milestone)),
                  )}
                />
                <span
                  className={cn(
                    "absolute top-11 bottom-0 left-1/2 -translate-x-1/2 group-last:hidden",
                    segmentClass(isReached(milestones[index + 1])),
                  )}
                />
                {milestone.status === "current" ? (
                  // El pin del final de la ruta: su punta (12, 21 de 24)
                  // cae en el ancla, donde termina el tramo verde.
                  <Icon
                    name="pin"
                    size={28}
                    strokeWidth={2}
                    className="absolute top-11 left-1/2 -translate-x-1/2 -translate-y-7/8 text-brand"
                  />
                ) : (
                  <span
                    className={cn(
                      "absolute top-11 left-1/2 -translate-1/2 rounded-full",
                      markers[milestone.status],
                    )}
                  />
                )}
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
