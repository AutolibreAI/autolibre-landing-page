"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { AppPreview } from "@/components/cuenta/app-preview";
import { ButtonAnchor } from "@/components/ui/button";
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
 * "Completá tu perfil" del Resumen (referencia: Square "Complete your setup").
 * Sale de los datos vacíos de `GET /partners/{id}`. Como no hay edición desde
 * la web, cada pendiente se manda por WhatsApp al equipo, que lo carga: el
 * botón lo dice.
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
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <h3 id={titleId} className="font-display text-2xl font-bold text-fg">
          {checklist.title}
        </h3>
        <div className="flex items-center gap-3">
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={total}
            aria-valuenow={done}
            aria-label={checklist.progressLabel(done, total)}
            className="h-1.5 w-35 overflow-hidden rounded-full bg-card-muted"
          >
            {/* Ancho calculado: es el dato. */}
            <span className="block h-full rounded-full bg-action" style={{ width: `${Math.round((done / total) * 100)}%` }} />
          </div>
          <span aria-hidden="true" className="text-sm font-medium text-fg">
            {checklist.progress(done, total)}
          </span>
        </div>
      </div>
      <div>
        <p className="leading-relaxed text-fg-muted">{missing.length > 0 ? checklist.body : checklist.complete}</p>
        <Link
          href={previewHref}
          className="inline-flex min-h-11 items-center font-semibold text-fg underline underline-offset-4"
        >
          {checklist.preview}
        </Link>
      </div>
      {missing.length > 0 ? (
        <ul>
          {missing.map((key) => {
            const item = checklist.items[key];
            return (
              <li key={key} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-card-line py-3.5">
                <span aria-hidden="true" className="size-5.5 shrink-0 rounded-full border-[1.5px] border-control-line-strong" />
                <div className="min-w-0 flex-[1_1_12rem]">
                  <p className="font-medium text-fg">{item.title}</p>
                  <p className="text-sm text-fg-muted">{item.hint}</p>
                </div>
                <ButtonAnchor
                  href={whatsappUrl(checklist.message(profile.name, item.title))}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline"
                  size="44"
                  aria-label={checklist.ctaLabel(item.title)}
                  data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                  data-analytics-placement="cuenta_completar_perfil"
                  className="ml-9.5 shrink-0 px-4 sm:ml-0"
                >
                  {checklist.cta}
                </ButtonAnchor>
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

/**
 * Pestaña Perfil (referencia: Podia "Account": una fila por dato, valor al
 * medio y acción a la derecha) con la vista previa de la app al costado
 * desde `lg`; en celular la vista previa se abre con un botón.
 *
 * Sin edición desde la web (no hay PATCH del dueño): cada fila pide el
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
  const fields = Object.keys(copy.fields) as FieldKey[];

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id={titleId} className="font-display text-3xl font-bold text-fg">
            {copy.title}
          </h2>
          <p className="mt-2 text-fg-muted">{copy.body}</p>
        </div>
        {publicHref ? (
          <ButtonAnchor href={publicHref} variant="outline" size="48">
            {accountContent.business.publicPage}
          </ButtonAnchor>
        ) : null}
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-12">
        <div className="flex flex-col gap-4">
          <dl className="rounded-card border border-card-line bg-card px-6 sm:px-7">
            {fields.map((key, index) => {
              const label = copy.fields[key];
              const value = fieldValue(profile, key);
              const checklistKey = CHECKLIST_FIELD[key];
              const missing = value === null || (checklistKey ? !isProfileFieldFilled(profile, checklistKey) : false);
              return (
                <div
                  key={key}
                  className={cn(
                    "flex min-h-17 flex-wrap items-center gap-x-5 gap-y-1.5 py-3",
                    index > 0 && "border-t border-card-line",
                  )}
                >
                  <dt className="w-full font-medium text-fg sm:w-48 sm:shrink-0">{label}</dt>
                  <dd
                    className={cn(
                      "min-w-0 flex-[1_1_14rem] whitespace-pre-line",
                      missing ? "font-semibold text-status-pending" : "text-fg-muted",
                    )}
                  >
                    {missing ? copy.missing : value}
                  </dd>
                  <dd className="shrink-0">
                    <ButtonAnchor
                      href={whatsappUrl(copy.changeMessage(profile.name, label))}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant={missing ? "primary" : "outline"}
                      size="44"
                      aria-label={missing ? copy.addLabel(label) : copy.editLabel(label)}
                      data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                      data-analytics-placement="cuenta_perfil"
                      className="px-4"
                    >
                      {missing ? copy.add : copy.edit}
                    </ButtonAnchor>
                  </dd>
                </div>
              );
            })}
          </dl>
          <p className="text-sm leading-relaxed text-fg-muted">{copy.note}</p>
        </div>

        <div id={APP_PREVIEW_ANCHOR} className="scroll-mt-24">
          <button
            type="button"
            aria-expanded={previewOpen}
            aria-controls={previewId}
            onClick={() => setPreviewOpen((value) => !value)}
            className="inline-flex h-12 w-full items-center justify-center rounded-full border border-action bg-card font-display text-control font-semibold text-fg hover:bg-brand-50 lg:hidden"
          >
            {previewOpen ? preview.hide : preview.show}
          </button>
          <div id={previewId} className={cn("mt-6 lg:mt-0 lg:block", previewOpen ? "block" : "hidden")}>
            <AppPreview profile={profile} headingLevel="h3" />
          </div>
        </div>
      </div>
    </div>
  );
}
