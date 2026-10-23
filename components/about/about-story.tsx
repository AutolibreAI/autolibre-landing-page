import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * La historia: a la izquierda el título y lo que aprendimos (el principio que
 * dejó el primer diagnóstico), a la derecha el relato; en mobile, uno debajo
 * del otro. El principio es una frase nuestra, no una cita de terceros: va en
 * un `<p>` con acento de marca, ni heading ni `<blockquote>`.
 *
 * Desde `lg` la columna izquierda queda `sticky` mientras se leen los
 * párrafos: `top-28` (7rem) deja libre el header sticky de `h-18` (4.5rem)
 * con aire. `self-start` hace falta para que el ítem de la grilla no se
 * estire al alto de la fila (estirado, no tendría dónde pegarse).
 *
 * Los párrafos se cortan en ~37rem para que la línea no se escape del ojo.
 *
 * Banda `surface-muted` a todo el ancho (decisión 2026-10-02): separa la
 * historia de la banda de tinta de arriba y de la línea de tiempo en blanco
 * de abajo. Ni `Section` ni nada entre la banda y la columna lleva
 * `overflow`, así que el `sticky` sigue pegándose al scroll del documento.
 * Los verdes sobre el lavado siguen pasando AA: `brand-hover` ~5:1.
 */
export function AboutStory() {
  const { title, paragraphs, principle } = aboutContent.story;

  return (
    <Section tone="muted" spacing="md" aria-labelledby="nuestra-historia">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <SectionHeading as="h2" size="md" id="nuestra-historia" title={title} />
          <div className="mt-8 border-l-2 border-brand pl-5 md:mt-10 md:pl-6">
            <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
              {principle.label}
            </p>
            <p className="mt-3 font-display text-2xl leading-snug font-semibold text-balance text-ink md:text-3xl">
              {principle.statement}
            </p>
          </div>
        </div>

        <div className="reveal-group flex max-w-150 flex-col gap-6 lg:col-span-7 lg:pt-3">
          {paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-lead leading-relaxed text-ink/80 md:text-lead-lg">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}
