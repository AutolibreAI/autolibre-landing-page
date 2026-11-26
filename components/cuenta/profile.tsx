"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AppPreview } from "@/components/cuenta/app-preview";
import { rowActionClass } from "@/components/cuenta/styles";
import { ButtonAnchor } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  isProfileFieldFilled,
  profileChecklist,
  type OwnerPartnerProfile,
  type ProfileChecklistKey,
} from "@/lib/account/partner-profile";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { checklist, profile: copy, preview } = accountContent.business;

/** `id` de la vista previa en la pestaña Perfil: destino de "Ver cómo te ven en la app". */
export const APP_PREVIEW_ANCHOR = "vista-app";

/**
 * Clases que comparten "Completá tu perfil" y su esqueleto de carga: mismo
 * alto antes y después de que llegue el perfil (sin saltos).
 */
export const checklistClasses = {
  card: "flex flex-col rounded-card border border-card-line bg-card px-5 pt-4 pb-1 sm:px-6",
  head: "flex flex-wrap items-center justify-between gap-x-6 gap-y-1",
  title: "font-display text-xl leading-7 font-bold text-fg",
  intro: "flex flex-wrap items-center justify-between gap-x-4",
  introText: "py-2.5 text-sm text-fg-muted",
  row: "flex items-center gap-3 border-t border-card-line py-2",
  rowTitle: "leading-snug font-medium text-fg",
  rowHint: "text-sm leading-snug text-fg-muted",
} as const;

/**
 * "Completá tu perfil" del Resumen (referencia: Square "Complete your setup").
 * Sale de los datos vacíos de `GET /partners/{id}`. Como no hay edición desde
 * la web, cada pendiente se manda por WhatsApp al equipo, que lo carga: la
 * acción de cada fila lo dice.
 */
export function ProfileChecklistCard({
  profile,
  previewHref,
}: {
  readonly profile: OwnerPartnerProfile;
  readonly previewHref: string;
}) {
  const titleId = useId();
  const { done, total, missing } = profileChecklist(profile);

  return (
    <section aria-labelledby={titleId} className={checklistClasses.card}>
      <div className={checklistClasses.head}>
        <h3 id={titleId} className={checklistClasses.title}>
          {checklist.title}
        </h3>
        <div className="flex h-7 items-center gap-3">
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label={checklist.progressLabel(done, total)}
            className="h-1.5 w-28 overflow-hidden rounded-full bg-card-muted"
          >
            {/* Ancho calculado: es el dato. */}
            <span className="block h-full rounded-full bg-action" style={{ width: `${Math.round((done / total) * 100)}%` }} />
          </div>
          <span aria-hidden="true" className="text-sm font-medium text-fg tabular-nums">
            {checklist.progress(done, total)}
          </span>
        </div>
      </div>
      <div className={checklistClasses.intro}>
        <p className={checklistClasses.introText}>{missing.length > 0 ? checklist.body : checklist.complete}</p>
        <Link
          href={previewHref}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
        >
          {checklist.preview}
        </Link>
      </div>
      {missing.length > 0 ? (
        <ul>
          {missing.map((key) => {
            const item = checklist.items[key];
            return (
              <li key={key} className={checklistClasses.row}>
                <span aria-hidden="true" className="size-5 shrink-0 rounded-full border-[1.5px] border-control-line-strong" />
                <div className="min-w-0 flex-1">
                  <p className={checklistClasses.rowTitle}>{item.title}</p>
                  <p className={checklistClasses.rowHint}>{item.hint}</p>
                </div>
                <a
                  href={whatsappUrl(checklist.message(profile.name, item.title))}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={checklist.ctaLabel(item.title)}
                  data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                  data-analytics-placement="cuenta_completar_perfil"
                  className={rowActionClass}
                >
                  <Icon name="whatsapp" size={18} strokeWidth={1.8} className="text-whatsapp" />
                  <span className="sm:hidden">{checklist.ctaShort}</span>
                  <span className="max-sm:hidden">{checklist.cta}</span>
                </a>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

type FieldKey = keyof typeof copy.fields;

/** Valor de cada fila de "Perfil del negocio", o `null` si falta. */
function fieldValue(profile: OwnerPartnerProfile, key: FieldKey): string | null {
  switch (key) {
    case "name":
      return profile.name;
    case "logo":
      return profile.logoUrl ? copy.logoLoaded : null;
    case "description":
      return profile.description;
    case "services": {
      const families = profile.serviceGroups.length > 0 ? profile.serviceGroups.map((group) => group.name) : profile.categories;
      return families.length > 0 ? families.join(" · ") : null;
    }
    case "brands":
      return profile.brands.length === 0 ? copy.allBrands : profile.brands.join(" · ");
    case "modality":
      return profile.modality;
    case "address":
      return profile.address;
    case "hours":
      return profile.hours;
    case "whatsapp":
      return profile.whatsapp;
    case "links": {
      const kinds = [...new Set(profile.links.map((link) => copy.linkKinds[link.kind] ?? copy.linkKinds.other))];
      return kinds.length > 0 ? kinds.join(" · ") : null;
    }
  }
}

const CHECKLIST_FIELD: Partial<Record<FieldKey, ProfileChecklistKey>> = {
  name: "name",
  logo: "logo",
  description: "description",
  services: "services",
  address: "address",
  hours: "hours",
  whatsapp: "whatsapp",
  links: "links",
};

/** Datos largos: ocupan las dos columnas de la grilla. */
const WIDE_FIELDS: ReadonlySet<FieldKey> = new Set(["description", "services"]);

/** Clases que comparten la pestaña Perfil y su esqueleto de carga. */
export const profileClasses = {
  head: "flex flex-wrap items-end justify-between gap-x-4 gap-y-2",
  title: "font-display text-2xl leading-tight font-bold text-fg",
  body: "mt-1 text-sm text-fg-muted",
  grid: "grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] xl:gap-10",
  card: "overflow-hidden rounded-card border border-card-line bg-card px-5 sm:px-6",
  /** `-mt-px`: el filete de arriba de la primera fila queda oculto (la tarjeta ya tiene borde). */
  list: "-mt-px grid gap-x-8 md:grid-cols-2",
  cell: "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 border-t border-card-line py-1.5",
  label: "text-sm text-fg-muted",
  previewToggle:
    "inline-flex h-12 w-full items-center justify-center rounded-full border border-action bg-card font-display text-control font-semibold text-fg hover:bg-brand-50 lg:hidden",
} as const;

/** Las filas de la pestaña Perfil, en orden (las largas, a lo ancho). */
export const PROFILE_FIELDS = (Object.keys(copy.fields) as FieldKey[]).map((key) => ({
  key,
  wide: WIDE_FIELDS.has(key),
}));

/**
 * Pestaña Perfil (referencia: Podia "Account"): una grilla de dato y valor
 * en dos columnas desde `md` (los largos, a lo ancho), con una acción chica
 * por dato, y la vista previa de la app al costado desde `lg`; en celular la
 * vista previa se abre con un botón.
 *
 * Sin edición desde la web (no hay PATCH del dueño): cada dato pide el
 * cambio por WhatsApp. `ACCOUNT_FEATURES.profileEditing` queda para cuando
 * exista.
 */
export function ProfileSection({
  profile,
  titleId,
  publicHref,
}: {
  readonly profile: OwnerPartnerProfile;
  readonly titleId: string;
  readonly publicHref: string | null;
}) {
  // Llegar con `#vista-app` ("Ver cómo te ven en la app" del Resumen) la abre
  // también en celular. Leer `window` acá es seguro: esta parte solo se
  // dibuja con sesión, en el browser (el server pinta el login).
  const [previewOpen, setPreviewOpen] = useState(
    () => typeof window !== "undefined" && window.location.hash === `#${APP_PREVIEW_ANCHOR}`,
  );
  const previewId = useId();

  return (
    <div className="flex flex-col gap-5">
      <div className={profileClasses.head}>
        <div>
          <h2 id={titleId} className={profileClasses.title}>
            {copy.title}
          </h2>
          <p className={profileClasses.body}>{copy.body}</p>
        </div>
        {publicHref ? (
          <ButtonAnchor href={publicHref} variant="outline" size="44">
            {accountContent.business.publicPage}
          </ButtonAnchor>
        ) : null}
      </div>

      <div className={profileClasses.grid}>
        <div className="flex flex-col gap-3">
          <div className={profileClasses.card}>
            <dl className={profileClasses.list}>
              {PROFILE_FIELDS.map(({ key, wide }) => {
                const label = copy.fields[key];
                const value = fieldValue(profile, key);
                const checklistKey = CHECKLIST_FIELD[key];
                const missing = value === null || (checklistKey ? !isProfileFieldFilled(profile, checklistKey) : false);
                return (
                  <div key={key} className={cn(profileClasses.cell, wide && "md:col-span-2")}>
                    <dt className={profileClasses.label}>{label}</dt>
                    <dd
                      className={cn(
                        "col-start-1 min-w-0 whitespace-pre-line",
                        missing ? "font-semibold text-status-pending" : "text-fg",
                      )}
                    >
                      {missing ? copy.missing : value}
                    </dd>
                    <dd className="col-start-2 row-span-2 row-start-1">
                      <a
                        href={whatsappUrl(copy.changeMessage(profile.name, label))}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={missing ? copy.addLabel(label) : copy.editLabel(label)}
                        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                        data-analytics-placement="cuenta_perfil"
                        className={rowActionClass}
                      >
                        <Icon name="whatsapp" size={16} strokeWidth={1.8} className="text-whatsapp" />
                        {missing ? copy.add : copy.edit}
                      </a>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
          <p className="text-sm text-fg-muted">{copy.note}</p>
        </div>

        <div id={APP_PREVIEW_ANCHOR} className="scroll-mt-24">
          <button
            type="button"
            aria-expanded={previewOpen}
            aria-controls={previewId}
            onClick={() => setPreviewOpen((value) => !value)}
            className={profileClasses.previewToggle}
          >
            {previewOpen ? preview.hide : preview.show}
          </button>
          <div id={previewId} className={cn("mt-5 lg:mt-0 lg:block", previewOpen ? "block" : "hidden")}>
            <AppPreview profile={profile} headingLevel="h3" />
          </div>
        </div>
      </div>
    </div>
  );
}
