"use client";

import { useEffect, useState } from "react";

/** Cada cuánto cambia el ejemplo. */
const INTERVAL_MS = 3000;
/** Lo que dura el fundido de salida antes de cambiar el texto. */
const FADE_MS = 200;

/**
 * Placeholder que rota por una lista de ejemplos ("Ej.: hace ruido al
 * frenar", …) en un input que ya tiene su `<label>` visible.
 *
 * - El primer render (server e hidratación) usa `phrases[0]`: el HTML del
 *   server ya trae el placeholder y no hay flash ni mismatch.
 * - Se frena con el campo enfocado o con texto (`paused`): al enfocar, la
 *   persona escribe sobre un placeholder quieto.
 * - Con `prefers-reduced-motion: reduce` no rota (queda la primera frase) y
 *   no hay fundido. Se consulta en cada tick: si la preferencia cambia en
 *   vivo, se respeta desde ahí.
 * - Nada de `aria-live`: el placeholder es un atributo del input y los
 *   lectores de pantalla no anuncian sus cambios en un campo sin foco (y con
 *   foco no rota). El nombre accesible sigue siendo el `<label>`.
 *
 * `fading` es para el fundido: el call site pone el placeholder en opacidad 0
 * mientras dura (con `motion-reduce:` sin transición).
 */
export function useRotatingPlaceholder(phrases: readonly string[], paused: boolean) {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const total = phrases.length;

  useEffect(() => {
    if (paused || total < 2) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let fadeTimer: number | undefined;
    const timer = window.setInterval(() => {
      if (reducedMotion.matches) return;
      setFading(true);
      fadeTimer = window.setTimeout(() => {
        setIndex((current) => (current + 1) % total);
        setFading(false);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => {
      window.clearInterval(timer);
      window.clearTimeout(fadeTimer);
      // Si se frenó a mitad del fundido, el placeholder vuelve a verse.
      setFading(false);
    };
  }, [paused, total]);

  return { placeholder: phrases[index] ?? phrases[0], fading } as const;
}
