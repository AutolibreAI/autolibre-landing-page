import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import { isUnoptimizedImage, ratingText } from "@/lib/provider-profile/present";
import { providerPath } from "@/lib/provider-profile/routes";
import type { PartnerProfileSummary } from "@/lib/provider-profile/types";

type DirectoryProps = {
  readonly profiles: readonly PartnerProfileSummary[];
  /** Texto del estado vacío (con o sin filtro). */
  readonly emptyText: string;
};

/**
 * Listado de proveedores de `/proveedor`: una tarjeta por perfil (logo, nombre,
 * rubro principal, localidad y puntuación) que enlaza a `/proveedor/<slug>`. Sin
 * perfiles, un estado vacío (no una página rota).
 */
export function Directory({ profiles, emptyText }: DirectoryProps) {
  if (profiles.length === 0) {
    return <p className="mt-6 text-base text-ink/70">{emptyText}</p>;
  }

  return (
    <ul aria-label={copy.directory.listLabel} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {profiles.map((profile) => (
        <li key={profile.slug}>
          <Link
            href={providerPath(profile.slug)}
            className="flex h-full items-center gap-4 rounded-2xl border border-card-line bg-card p-4 transition-colors hover:border-brand"
          >
            <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-card-muted">
              {profile.logo ? (
                <Image
                  src={profile.logo.url}
                  alt=""
                  width={profile.logo.width}
                  height={profile.logo.height}
                  unoptimized={isUnoptimizedImage(profile.logo.url)}
                  sizes="64px"
                  className="size-full object-cover"
                />
              ) : (
                <Icon name="car" size={24} className="text-ink/35" />
              )}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-base font-bold text-ink">
                {profile.name}
              </span>
              <span className="block truncate text-sm text-ink/70">
                {[profile.primaryCategory?.name, profile.locality].filter(Boolean).join(" · ")}
              </span>
              {profile.rating && profile.rating.count > 0 ? (
                <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-ink">
                  <Icon name="star" size={14} className="fill-current text-rating" />
                  {fillTemplate(copy.directory.ratingLabel, {
                    average: ratingText(profile.rating.average),
                    count: profile.rating.count,
                  })}
                </span>
              ) : null}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
