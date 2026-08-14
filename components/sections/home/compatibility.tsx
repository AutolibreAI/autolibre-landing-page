import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function CompatibilitySection() {
  const { title, subtitle, detail, cta, image } = homeContent.compatibility;

  return (
    <Section
      id="compatibilidad"
      tone="muted"
      spacing="md"
      aria-labelledby="compat-title"
    >
      <Container>
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-10 lg:flex-row lg:gap-14">
          <div className="max-w-[480px] flex-1">
            <h2
              id="compat-title"
              className="font-display text-[1.875rem] font-bold text-ink md:text-[2.125rem]"
            >
              {title}
            </h2>
            <p className="mt-4 text-[1.0625rem] leading-relaxed text-ink/72">
              {subtitle}
            </p>
            <p className="mt-7 text-[0.9375rem] leading-relaxed text-ink/65">
              {detail}
            </p>
            <a
              href={cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-7 inline-flex rounded-field border-[1.5px] border-ink/80 px-6 py-3 text-[0.9375rem] font-semibold text-ink transition-colors hover:border-brand hover:text-brand"
            >
              {cta.label}
            </a>
          </div>

          <div className="w-full max-w-[400px] flex-1">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(max-width: 1024px) 90vw, 400px"
              className="w-full rounded-card"
            />
          </div>
        </div>
      </Container>
    </Section>
  );
}
