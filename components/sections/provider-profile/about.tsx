import Image from "next/image";
import { ProfileCard } from "@/components/ui/profile-card";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  isUnoptimizedImage,
  monthYearLabel,
  yearsInTrade,
} from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";

/**
 * "Sobre {nombre}": descripción, quién atiende, años en el rubro y "En
 * AutoLibre desde". La descripción es TEXTO (nunca HTML) y cada dato ausente
 * se omite: si no hay nada, la sección entera no se renderiza.
 */
export function AboutSection({ profile }: { readonly profile: PartnerProfile }) {
  const paragraphs = (profile.description ?? "")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  const years = yearsInTrade(profile.foundedYear);
  const since = monthYearLabel(profile.memberSince);
  const people = profile.people;

  const facts = [
    years !== null
      ? years === 1
        ? copy.about.yearsInTradeOne
        : fillTemplate(copy.about.yearsInTrade, { years })
      : null,
    since ? fillTemplate(copy.about.memberSince, { monthYear: since }) : null,
  ].filter((fact): fact is string => fact !== null);

  if (paragraphs.length === 0 && facts.length === 0 && !people) return null;

  return (
    <ProfileCard
      id="perfil-sobre"
      title={fillTemplate(copy.sections.about, { name: profile.name })}
      className="mt-5"
    >
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="mt-3 text-base leading-relaxed text-ink/80">
          {paragraph}
        </p>
      ))}

      {people ? (
        <div className="mt-5 flex items-center gap-3">
          {people.photo ? (
            <Image
              src={people.photo.url}
              alt={fillTemplate(copy.alt.owner, { name: people.name })}
              width={people.photo.width}
              height={people.photo.height}
              unoptimized={isUnoptimizedImage(people.photo.url)}
              sizes="48px"
              className="size-12 rounded-full object-cover"
            />
          ) : null}
          <p className="text-[0.9375rem] text-ink/80">
            <span className="block text-sm text-ink/60">{copy.about.ownerLabel}</span>
            <span className="font-semibold text-ink">{people.name}</span>
            {people.role ? `, ${people.role}` : ""}
          </p>
        </div>
      ) : null}

      {facts.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2">
          {facts.map((fact) => (
            <li
              key={fact}
              className="rounded-full bg-card-muted px-3 py-1 text-sm font-medium text-ink/75"
            >
              {fact}
            </li>
          ))}
        </ul>
      ) : null}
    </ProfileCard>
  );
}
