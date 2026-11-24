import { eyebrowOnDark } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Misión y visión: dos tarjetas de color pleno, una al lado de la otra desde
 * `md` (referencia Coda). El `h2` de la sección no se ve (el lienzo no lo
 * muestra) pero está en el outline; cada tarjeta lleva su `h3` con aspecto de
 * eyebrow (el nivel sale del outline, no del tamaño).
 *
 * Contraste: misión sobre `action` (texto blanco 14.88:1, rótulo `brand-200`
 * 9.81:1); visión sobre `brand-50` (`fg` 15.76:1, rótulo `brand-hover`
 * 5.10:1).
 */
export function AboutPurpose() {
  const { title, mission, vision } = aboutContent.purpose;
  const statement = "font-display text-xl leading-snug font-semibold md:text-2xl";

  return (
    <Section
      spacing="sm"
      aria-labelledby="mision-vision"
      className="bg-card pt-0 pb-10 md:pt-0 md:pb-18"
    >
      <h2 id="mision-vision" className="sr-only">
        {title}
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <article
          aria-labelledby="mision"
          className="flex flex-col gap-5 rounded-3xl bg-action p-6 text-white md:p-11"
        >
          <h3 id="mision" className={eyebrowOnDark}>
            {mission.label}
          </h3>
          <p className={statement}>{mission.statement}</p>
        </article>
        <article
          aria-labelledby="vision"
          className="flex flex-col gap-5 rounded-3xl bg-brand-50 p-6 text-fg md:p-11"
        >
          <h3
            id="vision"
            className="text-label font-semibold tracking-wider text-brand-hover uppercase"
          >
            {vision.label}
          </h3>
          <p className={statement}>{vision.statement}</p>
        </article>
      </div>
    </Section>
  );
}
