import { sectionTitle } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";
import { siteContent } from "@/lib/content/site";
import { cn } from "@/lib/utils";

/** Fondo del panel de cada tarjeta: tokens con `fg` encima (≥ 11:1). */
const panelTones = {
  "brand-50": "bg-brand-50 text-fg",
  "on-dark": "bg-on-dark text-fg",
  "brand-200": "bg-brand-200 text-fg",
} as const;

/**
 * Beneficios de aliados: una fila de tarjetas que en celular se desliza con
 * scroll horizontal nativo (CSS, sin JS ni carrusel). Todas las tarjetas
 * están en el HTML y en el orden de lectura; cada una es un link externo
 * entero, con el título como `h3`.
 *
 * Sin evento propio, como el carrusel anterior: son salidas a un aliado.
 * La Esquina del Neumático sigue afuera hasta que producto la confirme.
 */
export function AlliesSection() {
  const { title, items } = homeContent.allies;
  const { externalHint } = siteContent.nav;

  return (
    <Section id="aliados" tone="canvas" spacing="md" aria-labelledby="aliados-title">
      <h2 id="aliados-title" className={sectionTitle}>
        {title}
      </h2>
      {/* En celular la fila scrollea; cada tarjeta es un link, así que el
          teclado la recorre con Tab y el navegador la desplaza solo.
          `relative`: los `sr-only` (absolutos) quedan dentro del scroll; sin
          él se escapan al viewport y en celular la página se achica. */}
      <ul
        aria-label={title}
        className="relative mt-5.5 -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-1 md:grid md:grid-cols-3 md:overflow-visible"
      >
        {items.map((item) => (
          <li key={item.id} className="flex w-64 shrink-0 snap-start md:w-auto">
            <a
              href={item.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full flex-col overflow-clip rounded-card border border-card-line bg-card text-fg transition-colors hover:border-action motion-reduce:transition-none"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-30 items-end px-5 pb-4 font-display text-4xl leading-none font-bold tracking-tight",
                  panelTones[item.tone],
                )}
              >
                {item.highlight}
              </span>
              <span className="flex flex-1 flex-col gap-1 px-5 pt-4 pb-4.5">
                <span className="text-label font-semibold text-fg-muted">{item.partner}</span>
                <h3 className="font-display text-lg leading-snug font-semibold">{item.title}</h3>
                <span className="text-sm text-fg-muted">{item.body}</span>
                <span className="mt-auto pt-3 text-control font-semibold">
                  {item.cta.label} <span aria-hidden="true">→</span>
                  <span className="sr-only"> {externalHint}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </Section>
  );
}
