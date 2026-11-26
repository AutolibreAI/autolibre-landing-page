import Image from "next/image";
import { aboutSectionTitle } from "@/components/about/styles";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";
import { siteContent } from "@/lib/content/site";

/** "Matías Vidal" → "MV": el marco de quien todavía no tiene retrato. */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Equipo (referencia Intercom, "Our leadership"): retrato 4:5, nombre y rol,
 * sin tarjeta ni color. 2 columnas en celular, 3 desde `md`, las 5 en una
 * fila desde `lg`.
 *
 * Retratos con `next/image` (lazy: están lejos del primer viewport, ninguno
 * es LCP), `width`/`height` del archivo y `alt` con el nombre y el rol. Sin
 * retrato, el mismo marco con las iniciales (decorativas: el nombre está
 * debajo como texto), así el layout no cambia el día que llegue la foto.
 */
export function AboutTeam() {
  const { title, intro, members, linkedinLabel } = aboutContent.team;

  return (
    <Section
      spacing="md"
      aria-labelledby="equipo"
      className="bg-card pt-6 pb-12 md:pt-10 md:pb-22"
    >
      <div className="mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-2 border-t border-control-line pt-7 md:pt-12">
        <h2 id="equipo" className={aboutSectionTitle}>
          {title}
        </h2>
        <p className="text-fg-muted">{intro}</p>
      </div>

      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 lg:grid-cols-5">
        {members.map((member) => (
          <li key={member.id} className="flex flex-col gap-3">
            <div className="relative flex aspect-4/5 items-center justify-center overflow-clip rounded-xl bg-canvas">
              {member.photo ? (
                <Image
                  src={member.photo.src}
                  alt={member.photo.alt}
                  width={member.photo.width}
                  height={member.photo.height}
                  // Contenedor de 88vw (tope 1440px) en 5 / 3 / 2 columnas.
                  sizes="(min-width: 1640px) 272px, (min-width: 1024px) 17vw, (min-width: 768px) 28vw, 43vw"
                  className="size-full object-cover"
                />
              ) : (
                <span aria-hidden="true" className="font-display text-4xl font-bold text-fg-muted">
                  {initials(member.name)}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lead leading-snug font-semibold text-fg">{member.name}</h3>
              <p className="mt-0.5 text-sm text-fg-muted">{member.role}</p>
              {member.linkedin ? (
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 -ml-2.5 inline-flex size-11 items-center justify-center rounded-full text-fg transition-colors hover:text-brand-hover motion-reduce:transition-none"
                >
                  <Icon name="linkedin" size={22} />
                  <span className="sr-only">
                    {linkedinLabel(member.name)} {siteContent.nav.externalHint}
                  </span>
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </Section>
  );
}
