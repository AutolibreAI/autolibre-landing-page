import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function FeaturesSection() {
  const { title, items, highlight } = homeContent.features;

  return (
    <Section tone="surface" aria-labelledby="features-title">
      <Container>
        <h2
          id="features-title"
          className="max-w-[640px] font-display text-[2rem] font-bold text-ink md:text-[2.375rem]"
        >
          {title}
        </h2>

        <ul className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map((item) => (
            <Card key={item.id} as="li" className="px-5 py-7">
              <Icon name={item.icon} className="mb-4.5 text-brand" />
              <h3 className="mb-2 font-display text-base font-semibold text-ink">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-ink/70">
                {item.description}
              </p>
            </Card>
          ))}
        </ul>

        <p className="mt-14 rounded-card bg-surface-muted p-8 text-center font-display text-xl font-semibold text-ink">
          {highlight}
        </p>
      </Container>
    </Section>
  );
}
