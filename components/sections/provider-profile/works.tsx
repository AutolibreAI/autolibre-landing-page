import Image from "next/image";
import { ProfileCard } from "@/components/ui/profile-card";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  isUnoptimizedImage,
  monthYearLabel,
  VISIBLE_WORKS,
} from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";

/**
 * "Trabajos hechos": hasta 3 cards con foto(s) antes/después, servicio,
 * vehículo (marca, modelo, año) y mes y año, con un badge distinto según el
 * origen ("Registrado en AutoLibre" / "Cargado por el taller") y el contador
 * "N registrados en AutoLibre · M en total". NUNCA patente ni datos del
 * cliente: el contrato no los trae y acá no hay dónde ponerlos.
 *
 * Fase C: se renderiza solo si el backend manda trabajos; sin ellos, la
 * sección no existe (no hay cuadro vacío ni datos inventados).
 */
export function WorksSection({ profile }: { readonly profile: PartnerProfile }) {
  const works = profile.works;
  if (!works || works.items.length === 0) return null;

  const visible = works.items.slice(0, VISIBLE_WORKS);
  const hasMore = works.totalCount > visible.length;

  return (
    <ProfileCard
      id="perfil-trabajos"
      sectionId="trabajos"
      title={copy.sections.works}
      className="mt-5"
    >
      <p className="mt-2 text-sm text-ink/65">
        {fillTemplate(copy.works.counter, {
          registered: works.registeredCount,
          total: works.totalCount,
        })}
      </p>

      <ul className="mt-4 grid gap-4 sm:grid-cols-3">
        {visible.map((work) => {
          const vehicle = `${work.vehicle.brand} ${work.vehicle.model}, ${work.vehicle.year}`;
          const photos = work.photos.slice(0, 2);
          const fromAutolibre = work.origin === "autolibre";
          return (
            <li key={work.id} className="overflow-hidden rounded-xl border border-card-line">
              {photos.length > 0 ? (
                <div className="grid grid-cols-2 gap-px bg-card-line">
                  {photos.map((photo) => (
                    <div key={photo.image.url} className="relative aspect-4/3 bg-card-muted">
                      <Image
                        src={photo.image.url}
                        alt={fillTemplate(copy.alt.work, { service: work.service, vehicle })}
                        fill
                        unoptimized={isUnoptimizedImage(photo.image.url)}
                        sizes="(min-width: 1024px) 160px, 45vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="p-3">
                <p
                  className={
                    fromAutolibre
                      ? "inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-ink"
                      : "inline-flex rounded-full bg-card-muted px-2.5 py-0.5 text-xs font-semibold text-ink/75"
                  }
                >
                  {fromAutolibre ? copy.works.badgeAutolibre : copy.works.badgeOwn}
                </p>
                <h3 className="mt-2 text-[0.9375rem] font-semibold text-ink">{work.service}</h3>
                <p className="text-sm text-ink/70">{vehicle}</p>
                <p className="text-sm text-ink/55">{monthYearLabel(work.monthYear)}</p>
              </div>
            </li>
          );
        })}
      </ul>

      {hasMore ? (
        <a
          href="#trabajos"
          className="mt-4 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          {fillTemplate(copy.works.seeAll, { total: works.totalCount })}
        </a>
      ) : null}
    </ProfileCard>
  );
}
