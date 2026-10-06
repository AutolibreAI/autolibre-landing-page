import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

/**
 * Franja de verticales: los nombres de lo que resolvemos, grandes, en
 * mayúsculas y en gris "fantasma", corriendo despacio entre `QuotesSection`
 * (ink) y `ProblemSection` (muted). Es textura tipográfica informativa: sin
 * fondo propio (comparte el `muted` de `ProblemSection`, así se lee como su
 * arranque y no como un bloque aparte), sin links ni nada que enfocar.
 *
 * Server Component, CSS puro: el track lleva la lista dos veces (la segunda
 * `aria-hidden`) y `animate-marquee` lo corre de 0 a -50%, que es
 * exactamente una copia, así la vuelta empalma sin salto. Cada item termina
 * con su separador, así el paso entre copias es igual al paso entre items.
 *
 * Full-bleed (`container={false}`) a propósito: el texto entra y sale por los
 * bordes de la ventana, no hay contenido que alinear con el header.
 *
 * Excepción aprobada de `prefers-reduced-motion` (`motion-exempt`, ver
 * `globals.css`): sigue corriendo con esa preferencia.
 */
export function VerticalsBandSection() {
  const { title, items, comingSoonLabel } = homeContent.verticals;

  return (
    <Section
      tone="muted"
      container={false}
      aria-labelledby="verticals-title"
      // Aire arriba (viene de la banda ink) y poco abajo: el `pt` de
      // `ProblemSection` ya separa, y así la franja queda pegada a su sección.
      className="pt-14 pb-2 md:pt-20 md:pb-4"
    >
      <h2 id="verticals-title" className="sr-only">
        {title}
      </h2>

      <div className="overflow-hidden mask-x-from-92%">
        <div className="motion-exempt flex w-max animate-marquee">
          {[false, true].map((duplicate) => (
            <ul
              key={duplicate ? "copy" : "list"}
              aria-hidden={duplicate || undefined}
              className="flex"
            >
              {items.map((item) => (
                <li
                  key={item.label}
                  // `text-ghost` da 3.02:1 sobre `surface-muted`: alcanza
                  // SOLO porque es texto grande (≥ 30px).
                  className="flex items-center gap-6 pr-6 font-display text-3xl leading-none font-semibold whitespace-nowrap text-ghost uppercase md:gap-10 md:pr-10 md:text-5xl lg:text-6xl"
                >
                  <span className="flex items-center gap-3 md:gap-4">
                    {item.label}
                    {item.comingSoon ? (
                      <>
                        <span className="sr-only">:</span>
                        {/* Texto chico: `ink/70` (5.3:1) y no `ghost`, que
                            no llega al 4.5:1. El borde es solo adorno. */}
                        <span className="rounded-full border border-ghost/60 px-2.5 py-1 font-sans text-label font-semibold tracking-wide text-ink/70 md:text-sm">
                          {comingSoonLabel}
                        </span>
                      </>
                    ) : null}
                  </span>
                  {/* Separador decorativo. */}
                  <span
                    aria-hidden="true"
                    className="size-1.5 shrink-0 rounded-full bg-ghost/60 md:size-2"
                  />
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </Section>
  );
}
