import Image from "next/image";
import Link from "next/link";
import { partnerMonogram, safeHttpUrl } from "@/components/aliados/partner-monogram";
import { Icon } from "@/components/ui/icon";
import type { PartnerSummary } from "@/lib/autolibre-api";
import { partnerPath } from "@/lib/aliados/query";
import { aliadosContent } from "@/lib/content/aliados";

type PartnerCardProps = {
  readonly partner: PartnerSummary;
  /** Slug de familia → nombre visible (del catálogo de servicios). */
  readonly categoryNames: ReadonlyMap<string, string>;
};

/**
 * Tarjeta de un negocio del directorio. Un solo punto de foco: el link del
 * `h3`, estirado sobre toda la tarjeta con un `::after` absoluto, así se
 * puede tocar en cualquier lado sin anidar links ni sumar tab stops. El
 * "Ver perfil" del pie es solo visual (`aria-hidden`).
 *
 * El anillo de foco lo dibuja la tarjeta (`has-[:focus-visible]`) en lugar
 * del link: el link mide lo que el nombre, y un anillo alrededor del nombre
 * no dice que toda la tarjeta es el destino. El outline se reemplaza, no se
 * quita.
 *
 * No muestra WhatsApp, dirección, link externo ni nivel del acuerdo: la
 * tarjeta presenta al negocio; el contacto pasa por AutoLibre.
 */
export function PartnerCard({ partner, categoryNames }: PartnerCardProps) {
  const { card } = aliadosContent.directory;
  const logoUrl = safeHttpUrl(partner.logoUrl);

  return (
    <li className="relative flex flex-col gap-4 rounded-card border border-line bg-surface p-6 transition-colors hover:border-brand has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand">
      <div className="flex size-16 shrink-0 items-center justify-center overflow-clip rounded-card border border-line bg-surface-subtle">
        {logoUrl ? (
          // `unoptimized`: el logo lo carga el equipo como una URL libre en el
          // admin y no hay un host fijo que declarar en `remotePatterns`. Un
          // host no declarado haría tirar a `next/image` y rompería la página
          // entera. A 64px el optimizador no ahorra casi nada.
          // `alt=""`: el nombre del negocio está al lado, en el `h3`.
          <Image
            src={logoUrl}
            alt=""
            width={64}
            height={64}
            sizes="64px"
            unoptimized
            className="size-full object-contain"
          />
        ) : (
          <span aria-hidden="true" className="font-display text-xl font-bold text-brand-hover">
            {partnerMonogram(partner.name)}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="font-display text-xl leading-tight font-bold text-ink">
          <Link
            href={partnerPath(partner.slug)}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
          >
            {partner.name}
          </Link>
        </h3>
        {partner.coverageZone ? (
          <p className="flex items-start gap-1.5 text-sm text-ink/70">
            <Icon name="pin" size={18} strokeWidth={1.8} className="mt-px shrink-0 text-brand-hover" />
            <span>
              <span className="sr-only">{card.zoneLabel} </span>
              {partner.coverageZone}
            </span>
          </p>
        ) : null}
      </div>

      {partner.categories.length > 0 ? (
        <ul aria-label={card.categoriesLabel} className="flex flex-wrap gap-2">
          {partner.categories.map((slug) => (
            <li key={slug} className="rounded-full bg-surface-muted px-3 py-1 text-sm text-ink">
              {categoryNames.get(slug) ?? slug}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-line pt-4 text-sm">
        <p className="text-ink/70">{card.brands(partner.brands)}</p>
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1 font-semibold text-brand-hover">
          {card.viewProfile}
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </span>
      </div>
    </li>
  );
}
