import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { partnerProfileContent } from "@/lib/content/partner-profile";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

type PartnerClaimCtaProps = {
  readonly name: string;
  readonly slug: string;
};

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 font-semibold text-brand-hover underline-offset-4 hover:underline";

/**
 * "¿Es tu taller?": invitación para que el dueño reclame el perfil (spec 211,
 * research D7). Server component, sin JS y sin nada de Clerk (FR-003).
 *
 * Es deliberadamente secundaria: texto chico al final del contenido, nunca en
 * la sticky bar. El WhatsApp de acá va a AutoLibre, no al negocio, así que no
 * puede competir con el CTA principal del perfil (`partner-profile-head.tsx`).
 */
export function PartnerClaimCta({ name, slug }: PartnerClaimCtaProps) {
  const { claimCta, head } = partnerProfileContent;

  return (
    <aside
      aria-labelledby="reclamar-taller-titulo"
      className="flex flex-col gap-2 rounded-card border border-dashed border-line p-5"
    >
      <h2 id="reclamar-taller-titulo" className="font-display text-base font-bold text-ink">
        {claimCta.title}
      </h2>
      <p className="text-sm leading-relaxed text-ink/70">{claimCta.body}</p>
      <ul className="flex flex-wrap gap-x-6">
        <li>
          <a
            href={whatsappUrl(claimCta.whatsappText(name, slug))}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {claimCta.requestCode}
            <Icon name="arrow-right" size={16} strokeWidth={2} />
            <span className="sr-only"> {head.externalHint}</span>
          </a>
        </li>
        <li>
          {/* Sin prefetch: la pantalla de canje trae Clerk y un perfil
              indexable no puede bajarlo (SC-004). */}
          <Link href={PROVEEDORES_RECLAMAR_PATH} prefetch={false} className={linkClass}>
            {claimCta.haveCode}
            <Icon name="arrow-right" size={16} strokeWidth={2} />
          </Link>
        </li>
      </ul>
    </aside>
  );
}
