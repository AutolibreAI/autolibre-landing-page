import Image from "next/image";
import { ProfileCard } from "@/components/ui/profile-card";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  directionsUrl,
  serviceAreaNames,
  STATIC_MAP_SIZE,
  staticMapUrl,
} from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";

/**
 * Ubicación del proveedor, en sus dos variantes:
 * - **Con local** (`in_person`/`both`): dirección completa, "Cómo llegar" y,
 *   si hay coordenadas, un mapa estático. Sin coordenadas, solo texto y link.
 * - **Sin local** (`mobile`): "Zona de cobertura" con la lista de partidos o
 *   localidades y el texto fijo. SIN mapa del área (no hay geometría: desvío
 *   documentado) y SIN dirección ni "Cómo llegar".
 * `both` suma "También atiende a domicilio en: …" si hay zonas (provisorio).
 * Sin ningún dato, la sección no se renderiza.
 */
export function LocationSection({ profile }: { readonly profile: PartnerProfile }) {
  const areas = serviceAreaNames(profile);
  const hasPlace = profile.locationMode !== "mobile" && profile.address !== null;

  if (!hasPlace && areas.length === 0) return null;

  if (!hasPlace) {
    return (
      <ProfileCard id="perfil-ubicacion" title={copy.sections.serviceArea}>
        <ul className="mt-3 flex flex-wrap gap-2">
          {areas.map((area) => (
            <li
              key={area}
              className="rounded-full bg-card-muted px-3 py-1 text-sm font-medium text-ink/80"
            >
              {area}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-[0.9375rem] leading-relaxed text-ink/75">
          {copy.location.serviceAreaNote}
        </p>
      </ProfileCard>
    );
  }

  const address = profile.address;
  const directions = directionsUrl(profile);
  const mapUrl = staticMapUrl(profile);

  return (
    <ProfileCard id="perfil-ubicacion" title={copy.sections.location}>
      {mapUrl ? (
        <Image
          src={mapUrl}
          alt={fillTemplate(copy.location.mapAlt, { name: profile.name })}
          width={STATIC_MAP_SIZE.width}
          height={STATIC_MAP_SIZE.height}
          // El mapa lo pide el navegador (con la API key pública, que puede
          // estar restringida por referer) y no el optimizador del servidor.
          unoptimized
          sizes="(min-width: 1024px) 400px, 100vw"
          className="mt-3 h-auto w-full rounded-xl border border-card-line"
        />
      ) : null}
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/85">{address?.full}</p>
      {areas.length > 0 && profile.locationMode === "both" ? (
        <p className="mt-2 text-sm text-ink/70">
          {fillTemplate(copy.location.alsoServes, { localities: areas.join(", ") })}
        </p>
      ) : null}
      {directions ? (
        <a
          href={directions}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event={ANALYTICS_EVENTS.providerActionClicked}
          data-analytics-action={PROVIDER_ACTIONS.directions}
          data-analytics-provider={profile.slug}
          data-analytics-placement="provider_aside"
          className="mt-3 inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          <Icon name="navigation" size={18} strokeWidth={1.8} />
          {copy.actions.directions}
        </a>
      ) : null}
    </ProfileCard>
  );
}
