/**
 * Estado en vivo de un proveedor ("Abierto · cierra 18:00" / "Cerrado · abre
 * mañana 8:00"). Módulo PURO: sin imports ni dependencias, solo sintaxis TS
 * borrable, así lo corre `node --test` y se puede portar tal cual a la app
 * (que debe pasar la misma fixture, `contracts/fixtures/open-status-cases.json`).
 *
 * Devuelve ESTRUCTURA, no strings: los textos salen de la capa de contenido.
 * Reglas (`data-model.md §3.2`):
 * - El día ISO y los minutos se leen EN la zona horaria dada con `Intl`
 *   (Argentina no tiene horario de verano, pero no se asume).
 * - Soporta varios tramos por día: entre dos tramos está "cerrado" y
 *   `nextOpening` es hoy (`dayOffset: 0`).
 * - Busca la próxima apertura hasta 7 días adelante (el mismo día de la
 *   semana que viene incluido).
 * - `closesAt = "24:00"` se informa como `"00:00"`.
 * - Sin ningún tramo en la semana, o sin horarios, es `unknown`: no se
 *   muestra nada.
 */

export type HoursRange = {
  /** "HH:MM", 24 h. */
  readonly opensAt: string;
  /** "HH:MM"; `"24:00"` equivale a 1440 minutos. */
  readonly closesAt: string;
};

export type HoursDay = {
  /** ISO: 1 = lunes … 7 = domingo. */
  readonly weekday: number;
  readonly ranges: readonly HoursRange[];
};

export type OpenStatus =
  | { readonly kind: "open"; readonly closesAt: string }
  | {
      readonly kind: "closed";
      readonly nextOpening: {
        /** 0 = hoy, 1 = mañana, … hasta 7. */
        readonly dayOffset: number;
        /** ISO del día de esa apertura. */
        readonly weekday: number;
        readonly opensAt: string;
      };
    }
  | { readonly kind: "unknown" };

export const DEFAULT_TIME_ZONE = "America/Argentina/Buenos_Aires";

const WEEKDAY_BY_SHORT_NAME: Readonly<Record<string, number>> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

/** "HH:MM" → minutos desde medianoche (`"24:00"` → 1440). */
export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Día ISO y minutos desde medianoche de `now` en la zona horaria. */
export function localClock(
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): { readonly weekday: number; readonly minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const weekday = WEEKDAY_BY_SHORT_NAME[get("weekday")] ?? 1;
  // `h23` puede devolver "24" a medianoche en algunos motores: se normaliza.
  const hours = Number(get("hour")) % 24;
  return { weekday, minutes: hours * 60 + Number(get("minute")) };
}

function sortedRanges(day: HoursDay | undefined): readonly HoursRange[] {
  return [...(day?.ranges ?? [])].sort(
    (a, b) => toMinutes(a.opensAt) - toMinutes(b.opensAt),
  );
}

function displayClose(closesAt: string): string {
  return closesAt === "24:00" ? "00:00" : closesAt;
}

export function getOpenStatus(
  businessHours: readonly HoursDay[] | null | undefined,
  now: Date,
  timeZone: string = DEFAULT_TIME_ZONE,
): OpenStatus {
  const days = businessHours ?? [];
  const hasAnyRange = days.some((day) => day.ranges.length > 0);
  if (!hasAnyRange) return { kind: "unknown" };

  const byWeekday = new Map<number, HoursDay>(
    days.map((day) => [day.weekday, day]),
  );
  const today = localClock(now, timeZone);

  const todayRanges = sortedRanges(byWeekday.get(today.weekday));
  for (const range of todayRanges) {
    if (
      toMinutes(range.opensAt) <= today.minutes &&
      today.minutes < toMinutes(range.closesAt)
    ) {
      return { kind: "open", closesAt: displayClose(range.closesAt) };
    }
  }

  const laterToday = todayRanges.find(
    (range) => toMinutes(range.opensAt) > today.minutes,
  );
  if (laterToday) {
    return {
      kind: "closed",
      nextOpening: {
        dayOffset: 0,
        weekday: today.weekday,
        opensAt: laterToday.opensAt,
      },
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = ((today.weekday - 1 + offset) % 7) + 1;
    const first = sortedRanges(byWeekday.get(weekday))[0];
    if (first) {
      return {
        kind: "closed",
        nextOpening: { dayOffset: offset, weekday, opensAt: first.opensAt },
      };
    }
  }

  return { kind: "unknown" };
}
