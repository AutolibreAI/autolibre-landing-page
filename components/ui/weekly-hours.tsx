"use client";

import { useSyncExternalStore } from "react";
import { localClock } from "@/lib/provider-profile/open-status";
import type { HoursRow } from "@/lib/provider-profile/present";
import { cn } from "@/lib/utils";

type WeeklyHoursProps = {
  readonly rows: readonly HoursRow[];
  /** Etiqueta accesible del día de hoy. */
  readonly todayLabel: string;
  readonly className?: string;
};

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}
/** Día ISO de hoy en la zona horaria de Argentina. */
const getToday = (): number => localClock(new Date()).weekday;
const getServerToday = (): null => null;

/**
 * Horario semanal. El TEXTO sale completo en el HTML del servidor (lo ve
 * Google y quien tiene JavaScript apagado); la isla solo resalta el día de
 * hoy una vez montada, porque "hoy" depende de la hora del visitante.
 */
export function WeeklyHours({ rows, todayLabel, className }: WeeklyHoursProps) {
  const today = useSyncExternalStore(subscribe, getToday, getServerToday);

  return (
    <dl className={cn("flex flex-col gap-1", className)}>
      {rows.map((row) => {
        const isToday = today === row.weekday;
        return (
          <div
            key={row.weekday}
            className={cn(
              "flex items-baseline justify-between gap-4 rounded-lg px-3 py-2 text-[0.9375rem]",
              isToday ? "bg-brand-50 font-semibold text-ink" : "text-ink/80",
            )}
          >
            <dt>
              {row.day}
              {isToday ? <span className="sr-only"> ({todayLabel})</span> : null}
            </dt>
            <dd className={cn("text-right", row.closed && "text-ink/55")}>{row.text}</dd>
          </div>
        );
      })}
    </dl>
  );
}
