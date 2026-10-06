import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Misión y visión como un libro de registro (el mismo lenguaje que "Últimas
 * notas" del blog): regla bajo el `h2` y dos renglones separados por un
 * hairline. El `h2` se ve chico, como rótulo, pero es el nivel que le toca
 * en el outline.
 *
 * Banda de tinta a todo el ancho (decisión 2026-10-02): `Section tone="ink"`
 * ya pinta el fondo de borde a borde y deja el contenido en el `Container`
 * de siempre, alineado con el header. Sobre tinta, con la paleta de la ruta
 * oscura `/descarga`: texto blanco, rótulos en `brand-soft` (5.01:1 sobre
 * tinta; `brand-hover` no llega), divisores `white/12` y la regla del `h2`
 * en `white/30`, un escalón más fuerte que los divisores como lo era la
 * tinta frente al hairline. El anillo de foco se acota a `brand-soft` (el
 * verde global mide 3.47:1 sobre tinta): hoy la banda no tiene links, pero
 * el que se sume ya nace con el anillo correcto.
 */
export function AboutPurpose() {
  const { title, mission, vision } = aboutContent.purpose;

  return (
    <Section
      tone="ink"
      spacing="md"
      className="[&_a:focus-visible]:outline-brand-soft"
      aria-labelledby="mision-vision"
    >
      <h2 id="mision-vision" className="border-b border-white/30 pb-4 text-2xl text-white">
        {title}
      </h2>
      <div className="reveal-group">
        {[mission, vision].map((item) => (
          <div
            key={item.label}
            className="grid gap-3 border-b border-white/12 py-8 last:border-b-0 md:py-10 lg:grid-cols-12 lg:gap-8"
          >
            <h3 className="text-label font-semibold tracking-wider text-brand-soft uppercase lg:col-span-3 lg:pt-2">
              {item.label}
            </h3>
            <p className="max-w-240 font-display text-2xl leading-snug font-semibold text-balance text-white md:text-3xl lg:col-span-9">
              {item.statement}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
