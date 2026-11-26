"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Cada cuánto cae la palabra siguiente. */
const INTERVAL_MS = 2800;

/**
 * Fase del cambio. Las dos palabras NUNCA se ven a la vez:
 * - `idle`: la palabra quieta.
 * - `out`: la actual cae y se apaga (`animate-hero-word-out`, 300 ms ease-in).
 *   Al terminar (`animationend`) queda en opacidad 0 y fuera del recorte.
 * - `in`: recién ahí se monta la nueva, que espera 80 ms con la ranura vacía
 *   (en ese tiempo está invisible, arriba del recorte) y baja desde arriba
 *   (`animate-hero-word-in`, 400 ms ease-out). Al terminar vuelve a `idle`.
 */
type Phase = "idle" | "out" | "in";

type HeroRotatingWordProps = {
  /** Palabras en orden; la primera es la del HTML del server. */
  words: readonly string[];
  className?: string;
};

/**
 * Palabra que va cayendo en el `<h1>` del Home (AUTO → MOTO, en mayúsculas
 * y en verde de marca por las clases que le pasa el hero).
 * Isla hoja: el resto del `<h1>` es server.
 *
 * - SEO/a11y: la isla es `aria-hidden` y no trae texto en el DOM (las
 *   palabras son `content: attr(data-word)`, utility `word-from-data`). El
 *   texto indexable y accesible es el `sr-only` que pone el hero: no cambia
 *   nunca y los lectores de pantalla no anuncian nada.
 * - Primer render (server e hidratación): la primera palabra, sin animación
 *   en la ranura ya reservada. No hay flash ni mismatch.
 * - Secuencial, sin solapamiento: hay UN solo elemento de palabra. Primero
 *   sale la actual; su `animationend` cambia la palabra y monta la entrante.
 *   Encadenado por eventos, no por timers, así no se desincroniza.
 * - Ancho FIJO, sin JS: la ranura es un `inline-grid` con todas las palabras
 *   apiladas en la misma celda como fantasmas invisibles (también con
 *   `attr(data-word)`, sin texto en el DOM). Mide lo que la más ancha en
 *   cualquier fuente y breakpoint, así nada de la línea se mueve. La palabra
 *   visible va al FINAL de la celda (`justify-self-end`), pegada a la coma:
 *   la diferencia de AUTO a MOTO (~0,17em) queda como un poco más de aire
 *   después de "tu", que se nota mucho menos que un hueco antes de la coma.
 * - `overflow-hidden` recorta la caída a la línea; el `py-2 -my-2` le da aire
 *   a los acentos y descendentes sin cambiar el alto de la línea, y
 *    `align-bottom` mantiene la base alineada con el resto (un `inline-grid`
 *   con overflow toma como base su borde de abajo).
 * - No rota con `prefers-reduced-motion` (se consulta en vivo) ni con la
 *   pestaña oculta (`visibilitychange`): el intervalo se frena.
 * - Loop infinito y SIN control de pausa: excepción aprobada por producto
 *   (2026-11-26). WCAG 2.2.2 (Pausar, detener, ocultar) no se cumple acá a
 *   propósito; ver AGENTS.md §3.
 */
export function HeroRotatingWord({ words, className }: HeroRotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  // Cambia en cada fase animada: remonta el elemento y la animación arranca
  // de cero aunque una anterior haya quedado cortada (p. ej. isla oculta).
  const [run, setRun] = useState(0);
  const total = words.length;

  useEffect(() => {
    if (total < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let timer: number | undefined;

    const advance = () => {
      setPhase("out");
      setRun((current) => current + 1);
    };
    const stop = () => {
      window.clearInterval(timer);
      timer = undefined;
    };
    const sync = () => {
      if (document.hidden || reducedMotion.matches) stop();
      else if (timer === undefined) timer = window.setInterval(advance, INTERVAL_MS);
    };

    sync();
    document.addEventListener("visibilitychange", sync);
    reducedMotion.addEventListener("change", sync);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", sync);
      reducedMotion.removeEventListener("change", sync);
    };
  }, [total]);

  const handleAnimationEnd = () => {
    if (phase === "out") {
      // La saliente ya no se ve: recién ahora entra la siguiente.
      setIndex((current) => (current + 1) % total);
      setPhase("in");
      setRun((current) => current + 1);
    } else if (phase === "in") {
      setPhase("idle");
    }
  };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative -my-2 inline-grid overflow-hidden py-2 align-bottom whitespace-nowrap",
        className,
      )}
    >
      {/* Fantasmas: reservan el ancho de la palabra más ancha. */}
      {words.map((word) => (
        <span
          key={`ghost-${word}`}
          data-word={word}
          className="word-from-data invisible col-start-1 row-start-1"
        />
      ))}
      <span
        key={run}
        data-word={words[index] ?? words[0]}
        onAnimationEnd={handleAnimationEnd}
        className={cn(
          "word-from-data col-start-1 row-start-1 justify-self-end",
          phase === "out" && "animate-hero-word-out",
          phase === "in" && "animate-hero-word-in",
        )}
      />
    </span>
  );
}
