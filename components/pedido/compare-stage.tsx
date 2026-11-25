"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

type View = "whatsapp" | "app";

export type CompareVideo = {
  readonly src: string;
  readonly poster: string;
  /** Segundo en que arranca y termina el tramo que se muestra. */
  readonly start: number;
  readonly end: number;
  readonly label: string;
};

/** Un mensaje del chat aparece en `clip` (índice de video), segundo `at`. */
export type CompareCue = {
  readonly clip: number;
  readonly at: number;
  readonly step: number;
};

type CompareStageProps = {
  /** Mitad de WhatsApp (izquierda), armada en el server. */
  readonly whatsapp: React.ReactNode;
  /** Etiqueta "En la app" de la mitad derecha (solo desde `lg`). */
  readonly appTag: React.ReactNode;
  readonly videos: readonly CompareVideo[];
  readonly cues: readonly CompareCue[];
  readonly copy: {
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

/** Clip y segundo del cuadro quieto (server, sin JS, movimiento reducido): llegan las propuestas. */
const STILL = { clip: 1, time: 21 } as const;
/** Pausa en el último cuadro antes de volver a empezar (ms). */
const LOOP_HOLD_MS = 1800;

/** Paso del chat para un momento del recorrido: el último cue que ya pasó. */
function stepAt(
  cues: readonly CompareCue[],
  clip: number,
  time: number,
): number {
  let step = 0;
  for (const cue of cues) {
    if (cue.clip < clip || (cue.clip === clip && cue.at <= time))
      step = cue.step;
  }
  return step;
}

/**
 * "WhatsApp / app" en paralelo (experimento del 2026-11-25). El RELOJ es el
 * video de la app: los tres tramos (pedís, comparás, elegís) se reproducen
 * en fila y el chat de WhatsApp avanza leyendo `currentTime` en cada cuadro
 * (`requestAnimationFrame`), así que los dos lados no se pueden desfasar.
 * Los pasos de abajo son botones: saltan los dos lados al mismo momento.
 *
 * Desde `lg` las dos mitades se ven a la vez; en celular un toggle elige
 * cuál (las dos siguen en el HTML). Los videos no bajan nada hasta que la
 * sección está cerca de la pantalla (`preload="none"` + póster), corren
 * mudos y en línea, se pausan fuera de pantalla y, con movimiento reducido,
 * no arrancan solos: queda el cuadro de las propuestas y el botón de play.
 */
export function CompareStage({
  whatsapp,
  appTag,
  videos,
  cues,
  copy,
}: CompareStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [view, setView] = useState<View>("whatsapp");
  const [clip, setClip] = useState<number>(STILL.clip);
  // El clip activo también en un ref: `onPlay` puede llegar antes del render
  // que actualiza `clip`, y con el estado viejo no arrancaría el reloj.
  const clipRef = useRef<number>(STILL.clip);
  const [step, setStep] = useState(() => stepAt(cues, STILL.clip, STILL.time));
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [visible, setVisible] = useState(false);
  const [near, setNear] = useState(false);
  const [reduced, setReduced] = useState(true);
  const started = useRef(false);
  /** Segundo pedido para cada video: se aplica cuando carga (antes, el navegador lo ignora). */
  const wanted = useRef<number[]>(videos.map((video) => video.start));

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  // `near`: empezar a bajar el video un poco antes de que se vea.
  // `visible`: reproducir solo con el escenario en pantalla.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nearObserver = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setNear(true),
      {
        rootMargin: "600px 0px",
      },
    );
    const visibleObserver = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      {
        threshold: 0.35,
      },
    );
    nearObserver.observe(root);
    visibleObserver.observe(root);
    return () => {
      nearObserver.disconnect();
      visibleObserver.disconnect();
    };
  }, []);

  /** Lleva los dos lados a `index`/`time` y reproduce (o deja quieto). */
  const goTo = useCallback(
    (index: number, time: number, play: boolean) => {
      videoRefs.current.forEach((video, i) => {
        if (!video || i === index) return;
        video.pause();
      });
      const video = videoRefs.current[index];
      clipRef.current = index;
      setClip(index);
      setStep(stepAt(cues, index, time));
      wanted.current[index] = time;
      if (!video) return;
      video.currentTime = time;
      if (play) void video.play().catch(() => setPlaying(false));
    },
    [cues],
  );

  const autoplay = !reduced && visible && !userPaused;

  // Arranque y pausa automáticos (pantalla, pausa del usuario, movimiento reducido).
  useEffect(() => {
    const video = videoRefs.current[clip];
    if (!video) return;
    if (autoplay) {
      if (!started.current) {
        started.current = true;
        goTo(0, videos[0].start, true);
        return;
      }
      void video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [autoplay, clip, goTo, videos]);

  // El reloj: en cada cuadro, el chat lee el tiempo del video activo.
  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let hold: number | undefined;
    const tick = () => {
      const video = videoRefs.current[clip];
      if (video) {
        const { end } = videos[clip];
        setStep(stepAt(cues, clip, video.currentTime));
        if (video.currentTime >= end || video.ended) {
          video.pause();
          const next = clip + 1;
          if (next < videos.length) {
            goTo(next, videos[next].start, true);
          } else {
            hold = window.setTimeout(
              () => goTo(0, videos[0].start, true),
              LOOP_HOLD_MS,
            );
          }
          return;
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(hold);
    };
  }, [playing, clip, cues, goTo, videos]);

  function togglePlay() {
    const video = videoRefs.current[clip];
    if (!video) return;
    if (playing) {
      setUserPaused(true);
      video.pause();
    } else {
      setUserPaused(false);
      started.current = true;
      void video.play().catch(() => setPlaying(false));
    }
  }

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
        className="cmp grid h-130 overflow-clip rounded-panel border border-card-line lg:h-150 lg:grid-cols-2"
      >
        <div className={cn("relative", view !== "whatsapp" && "max-lg:hidden")}>
          {whatsapp}
        </div>

        <div
          className={cn("relative bg-ink", view !== "app" && "max-lg:hidden")}
        >
          {appTag}
          {/* Mismo marco y medida que el teléfono de WhatsApp (`cmp-phone`). */}
          <div className="cmp-phone border-on-dark-subtle bg-card">
            {videos.map((video, index) => (
              <video
                key={video.src}
                ref={(element) => {
                  videoRefs.current[index] = element;
                }}
                src={near ? video.src : undefined}
                poster={video.poster}
                preload={near && index === clip ? "auto" : "none"}
                muted
                playsInline
                disablePictureInPicture
                aria-label={video.label}
                onLoadedMetadata={(event) => {
                  event.currentTarget.currentTime = wanted.current[index];
                }}
                onPlay={() => index === clipRef.current && setPlaying(true)}
                onPause={() => index === clipRef.current && setPlaying(false)}
                className={cn(
                  "absolute inset-0 size-full object-cover object-top transition-opacity duration-300 motion-reduce:transition-none",
                  index === clip ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <ol
          aria-label={copy.beatsLabel}
          className="grid flex-1 list-none grid-cols-3 gap-2 sm:gap-3"
        >
          {copy.beats.map((item, index) => (
            <li key={item.title}>
              <button
                type="button"
                aria-current={index === clip ? "step" : undefined}
                onClick={() => {
                  setUserPaused(false);
                  started.current = true;
                  goTo(index, videos[index].start, true);
                }}
                className={cn(
                  "flex min-h-11 w-full flex-col gap-0.5 border-t-2 pt-2.5 text-left transition-colors hover:border-fg-muted motion-reduce:transition-none",
                  index === clip ? "border-action" : "border-card-line",
                )}
              >
                <span className="font-display text-sm leading-tight font-semibold text-fg sm:text-base">
                  <span
                    aria-hidden="true"
                    className="text-fg-subtle max-sm:hidden"
                  >
                    {index + 1}.{" "}
                  </span>
                  {item.title}
                </span>
                {/* En celular, solo los títulos: los tres pasos en una fila. */}
                <span className="hidden text-sm text-fg-muted sm:block">
                  {item.body}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? copy.pause : copy.play}
          className="flex size-11 shrink-0 items-center justify-center rounded-full border border-control-line-strong bg-card text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none"
        >
          <Icon name={playing ? "pause" : "play"} size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
