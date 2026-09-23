import type { Metadata } from "next";
import { OpenFormButton } from "@/components/pedido/open-form-button";
import { PedidoFooter } from "@/components/pedido/pedido-footer";
import { PedidoHeader } from "@/components/pedido/pedido-header";
import { PedidoHero } from "@/components/pedido/pedido-hero";
import {
  PedidoCtaBand,
  PedidoExample,
  PedidoFaq,
  PedidoSteps,
} from "@/components/pedido/pedido-sections";
import { PedidoStickyBar } from "@/components/pedido/pedido-sticky-bar";
import { WhatsappLink } from "@/components/pedido/whatsapp-link";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { meta, faq, stickyBar } = presupuestoContent.pedidoPage;

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
  webPageSchema({ name: meta.title, description: meta.description, path: PATH }),
  breadcrumbSchema([
    { name: meta.homeBreadcrumb, path: "/" },
    { name: meta.breadcrumb, path: PATH },
  ]),
  faqPageSchema(faq.items),
);

/**
 * `/pedido`: presupuestos de proveedores de la zona, por WhatsApp.
 *
 * Server Component. Todo el contenido indexable (hero, cómo funciona, el
 * ejemplo de respuesta, la FAQ y la banda de cierre) sale en el HTML del
 * server. Islas de cliente, solo dos: `PedidoForm` (form + vista mobile +
 * confirmación) y `PedidoStickyBar` (cuándo mostrar la barra fija mobile).
 *
 * No usa `PageShell`: header y footer propios y mínimos. Quien llega acá viene
 * de un link directo y tiene una sola cosa para hacer; la única salida del
 * header es el logo, que vuelve al inicio.
 *
 * Outline: h1 (hero) → h2 del form → h2 por sección → h3 por paso y por
 * pregunta.
 */
export default function PedidoPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted text-ink">
      <PedidoHeader />

      <main className="flex-1">
        <PedidoHero />

        {/* Mismo contenedor que las secciones de la home. */}
        <Container>
          <PedidoSteps />
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-16">
            <PedidoExample />
            <PedidoFaq />
          </div>
          <PedidoCtaBand />
        </Container>
      </main>

      <PedidoFooter />

      <PedidoStickyBar label={stickyBar.label}>
        <WhatsappLink placement="sticky_bar" size="lg" block />
        <OpenFormButton className="inline-flex min-h-11 items-center self-center text-sm font-medium text-ink/70 underline-offset-4 transition-colors hover:text-brand hover:underline">
          {stickyBar.formCta}
        </OpenFormButton>
      </PedidoStickyBar>

      <JsonLd schema={schema} />
    </div>
  );
}
