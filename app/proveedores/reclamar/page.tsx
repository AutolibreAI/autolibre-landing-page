import type { Metadata } from "next";
import { ClaimForm } from "@/components/proveedores/claim/claim-form";
import { clerkClientUatCookieName } from "@/lib/auth/session-cookie";
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
 * `/proveedores/reclamar`: el dueño de un negocio canjea el código que le
 * mandó el equipo de AutoLibre (spec 211). La pantalla entera (encabezado de
 * foco incluido, sin el menú del sitio ni el pie) la pinta la isla
 * `ClaimForm`, que necesita la sesión; Clerk solo existe en este segmento
 * (`layout.tsx`).
 *
 * `?next=`: si el reclamo viene de contratar un plan (spec 212, US2), tras el
 * canje se ofrece volver ahí. Se valida en el server y SOLO se acepta una
 * ruta relativa bajo `/proveedores/contratar` (research D10, anti open
 * redirect); cualquier otra cosa se ignora.
 */
export default async function ProveedoresReclamarPage({ searchParams }: ReclamarPageProps) {
  const continueHref = safeContinuePath((await searchParams).next, PROVEEDORES_CONTRATAR_PATH);
  const selfPath = continueHref ? claimWithReturnHref(PATH, continueHref) : PATH;

  return <ClaimForm continueHref={continueHref} selfPath={selfPath} sessionCookie={clerkClientUatCookieName()} />;
}
