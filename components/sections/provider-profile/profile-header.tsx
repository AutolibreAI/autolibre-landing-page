import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OpenStatusBadge } from "@/components/ui/open-status-badge";
import { ShareButton } from "@/components/ui/share-button";
import { ANALYTICS_EVENTS, PROVIDER_ACTIONS } from "@/lib/analytics/events";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  directionsUrl,
  isUnoptimizedImage,
  ratingText,
  safeWhatsappUrl,
  serviceAreaNames,
} from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";
import { cn } from "@/lib/utils";

type ProfileHeaderProps = {
  readonly profile: PartnerProfile;
  /** URL pública y canónica del perfil (la que se comparte). */
  readonly publicUrl: string;
};

const primaryAction = cn(
  buttonVariants({ size: "md" }),
  "min-h-11 bg-ink hover:bg-ink/90",
);
const secondaryAction = cn(buttonVariants({ variant: "outline", size: "md" }), "min-h-11");

/**
 * Encabezado del perfil: portada, logo, nombre (el ÚNICO `<h1>`), sello,
 * rubros, puntuación, estado en vivo, localidad y botones de contacto.
 *
 * La portada es la imagen más grande de la primera pantalla: la ÚNICA con
 * `preload` de la página (nunca `priority`). Sin portada o sin logo se pinta
 * un cuadro neutro, no una imagen rota.
 */
export function ProfileHeader({ profile, publicUrl }: ProfileHeaderProps) {
  const { actions, header } = copy;
  const whatsappUrl = safeWhatsappUrl(profile.contact.whatsappUrl);
  const phone = profile.contact.phoneE164;
  const directions = profile.locationMode === "mobile" ? null : directionsUrl(profile);
  const hours = profile.businessHours ?? [];
  const hasHours = hours.some((day) => day.ranges.length > 0);
  const reviews = profile.reviews;
  const hasRating = reviews !== null && reviews.count > 0;
  const area = serviceAreaNames(profile).join(", ");

  // Sin local: "A domicilio y online · <zona>" en lugar de la dirección.
  const place =
    profile.locationMode === "mobile"
      ? area
        ? fillTemplate(header.mobileLocation, { area })
        : header.mobileLocationNoArea
      : profile.locality;

  const categories = profile.primaryCategory
    ? [profile.primaryCategory, ...profile.secondaryCategories]
    : [];

  const analytics = (action: string) => ({
    "data-analytics-event": ANALYTICS_EVENTS.providerActionClicked,
    "data-analytics-action": action,
    "data-analytics-provider": profile.slug,
    "data-analytics-placement": "provider_header",
  });

  return (
    <section
      aria-labelledby="perfil-encabezado"
      className="overflow-hidden rounded-2xl border border-card-line bg-card"
    >
      <div className="relative h-28 bg-card-muted sm:h-44 md:h-60">
        {profile.cover ? (
          <Image
            src={profile.cover.url}
            alt={fillTemplate(copy.alt.cover, { name: profile.name })}
            fill
            preload
            unoptimized={isUnoptimizedImage(profile.cover.url)}
            sizes="(min-width: 1280px) 1100px, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="sr-only">{copy.imagePlaceholder.cover}</span>
        )}
      </div>

      <div className="px-5 pb-5 md:px-8 md:pb-6">
        <div className="relative -mt-10 flex size-20 items-center sm:-mt-12 sm:size-24 justify-center overflow-hidden rounded-2xl border-4 border-card bg-card-muted">
          {profile.logo ? (
            <Image
              src={profile.logo.url}
              alt={fillTemplate(copy.alt.logo, { name: profile.name })}
              width={profile.logo.width}
              height={profile.logo.height}
              unoptimized={isUnoptimizedImage(profile.logo.url)}
              sizes="(min-width: 640px) 96px, 80px"
              className="size-full object-cover"
            />
          ) : (
            <Icon name="car" size={32} className="text-ink/35" />
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 sm:mt-4">
          <h1
            id="perfil-encabezado"
            className="font-display text-2xl font-bold text-ink md:text-3xl"
          >
            {profile.name}
          </h1>
          {profile.isAlly ? (
            <p className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-ink">
              <Image
                src="/brand/isotype.png"
                alt=""
                width={450}
                height={407}
                sizes="16px"
                className="h-4 w-auto"
              />
              {copy.ally}
            </p>
          ) : null}
        </div>

        {categories.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-2">
            {categories.map((category, index) => (
              <li
                key={category.slug}
                className={cn(
                  "rounded-full px-3 py-1 text-sm font-medium",
                  index === 0 ? "bg-ink text-white" : "hidden bg-card-muted text-ink/75 sm:block",
                )}
              >
                {category.name}
              </li>
            ))}
            {categories.length > 1 ? (
              <li className="rounded-full bg-card-muted px-3 py-1 text-sm font-medium text-ink/75 sm:hidden">
                {fillTemplate(header.categoriesMore, { count: categories.length - 1 })}
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[0.9375rem] text-ink/75 sm:mt-4">
          {hasRating && reviews ? (
            <a
              href="#resenas"
              className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-ink underline-offset-4 hover:underline"
            >
              <Icon name="star" size={18} className="fill-current text-rating" />
              {fillTemplate(header.ratingLabel, {
                average: ratingText(reviews.average),
                count: reviews.count,
                reviews: reviews.count === 1 ? header.reviewsOne : header.reviewsMany,
              })}
            </a>
          ) : null}
          {place ? (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" size={18} className="text-ink/55" />
              {place}
            </span>
          ) : null}
          {hasHours ? <OpenStatusBadge hours={hours} /> : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-3 sm:mt-5">
          {whatsappUrl ? (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-provider={profile.slug}
              data-analytics-placement="provider_header"
              className={primaryAction}
            >
              <Icon name="whatsapp" size={18} strokeWidth={1.8} />
              {actions.whatsapp}
            </a>
          ) : null}
          {phone ? (
            <a
              href={`tel:${phone}`}
              {...analytics(PROVIDER_ACTIONS.call)}
              className={secondaryAction}
            >
              <Icon name="phone" size={18} strokeWidth={1.8} />
              {actions.call}
            </a>
          ) : null}
          {directions ? (
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              {...analytics(PROVIDER_ACTIONS.directions)}
              className={secondaryAction}
            >
              <Icon name="navigation" size={18} strokeWidth={1.8} />
              {actions.directions}
            </a>
          ) : null}
          <ShareButton
            label={actions.share}
            copiedLabel={copy.share.copied}
            url={publicUrl}
            title={fillTemplate(copy.share.shareTitle, { name: profile.name })}
            provider={profile.slug}
            placement="provider_header"
            className={secondaryAction}
          />
        </div>
      </div>
    </section>
  );
}
