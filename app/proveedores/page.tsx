import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { ProviderForm } from "@/components/forms/provider-form";
import { ProvidersHeroSection } from "@/components/sections/providers/hero";
import { ProvidersReasonsSection } from "@/components/sections/providers/reasons";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { fetchServiceCatalog } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const TITLE = "Sumá tu taller a AutoLibre";
const DESCRIPTION =
  "Recibí consultas de dueños de auto con marca, modelo, año y el problema ya delimitado. Registrá tu taller o servicio en AutoLibre y armá tu perfil en la app.";
const PATH = "/proveedores";

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
    { name: "Proveedores", path: PATH },
  ]),
);

/**
 * El catalogo se lee acá, en el servidor, y no dentro del formulario: la URL
 * del backend es server-side (sin `NEXT_PUBLIC_`), asi que un fetch desde el
 * cliente obligaria a abrir una ruta proxy nueva solo para leer una lista
 * publica. Resolviendolo en el render la pagina sigue siendo estatica, el
 * formulario nace con sus opciones puestas y no hay un estado de carga que
 * mantener.
 */
export default async function ProveedoresPage() {
  const serviceCategories = await fetchServiceCatalog();

  return (
    <>
      <PageShell
        secondary={{ label: "Soy dueño de auto", href: "/" }}
        cta={{ label: "Sumar mi negocio", href: "#form" }}
      >
        <ProvidersHeroSection />
        <ProvidersReasonsSection />

        <Section id="form" tone="muted" spacing="md">
          <Container size="narrow">
            <h2 className="text-center font-display text-2xl font-bold text-ink">
              {providersContent.form.title}
            </h2>
            <p className="mt-3 mb-10 text-center text-[0.9375rem] text-ink/65">
              {providersContent.form.subtitle}
            </p>
            <ProviderForm serviceCategories={serviceCategories ?? []} />
          </Container>
        </Section>
      </PageShell>

      <JsonLd schema={schema} />
    </>
  );
}
