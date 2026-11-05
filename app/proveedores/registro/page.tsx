import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ProvidersHeroSection } from "@/components/sections/providers/hero";
import { ProvidersPlansBannerSection } from "@/components/sections/providers/plans-banner";
import { ProvidersReasonsSection } from "@/components/sections/providers/reasons";
import { ProvidersRegisterForkSection } from "@/components/sections/providers/register-fork";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
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
 * `/proveedores/registro`: página pública e INDEXABLE, el hub del alta de
 * talleres. Todos los "Sumar mi negocio" del sitio (header, home, directorio,
 * footer, plan Gratis) llegan acá.
 *
 * Lo primero después del hero es la bifurcación "¿Tu taller ya aparece?":
 * administrar un taller que ya está en la red o registrar uno nuevo. Sin ella,
 * un taller que ya figura se registraba de nuevo y quedaba duplicado.
 *
 * Desde la spec 212 (US3) el formulario ya no vive acá: el alta exige la
 * cuenta de AutoLibre y eso trae Clerk. Para que esta página siga sin cargar
 * un solo byte de Clerk (FR-011, SC-005), el formulario vive en
 * `/proveedores/registro/formulario` (privada, `noindex`, con su propio
 * layout de Clerk) y acá queda el contenido citable más los CTAs hacia allá,
 * todos con `prefetch={false}` (prefetchear traería los chunks de Clerk).
 */
export default function ProveedoresRegistroPage() {
  const { register } = providersContent;

  return (
    <>
      <PageShell cta={providersContent.headerCta} currentPath={PATH}>
        <ProvidersHeroSection />
        <ProvidersRegisterForkSection />
        <ProvidersReasonsSection />
        <ProvidersPlansBannerSection />

        <Section
          id={register.id}
          tone="muted"
          spacing="md"
          container="narrow"
          aria-labelledby="registro-titulo"
        >
          <h2 id="registro-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
            {register.title}
          </h2>
          <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink/72 md:text-base">
            {register.intro}
          </p>

          <ol className="mt-8 flex list-decimal flex-col gap-3 pl-6 text-[0.9375rem] leading-relaxed text-ink/75 marker:font-bold marker:text-brand-hover">
            {register.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <ButtonLink
            href={register.cta.href}
            prefetch={false}
            size="lg"
            block
            className="mt-10"
            data-analytics-event={ANALYTICS_EVENTS.partnerRegisterStarted}
          >
            {register.cta.label}
          </ButtonLink>
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
