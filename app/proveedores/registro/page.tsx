import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ProvidersHeroSection } from "@/components/sections/providers/hero";
import { ProvidersPlansBannerSection } from "@/components/sections/providers/plans-banner";
import { ProvidersReasonsSection } from "@/components/sections/providers/reasons";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_PATH, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = providersContent.meta;
const PATH = PROVEEDORES_REGISTRO_PATH;

export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Proveedores", path: PROVEEDORES_PATH },
    { name: "Registro", path: PATH },
  ]),
);

/**
 * `/proveedores/registro`: página pública e INDEXABLE del alta de talleres.
 *
 * Desde la spec 212 (US3) el formulario ya no vive acá: el alta exige la
 * cuenta de AutoLibre (el backend deja como dueña del taller a la cuenta que lo
 * registró) y eso trae Clerk. Para que esta página siga sin cargar un solo
 * byte de Clerk (FR-011, SC-005), el formulario se mudó a
 * `/proveedores/registro/formulario` (privada, `noindex`, con su propio layout
 * de Clerk) y acá queda el contenido citable más el CTA hacia allá.
 *
 * El CTA va con `prefetch={false}`: prefetchear el formulario traería su
 * payload (y los chunks de Clerk) a esta página. La sección conserva
 * `id="form"` para que los links viejos a `/proveedores/registro#form` sigan
 * cayendo en el lugar correcto.
 */
export default function ProveedoresRegistroPage() {
  const { register } = providersContent;

  return (
    <>
      <PageShell
        cta={{ label: "Sumar mi negocio", href: "#form" }}
        currentPath={PATH}
      >
        <ProvidersHeroSection />
        <ProvidersReasonsSection />
        <ProvidersPlansBannerSection />

        <Section id="form" tone="muted" spacing="md" container="narrow" aria-labelledby="registro-titulo">
          <h2 id="registro-titulo" className="text-center font-display text-2xl font-bold text-ink">
            {register.title}
          </h2>
          <p className="mt-3 text-center text-[0.9375rem] leading-relaxed text-ink/70">
            {register.intro}
          </p>

          <h3 className="mt-10 font-display text-lg font-bold text-ink">{register.stepsTitle}</h3>
          <ol className="mt-4 flex list-decimal flex-col gap-3 pl-6 text-[0.9375rem] leading-relaxed text-ink/75 marker:font-bold marker:text-brand">
            {register.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <ButtonLink href={register.cta.href} prefetch={false} size="lg" block className="mt-10">
            {register.cta.label}
          </ButtonLink>
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
