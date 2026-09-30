import { AboutPhoto } from "@/components/about/about-photo";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Apertura de "Sobre nosotros": eyebrow, el único `h1` (la misión en una
 * frase), bajada y la foto grupal a todo el ancho del contenedor.
 *
 * Sin `reveal`: es lo que está en pantalla al cargar y la foto es la LCP.
 */
export function AboutHero() {
  const { eyebrow, title, lead, groupPhoto } = aboutContent.hero;

  return (
    <Section spacing="sm" className="md:pt-20" aria-labelledby="sobre-nosotros-titulo">
      <div className="flex flex-col gap-4">
        <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
          {eyebrow}
        </p>
        <h1
          id="sobre-nosotros-titulo"
          className="max-w-190 text-display-xs text-ink sm:text-display-sm md:text-display-md"
        >
          {title}
        </h1>
        <p className="max-w-150 text-lead leading-relaxed text-ink/70 md:text-lead-lg">{lead}</p>
      </div>

      {/* Más alta en mobile (4:3) para que el grupo no quede como una tira. */}
      <AboutPhoto
        photo={groupPhoto}
        // Contenedor `wide`: 88vw (6% de gutter por lado) hasta tocar 1440px.
        sizes="(min-width: 1637px) 1440px, 88vw"
        preload
        className="mt-10 aspect-4/3 rounded-panel md:mt-14 md:aspect-video"
      />
    </Section>
  );
}
