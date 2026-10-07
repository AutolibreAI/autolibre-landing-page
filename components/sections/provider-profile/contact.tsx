import { Icon } from "@/components/ui/icon";
import { ProfileCard } from "@/components/ui/profile-card";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import { linkLabel, safeExternalUrl } from "@/lib/provider-profile/present";
import type { IconName } from "@/lib/content/types";
import type { PartnerProfile } from "@/lib/provider-profile/types";

const LINK_ICONS: Readonly<Record<string, IconName>> = {
  instagram: "instagram",
  website: "globe",
};

/**
 * "Contacto y redes": teléfono, Instagram y web propia, cuando existen. Los
 * enlaces del proveedor son contenido de un tercero: solo `http(s)` (un
 * `javascript:` no se renderiza como `<a href>`) y con `rel="nofollow ugc
 * noopener noreferrer"`. Sin ningún dato, la sección no se renderiza.
 */
export function ContactSection({ profile }: { readonly profile: PartnerProfile }) {
  const phone = profile.contact.phoneE164;
  const links = profile.links
    .map((link) => ({ link, url: safeExternalUrl(link.url) }))
    .filter((entry): entry is { link: typeof entry.link; url: string } => entry.url !== null);

  if (!phone && links.length === 0) return null;

  const row =
    "inline-flex min-h-11 items-center gap-2.5 text-[0.9375rem] font-medium text-ink hover:text-brand-hover";

  return (
    <ProfileCard id="perfil-contacto" title={copy.sections.contact}>
      <ul className="mt-3 flex flex-col">
        {phone ? (
          <li>
            <a
              href={`tel:${phone}`}
              data-analytics-event={ANALYTICS_EVENTS.providerActionClicked}
              data-analytics-action={PROVIDER_ACTIONS.call}
              data-analytics-provider={profile.slug}
              data-analytics-placement="provider_contact"
              className={row}
            >
              <Icon name="phone" size={18} strokeWidth={1.8} />
              {phone}
            </a>
          </li>
        ) : null}
        {links.map(({ link, url }) => (
          <li key={`${link.kind}-${url}`}>
            <a
              href={url}
              target="_blank"
              rel="nofollow ugc noopener noreferrer"
              className={row}
            >
              <Icon name={LINK_ICONS[link.kind] ?? "globe"} size={18} strokeWidth={1.8} />
              {linkLabel(link)}
            </a>
          </li>
        ))}
      </ul>
    </ProfileCard>
  );
}
