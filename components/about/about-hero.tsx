import { AboutRouteIllustration } from "@/components/about/about-route-illustration";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { aboutContent } from "@/lib/content/about";

/**
 * Apertura de "Sobre nosotros", sin foto: eyebrow, el único `h1` (la misión
 * en una frase), la bajada y una ficha de datos.
 *
 * Desde `lg` es un hero partido: texto en 7/12 y, en 5/12, la ilustración
 * del auto sobre la ruta (`AboutRouteIllustration`, decisión 2026-10-02).
 * Debajo de `lg` la ilustración no se muestra y el hero queda tipográfico
 * como antes. En 7/12 la columna mide ~490px a 1024px: el `h1` se queda en
 * `display-md` hasta `xl` (mismo criterio que el `display` de
 * `SectionHeading`) para no partirse en cuatro renglones.
 *
 * La ficha es un `<dl>` con el lenguaje de "registro" de Misión y visión y la
 * línea de tiempo: regla en tinta arriba y renglones separados por hairlines.
 * Va a todo el ancho, debajo de las dos columnas. 2 columnas → 3 desde `md`
 * → una sola fila desde `xl`. En esa fila las columnas se miden por su
 * contenido (`auto-cols-auto`) y el sobrante se reparte entre ellas: con 6
 * columnas iguales, "App Store, Google Play y web" quedaba en tres renglones
 * y "5" nadaba en el mismo ancho.
 *
 * Cada dato lleva su ícono en un pozo redondo ARRIBA del rótulo, no al lado:
 * apilado solo suma alto, y la fila de `xl` (que ya va justa a 1280px) no
 * gana ~56px por columna que la harían partirse.
 *
 * Sin `reveal`: es lo que está en pantalla al cargar, y el `h1` es la LCP
 * (sin imagen, no hay nada que precargar).
 */
export function AboutHero() {
  const { eyebrow, title, lead, facts } = aboutContent.hero;

  return (
    <Section spacing="sm" className="md:pt-20" aria-labelledby="sobre-nosotros-titulo">
      <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-16">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
            {eyebrow}
          </p>
          <h1
            id="sobre-nosotros-titulo"
            className="max-w-240 text-display-xs text-balance text-ink sm:text-display-sm md:text-display-md xl:text-display-lg"
          >
            {title}
          </h1>
          <p className="max-w-150 text-lead leading-relaxed text-ink/70 md:text-lead-lg">{lead}</p>
        </div>

        <AboutRouteIllustration className="hidden lg:col-span-5 lg:block" />
      </div>

      <dl className="mt-12 grid grid-cols-2 gap-x-6 border-t border-ink md:mt-16 md:grid-cols-3 md:gap-x-8 xl:auto-cols-auto xl:grid-flow-col xl:grid-cols-none xl:justify-between">
        {facts.map((fact) => (
          // Un `<div>` por par `<dt>`/`<dd>`: es válido dentro de un `<dl>` y
          // permite darle el renglón (hairline y padding) a cada dato.
          <div key={fact.id} className="flex flex-col gap-2 border-b border-line py-5 md:py-6">
            {/* El pozo va DENTRO del `<dt>`: en un `<div>` de `<dl>` solo
                caben `<dt>` y `<dd>`. Decorativo: el rótulo ya lo dice. */}
            <dt className="flex flex-col items-start gap-4 text-label font-semibold tracking-wider text-brand-hover uppercase">
              <span
                aria-hidden="true"
                className="flex size-11 items-center justify-center rounded-full bg-surface-muted"
              >
                <Icon name={fact.icon} size={22} />
              </span>
              {fact.label}
            </dt>
            <dd className="font-display text-xl leading-tight font-semibold text-balance text-ink tabular-nums sm:text-2xl">
              {fact.dateTime ? <time dateTime={fact.dateTime}>{fact.value}</time> : fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
