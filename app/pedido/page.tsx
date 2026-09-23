import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { OpenFormButton } from "@/components/pedido/open-form-button";
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
import { META_EVENTS } from "@/lib/analytics/meta-pixel";
import { presupuestoContent } from "@/lib/content/presupuesto";
import type { NavCta } from "@/lib/content/types";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  faqPageSchema,
  graph,
  organizationSchema,
  webPageSchema,
} from "@/lib/seo/schema";
import { whatsappUrl } from "@/lib/whatsapp";

const { meta, faq, stickyBar, whatsapp } = presupuestoContent.pedidoPage;

const PATH = "/pedido";

/**
 * En `/pedido` el CTA del header es el mismo chat de WhatsApp que el resto de
 * la página (no "Descargar la app"): una sola conversión. Se mide como
 * `Contact` con `placement` `header`, y `header_menu` dentro del menú mobile.
 */
const headerCta: NavCta = {
  label: whatsapp.label,
  href: whatsappUrl(whatsapp.text),
  external: true,
  icon: "whatsapp",
  tracking: {
    event: META_EVENTS.contact,
    placement: "header",
    menuPlacement: "header_menu",
  },
};

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
 * `/pedido`: presupuestos de proveedores de la zona, por WhatsApp.
 *
 * Server Component. Todo el contenido indexable (hero, cómo funciona, el
 * ejemplo de respuesta, la FAQ y la banda de cierre) sale en el HTML del
 * server. Islas de cliente, solo dos: `PedidoForm` (form + vista mobile +
 * confirmación) y `PedidoStickyBar` (cuándo mostrar la barra fija mobile).
 *
 * Usa `PageShell` como el resto del sitio: header y footer compartidos, con
 * el link "Pedir presupuesto" marcado como página actual y WhatsApp como CTA
 * del header. Sin anclas de sección en el header (son de la home).
 *
 * Outline: h1 (hero) → h2 del form → h2 por sección → h3 por paso y por
 * pregunta.
 */
export default function PedidoPage() {
  return (
    <>
      <PageShell cta={headerCta} currentPath={PATH}>
        {/* El fondo va en un wrapper y no en `<main>` (lo pone `PageShell`):
            las secciones viven dentro de `Container` y el lavado verde tiene
            que llegar de borde a borde. */}
        <div className="bg-surface-muted text-ink">
          <PedidoHero />

          {/* Cada `Section` trae su `Container` (ancho `wide`, el del header
              y el footer). Ejemplo y FAQ comparten fila en desktop: la
              grilla es el contenedor y ellas van con `container={false}`,
              así los bordes externos de la fila siguen alineados. */}
          <PedidoSteps />
          <Container
            size="wide"
            className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-16"
          >
            <PedidoExample />
            <PedidoFaq />
          </Container>
          <PedidoCtaBand />
        </div>
      </PageShell>

      <PedidoStickyBar label={stickyBar.label}>
        <WhatsappLink placement="sticky_bar" size="lg" block />
        <OpenFormButton className="inline-flex min-h-11 items-center self-center text-sm font-medium text-ink/70 underline-offset-4 transition-colors hover:text-brand hover:underline">
          {stickyBar.formCta}
        </OpenFormButton>
      </PedidoStickyBar>

      <JsonLd schema={schema} />
    </>
  );
}
