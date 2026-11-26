"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5000;

type AlliesCarouselProps = {
  /** El `<h2>` de la sección, armado en el server: la isla solo lo ubica en la fila de las flechas. */
  readonly heading: React.ReactNode;
  /** Un slide por aliado. El contenido de cada uno ya viene armado por el server. */
  readonly slides: readonly React.ReactNode[];
  readonly label: string;
  /** Rótulo "Publicidad" sobre el banner. */
  readonly adLabel: string;
  readonly prevLabel: string;
  readonly nextLabel: string;
  /** Un `aria-label` por punto, ya resuelto: una función no cruza el límite server/client. */
  readonly goToLabels: readonly string[];
};

/** Flecha redonda de la cabecera: 44px (objetivo táctil) en todos los anchos. */
const arrowButton =
  "flex size-11 items-center justify-center rounded-full border border-card-line bg-card text-fg transition-colors hover:bg-card-muted motion-reduce:transition-none";

/**
 * Isla cliente del carrusel de aliados: solo el control (índice, autoplay,
 * flechas, puntos). El heading y cada slide llegan armados desde
 * `AlliesSection` (server) como props, así el contenido no se mueve al
 * cliente y sigue en el HTML inicial.
 *
 * Layout (referencia de producto, 2026-11-26): fila de cabecera con el
 * título a la izquierda y las flechas a la derecha; debajo, el banner como
 * tarjeta redondeada del ancho del `Container` wide con el rótulo
 * "Publicidad"; debajo, los puntos centrados.
 *
 * Autoplay en loop (no es de las excepciones de `prefers-reduced-motion`
 * aprobadas en AGENTS.md): se desactiva con `matchMedia`, pero los slides
 * siguen navegables a mano con las flechas y los puntos.
 */
export function AlliesCarousel({ heading, slides, label, adLabel, prevLabel, nextLabel, goToLabels }: AlliesCarouselProps) {
  const [index, setIndex] = useState(0);
  // Lazy init (no `useEffect` + `setState`): evita un render extra solo para
  // leer la preferencia la primera vez.
  const [reducedMotion, setReducedMotion] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [paused, setPaused] = useState(false);
  const total = slides.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || paused || total < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % total);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [reducedMotion, paused, total]);

  const goTo = useCallback((next: number) => setIndex(((next % total) + total) % total), [total]);

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="flex items-center justify-between gap-4">
        {heading}
        {total > 1 ? (
          <div className="flex shrink-0 gap-2">
            <button type="button" aria-label={prevLabel} onClick={() => goTo(index - 1)} className={arrowButton}>
              <Icon name="chevron-left" size={20} />
            </button>
            <button type="button" aria-label={nextLabel} onClick={() => goTo(index + 1)} className={arrowButton}>
              <Icon name="chevron-right" size={20} />
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative mt-6 overflow-hidden rounded-card">
        <div
          className="flex transition-transform duration-500 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {slides.map((slide, position) => (
            <div
              key={position}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${position + 1}/${total}`}
              // `inert` (no solo `aria-hidden`): sin esto, los links de un slide
              // fuera de pantalla seguían recibiendo foco con Tab.
              inert={position !== index}
              // `flex`: el banner se estira al alto del más alto, así el
              // carrusel no salta de alto al pasar de uno a otro.
              className="flex w-full shrink-0"
            >
              {slide}
            </div>
          ))}
        </div>

        {/* Fondo oscuro translúcido: el rótulo cae sobre fondos de marca
            distintos (y sobre una foto en La Esquina del Neumático), así se
            lee igual sobre todos. `pointer-events-none`: no tapa el link. */}
        <p className="pointer-events-none absolute top-3 right-3 rounded-full bg-black/45 px-2.5 py-0.5 text-xs font-semibold text-white">
          {adLabel}
        </p>
      </div>

      {total > 1 ? (
        <div className="mt-3 flex justify-center gap-1">
          {slides.map((_, position) => (
            <button
              key={position}
              type="button"
              aria-label={goToLabels[position]}
              aria-current={position === index}
              onClick={() => goTo(position)}
              className="flex h-11 w-7 items-center justify-center"
            >
              <span
                className={cn(
                  "block h-2 rounded-full transition-all motion-reduce:transition-none",
                  position === index ? "w-6 bg-fg" : "w-2 bg-fg-subtle",
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
