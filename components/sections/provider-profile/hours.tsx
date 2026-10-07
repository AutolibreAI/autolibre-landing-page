import { ProfileCard } from "@/components/ui/profile-card";
import { WeeklyHours } from "@/components/ui/weekly-hours";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import { hoursRows } from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";

/**
 * "Horarios": la semana completa con el día de hoy resaltado y el texto fijo
 * de feriados. Sin horarios estructurados, la sección no se renderiza.
 */
export function HoursSection({ profile }: { readonly profile: PartnerProfile }) {
  const hours = profile.businessHours ?? [];
  if (!hours.some((day) => day.ranges.length > 0)) return null;

  return (
    <ProfileCard id="perfil-horarios" title={copy.sections.hours}>
      <WeeklyHours
        rows={hoursRows(hours)}
        todayLabel={copy.hours.today}
        className="mt-3"
      />
      <p className="mt-3 px-3 text-sm text-ink/65">{copy.hours.holidays}</p>
    </ProfileCard>
  );
}
