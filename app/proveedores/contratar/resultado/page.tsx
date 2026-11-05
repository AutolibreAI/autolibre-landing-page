import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { CheckoutResult } from "@/components/proveedores/checkout/checkout-result";
import { Section } from "@/components/ui/section";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import { parsePartnerIdParam } from "@/lib/partner-billing/subscription";
import { PROVEEDORES_CONTRATAR_RESULTADO_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = PROVEEDORES_CONTRATAR_RESULTADO_PATH;
const { result: content } = partnerCheckoutContent;

/** Privada, como `/proveedores/contratar`: noindex, sin sitemap ni JSON-LD. */
export const metadata: Metadata = createMetadata({
  title: content.meta.title,
  description: content.meta.description,
  path: PATH,
  index: false,
});

type ResultadoPageProps = {
  readonly searchParams: Promise<{ readonly [key: string]: string | string[] | undefined }>;
};

/**
 * `/proveedores/contratar/resultado`: la `back_url` de Mercado Pago. De la
 * URL solo se toma un `?partnerId` (validado como UUID) para saber QUÉ taller
 * consultar; el estado lo confirma el backend (FR-008). Los demás params que
 * agrega MP se ignoran.
 */
export default async function ProveedoresContratarResultadoPage({ searchParams }: ResultadoPageProps) {
  const partnerId = parsePartnerIdParam((await searchParams).partnerId);
  const selfPath = partnerId ? `${PATH}?${new URLSearchParams({ partnerId }).toString()}` : PATH;

  return (
    <PageShell currentPath={PATH}>
      {/* Contenedor `wide`, como `/contratar`: la isla pinta el `<h1>` y el
          mismo armazón de flujo (paso en curso + tarjeta del plan). */}
      <Section tone="muted" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <CheckoutResult partnerIdFromQuery={partnerId} selfPath={selfPath} />
      </Section>
    </PageShell>
  );
}
