import { Breadcrumbs, type Crumb } from "@/components/marketing/breadcrumbs";
import { ProvidersPlansGrid } from "@/components/sections/providers/plans-grid";
import { Section } from "@/components/ui/section";
import { providersPlansContent } from "@/lib/content/providers-plans";

/**
 * Cabecera de `/proveedores/planes` (lienzo `Planes`): migas, rótulo, el
 * único `<h1>` (el LCP, texto del server) y la bajada, centrados, y los
 * planes enseguida en la misma banda. Clases canónicas: la línea base tenía
 * valores arbitrarios en el `<h1>` y en la bajada.
 */
export function ProvidersPlansHeroSection({ breadcrumbs }: { readonly breadcrumbs: readonly Crumb[] }) {
  const { hero, breadcrumb } = providersPlansContent;

  return (
    <Section tone="card" spacing="sm" aria-labelledby="planes-titulo" className="border-t-0 pt-5 md:pt-7">
      <Breadcrumbs items={breadcrumbs} label={breadcrumb.label} />

      <div className="mx-auto mt-8 flex max-w-200 flex-col items-center gap-3 text-center md:mt-10">
        <p className="text-sm font-semibold text-brand-hover">{hero.eyebrow}</p>
        <h1
          id="planes-titulo"
          className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl lg:text-display-sm"
        >
          {hero.titleLines[0]}
          <br className="hidden md:block" /> {hero.titleLines[1]}
        </h1>
        <p className="max-w-150 text-lead text-fg-muted md:text-lead-lg">{hero.subtitle}</p>
      </div>

      <div className="mt-10 md:mt-12">
        <ProvidersPlansGrid />
      </div>
    </Section>
  );
}
