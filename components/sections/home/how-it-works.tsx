import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function HowItWorksSection() {
  const { title, subtitle, steps } = homeContent.howItWorks;

  return (
    <Section
      id="como-funciona"
      tone="muted"
      aria-labelledby="how-title"
      container="content"
    >
      <div className="reveal mx-auto mb-16 max-w-[760px] text-center">
        <h2
          id="how-title"
          className="font-display text-[2.125rem] font-bold text-ink md:text-[2.5rem]"
        >
          {title}
        </h2>
        <p className="mt-5 text-[1.0625rem] leading-relaxed text-ink/72 md:text-lg">
          {subtitle}
        </p>
      </div>

      {/* El gap de 2px sobre fondo oscuro dibuja la línea divisoria. */}
      {/* Entrada escalonada por scroll, CSS puro (ver `reveal` en
          globals.css). Anima el CONTENIDO de cada paso y no el `<li>`: el
          `<li>` transparente dejaría ver el fondo ink del divisor.
          `overflow-clip` y NO `overflow-hidden`: `hidden` vuelve a la lista
          un contenedor de scroll y `view()` se ata a ella (siempre al
          100%) en vez de al scroll de la página. */}
      <ol className="reveal-stagger mx-auto grid max-w-[1040px] gap-0.5 overflow-clip rounded-panel bg-ink md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.id} className="bg-surface px-8 py-12 md:px-10">
            <div className="reveal">
              {/* El glifo deja ~10px de aire dentro de su caja de 80px, así
                que este margen da un hueco óptico de ~26px. Ojo: no volver
                al `-mb-3` del mockup, que superpone el número al título. */}
              <p
                aria-hidden="true"
                className="mb-4 font-display text-[5rem] leading-none font-bold text-surface-muted"
              >
                {step.number}
              </p>
              <h3 className="mb-3.5 font-display text-2xl font-bold text-ink">
                {step.title}
              </h3>
              <p className="text-base leading-relaxed text-ink/70">
                {step.description}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
