import { AboutPhoto } from "@/components/about/about-photo";
import { SectionHeading } from "@/components/ui/heading";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * La historia: título y foto de los dos fundadores a la izquierda, el relato
 * a la derecha (en mobile, uno debajo del otro). Los párrafos se cortan en
 * ~37rem para que la línea no se escape del ojo.
 */
export function AboutStory() {
  const { title, paragraphs, photo } = aboutContent.story;

  return (
    <Section spacing="md" aria-labelledby="nuestra-historia">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="reveal lg:col-span-5">
          <SectionHeading as="h2" size="md" id="nuestra-historia" title={title} />
          <AboutPhoto
            photo={photo}
            // Columna de 5/12 desde `lg`; en mobile, el ancho del contenedor.
            sizes="(min-width: 1024px) 38vw, 88vw"
            className="mt-8 aspect-4/3 rounded-panel"
          />
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
