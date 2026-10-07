"use client";

import { useSyncExternalStore } from "react";
import {
  getOpenStatus,
  type HoursDay,
} from "@/lib/provider-profile/open-status";
import { openStatusLabel } from "@/lib/provider-profile/present";
import { cn } from "@/lib/utils";

type OpenStatusBadgeProps = {
  readonly hours: readonly HoursDay[];
  readonly className?: string;
};

/** Cambia una vez por minuto: alcanza para un "abierto/cerrado" sin parpadeos. */
function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}
const getMinute = (): number => Math.floor(Date.now() / 60_000);
/** En el servidor no hay "ahora" confiable: se reserva el lugar y no se pinta nada. */
const getServerMinute = (): null => null;

/**
 * Estado en vivo ("Abierto · cierra 18:00"). Isla de cliente chica: depende de
 * la hora actual, que el servidor no puede saber sin dejar la página con un
 * dato falso entre revalidaciones.
 *
 * Reserva su alto (y un ancho mínimo) desde el HTML del servidor, así que
 * mostrarse no mueve el diseño (CLS). Sin horarios no se muestra nada.
 */
export function OpenStatusBadge({ hours, className }: OpenStatusBadgeProps) {
  const minute = useSyncExternalStore(subscribe, getMinute, getServerMinute);

  if (minute === null) {
    return (
      <span
        aria-hidden="true"
        className={cn("inline-block h-8 min-w-48", className)}
      />
    );
  }

  const status = getOpenStatus(hours, new Date(minute * 60_000));
  const label = openStatusLabel(status);
  if (!label) return null;

  const open = status.kind === "open";
  return (
    <span
      role="status"
      className={cn(
        "inline-flex h-8 items-center gap-2 rounded-full px-3.5 text-sm font-semibold",
        open ? "bg-status-ok-bg text-status-ok" : "bg-card-muted text-ink/75",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-2 rounded-full", open ? "bg-status-ok" : "bg-ink/40")}
      />
      {label}
    </span>
  );
}
