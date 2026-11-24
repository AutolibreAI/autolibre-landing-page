import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import {
  PEDIDO_ID,
  PedidoCtaBand,
  PedidoExample,
  PedidoFaqAndGuides,
  PedidoHero,
  PedidoSteps,
} from "@/components/pedido/pedido-sections";
import { JsonLd } from "@/components/seo/json-ld";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { meta, faq, mobileBarLabel } = presupuestoContent.pedidoPage;

const PATH = "/pedido";

/**
 * Se indexa: es la landing que se comparte por WhatsApp y en anuncios, y la
 * que tiene que aparecer cuando alguien busca "presupuesto para mi auto". El
 * `title` no repite la marca: de eso se encarga el template del layout raíz.
 */
export const metadata: Metadata = createMetadata({
  title: meta.title,
  description: meta.description,
  path: PATH,
});

const schema = graph(
  organizationSchema(),
  webPageSchema({
    name: meta.title,
    description: meta.description,
    path: PATH,
  }),
  breadcrumbSchema([
    { name: meta.homeBreadcrumb, path: "/" },
    { name: meta.breadcrumb, path: PATH },
  ]),
  faqPageSchema(faq.items),
);

/**
 * `/pedido` (rediseño 2026-11, fase 4a): el módulo de pedido es el
 * formulario. Server Component; las únicas islas de cliente son las del
 * módulo (pestañas y form de Taller).
 *
 * El header va SIN "Hacé tu pedido" (`cta={false}`): sería un link a la
 * misma página. En celular, la barra fija lleva "Hacé tu pedido" (sube al
 * módulo) y WhatsApp como `Lead`.
 *
 * Outline: h1 → h2 de los paneles del módulo → h2 por sección (y el de las
 * guías relacionadas) → h3 por paso.
 */
export default function PedidoPage() {
  return (
    <>
      <PageShell
        cta={false}
        currentPath={PATH}
        actionBar
        actionBarQuoteHref={`#${PEDIDO_ID}`}
        actionBarLabel={mobileBarLabel}
        actionBarWhatsappLead
      >
        <PedidoHero />
        <PedidoExample />
        <PedidoSteps />
        <PedidoFaqAndGuides />
        <PedidoCtaBand />
      </PageShell>
      <JsonLd schema={schema} />
    </>
  );
}
