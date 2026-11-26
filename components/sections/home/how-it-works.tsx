import { NumberedSteps } from "@/components/marketing/numbered-steps";
import { eyebrow, sectionTitleLg } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

/**
 * Cómo funciona: tres pasos numerados. El lienzo suma debajo un ejemplo de
 * propuestas con marcadores ("[Proveedor A]", "$ [precio]") sin dato real:
 * no se muestra (ver INFORME, fase 4a).
 */
export function HowItWorksSection() {
  const { eyebrow: label, title, steps } = homeContent.howItWorks;

  return (
    <Section id="como-funciona" tone="card" spacing="md" aria-labelledby="como-funciona-title">
      <p className={eyebrow}>{label}</p>
      <h2 id="como-funciona-title" className={`mt-2 text-fg ${sectionTitleLg}`}>
        {title}
      </h2>
      <NumberedSteps steps={steps} className="mt-9" />
    </Section>
  );
}
