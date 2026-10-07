import { ButtonLink } from "@/components/ui/button";
import { ProfileCard } from "@/components/ui/profile-card";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import type { PartnerProfile } from "@/lib/provider-profile/types";

/**
 * Tarjeta "¿Necesitás una propuesta?" de la columna derecha. En la v1 el slug
 * del proveedor viaja SOLO como atribución (`origen` y `proveedor` en la URL):
 * `/pedido` todavía no lo lee ni apunta el pedido a ese proveedor (research
 * D19 y D12 de la spec 210). El `href` es ese contrato futuro, medido igual.
 */
export function ProposalCard({ profile }: { readonly profile: PartnerProfile }) {
  const href = `/pedido?origen=perfil&proveedor=${encodeURIComponent(profile.slug)}`;
  return (
    <ProfileCard id="perfil-propuesta" title={copy.sections.proposal}>
      <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/75">{copy.proposal.body}</p>
      <ButtonLink
        href={href}
        size="md"
        data-analytics-event={ANALYTICS_EVENTS.providerActionClicked}
        data-analytics-action={PROVIDER_ACTIONS.proposal}
        data-analytics-provider={profile.slug}
        data-analytics-placement="provider_aside"
        className="mt-4 min-h-11 w-full bg-ink hover:bg-ink/90"
      >
        {copy.proposal.cta}
      </ButtonLink>
    </ProfileCard>
  );
}
