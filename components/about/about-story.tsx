import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * "Nuestra historia" sobre `canvas` (referencia Teak): arriba, lo que
 * aprendimos en grande y centrado; debajo, el relato en tres columnas desde
 * `md`.
 *
 * La frase es nuestra (no una cita de terceros): va en un `<figure>` con su
 * rótulo en `<figcaption>`, como `<p>` y no como `<blockquote>`. Queda antes
 * del `h2` como en el lienzo, pero dentro de la sección que ese `h2` nombra.
 */
export function AboutStory() {
  const { title, paragraphs, principle } = aboutContent.story;

  return (
    <Section tone="canvas" spacing="md" aria-labelledby="nuestra-historia">
      <figure className="mx-auto flex max-w-225 flex-col gap-4.5 text-center">
        <p className="font-display text-3xl leading-tight font-bold tracking-tight text-balance text-fg md:text-4xl lg:text-5xl">
          {principle.quoted}
        </p>
        <figcaption className="text-control text-fg-muted">{principle.label}</figcaption>
      </figure>

      <div className="mt-8 md:mt-14">
        <h2
          id="nuestra-historia"
          className="mb-5 border-t border-fg pt-5 font-display text-2xl font-bold text-fg md:text-3xl"
        >
          {title}
        </h2>
        <div className="grid gap-x-10 gap-y-5 text-lead text-fg md:grid-cols-3">
          {paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 32)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </Section>
  );
}
