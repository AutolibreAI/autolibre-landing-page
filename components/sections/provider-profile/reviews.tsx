import { Icon } from "@/components/ui/icon";
import { ProfileCard } from "@/components/ui/profile-card";
import {
  fillTemplate,
  providerProfileContent as copy,
} from "@/lib/content/provider-profile";
import {
  monthYearLabel,
  ratingText,
  VISIBLE_REVIEWS,
} from "@/lib/provider-profile/present";
import type { PartnerProfile } from "@/lib/provider-profile/types";

function Stars({ value }: { readonly value: number }) {
  return (
    <span aria-hidden="true" className="inline-flex gap-0.5 text-rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon
          key={n}
          name="star"
          size={16}
          className={n <= Math.round(value) ? "fill-current" : "text-ink/20"}
        />
      ))}
    </span>
  );
}

/**
 * "Reseñas": solo las hechas en AutoLibre, con la puntuación general (sin
 * desglose) y hasta 3 reseñas. El nombre llega ya abreviado del backend
 * ("Lucía M."); se muestra tal cual. `id="resenas"` es el destino del link de
 * la puntuación del encabezado.
 *
 * Fase C: sin reseñas (`null` o `count: 0`), la sección no existe.
 */
export function ReviewsSection({ profile }: { readonly profile: PartnerProfile }) {
  const reviews = profile.reviews;
  if (!reviews || reviews.count <= 0 || reviews.items.length === 0) return null;

  const visible = reviews.items.slice(0, VISIBLE_REVIEWS);
  const countLabel =
    reviews.count === 1
      ? copy.reviews.countOne
      : fillTemplate(copy.reviews.count, { count: reviews.count });

  return (
    <ProfileCard
      id="perfil-resenas"
      sectionId="resenas"
      title={copy.sections.reviews}
      className="mt-5"
    >
      <p className="mt-2 flex items-center gap-2">
        <span className="font-display text-3xl font-bold text-ink">
          {ratingText(reviews.average)}
        </span>
        <Stars value={reviews.average} />
        <span className="text-sm text-ink/65">{countLabel}</span>
      </p>

      <ul className="mt-4 flex flex-col gap-4">
        {visible.map((review) => (
          <li key={review.id} className="rounded-xl border border-card-line p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <p className="font-semibold text-ink">{review.displayName}</p>
              <Stars value={review.stars} />
              <span className="sr-only">{review.stars} de 5</span>
            </div>
            <p className="text-sm text-ink/60">
              {[review.vehicle, monthYearLabel(review.date)].filter(Boolean).join(" · ")}
            </p>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-ink/80">{review.text}</p>
            {review.reply ? (
              <div className="mt-3 rounded-lg bg-card-muted p-3">
                <p className="text-sm font-semibold text-ink">{copy.reviews.replyLabel}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink/75">{review.reply.text}</p>
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {reviews.count > visible.length ? (
        <a
          href="#resenas"
          className="mt-4 inline-flex min-h-11 items-center text-[0.9375rem] font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          {fillTemplate(copy.reviews.seeAll, { count: reviews.count })}
        </a>
      ) : null}
    </ProfileCard>
  );
}
