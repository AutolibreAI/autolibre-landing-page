"use client";

import { useId, useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  appHeadline,
  appLocationLine,
  monogramToneFor,
  partnerInitials,
  type OwnerPartnerProfile,
  type PartnerServiceGroup,
} from "@/lib/account/partner-profile";
import { accountContent } from "@/lib/content/account";
import { cn } from "@/lib/utils";

const { preview } = accountContent.business;

/** Tonos de la portada con monograma, con los colores de la app (`workshop-monogram-cover.tsx`). */
const TONES = {
  dark: { cover: "bg-action", ink: "text-brand-200/14" },
  soft: { cover: "bg-brand-50", ink: "text-brand/16" },
  gray: { cover: "bg-monogram-gray", ink: "text-monogram-ink-gray/16" },
} as const;

const ONE_DECIMAL = new Intl.NumberFormat("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

type AppPreviewProps = {
  readonly profile: OwnerPartnerProfile;
  /** Nivel del título "Así te ven en la app" según dónde se monte. */
  readonly headingLevel: "h2" | "h3";
  readonly className?: string;
};

/**
 * "Así te ven en la app": réplica de la ficha del taller de la app
 * (`autolibre-mobile/.../taller-perfil/TallerPerfilScreen.tsx`) con los datos
 * de HOY, que salen del mismo endpoint que lee la app (`GET /partners/{id}`).
 * Muestra solo lo que la app muestra hoy:
 *
 * - Portada: la foto propia, o el monograma de marca (tono por id, iniciales
 *   gigantes recortadas y el logo o las iniciales en un círculo blanco).
 * - Nombre y subtítulo (familia principal; la distancia depende de quien
 *   mira, así que la vista previa no la inventa).
 * - Números: solo el puntaje con opiniones (la app todavía no tiene tiempo
 *   de respuesta ni trabajos por la app).
 * - "Qué hacen" agrupado, de a una familia abierta (con una sola familia,
 *   los chips directo).
 * - Reseñas: "Todavía no tiene reseñas" sin puntaje.
 * - SIN horarios ni "Abierto hasta…": la app los tiene apagados hasta que
 *   el backend mande horarios estructurados.
 * - "Dónde está" con la dirección (el mini mapa solo con coordenadas).
 * - Barra: chat (si hay contacto) y "Pedir presupuesto", que es lo que dice
 *   la app HOY (debería pasar a "Pedir propuestas": ver el informe).
 *
 * La pantalla del teléfono scrollea por dentro y se puede enfocar con Tab
 * (región con nombre). Los botones de la barra son dibujo: no hacen nada,
 * así que van ocultos al lector de pantalla.
 */
export function AppPreview({ profile, headingLevel: Heading, className }: AppPreviewProps) {
  const titleId = useId();
  const tone = TONES[monogramToneFor(profile.id)];
  const initials = partnerInitials(profile.name);

  return (
    <section aria-labelledby={titleId} className={cn("flex flex-col items-center gap-3", className)}>
      <Heading id={titleId} className="self-start font-display text-lg leading-7 font-bold text-fg">
        {preview.title}
      </Heading>

      {/* Marco del teléfono: borde `action` de 8px (no hay clase de borde de 8 con radio interno). */}
      <div className="w-full max-w-75 rounded-[2.5rem] border-8 border-action bg-card">
        <div
          role="region"
          aria-label={preview.frameLabel(profile.name)}
          tabIndex={0}
          className="relative h-128 overflow-hidden rounded-[2rem] bg-card"
        >
          <div className="h-full overflow-y-auto overscroll-contain pb-20">
            {/* Portada */}
            <div className={cn("relative h-50 overflow-hidden", profile.coverUrl ? "bg-card-muted" : tone.cover)}>
              {profile.coverUrl ? (
                // Foto propia del taller: se muestra recortada como en la app. `<img>` y no
                // `next/image`: la URL es del storage del backend y es una vista previa privada.
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.coverUrl} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -right-4 -bottom-8 font-display leading-none font-bold whitespace-nowrap select-none",
                      // 1,4 veces el alto de la portada, como `monogramFontSize` de la app.
                      "text-[17.5rem]",
                      tone.ink,
                    )}
                  >
                    {initials}
                  </span>
                  <span
                    aria-hidden="true"
                    className="absolute bottom-10 left-3.5 flex size-14 items-center justify-center overflow-hidden rounded-full border-3 border-card bg-card font-display text-lg font-bold text-action"
                  >
                    {profile.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={profile.logoUrl} alt="" className="size-full object-contain" />
                    ) : (
                      initials
                    )}
                  </span>
                </>
              )}
              <span
                aria-hidden="true"
                className="absolute top-3 left-3 flex size-8 items-center justify-center rounded-full bg-card text-fg"
              >
                <Icon name="arrow-left" size={16} strokeWidth={2} />
              </span>
            </div>

            {/* Hoja blanca que monta sobre la portada */}
            <div className="relative -mt-7 flex flex-col gap-5 rounded-t-3xl bg-card px-4 pt-6">
              <div className="flex flex-col gap-1">
                <p className="font-display text-xl leading-tight font-bold text-fg">{profile.name}</p>
                <p className="text-sm text-fg-subtle">{appHeadline(profile)}</p>
              </div>

              {profile.rating ? (
                <div className="flex rounded-2xl border border-card-line">
                  <p className="flex flex-1 flex-col items-center gap-0.5 px-1.5 py-3">
                    <span className="font-display text-lg font-bold text-fg">
                      {ONE_DECIMAL.format(profile.rating.average)}
                    </span>
                    <span className="text-xs text-fg-subtle">{preview.ratingLabel(profile.rating.count)}</span>
                  </p>
                </div>
              ) : null}

              {profile.serviceGroups.length > 0 ? (
                <PreviewSection title={preview.whatTheyDo}>
                  <ServiceGroups groups={profile.serviceGroups} />
                </PreviewSection>
              ) : profile.categories.length > 0 ? (
                <PreviewSection title={preview.whatTheyDo}>
                  <Chips items={profile.categories} />
                </PreviewSection>
              ) : null}

              {profile.reviewsCount === 0 && profile.rating === null ? (
                <PreviewSection title={preview.reviews}>
                  <p className="text-sm text-fg-subtle">{preview.noReviews}</p>
                </PreviewSection>
              ) : null}

              <PreviewSection title={preview.where}>
                {profile.hasGeo ? (
                  <span
                    aria-hidden="true"
                    className="flex h-24 items-center justify-center rounded-2xl bg-canvas text-fg-subtle"
                  >
                    <Icon name="pin" size={22} />
                  </span>
                ) : null}
                <p className="text-sm text-fg-muted">{appLocationLine(profile)}</p>
              </PreviewSection>
            </div>
          </div>

          {/* Barra fija de la ficha: chat (si hay contacto) + "Pedir presupuesto". Dibujo, sin acción. */}
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 flex items-center gap-2 border-t border-card-line bg-card px-3 pt-3 pb-4"
          >
            {profile.contactUrl ? (
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border-[1.5px] border-control-line-strong text-fg">
                <Icon name="whatsapp" size={20} strokeWidth={1.8} />
              </span>
            ) : null}
            <span className="flex h-11 flex-1 items-center justify-center rounded-2xl border-[1.5px] border-control-line-strong font-display text-sm font-semibold text-fg">
              {preview.requestQuote}
            </span>
          </div>
        </div>
      </div>

      <p className="max-w-75 text-center text-label text-fg-muted">{preview.note(profile.logoUrl !== null)}</p>
    </section>
  );
}

function PreviewSection({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      {/* `<p>` y no heading: es la ficha dibujada, no secciones de esta página. */}
      <p className="font-display text-base font-bold text-fg">{title}</p>
      {children}
    </div>
  );
}

function Chips({ items }: { readonly items: readonly string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item} className="rounded-full bg-canvas px-2.5 py-1 text-xs text-fg-muted">
          {item}
        </li>
      ))}
    </ul>
  );
}

/** "Qué hacen" agrupado, de a UNA familia abierta (`taller-service-groups.tsx`). */
function ServiceGroups({ groups }: { readonly groups: readonly PartnerServiceGroup[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const baseId = useId();

  if (groups.length === 1) return <Chips items={groups[0]?.services ?? []} />;

  return (
    <ul className="flex flex-col">
      {groups.map((group, index) => {
        const open = openSlug === group.slug;
        const panelId = `${baseId}-${index}`;
        return (
          <li key={group.slug} className={cn(index > 0 && "border-t border-card-line")}>
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${group.name}, ${preview.servicesCount(group.services.length)}`}
              onClick={() => setOpenSlug(open ? null : group.slug)}
              className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-sm text-fg"
            >
              <span>{group.name}</span>
              <span className="flex items-center gap-1.5 text-fg-subtle">
                <span aria-hidden="true">{group.services.length}</span>
                <Icon
                  name="chevron-down"
                  size={16}
                  strokeWidth={2}
                  className={cn("transition-transform motion-reduce:transition-none", open && "rotate-180")}
                />
              </span>
            </button>
            {open ? (
              <div id={panelId} className="pb-3">
                <Chips items={group.services} />
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
