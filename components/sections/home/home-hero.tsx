import { ModuloPedido } from "@/components/modulo-pedido/modulo-pedido";
import { Section } from "@/components/ui/section";
import { QUOTE_MODULE_PLACEMENTS } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/** Ancla del hero: la usan la barra fija del celular y el "Hacé tu pedido" del Home. */
export const HOME_PEDIDO_ID = "pedido";

/**
 * Hero del Home (rediseño 2026-11): el `<h1>` centrado, la bajada y el módulo
 * de pedido con Taller elegido. Debajo, tres cifras publicables.
 *
 * Server Component. El LCP es texto (el `<h1>`): sale en el HTML del server,
 * con `next/font` (`display: swap` y fallback métrico), sin animación ni
 * `reveal`. Los íconos de las pestañas son chicos y no compiten.
 *
 * Outline: h1 → h2 de los paneles del módulo (Auxilio, Multas, paso 2).
 */
export function HomeHero() {
  const { title, subtitle, facts } = homeContent.hero;

  return (
    <Section
      id={HOME_PEDIDO_ID}
      tone="card"
      spacing="sm"
      aria-labelledby="hero-title"
      // `min-h-below-header`: el hero ocupa al menos la pantalla menos el
      // header sticky, así la sección siguiente no se asoma en la primera
      // pantalla. Contenido alineado ARRIBA, no centrado: las pestañas del
      // módulo cambian el alto del panel (Taller → Auxilio, paso 2, enviado)
      // y centrado movería las pestañas debajo del dedo al tocarlas.
      className="min-h-below-header border-t-0 scroll-mt-17"
    >
      <div className="flex flex-col items-center text-center">
        <h1
          id="hero-title"
          className="max-w-180 font-display text-display-xs font-bold tracking-tight text-balance text-fg xs:text-display-sm sm:text-display-md lg:text-display-lg"
        >
          {title}
        </h1>
        <p className="mt-3.5 max-w-140 text-lead text-pretty text-fg-muted md:text-lead-lg">
          {subtitle}
        </p>
      </div>

      <ModuloPedido placement={QUOTE_MODULE_PLACEMENTS.home} idPrefix="home-pedido" className="mt-6" />

      <ul className="mx-auto mt-8 flex max-w-230 flex-wrap justify-center gap-x-10 gap-y-2.5 border-t border-card-line pt-5 text-control text-fg-muted">
        {facts.map((fact) => (
          <li key={fact.id} className="flex items-baseline gap-2">
            <strong className="font-display text-xl font-bold text-fg">{fact.value}</strong>
            {fact.label}
          </li>
        ))}
      </ul>
    </Section>
  );
}
