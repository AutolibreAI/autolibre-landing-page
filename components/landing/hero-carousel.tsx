'use client';

import { useState, useCallback } from "react";

/**
 * Slide configuration.
 * When you have real screenshots, replace `src` with the image path and set
 * `isEmpty` to false so the placeholder UI disappears.
 */
const SLIDES = [
  { id: 1, label: "Dashboard",       isEmpty: true, src: null },
  { id: 2, label: "Mi vehículo",     isEmpty: true, src: null },
  { id: 3, label: "Historial",       isEmpty: true, src: null },
  { id: 4, label: "Presupuestos",    isEmpty: true, src: null },
  { id: 5, label: "Mantenimiento",   isEmpty: true, src: null },
] as const;

export default function HeroCarousel() {
  const [active, setActive] = useState(0);

  const prev = useCallback(() =>
    setActive(i => (i - 1 + SLIDES.length) % SLIDES.length), []);
  const next = useCallback(() =>
    setActive(i => (i + 1) % SLIDES.length), []);

  const slide = SLIDES[active];

  return (
    <div className="al-carousel-root" aria-label="Vistas de la aplicación">
      {/* Phone frame */}
      <div className="al-carousel-frame">
        {/* Status bar */}
        <div className="al-carousel-statusbar">
          <span>AUTOLIBRE</span>
          <span className="al-carousel-dot" />
        </div>

        {/* Slide area */}
        <div className="al-carousel-stage" aria-live="polite">
          {slide.isEmpty ? (
            <div className="al-carousel-empty">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              <span>{slide.label}</span>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={slide.src!}
              alt={`Vista: ${slide.label}`}
              className="al-carousel-img"
            />
          )}
        </div>

        {/* Slide label pill */}
        <div className="al-carousel-label-pill">{slide.label}</div>
      </div>

      {/* Controls row */}
      <div className="al-carousel-controls">
        <button
          className="al-carousel-arrow"
          onClick={prev}
          aria-label="Diapositiva anterior"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* Dot indicators */}
        <div className="al-carousel-dots" role="tablist">
          {SLIDES.map((s, i) => (
            <button
              key={s.id}
              role="tab"
              aria-selected={i === active}
              aria-label={s.label}
              className={`al-carousel-dot-btn${i === active ? " al-carousel-dot-btn--active" : ""}`}
              onClick={() => setActive(i)}
            />
          ))}
        </div>

        <button
          className="al-carousel-arrow"
          onClick={next}
          aria-label="Siguiente diapositiva"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
