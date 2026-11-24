import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Apertura de "Sobre nosotros" (lienzo `Nosotros`, referencia Büro): fecha y
 * ciudad en los extremos de una línea, el `h1` enorme, la definición
 * canónica y una ficha de datos con filetes. Tipográfico, sin imagen: el
 * `h1` es la LCP y no hay nada que precargar.
 *
 * La ficha es un `<dl>`; cada par `<dt>`/`<dd>` va en un `<div>` (válido
 * dentro de `<dl>`) para darle su renglón.
 */
export function AboutHero() {
  const { topline, title, lead, facts } = aboutContent.hero;

  return (
    <Section
      spacing="sm"
      aria-labelledby="sobre-nosotros-titulo"
      className="bg-card pt-6 pb-10 md:pt-9 md:pb-18"
    >
      <p className="flex items-center gap-5 text-control font-medium text-fg-muted">
        <time dateTime={topline.dateTime}>{topline.date}</time>
        <span aria-hidden="true" className="h-px flex-1 bg-fg" />
        <span>{topline.place}</span>
      </p>

      <h1
        id="sobre-nosotros-titulo"
        className="mt-6 max-w-240 font-display text-display-sm leading-none font-bold tracking-tighter text-balance text-fg md:mt-14 md:text-7xl xl:text-8xl"
      >
        {title}
      </h1>

      <div className="mt-7 flex flex-wrap items-start gap-x-18 gap-y-8 md:mt-14">
        <p className="min-w-0 flex-[1.2_1_26rem] text-lead-lg leading-snug text-fg md:text-2xl">
          {lead}
        </p>
        <dl className="min-w-0 flex-[1_1_22rem] border-t border-fg">
          {facts.map((fact) => (
            <div
              key={fact.id}
              className="flex items-baseline justify-between gap-6 border-b border-control-line py-3.5"
            >
              <dt className="text-fg-muted">{fact.label}</dt>
              <dd className="text-right font-display text-lg font-semibold text-fg tabular-nums">
                {fact.dateTime ? <time dateTime={fact.dateTime}>{fact.value}</time> : fact.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  );
}
