import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Misión y visión como un libro de registro (el mismo lenguaje que "Últimas
 * notas" del blog): regla gruesa en tinta bajo el `h2` y dos renglones
 * separados por un hairline. El `h2` se ve chico, como rótulo, pero es el
 * nivel que le toca en el outline.
 */
export function AboutPurpose() {
  const { title, mission, vision } = aboutContent.purpose;

  return (
    <Section spacing="md" aria-labelledby="mision-vision">
      <h2 id="mision-vision" className="border-b border-ink pb-4 text-2xl text-ink">
        {title}
      </h2>
      <div className="reveal-group">
        {[mission, vision].map((item) => (
          <div
            key={item.label}
            className="grid gap-3 border-b border-line py-8 last:border-b-0 md:py-10 lg:grid-cols-12 lg:gap-8"
          >
            <h3 className="text-label font-semibold tracking-wider text-brand-hover uppercase lg:col-span-3 lg:pt-2">
              {item.label}
            </h3>
            <p className="max-w-240 font-display text-2xl leading-snug font-semibold text-balance text-ink md:text-3xl lg:col-span-9">
              {item.statement}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
