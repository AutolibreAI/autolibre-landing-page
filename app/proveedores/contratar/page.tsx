import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CheckoutFlow } from "@/components/proveedores/checkout/checkout-flow";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { partnerCheckoutContent, planContent } from "@/lib/content/partner-checkout";
import { parsePlanParam } from "@/lib/partner-billing/checkout";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = PROVEEDORES_CONTRATAR_PATH;
const content = partnerCheckoutContent;

/**
 * Pantalla privada y transaccional (spec 212, FR-012): `noindex, nofollow`,
 * fuera de `app/sitemap.ts` y de `public/llms.txt`, SIN `Disallow` en
 * `app/robots.ts` (impediría ver el noindex) y sin JSON-LD (211 D8).
 */
export const metadata: Metadata = createMetadata({
  title: content.meta.title,
  description: content.meta.description,
  path: PATH,
  index: false,
});

type ContratarPageProps = {
  readonly searchParams: Promise<{ readonly [key: string]: string | string[] | undefined }>;
};

/**
 * `/proveedores/contratar?plan=plus|plus_max`: el dueño de un taller contrata
 * un plan pago y lo paga en Mercado Pago. El plan se valida acá, en el server
 * (research D3); la isla client pinta la pantalla entera (encabezado de foco
 * con los pasos, login o contratación). Clerk solo existe en este segmento
 * (`layout.tsx`).
 */
export default async function ProveedoresContratarPage({ searchParams }: ContratarPageProps) {
  const planCode = parsePlanParam((await searchParams).plan);
  const plan = planCode ? planContent(planCode) : null;

  if (!planCode || !plan) {
    return (
      <PageShell currentPath={PATH}>
        <Section tone="card" spacing="md" container="narrow" aria-labelledby="contratar-titulo">
          <h1 id="contratar-titulo" className="font-display text-4xl font-bold tracking-tight text-fg md:text-5xl">
            {content.invalidPlan.title}
          </h1>
          <p className="mt-3 mb-8 text-lead text-fg-muted md:text-lead-lg">{content.invalidPlan.body}</p>
          <ButtonLink href={content.invalidPlan.cta.href} variant="primary" size="52">
            {content.invalidPlan.cta.label}
          </ButtonLink>
        </Section>
      </PageShell>
    );
  }

  return <CheckoutFlow planCode={planCode} planName={plan.name} selfPath={checkoutHref(PATH, planCode)} />;
}
