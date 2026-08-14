import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { providersContent } from "@/lib/content/providers";

export function ProvidersHeroSection() {
  const { titleLines, subtitle } = providersContent.hero;

  return (
    <Section tone="muted" spacing="md">
      <Container size="narrow" className="text-center">
        <h1 className="font-display text-[1.75rem] leading-tight font-bold text-ink md:text-[2.25rem]">
          {titleLines[0]}
          <br className="hidden md:block" />{" "}
          {titleLines[1]}
        </h1>
        <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink/72 md:text-lg">
          {subtitle}
        </p>
      </Container>
    </Section>
  );
}
