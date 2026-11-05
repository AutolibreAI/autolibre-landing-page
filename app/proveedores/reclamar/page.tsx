import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { ClaimForm } from "@/components/proveedores/claim/claim-form";
import { Section } from "@/components/ui/section";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { claimWithReturnHref, safeContinuePath } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_CONTRATAR_PATH, PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";

const PATH = PROVEEDORES_RECLAMAR_PATH;

/**
 * Pantalla privada y transaccional (research D8): `noindex, nofollow`, fuera
 * de `app/sitemap.ts` y de `public/llms.txt`, y SIN `Disallow` en
 * `app/robots.ts` (un Disallow impediría que el crawler vea el noindex). Sin
 * JSON-LD: no hay contenido citable (plan › Complexity Tracking).
 */
export const metadata: Metadata = createMetadata({
  title: partnerClaimContent.meta.title,
  description: partnerClaimContent.meta.description,
  path: PATH,
  index: false,
});

type ReclamarPageProps = {
  readonly searchParams: Promise<{ readonly [key: string]: string | string[] | undefined }>;
};

/**
 * `/proveedores/reclamar`: el dueño de un taller canjea el código que le
 * mandó el equipo de AutoLibre (spec 211). La página es server; la única isla
 * client es el formulario (con el `<SignIn>` de Clerk), y Clerk solo existe en
 * este segmento (`layout.tsx`).
 *
 * `?next=`: si el reclamo viene de contratar un plan (spec 212, US2), tras el
 * canje se ofrece volver ahí. Se valida en el server y SOLO se acepta una
 * ruta relativa bajo `/proveedores/contratar` (research D10, anti open
 * redirect); cualquier otra cosa se ignora.
 */
export default async function ProveedoresReclamarPage({ searchParams }: ReclamarPageProps) {
  const continueHref = safeContinuePath((await searchParams).next, PROVEEDORES_CONTRATAR_PATH);
  const selfPath = continueHref ? claimWithReturnHref(PATH, continueHref) : PATH;

  return (
    <PageShell currentPath={PATH}>
      <Section tone="muted" spacing="md" container="narrow" aria-labelledby="reclamar-titulo">
        <h1 id="reclamar-titulo" className="font-display text-3xl font-bold text-ink md:text-4xl">
          {partnerClaimContent.title}
        </h1>
        <p className="mt-4 mb-10 text-lead leading-relaxed text-ink/70">{partnerClaimContent.intro}</p>
        <ClaimForm continueHref={continueHref} selfPath={selfPath} />
      </Section>
    </PageShell>
  );
}
