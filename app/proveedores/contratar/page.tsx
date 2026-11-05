import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { CheckoutFlow } from "@/components/proveedores/checkout/checkout-flow";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { partnerCheckoutContent, planDisplayName } from "@/lib/content/partner-checkout";
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
 * (research D3); la isla client hace el login, elige el taller e inicia el
 * pago. Clerk solo existe en este segmento (`layout.tsx`).
 */
export default async function ProveedoresContratarPage({ searchParams }: ContratarPageProps) {
  const planCode = parsePlanParam((await searchParams).plan);
  const planName = planCode ? planDisplayName(planCode) : null;

  return (
    <PageShell currentPath={PATH}>
      <Section tone="muted" spacing="md" container="narrow" aria-labelledby="contratar-titulo">
        {planCode && planName ? (
          <>
            <h1 id="contratar-titulo" className="font-display text-3xl font-bold text-ink md:text-4xl">
              {content.title(planName)}
            </h1>
            <p className="mt-4 mb-10 text-lead leading-relaxed text-ink/70">{content.intro}</p>
            <CheckoutFlow planCode={planCode} planName={planName} selfPath={checkoutHref(PATH, planCode)} />
          </>
        ) : (
          <>
            <h1 id="contratar-titulo" className="font-display text-3xl font-bold text-ink md:text-4xl">
              {content.invalidPlan.title}
            </h1>
            <p className="mt-4 mb-8 text-lead leading-relaxed text-ink/70">{content.invalidPlan.body}</p>
            <ButtonLink href={content.invalidPlan.cta.href}>{content.invalidPlan.cta.label}</ButtonLink>
          </>
        )}
      </Section>
    </PageShell>
  );
}
