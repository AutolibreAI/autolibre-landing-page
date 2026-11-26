"use client";

import Link from "next/link";
import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

export type DirectoryMapMarker = {
  readonly slug: string;
  readonly name: string;
  readonly monogram: string;
  /** Nombre accesible del marcador ("Ver X en el mapa"), armado en el server. */
  readonly label: string;
  readonly href: string;
  /** Rubro principal (nombre visible) o `null`. */
  readonly category: string | null;
  readonly locality: string | null;
  /** Posición en % sobre la imagen del mapa. */
  readonly x: number;
  readonly y: number;
};

type DirectoryMapMarkersProps = {
  readonly markers: readonly DirectoryMapMarker[];
  /** "Ver perfil". Strings y no funciones: cruzan del server a la isla. */
  readonly viewProfile: string;
};

/**
 * Marcadores del mapa del directorio y la tarjeta del elegido. Isla hoja: lo
 * único client es cuál está elegido. Los marcadores son botones
 * (`aria-pressed`) y la tarjeta lleva al perfil; todo lo demás (lista,
 * nombres, links a los perfiles) ya está en el HTML del server.
 *
 * Sin distancias: el lienzo muestra "1,1 km", pero la web no conoce la
 * ubicación de la persona (sería un dato inventado).
 */
export function DirectoryMapMarkers({ markers, viewProfile }: DirectoryMapMarkersProps) {
  const [selected, setSelected] = useState(0);
  const current = markers[selected] ?? markers[0];
  if (!current) return null;

  return (
    <>
      <ul className="absolute inset-0">
        {markers.map((marker, index) => {
          const isSelected = index === selected;
          return (
            <li
              key={marker.slug}
              // Posición calculada en el server (`fitMapView`): no hay clase
              // canónica para un % arbitrario por marcador.
              style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
              className={cn("absolute -translate-x-1/2 -translate-y-1/2", isSelected ? "z-20" : "z-10")}
            >
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={marker.label}
                onClick={() => setSelected(index)}
                className={cn(
                  "flex size-11 items-center justify-center rounded-full border font-display text-xs font-bold transition-colors motion-reduce:transition-none",
                  isSelected
                    ? "border-action bg-action text-white"
                    : "border-card-line bg-card text-fg hover:border-action",
                )}
              >
                {marker.monogram}
              </button>
            </li>
          );
        })}
      </ul>

      <Link
        href={current.href}
        className="absolute inset-x-3.5 bottom-3.5 z-30 flex items-center gap-3.5 rounded-card border border-card-line bg-card p-3.5 text-fg"
      >
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 font-display text-xl font-bold text-action"
        >
          {current.monogram}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-display text-lg font-semibold">{current.name}</span>
          {current.category || current.locality ? (
            <span className="block truncate text-sm text-fg-muted">
              {[current.category, current.locality].filter(Boolean).join(" · ")}
            </span>
          ) : null}
          <span className="mt-1 flex items-center gap-1 text-sm font-semibold text-action">
            {viewProfile}
            <Icon name="arrow-right" size={16} strokeWidth={2} />
          </span>
        </span>
      </Link>
    </>
  );
}
