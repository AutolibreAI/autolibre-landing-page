import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function MarketplaceSection() {
  const { title, subtitle, steps, services, servicesMore, coverage } =
    homeContent.marketplace;

  return (
    <Section id="marketplace" tone="muted" aria-labelledby="marketplace-title">
      <Container>
        <div className="mx-auto mb-16 max-w-[780px] text-center">
          <h2
            id="marketplace-title"
            className="font-display text-[2.25rem] font-bold text-ink md:text-[2.875rem]"
          >
            {title}
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-ink/72 md:text-[1.1875rem]">
            {subtitle}
          </p>
        </div>

        {/* Los tres pasos. En mobile se apilan y la flecha rota 90°. */}
        <ol className="mx-auto mb-16 flex max-w-[1080px] flex-col items-center md:flex-row md:items-start">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <li
                key={step.id}
                className="flex flex-col items-center md:flex-1 md:flex-row md:items-start"
              >
                <div className="flex flex-col items-center px-4 text-center md:flex-1">
                  <span
                    className={`mb-6 flex size-16 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold ${
                      isLast
                        ? "bg-brand text-white shadow-[0_6px_18px_rgba(42,140,58,0.28)]"
                        : "bg-white text-ink shadow-[0_4px_14px_rgba(28,43,28,0.08)]"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <p
                    className={`font-display text-[1.1875rem] leading-snug ${isLast ? "font-bold" : "font-semibold"} text-ink`}
                  >
                    {step.label}
                  </p>
                </div>
                {!isLast ? (
                  <Icon
                    name="arrow-right"
                    size={32}
                    className="my-8 shrink-0 rotate-90 text-brand-soft md:my-0 md:mt-6 md:rotate-0"
                  />
                ) : null}
              </li>
            );
          })}
        </ol>

        <ul className="mx-auto mb-10 flex max-w-[900px] flex-wrap justify-center gap-3">
          {services.map((service) => (
            <li
              key={service}
              className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-ink"
            >
              {service}
            </li>
          ))}
          <li className="rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-white">
            {servicesMore}
          </li>
        </ul>

        <p className="text-center text-[0.8125rem] text-ink/50">{coverage}</p>
      </Container>
    </Section>
  );
}
