"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/** Cuánto dura cada paso (ms). 7 pasos: pedís (0-2), propuestas (3-4), elegís (5-6). */
const STEP_MS = [1400, 1600, 2400, 1300, 3200, 2600, 3000] as const;
/** El cuadro quieto: server, sin JS y con `prefers-reduced-motion`. */
const STILL_STEP = 4;
/** Paso → qué tarjeta de la línea de tiempo se marca. */
const BEAT_OF_STEP = [0, 0, 0, 1, 1, 2, 2] as const;

type CompareStageProps = {
  /** Capa de WhatsApp (izquierda), armada en el server. */
  readonly whatsapp: React.ReactNode;
  /** Capa de la app (derecha), armada en el server. */
  readonly app: React.ReactNode;
  readonly copy: {
    readonly sliderLabel: string;
    readonly pause: string;
    readonly play: string;
    readonly beatsLabel: string;
    readonly beats: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
  /** `aria-valuetext` del slider, ya armado para cada posición (0 a 100, de a 5). */
  readonly valueTexts: Readonly<Record<number, string>>;
};

/**
 * Comparador "WhatsApp / app" (experimento del 2026-11-25): las dos capas
 * ocupan el mismo escenario y la de la app se recorta con `clip-path` desde
 * la posición del slider. El slider es un `<input type="range">` nativo
 * transparente sobre todo el escenario: se arrastra desde cualquier punto,
 * se maneja con flechas y lo leen los lectores de pantalla.
 *
 * La animación es un paso (`data-step`) que avanza con un timer solo
 * mientras el escenario está en pantalla, no está en pausa y no se pidió
 * movimiento reducido. Todo lo que se mueve es CSS (`globals.css`, `.cmp`).
 */
export function CompareStage({
  whatsapp,
  app,
  copy,
  valueTexts,
}: CompareStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [step, setStep] = useState<number>(STILL_STEP);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [canAnimate, setCanAnimate] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setCanAnimate(!query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.35 },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  const running = canAnimate && visible && !paused;

  // Al empezar a correr por primera vez, arranca desde el principio.
  const started = useRef(false);
  useEffect(() => {
    if (!running || started.current) return;
    started.current = true;
    setStep(0);
  }, [running]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setStep((current) => (current + 1) % STEP_MS.length),
      STEP_MS[step],
    );
    return () => window.clearTimeout(timer);
  }, [running, step]);

  const beat = BEAT_OF_STEP[step];
  const rounded = Math.round(position / 5) * 5;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={rootRef}
        data-step={step}
        className="cmp relative h-110 overflow-clip rounded-panel border border-card-line select-none md:h-126"
        style={{ "--cmp-pos": `${position}%` } as React.CSSProperties}
      >
        <div className="absolute inset-0">{whatsapp}</div>
        <div className="absolute inset-0 [clip-path:inset(0_0_0_var(--cmp-pos))]">
          {app}
        </div>

        {/* La línea y la manija: solo dibujo, el control es el range. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-(--cmp-pos) w-0.5 -translate-x-1/2 bg-card"
        >
          <span className="absolute top-1/2 left-1/2 flex size-11 -translate-1/2 items-center justify-center gap-0.5 rounded-full border border-card-line bg-card text-fg">
            <Icon name="arrow-left" size={14} strokeWidth={2.2} />
            <Icon name="arrow-right" size={14} strokeWidth={2.2} />
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(Number(event.target.value))}
          aria-label={copy.sliderLabel}
          aria-valuetext={valueTexts[rounded]}
          className="peer absolute inset-0 size-full cursor-ew-resize touch-pan-y opacity-0"
        />
        {/* Foco visible del range (que es transparente): anillo en el escenario. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-panel peer-focus-visible:outline-2 peer-focus-visible:-outline-offset-2 peer-focus-visible:outline-brand"
        />
      </div>

      <div className="flex items-start gap-4">
        <ol
          aria-label={copy.beatsLabel}
          className="grid flex-1 list-none gap-3 sm:grid-cols-3"
        >
          {copy.beats.map((item, index) => (
            <li
              key={item.title}
              aria-current={index === beat ? "step" : undefined}
              className={cn(
                "flex flex-col gap-0.5 border-t-2 pt-2.5 transition-colors motion-reduce:transition-none",
                index === beat ? "border-action" : "border-card-line",
              )}
            >
              <p className="font-display text-base font-semibold text-fg">
                <span aria-hidden="true" className="text-fg-subtle">
                  {index + 1}.{" "}
                </span>
                {item.title}
              </p>
              <p className="text-sm text-fg-muted">{item.body}</p>
            </li>
          ))}
        </ol>
        {canAnimate ? (
          <button
            type="button"
            onClick={() => setPaused((value) => !value)}
            aria-label={paused ? copy.play : copy.pause}
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-control-line-strong bg-card text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none"
          >
            <Icon name={paused ? "play" : "pause"} size={18} strokeWidth={2} />
          </button>
        ) : null}
      </div>
    </div>
  );
}
