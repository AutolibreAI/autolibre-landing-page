import Image from "next/image";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/heading";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { StoreLinks } from "@/components/ui/store-links";
import { homeContent } from "@/lib/content/home";

/** Ciclos de las animaciones del hero. Deben coincidir con `globals.css`:
 *  distintos a propósito, así palabras y pantallas no cambian juntas. */
const WORD_CYCLE_SECONDS = 20;
const SCREEN_CYCLE_SECONDS = 24;

/**
 * Delay negativo: cada elemento arranca ya "en su fase", sin frame vacío.
 * Cada lista reparte su propio ciclo en sus propios pasos.
 */
function stepDelay(index: number, total: number, cycle: number) {
  return `${index * (cycle / total) - cycle}s`;
}

/**
 * Hero de la home: qué es AutoLibre. Server component, CERO JavaScript de
 * cliente — la animación es CSS puro.
 *
 * - `<h1>` = el eslogan, fijo. Justo debajo, al mismo tamaño y en verde,
 *   suben las palabras con un rebote (VTV, Multas, Seguros…). Todas están en el HTML
 *   del server (indexables); los lectores de pantalla leen `wordsSrText`.
 * - Un solo fondo `surface-muted` para todo el hero. El teléfono cicla sus
 *   pantallas por su cuenta, sin relación con las palabras.
 * - Único adorno: una ruta punteada que termina en un pin junto al
 *   teléfono (desde `xl`, estática).
 * - `prefers-reduced-motion`: nada se mueve; quedan la primera palabra y la
 *   primera pantalla fijas.
 * - Sin control de pausa por decisión de producto (2026-09-22). Ojo: WCAG
 *   2.2.2 lo pide para movimiento automático de más de 5s.
 *
 * `id="descargar"` (destino del CTA del header) vive en las tiendas.
 */
export function HeroSection() {
  const {
    titleLines,
    subtitle,
    downloadNote,
    quoteLink,
    words,
    wordsSrText,
    screens,
    phoneLabel,
  } = homeContent.hero;

  return (
    <section
      id="producto"
      aria-labelledby="hero-title"
      className="bg-surface-muted"
    >
      <Container size="wide" className="relative isolate">
        {/* Ruta con pin (desde `xl`: entre 1024 y 1279px el 60% cae detrás
            del teléfono y el pin quedaba tapado). Una línea punteada que pasa POR
            DEBAJO del bloque de texto — nunca cruza lo que hay que leer —,
            sube por el espacio entre columnas y termina en un pin junto al
            teléfono. El SVG se estira con el layout (`preserveAspectRatio
            none`) y `non-scaling-stroke` mantiene los puntos del mismo
            tamaño en cualquier ancho. El pin es HTML, ubicado en el mismo
            punto donde termina la ruta (60%, 80%): así no se deforma. */}
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 -z-10 hidden size-full overflow-visible xl:block"
        >
          <path
            d="M-6 96C18 99 38 100 48 92C53 88 56 82 60 80"
            fill="none"
            vectorEffect="non-scaling-stroke"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="0.5 9"
            className="stroke-brand/60"
          />
        </svg>
        <span
          aria-hidden="true"
          className="absolute top-4/5 left-3/5 -z-10 hidden size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand ring-6 ring-brand/15 xl:block"
        />

        <div className="grid items-center gap-12 py-16 md:py-20 lg:grid-cols-2 lg:gap-16 lg:py-24">
          <div>
            <SectionHeading
              as="h1"
              size="display"
              id="hero-title"
              title={
                <>
                  {titleLines[0]}
                  <br />
                  {titleLines[1]}
                </>
              }
            />

            {/* Tercera línea del titular: mismo tamaño que el `<h1>`, en verde
                de marca (3.77:1 sobre `surface-muted`: alcanza porque a este
                tamaño es texto grande). Las palabras van apiladas en la misma
                celda y suben con un rebote; `overflow-hidden` es la máscara
                que las hace aparecer desde "adentro" del renglón. El `pb-2`
                deja lugar a los descendentes (la g de "Seguros"). */}
            <p className="font-display text-display-xs font-bold text-brand xs:text-display-sm sm:text-display-md xl:text-display-lg">
              <span className="sr-only">{wordsSrText}</span>
              <span aria-hidden="true" className="grid overflow-hidden pb-2">
                {words.map((word, index) => (
                  <span
                    key={word}
                    style={{
                      animationDelay: stepDelay(
                        index,
                        words.length,
                        WORD_CYCLE_SECONDS,
                      ),
                    }}
                    className={`col-start-1 row-start-1 animate-hero-word whitespace-nowrap motion-reduce:animate-none ${index > 0 ? "motion-reduce:invisible" : ""}`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            </p>

            <p className="mt-4 max-w-120 text-lead leading-relaxed text-ink/70 md:text-lead-lg">
              {subtitle}
            </p>

            <StoreLinks id="descargar" note={downloadNote} className="mt-10" />

            <p className="mt-6 text-base text-ink/70">
              {quoteLink.lead}{" "}
              <a
                href={quoteLink.href}
                className="inline-flex min-h-11 items-center font-semibold text-brand-hover underline decoration-brand-hover/40 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink"
              >
                {quoteLink.label}
              </a>
            </p>
          </div>

          <div className="flex justify-center">
            <PhoneFrame label={phoneLabel} className="w-64 lg:w-80">
              {screens.map((screen, index) => (
                <Image
                  key={screen.src}
                  src={screen.src}
                  alt=""
                  fill
                  // La primera pantalla es la candidata a LCP en desktop:
                  // `preload` (reemplaza a `priority`, deprecado en Next 16).
                  preload={index === 0}
                  sizes="(min-width: 1024px) 320px, 256px"
                  style={{
                    animationDelay: stepDelay(
                      index,
                      screens.length,
                      SCREEN_CYCLE_SECONDS,
                    ),
                  }}
                  className={`animate-hero-screen object-cover object-top motion-reduce:animate-none ${index > 0 ? "motion-reduce:hidden" : ""}`}
                />
              ))}
            </PhoneFrame>
          </div>
        </div>
      </Container>
    </section>
  );
}
