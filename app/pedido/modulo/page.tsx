import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { ModuloPedido } from "@/components/modulo-pedido/modulo-pedido";
import { Container } from "@/components/ui/container";
import { QUOTE_MODULE_PLACEMENTS } from "@/lib/analytics/events";
import { moduloPedidoPreviewContent as copy } from "@/lib/content/modulo-pedido";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = "/pedido/modulo";

/**
 * Vista previa del módulo de pedido (rediseño 2026-11, fase 3). `noindex` y
 * fuera del sitemap: es una página de prueba con el build real, no una
 * landing. En la fase 4 el módulo pasa al Home y a `/pedido` y esta ruta se
 * borra. Mide como `/pedido` (`placement: "modulo_pedido"`): el tráfico de
 * esta página es interno.
 *
 * Outline: h1 → h2 de los paneles del módulo.
 */
export const metadata: Metadata = createMetadata({
  title: copy.meta.title,
  description: copy.meta.description,
  path: PATH,
  index: false,
});

export default function ModuloPedidoPreviewPage() {
  return (
    <PageShell cta={false}>
      <section aria-labelledby="modulo-titulo" className="bg-card">
        <Container size="wide" className="py-12 text-center md:py-16">
          <p className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-label font-semibold text-fg">
            {copy.badge}
          </p>
          <h1
            id="modulo-titulo"
            className="mx-auto mt-4 max-w-200 font-display text-4xl font-bold text-balance text-fg md:text-5xl"
          >
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-140 text-lead text-fg-muted md:text-lead-lg">
            {copy.subtitle}
          </p>
          <ModuloPedido placement={QUOTE_MODULE_PLACEMENTS.pedido} className="mt-8" />
        </Container>
      </section>
    </PageShell>
  );
}
