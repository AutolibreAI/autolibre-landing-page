import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { providersContent } from "@/lib/content/providers";

export function ProvidersReasonsSection() {
  return (
    <Section tone="surface" spacing="md" aria-labelledby="providers-reasons">
      <Container>
        <h2 id="providers-reasons" className="sr-only">
          Por qué sumarte como proveedor
        </h2>
        <ul className="mx-auto grid max-w-[1100px] gap-6 md:grid-cols-3">
          {providersContent.reasons.map((reason) => (
            <Card key={reason.id} as="li" className="p-8">
              <h3 className="mb-3 font-display text-lg font-bold text-ink">
                {reason.title}
              </h3>
              <p className="text-[0.9375rem] leading-relaxed text-ink/70">
                {reason.description}
              </p>
            </Card>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
