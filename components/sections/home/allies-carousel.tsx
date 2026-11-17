"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 5000;

type AlliesCarouselProps = {
  /** Un slide por aliado. El contenido de cada uno ya viene armado por el server. */
  readonly slides: readonly React.ReactNode[];
  readonly label: string;
  readonly prevLabel: string;
  readonly nextLabel: string;
  /** Un `aria-label` por punto, ya resuelto: una función no cruza el límite server/client. */
  readonly goToLabels: readonly string[];
};

/**
 * Isla cliente del carrusel de aliados: solo el control (índice, autoplay,
 * botones, puntos). Cada slide llega armado desde `AlliesSection` (server)
 * como children, así el banner en sí no se mueve al cliente.
 *
 * Autoplay en loop (no es de las excepciones de `prefers-reduced-motion`
 * aprobadas en AGENTS.md): se desactiva con `matchMedia`, pero los slides
 * siguen navegables a mano con las flechas y los puntos.
 */
export function AlliesCarousel({ slides, label, prevLabel, nextLabel, goToLabels }: AlliesCarouselProps) {
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

  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <div
      role="region"
      aria-roledescription="carrusel"
      aria-label={label}
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      {/* Sin `rounded-card`: el carrusel es full-bleed (pedido de producto, 2026-11-17). */}
      <div className="overflow-hidden">
        <div
          ref={trackRef}
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
              className="w-full shrink-0"
            >
              {slide}
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label={prevLabel}
        onClick={() => goTo(index - 1)}
        className="absolute top-1/2 left-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-surface text-ink shadow-sm transition hover:bg-surface-muted sm:left-4"
      >
        <Icon name="arrow-left" size={20} />
      </button>
      <button
        type="button"
        aria-label={nextLabel}
        onClick={() => goTo(index + 1)}
        className="absolute top-1/2 right-2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-surface text-ink shadow-sm transition hover:bg-surface-muted sm:right-4"
      >
        <Icon name="arrow-right" size={20} />
      </button>

      {/* Sobre el banner, no debajo: una franja blanca separada se veía
          desconectada del banner full-bleed (pedido de producto, 2026-11-17). */}
      <div className="absolute right-0 bottom-5 left-0 flex justify-center gap-2.5">
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
                "block h-2 rounded-field bg-white transition-all",
                position === index ? "w-7 opacity-100" : "w-2 opacity-40",
              )}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
