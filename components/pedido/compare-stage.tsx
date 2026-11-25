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

type View = "whatsapp" | "app";

type CompareStageProps = {
  /** Mitad de WhatsApp (izquierda), armada en el server. */
  readonly whatsapp: React.ReactNode;
  /** Mitad de la app (derecha), armada en el server. */
  readonly app: React.ReactNode;
  readonly copy: {
    /** Nombre del grupo del toggle de celular. */
    readonly toggleLabel: string;
    readonly whatsappLabel: string;
    readonly appLabel: string;
    readonly pause: string;
    readonly play: string;
    readonly beatsLabel: string;
    readonly beats: readonly {
      readonly title: string;
      readonly body: string;
    }[];
  };
};

/**
 * "WhatsApp / app" en movimiento (experimento del 2026-11-25, segunda
 * vuelta): desde `lg` las dos mitades se ven a la vez, una al lado de la
 * otra, y avanzan juntas como un video. En celular no entran las dos: un
 * toggle elige cuál se ve (las dos están siempre en el HTML; la otra solo
 * se esconde con CSS debajo de `lg`).
 *
 * La animación es un paso (`data-step`) que avanza con un timer solo
 * mientras el escenario está en pantalla, no está en pausa y no se pidió
 * movimiento reducido. Todo lo que se mueve es CSS (`globals.css`, `.cmp`).
 */
export function CompareStage({ whatsapp, app, copy }: CompareStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("whatsapp");
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
  const options: readonly {
    readonly id: View;
    readonly label: string;
    readonly icon: "whatsapp" | "smartphone";
  }[] = [
    { id: "whatsapp", label: copy.whatsappLabel, icon: "whatsapp" },
    { id: "app", label: copy.appLabel, icon: "smartphone" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toggle solo en celular: desde `lg` se ven las dos mitades. */}
      <div
        role="group"
        aria-label={copy.toggleLabel}
        className="grid grid-cols-2 gap-1 self-center rounded-full border border-card-line bg-card p-1 lg:hidden"
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            aria-pressed={view === option.id}
            onClick={() => setView(option.id)}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-full px-4 font-display text-control font-semibold transition-colors motion-reduce:transition-none",
              view === option.id
                ? "bg-action text-card"
                : "text-fg hover:bg-brand-50",
            )}
          >
            <Icon name={option.icon} size={18} strokeWidth={2} />
            {option.label}
          </button>
        ))}
      </div>

      <div
        ref={rootRef}
        data-step={step}
        className="cmp grid h-110 overflow-clip rounded-panel border border-card-line md:h-126 lg:grid-cols-2"
      >
        <div className={cn("relative", view !== "whatsapp" && "max-lg:hidden")}>
          {whatsapp}
        </div>
        <div className={cn("relative", view !== "app" && "max-lg:hidden")}>
          {app}
        </div>
      </div>

      <div className="flex items-start gap-4">
        <ol
          aria-label={copy.beatsLabel}
          className="grid flex-1 list-none grid-cols-3 gap-3"
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
              <p className="font-display text-sm leading-tight font-semibold text-fg sm:text-base">
                <span
                  aria-hidden="true"
                  className="max-sm:hidden text-fg-subtle"
                >
                  {index + 1}.{" "}
                </span>
                {item.title}
              </p>
              {/* En celular, solo los títulos: los tres pasos en una fila. */}
              <p className="hidden text-sm text-fg-muted sm:block">
                {item.body}
              </p>
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
