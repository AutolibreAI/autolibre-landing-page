import { AboutPhoto } from "@/components/about/about-photo";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * El equipo: una ficha por persona (retrato 4:5, nombre, rol y, si los hay,
 * una línea y su LinkedIn). 1 columna → 2 desde `sm` → 3 desde `md` → 5
 * desde `xl`.
 */
export function AboutTeam() {
  const { title, intro, members, linkedinLabel } = aboutContent.team;

  return (
    <Section spacing="md" aria-labelledby="equipo">
      <SectionHeading
        as="h2"
        size="md"
        id="equipo"
        title={title}
        subtitle={intro}
        className="[&>p]:max-w-150"
      />

      {/* Cinco fichas. Las filas incompletas se centran con una grilla del
          doble de columnas donde cada ficha ocupa dos:
          - 1 columna.
          - `sm`: 2 por fila (4 cols); la última, sola, arranca en la col 2.
          - `md`: 3 por fila (6 cols); la 4.ª arranca en la col 2 → 3 + 2.
          - `xl`: las 5 en una fila (a 1280px cada retrato mide ~200px; en
            `lg` quedaban de ~155px, demasiado chicos).
          Si cambia la cantidad de personas, revisar estos `nth`/`last`. */}
      <ul className="reveal-group mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-4 md:mt-14 md:grid-cols-6 xl:grid-cols-5">
        {members.map((member) => (
          <li
            key={member.id}
            className="sm:col-span-2 sm:odd:last:col-start-2 md:odd:last:col-start-auto md:nth-4:col-start-2 xl:col-span-1 xl:nth-4:col-start-auto"
          >
            <article aria-labelledby={`equipo-${member.id}`}>
              <AboutPhoto
                photo={member.photo}
                // Contenedor de 88vw (tope 1440px) en 5 / 3 / 2 / 1 columnas.
                sizes="(min-width: 1640px) 264px, (min-width: 1280px) 18vw, (min-width: 768px) 29vw, (min-width: 640px) 44vw, 88vw"
                className="aspect-4/5 rounded-card"
              />
              <h3 id={`equipo-${member.id}`} className="mt-5 text-xl leading-snug text-ink">
                {member.name}
              </h3>
              <p className="mt-1 text-label font-semibold text-brand-hover">{member.role}</p>
              {member.bio ? (
                <p className="mt-3 text-base leading-relaxed text-ink/70">{member.bio}</p>
              ) : null}
              {member.linkedin ? (
                // 44px de objetivo táctil; el margen negativo alinea el ícono
                // con el texto de arriba sin mover el layout.
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={linkedinLabel(member.name)}
                  className="mt-2 -ml-2.5 inline-flex size-11 items-center justify-center rounded-field text-ink transition-colors hover:text-brand-hover"
                >
                  <Icon name="linkedin" size={22} />
                </a>
              ) : null}
            </article>
          </li>
        ))}
      </ul>
    </Section>
  );
}
