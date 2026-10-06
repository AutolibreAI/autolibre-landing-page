import { PageShell } from "@/components/layout/page-shell";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";

/**
 * 404 de un perfil: el slug no existe, el negocio está inactivo o el link es
 * viejo. Lo dispara `notFound()` en la página ANTES de renderizar nada, así
 * que el status es un 404 real y Next suma el `noindex` solo. La salida es la
 * red completa o pedir presupuesto igual.
 */
export default function PartnerNotFound() {
  const { eyebrow, title, body, primaryCta, secondaryCta } = aliadoPerfilContent.notFound;

  return (
    <PageShell>
      <Section tone="muted" spacing="lg" aria-labelledby="aliado-no-encontrado">
        <div className="flex max-w-190 flex-col gap-4">
          <p className="text-label font-semibold tracking-wider text-brand-hover uppercase">{eyebrow}</p>
          <h1
            id="aliado-no-encontrado"
            className="font-display text-3xl leading-tight font-bold text-balance text-ink md:text-5xl"
          >
            {title}
          </h1>
          <p className="max-w-150 text-lead leading-relaxed text-ink/70 md:text-lead-lg">{body}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ButtonLink href={primaryCta.href} size="lg">
              {primaryCta.label}
            </ButtonLink>
            <ButtonLink href={secondaryCta.href} variant="outline" size="lg">
              {secondaryCta.label}
            </ButtonLink>
          </div>
        </div>
      </Section>
    </PageShell>
  );
}
