import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function HowItWorksSection() {
  const { title, subtitle, steps } = homeContent.howItWorks;

  return (
    <Section id="como-funciona" tone="muted" aria-labelledby="how-title">
      <Container>
        <div className="mx-auto mb-16 max-w-[760px] text-center">
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
        <ol className="mx-auto grid max-w-[1040px] gap-0.5 overflow-hidden rounded-panel bg-ink md:grid-cols-2">
          {steps.map((step) => (
            <li key={step.id} className="bg-surface px-8 py-12 md:px-10">
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
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
