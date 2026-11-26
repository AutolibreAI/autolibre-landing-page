import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RegistroFlowLoading, REGISTRO_FLOW_SCRIPT } from "@/components/proveedores/registro/registro-flow-loading";
import { RegistroFlowMount } from "@/components/proveedores/registro/registro-flow-mount";
import {
  SumateBenefits,
  SumateFaq,
  SumateHero,
  SumateListed,
  SumateMobileBar,
  SumatePlans,
  SumateSteps,
} from "@/components/proveedores/registro/sumate-sections";
import { JsonLd } from "@/components/seo/json-ld";
import { fetchServiceCatalog } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_PATH, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { title: TITLE, description: DESCRIPTION } = providersContent.meta;
const PATH = PROVEEDORES_REGISTRO_PATH;
const { sumate } = providersContent;

/**
 * Indexable, como siempre lo fue `/proveedores/registro` (sitemap y
 * `llms.txt`). Mismo title y description que antes del rediseño. Con
 * `?alta=1` o `?next=` es la misma URL canónica (sin query): el flujo no se
 * indexa aparte.
 */
export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

/** La MISMA lista alimenta las migas visibles y el `BreadcrumbList`. */
const breadcrumbs = [
  { name: "Inicio", path: "/" },
  { name: "Proveedores", path: PROVEEDORES_PATH },
  { name: sumate.breadcrumb, path: PATH },
];

const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  breadcrumbSchema(breadcrumbs),
  faqPageSchema(sumate.faq.items),
);

/** Lo que se esconde mientras el flujo del alta está abierto (`<html data-registro-alta>`). */
const landingClass = "in-data-[registro-alta]:hidden";

/**
 * `/proveedores/registro` (rediseño 2026-11, fase 5). Dos cosas en la misma
 * ruta pública:
 *
 * 1. **La landing "Sumá tu negocio"** (lienzo `Sumate`): Server Component,
 *    estática (ISR al ritmo del catálogo) y SIN Clerk. Es lo que está en el
 *    HTML del server y lo que se indexa: un `<h1>`, migas, JSON-LD con
 *    `FAQPage`.
 * 2. **El flujo del alta** (lienzos `IngresarNegocio` y `Alta`), con
 *    `?alta=1` (los CTA de la landing) o `?next=` (viene de la contratación).
 *    Lo monta la isla `RegistroFlowMount`, que importa Clerk con
 *    `React.lazy` recién al abrirse. Mientras está abierto, `<html>` lleva
 *    `data-registro-alta` y el CSS esconde la landing entera (header y pie
 *    incluidos): el flujo trae su pantalla de foco. El script inline pone esa
 *    marca antes del primer paint si la URL ya trae el parámetro.
 *
 * Antes la página ERA el formulario y cargaba Clerk (~395 KB) en la ruta
 * indexable: Performance móvil 44 y TBT de 4 s en la línea base.
 *
 * El catálogo se lee acá, en el servidor, y viaja a la isla como prop: la URL
 * del backend es server-side. Sin catálogo, el render degradado no puede
 * quedar en el cache ISR: `connection()` vuelve dinámica la regeneración (y
 * Next sigue sirviendo la última versión buena; ver
 * `incremental-static-regeneration.md`), y en un build con el backend caído
 * la ruta queda dinámica para ese deploy. El formulario degradado igual deja
 * escribir los servicios a mano.
 */
export default async function ProveedoresRegistroPage() {
  const catalog = await fetchServiceCatalog();
  if (catalog === null) await connection();
  const serviceFamilies = catalog ?? [];

  return (
    <>
      {/* Antes del primer paint: con `?alta`/`?next` esconde la landing. */}
      <script dangerouslySetInnerHTML={{ __html: REGISTRO_FLOW_SCRIPT }} />

      <div className={landingClass}>
        <SiteHeader cta={false} currentPath={PATH} />
        <main>
          <SumateHero breadcrumbs={breadcrumbs} />
          <SumateListed />
          <SumateBenefits />
          <SumateSteps />
          <SumatePlans />
          <SumateFaq />
        </main>
        <SiteFooter />
        <SumateMobileBar />
      </div>

      {/* El flujo: fuera del HTML del server. El fallback (el "cargando" del
          flujo) solo se ve con la marca puesta, antes de hidratar. */}
      <Suspense
        fallback={
          <div className="hidden in-data-[registro-alta]:block">
            <RegistroFlowLoading landmarks={false} />
          </div>
        }
      >
        <RegistroFlowMount serviceFamilies={serviceFamilies} loading={<RegistroFlowLoading />} />
      </Suspense>

      <JsonLd schema={schema} />
    </>
  );
}
