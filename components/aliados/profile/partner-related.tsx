import Link from "next/link";
import { PartnerCard } from "@/components/aliados/partner-card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { PartnerSummary } from "@/lib/autolibre-api";
import { aliadosHref } from "@/lib/aliados/query";
import { aliadoPerfilContent } from "@/lib/content/aliado-perfil";
import { aliadosContent } from "@/lib/content/aliados";

type PartnerRelatedProps = {
  readonly family: { readonly slug: string; readonly name: string };
  readonly partners: readonly PartnerSummary[];
  readonly categoryNames: ReadonlyMap<string, string>;
};

/**
 * "Más aliados de {familia}": hasta tres negocios más de la primera familia
 * del perfil, con la misma tarjeta del directorio. Quien llama la omite si no
 * hay ninguno.
 */
export function PartnerRelated({ family, partners, categoryNames }: PartnerRelatedProps) {
  const { related } = aliadoPerfilContent;

  return (
    <Section tone="subtle" spacing="md" aria-labelledby="relacionados-titulo">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="relacionados-titulo" className="font-display text-2xl font-bold text-ink md:text-3xl">
          {related.title(family.name)}
        </h2>
        <Link
          href={aliadosHref({ rubro: family.slug }, aliadosContent.directory.id)}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          {related.seeAll}
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </Link>
      </div>
      <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} categoryNames={categoryNames} />
        ))}
      </ul>
    </Section>
  );
}
