import Image from "next/image";
import Link from "next/link";
import { partnerMonogram, safeHttpUrl } from "@/components/proveedores/partner-monogram";
import { Icon } from "@/components/ui/icon";
import type { PartnerSummary } from "@/lib/autolibre-api";
import { partnerPath } from "@/lib/proveedores/query";
import { providersDirectoryContent } from "@/lib/content/providers-directory";

type PartnerCardProps = {
  readonly partner: PartnerSummary;
  /** Slug de familia → nombre visible (del catálogo de servicios). */
  readonly categoryNames: ReadonlyMap<string, string>;
};

/**
 * Tarjeta de un negocio (directorio y "Más proveedores de…" del perfil),
 * sistema AutoLibre AI: `card` con filete `card-line`, sin sombra.
 *
 * Un solo punto de foco: el link del `h3`, estirado sobre toda la tarjeta con
 * un `::after` absoluto, así se toca en cualquier lado sin anidar links ni
 * sumar tab stops. "Ver perfil" es solo visual (`aria-hidden`). El anillo de
 * foco lo dibuja la tarjeta (`has-[:focus-visible]`): el outline se
 * reemplaza, no se quita.
 *
 * No muestra WhatsApp, dirección ni nivel del acuerdo: la tarjeta presenta al
 * negocio; el contacto pasa por AutoLibre. Las marcas solo si el dato existe
 * (el listado del backend no las trae: no se escribe "Todas las marcas").
 */
export function PartnerCard({ partner, categoryNames }: PartnerCardProps) {
  const { card } = providersDirectoryContent.directory;
  const logoUrl = safeHttpUrl(partner.logoUrl);

  return (
    <li className="relative flex flex-col gap-3 rounded-card border border-card-line bg-card p-4.5 text-fg transition-colors hover:border-action has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand motion-reduce:transition-none">
      <div className="flex items-center gap-3.5">
        <div className="flex size-14 shrink-0 items-center justify-center overflow-clip rounded-xl bg-brand-50">
          {logoUrl ? (
            // `unoptimized`: el logo es una URL libre cargada en el admin, sin
            // host fijo para `remotePatterns` (un host no declarado rompería la
            // página). A 56px el optimizador no ahorra casi nada. `alt=""`: el
            // nombre está al lado, en el `h3`.
            <Image
              src={logoUrl}
              alt=""
              width={56}
              height={56}
              sizes="56px"
              unoptimized
              className="size-full bg-card object-contain"
            />
          ) : (
            <span aria-hidden="true" className="font-display text-xl font-bold text-action">
              {partnerMonogram(partner.name)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="font-display text-lg leading-tight font-semibold text-fg md:text-xl">
            <Link
              href={partnerPath(partner.slug)}
              className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none"
            >
              {partner.name}
            </Link>
          </h3>
          {partner.coverageZone ? (
            <p className="mt-0.5 text-sm text-fg-muted">
              <span className="sr-only">{card.zoneLabel} </span>
              {partner.coverageZone}
            </p>
          ) : null}
        </div>
      </div>

      {partner.categories.length > 0 ? (
        <ul aria-label={card.categoriesLabel} className="flex flex-wrap gap-2">
          {partner.categories.map((slug) => (
            <li key={slug} className="rounded-full bg-canvas px-3 py-1 text-sm font-medium text-fg-muted">
              {categoryNames.get(slug) ?? slug}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-4 border-t border-card-line pt-3 text-sm">
        {partner.brands ? <p className="text-fg-muted">{card.brands(partner.brands)}</p> : <span />}
        <span aria-hidden="true" className="flex shrink-0 items-center gap-1 font-semibold text-fg">
          {card.viewProfile}
          <Icon name="arrow-right" size={16} strokeWidth={2} />
        </span>
      </div>
    </li>
  );
}
