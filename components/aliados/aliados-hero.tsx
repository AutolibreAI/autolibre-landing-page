import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { aliadosContent } from "@/lib/content/aliados";

type AliadosHeroProps = {
  /**
   * Familias del catálogo con al menos un negocio activo. `null` si no se
   * pudo calcular: el dato "Rubros" no se muestra.
   */
  readonly activeCategoryCount: number | null;
};

/**
 * Apertura de `/aliados`: eyebrow, el único `h1`, la bajada, los dos CTA y
 * una ficha de datos. Una sola columna alineada a la izquierda.
 *
 * La ficha reusa el lenguaje de "registro" del hero de `/sobre-nosotros`
 * (regla en tinta arriba, renglones con hairline). Sin el conteo de rubros,
 * ese dato no se muestra: mejor un dato menos que uno inventado.
 *
 * Sin `reveal`: es lo que está en pantalla al cargar y el `h1` es la LCP.
 */
export function AliadosHero({ activeCategoryCount }: AliadosHeroProps) {
  const { eyebrow, title, lead, primaryCta, secondaryCta, facts } = aliadosContent.hero;

  const items = [
    { id: "negocios", label: facts.partners.label, value: facts.partners.value },
    ...(activeCategoryCount
      ? [
          {
            id: "rubros",
            label: facts.categories.label,
            value: facts.categories.value(activeCategoryCount),
          },
        ]
      : []),
    { id: "zona", label: facts.zone.label, value: facts.zone.value },
  ];

  return (
    <Section tone="muted" spacing="sm" className="md:pt-20" aria-labelledby="aliados-titulo">
      <div className="flex max-w-190 flex-col gap-4">
        <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">
          {eyebrow}
        </p>
        <h1
          id="aliados-titulo"
          className="font-display text-display-xs font-bold text-balance text-ink sm:text-display-sm md:text-display-md"
        >
          {title}
        </h1>
        <p className="max-w-150 text-lead leading-relaxed text-ink/70 md:text-lead-lg">{lead}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href={primaryCta.href} size="lg">
            {primaryCta.label}
          </ButtonLink>
          <ButtonLink href={secondaryCta.href} variant="outline" size="lg">
            {secondaryCta.label}
          </ButtonLink>
        </div>
      </div>

      {/* 1 columna en mobile, una fila desde `md` (una columna por dato). */}
      <dl className="mt-12 grid grid-cols-1 border-t border-ink md:mt-16 md:auto-cols-fr md:grid-flow-col md:gap-x-12">
        {items.map((item) => (
          // Un `<div>` por par `<dt>`/`<dd>`: válido dentro de un `<dl>`.
          //
          // Hairline en `ink/15` y no en `line`: sobre `surface-muted`, `line`
          // es el mismo color que el fondo y no se vería.
          <div key={item.id} className="flex flex-col gap-2 border-b border-ink/15 py-5 md:py-6">
            <dt className="text-label font-semibold tracking-wider text-brand-hover uppercase">
              {item.label}
            </dt>
            <dd className="font-display text-xl leading-tight font-semibold text-ink tabular-nums sm:text-2xl">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
