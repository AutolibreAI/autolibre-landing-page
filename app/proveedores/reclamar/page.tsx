import type { Metadata } from "next";
import { PageShell } from "@/components/layout/page-shell";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { ClaimForm } from "@/components/proveedores/claim/claim-form";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { claimWithReturnHref, safeContinuePath } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_CONTRATAR_PATH, PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { createMetadata } from "@/lib/seo/metadata";
import { whatsappUrl } from "@/lib/whatsapp";

const PATH = PROVEEDORES_RECLAMAR_PATH;
const content = partnerClaimContent;

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
 * Qué es el código, cómo se pide y cuánto dura: el contexto del paso, al
 * costado en desktop y debajo en mobile (`FlowLayout`): ahí no empuja el
 * login ni el código fuera de la primera pantalla. Server, sin JS. Sirve
 * también a quien llegó sin código: tiene a mano cómo pedirlo.
 */
function ClaimCodeAbout() {
  const { about } = partnerClaimContent;

  return (
    <aside
      aria-labelledby="reclamar-codigo-titulo"
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-6"
    >
      <h2 id="reclamar-codigo-titulo" className="font-display text-lg font-bold text-ink">
        {about.title}
      </h2>
      <dl className="flex flex-col gap-4">
        {about.items.map((item) => (
          <div key={item.term} className="flex flex-col gap-0.5">
            <dt className="text-label font-semibold text-ink">{item.term}</dt>
            <dd className="text-sm leading-relaxed text-ink/72">{item.description}</dd>
          </div>
        ))}
      </dl>
      <a
        href={whatsappUrl(about.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement="reclamar_pedir_codigo"
        className="-my-2 inline-flex min-h-11 items-center gap-2 self-start text-sm font-semibold text-brand-hover underline-offset-4 hover:underline"
      >
        <Icon name="whatsapp" size={18} strokeWidth={1.8} />
        {about.requestCta}
      </a>
    </aside>
  );
}

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
      {/* Contenedor `wide`: alineado con el header. El `<h1>` lo pinta la
          isla en los dos estados (login y formulario). */}
      <Section tone="muted" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <ClaimForm
          continueHref={continueHref}
          selfPath={selfPath}
          head={{ eyebrow: content.eyebrow, title: content.title, intro: content.intro }}
          signInContext={
            <FlowSteps orientation="vertical" label={content.steps.label} steps={content.steps.items} current={0} />
          }
          about={<ClaimCodeAbout />}
        />
      </Section>
    </PageShell>
  );
}
