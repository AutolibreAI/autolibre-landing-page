import { ProfileCard } from "@/components/ui/profile-card";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import type { PartnerProfile } from "@/lib/provider-profile/types";

const vehicleLabels: Readonly<Record<string, string>> = copy.services.vehicleLabels;
const fuelLabels: Readonly<Record<string, string>> = copy.services.fuelLabels;

function Pills({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full bg-card-muted px-3 py-1 text-sm font-medium text-ink/80"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

/**
 * "Servicios": servicios agrupados por familia, marcas, tipos de vehículo,
 * combustibles y equipamiento. Son datos estructurados (no texto libre) y lo
 * vacío se omite. "Todas las marcas" solo se dice con `mode: "all"`.
 */
export function ServicesSection({ profile }: { readonly profile: PartnerProfile }) {
  const groups = profile.services.filter((group) => group.items.length > 0);
  const brands =
    profile.brands.mode === "all"
      ? [copy.services.allBrands]
      : [...profile.brands.items];
  const vehicles = profile.vehicleTypes
    .map((type) => vehicleLabels[type])
    .filter((label): label is string => Boolean(label));
  // Los combustibles solo se listan si el proveedor declaró algunos: "todos"
  // no es una afirmación que valga la pena mostrar.
  const fuels =
    profile.fuelTypes.mode === "specific"
      ? profile.fuelTypes.items
          .map((fuel) => fuelLabels[fuel])
          .filter((label): label is string => Boolean(label))
      : [];
  const equipment = profile.equipment.map((item) => item.name);

  if (groups.length === 0 && brands.length === 0 && vehicles.length === 0 && equipment.length === 0) {
    return null;
  }

  const subheading = "mt-5 text-sm font-semibold tracking-wide text-ink/60 uppercase";

  return (
    <ProfileCard id="perfil-servicios" title={copy.sections.services} className="mt-5">
      {groups.map((group) => (
        <div key={group.category.slug}>
          <h3 className={subheading}>{group.category.name}</h3>
          <Pills items={group.items.map((item) => item.name)} />
        </div>
      ))}

      {brands.length > 0 && groups.length > 0 ? (
        <div>
          <h3 className={subheading}>{copy.sections.brands}</h3>
          <Pills items={brands} />
        </div>
      ) : null}
      {vehicles.length > 0 ? (
        <div>
          <h3 className={subheading}>{copy.sections.vehicleTypes}</h3>
          <Pills items={vehicles} />
        </div>
      ) : null}
      {fuels.length > 0 ? (
        <div>
          <h3 className={subheading}>{copy.sections.fuelTypes}</h3>
          <Pills items={fuels} />
        </div>
      ) : null}
      {equipment.length > 0 ? (
        <div>
          <h3 className={subheading}>{copy.sections.equipment}</h3>
          <Pills items={equipment} />
        </div>
      ) : null}
    </ProfileCard>
  );
}
