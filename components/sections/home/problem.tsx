import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function ProblemSection() {
  const { title, paragraphs } = homeContent.problem;

  return (
    <Section id="problema" tone="muted">
      <Container size="narrow" className="text-center">
        <h2 className="font-display text-[2rem] font-bold text-ink md:text-[2.375rem]">
          {title}
        </h2>
        <div className="mt-7 flex flex-col gap-3.5">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="text-[1.0625rem] leading-[1.7] text-ink/75 md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>
      </Container>
    </Section>
  );
}
