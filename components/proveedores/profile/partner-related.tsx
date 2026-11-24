import Link from "next/link";
import { PartnerCard } from "@/components/proveedores/partner-card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import type { PartnerSummary } from "@/lib/autolibre-api";
import { proveedoresHref } from "@/lib/proveedores/query";
import { partnerProfileContent } from "@/lib/content/partner-profile";
import { providersDirectoryContent } from "@/lib/content/providers-directory";

type PartnerRelatedProps = {
  readonly family: { readonly slug: string; readonly name: string };
  readonly partners: readonly PartnerSummary[];
  readonly categoryNames: ReadonlyMap<string, string>;
};

/**
 * "Más proveedores de {familia}": hasta tres negocios más de la primera
 * familia del perfil (`GET /partner-profiles?category=`, datos reales), con
 * la misma tarjeta del directorio, y el link al directorio filtrado por esa
 * familia. Enlazado interno entre perfiles. Quien llama la omite si no hay
 * ninguno.
 */
export function PartnerRelated({ family, partners, categoryNames }: PartnerRelatedProps) {
  const { related } = partnerProfileContent;

  return (
    <Section tone="canvas" spacing="md" aria-labelledby="relacionados-titulo" className="py-10 md:py-18">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <h2
          id="relacionados-titulo"
          className="font-display text-2xl leading-tight font-bold text-balance text-fg md:text-3xl"
        >
          {related.title(family.name)}
        </h2>
        <Link
          href={proveedoresHref({ rubro: family.slug }, providersDirectoryContent.directory.id)}
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
        >
          {related.seeAll}
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </Link>
      </div>
      <ul className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} categoryNames={categoryNames} />
        ))}
      </ul>
    </Section>
  );
}
