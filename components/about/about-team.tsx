import { AboutPhoto } from "@/components/about/about-photo";
import { SectionHeading } from "@/components/ui/heading";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * El equipo: una ficha por persona (retrato 4:5, nombre, rol, una línea y
 * su LinkedIn si lo hay). 1 columna → 2 desde `sm` → 4 desde `lg`.
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

      <ul className="reveal-group mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 md:mt-14 lg:grid-cols-4">
        {members.map((member) => (
          <li key={member.id}>
            <article aria-labelledby={`equipo-${member.id}`}>
              <AboutPhoto
                photo={member.photo}
                // Contenedor de 88vw repartido en 4 / 2 / 1 columnas.
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 88vw"
                className="aspect-4/5 rounded-card"
              />
              <h3 id={`equipo-${member.id}`} className="mt-5 text-xl leading-snug text-ink">
                {member.name}
              </h3>
              <p className="mt-1 text-label font-semibold text-brand-hover">{member.role}</p>
              <p className="mt-3 text-base leading-relaxed text-ink/70">{member.bio}</p>
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
