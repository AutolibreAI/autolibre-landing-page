import Image from "next/image";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

/**
 * Todo trazo con `non-scaling-stroke`: el dibujo escala con la columna, pero
 * la línea mide siempre 2px en pantalla, como los íconos de línea del sitio.
 * `vector-effect` no se hereda, así que va en cada forma.
 */
const stroke = { vectorEffect: "non-scaling-stroke" } as const;

type ScatteredIsotype = {
  readonly id: string;
  /** Posición, tamaño, giro y opacidad: clases canónicas de Tailwind. */
  readonly className: string;
  /** Ancho renderizado en px, para el `sizes` del srcset. */
  readonly size: number;
};

/**
 * Tres isotipos sueltos alrededor del auto (decisión 2026-10-02). Parecen
 * tirados al azar, pero las posiciones son FIJAS a propósito: nada de
 * `Math.random`, así el HTML es determinístico (server y cliente coinciden,
 * la página sigue siendo estática) y cada isotipo tiene su lugar reservado
 * en porcentaje de la caja, que escala con ella sin mover nada: CLS 0.
 * Elegidas para no pisar el auto, la ruta ni el pin.
 */
const scatteredIsotypes: readonly ScatteredIsotype[] = [
  { id: "abajo-izquierda", className: "top-24/25 left-1/25 w-10 -rotate-12 opacity-80", size: 40 },
  { id: "arriba-centro", className: "-top-1/25 left-1/2 w-14 rotate-8 opacity-70", size: 56 },
  { id: "abajo-derecha", className: "top-4/5 left-9/10 w-7 rotate-18 opacity-60", size: 28 },
];

/**
 * Ilustración del hero de "Sobre nosotros" (decisión de producto
 * 2026-10-02): un auto de perfil, en línea de tinta, que avanza por la ruta
 * de la home y llega a un pin. Es el mismo motivo "te llevamos a lo que
 * necesitás", extendido; la excepción a "nada es decorativo" está acotada a
 * este uso y al hilo de la línea de tiempo (ver `DESIGN.md`).
 *
 * - La ruta copia el trazo de la ruta del hero de la home
 *   (`components/sections/home/hero.tsx`): `stroke-brand/60`, 2px, punteado
 *   `0.5 9` con puntas redondas y `non-scaling-stroke`.
 * - El pin es HTML encima del SVG, como en la home, para que no se deforme
 *   ni engorde con el escalado: es el ícono `pin` del sistema, con la punta
 *   apoyada justo sobre el final de la ruta (480 × 7/8 = 420,
 *   300 × 3/8 = 112.5 en el `viewBox`). El trazo de 1 sobre 24 a 48px da
 *   los mismos 2px que el auto.
 * - El auto: pocos trazos y geométrico (carrocería, dos ventanillas, la
 *   puerta, la manija, el faro y las ruedas como círculos), sin sombras.
 *   Mira a la derecha, hacia el pin.
 *
 * - Alrededor, tres isotipos sueltos (`scatteredIsotypes`), también parte
 *   de la excepción: posiciones fijas, sin movimiento.
 *
 * Solo desde `lg` (lo decide quien lo usa con `hidden lg:block`): en mobile
 * el `h1` sigue siendo la LCP y el layout no cambia. La caja tiene la misma
 * proporción que el `viewBox` (`aspect-8/5` = 480 × 300) y reserva su lugar
 * antes de pintar: CLS 0. Decorativa entera (`aria-hidden`), sin movimiento.
 */
export function AboutRouteIllustration({ className }: { readonly className?: string }) {
  return (
    <div aria-hidden="true" className={cn("relative aspect-8/5 w-full", className)}>
      <svg
        focusable="false"
        viewBox="0 0 480 300"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute inset-0 size-full overflow-visible"
      >
        {/* La ruta: nace detrás del auto, corre bajo sus ruedas y sube
            hasta la punta del pin. Termina unos px antes (y=124) para que
            el último punto no se pegue a la punta. */}
        <path
          d="M16 260H336C380 260 404 244 412 212C417 192 420 158 420 124"
          strokeWidth={2}
          strokeDasharray="0.5 9"
          className="stroke-brand/60"
          {...stroke}
        />

        {/* El auto, apoyado sobre la ruta (las ruedas tocan y=260). */}
        <g strokeWidth={2} className="stroke-ink">
          {/* Carrocería en un solo trazo, con los pasarruedas recortados
              (r 30 sobre ruedas de r 25). */}
          <path
            d="M140 235H240A30 30 0 0 1 300 235H318Q326 235 326 227V206Q326 194 314 192L268 184L232 146Q228 142 222 142H146Q140 142 136 146L104 184L66 186Q54 188 54 200V227Q54 235 62 235H80A30 30 0 0 1 140 235Z"
            {...stroke}
          />
          {/* Ventanillas: trasera y delantera, paralelas a los parantes. */}
          <path d="M116 178L140 150H180V178Z" {...stroke} />
          <path d="M190 178V150H228L254 178Z" {...stroke} />
          {/* Puerta, manija y faro. */}
          <path d="M185 188V224M196 198H206M312 202H320" {...stroke} />
          {/* Ruedas: llanta y maza. */}
          <circle cx="110" cy="235" r="25" {...stroke} />
          <circle cx="110" cy="235" r="7" {...stroke} />
          <circle cx="270" cy="235" r="25" {...stroke} />
          <circle cx="270" cy="235" r="7" {...stroke} />
        </g>
      </svg>

      {scatteredIsotypes.map((isotype) => (
        <Image
          key={isotype.id}
          src="/brand/isotype.png"
          alt=""
          width={450}
          height={407}
          sizes={`${isotype.size}px`}
          draggable={false}
          className={cn("pointer-events-none absolute h-auto select-none", isotype.className)}
        />
      ))}

      {/* La punta del pin (12, 21 en su caja de 24) cae en el ancla:
          `-translate-x-1/2` la centra y `-translate-y-7/8` (21/24) la baja
          hasta el punto. */}
      <Icon
        name="pin"
        size={48}
        strokeWidth={1}
        className="absolute top-3/8 left-7/8 -translate-x-1/2 -translate-y-7/8 text-brand"
      />
    </div>
  );
}
