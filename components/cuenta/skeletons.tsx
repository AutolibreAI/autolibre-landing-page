import { businessHeaderClasses } from "@/components/cuenta/business-header";
import { planSectionClasses, planSummaryClasses } from "@/components/cuenta/plan";
import { checklistClasses, PROFILE_FIELDS, profileClasses } from "@/components/cuenta/profile";
import { boneClass } from "@/components/cuenta/styles";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import type { AccountSection } from "@/lib/account/sections";
import { accountContent } from "@/lib/content/account";
import { cn } from "@/lib/utils";

const { business, customer } = accountContent;

/**
 * Esqueletos de carga de "Mi negocio" y de la cuenta de cliente. Reemplazan a
 * los "Cargando…" de texto: ocupan el MISMO lugar que el contenido que llega
 * (mismas clases de caja y de tipografía, ver `styles.ts`), así nada salta
 * cuando responden `GET /partners/me/memberships`, `GET /partners/{id}` y la
 * suscripción (CLS ≈ 0).
 *
 * Son decorativos (`aria-hidden`): lo que se anuncia es el `role="status"`
 * de quien los monta. Sin animación con `prefers-reduced-motion`.
 */

function Bone({ className }: { readonly className?: string }) {
  return <span aria-hidden="true" className={cn(boneClass, className)} />;
}

/** "Completá tu perfil" mientras llega el perfil (con tres pendientes, el caso típico). */
export function ChecklistSkeleton({ rows = 3 }: { readonly rows?: number }) {
  return (
    <div aria-hidden="true" className={checklistClasses.card}>
      <div className={checklistClasses.head}>
        <p className={checklistClasses.title}>
          <Bone className="h-5 w-44" />
        </p>
        <div className="flex h-7 items-center gap-3">
          <Bone className="h-1.5 w-28" />
          <Bone className="h-3.5 w-10" />
        </div>
      </div>
      <div className={checklistClasses.intro}>
        <p className={checklistClasses.introText}>
          <Bone className="h-3 w-72 max-sm:w-full" />
          <Bone className="h-3 w-40 sm:hidden" />
        </p>
        <p className="flex min-h-11 items-center">
          <Bone className="h-3 w-40" />
        </p>
      </div>
      <ul>
        {Array.from({ length: rows }, (_, index) => (
          <li key={index} className={checklistClasses.row}>
            <span className="size-5 shrink-0 rounded-full border-[1.5px] border-card-line" />
            <div className="min-w-0 flex-1">
              <p className={checklistClasses.rowTitle}>
                <Bone className="h-3.5 w-52 max-sm:w-full" />
                <Bone className="h-3.5 w-20 sm:hidden" />
              </p>
              <p className={checklistClasses.rowHint}>
                <Bone className="h-3 w-40 max-sm:w-full" />
                <Bone className="h-3 w-24 sm:hidden" />
              </p>
            </div>
            <p className="flex min-h-11 shrink-0 items-center">
              <Bone className="h-3.5 w-16 sm:w-40" />
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tarjeta del plan del Resumen mientras llega la suscripción. Con la forma de
 * Gratis, la más alta: si el negocio tiene un plan pago, la tarjeta solo se
 * achica y no empuja nada hacia abajo.
 */
export function PlanSummarySkeleton() {
  return (
    <div aria-hidden="true" className={planSummaryClasses.card}>
      <div className={planSummaryClasses.head}>
        <p className={planSummaryClasses.title}>
          <Bone className="h-5 w-32" />
        </p>
      </div>
      <p className={planSummaryClasses.text}>
        <Bone className="h-3 w-52" />
      </p>
      <div className="flex flex-col gap-2 pb-1">
        <p className={planSummaryClasses.text}>
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-12" />
        </p>
        <Bone className="h-11 w-full" />
        <p className="text-center text-label">
          <Bone className="h-3 w-48" />
        </p>
      </div>
    </div>
  );
}

/** "¿Necesitás una mano?" sin el nombre del negocio todavía. */
export function HelpLinkSkeleton({ className }: { readonly className?: string }) {
  return (
    <div aria-hidden="true" className={cn("flex flex-col gap-1 px-1", className)}>
      <p className="font-medium">
        <Bone className="h-3.5 w-36" />
      </p>
      <p className="flex min-h-11 items-center">
        <Bone className="h-3.5 w-48" />
      </p>
    </div>
  );
}

/** Grilla de la pestaña Perfil y la vista previa, mientras llega el perfil. */
export function ProfileSkeleton() {
  return (
    <div aria-hidden="true" className={profileClasses.grid}>
      <div className="flex flex-col gap-3">
        <div className={profileClasses.card}>
          <div className={profileClasses.list}>
            {PROFILE_FIELDS.map(({ key, wide }) => (
              <div key={key} className={cn(profileClasses.cell, wide && "md:col-span-2")}>
                <p className={profileClasses.label}>
                  <Bone className="h-3 w-20" />
                </p>
                <p className="col-start-1">
                  <Bone className={cn("h-3.5 max-w-full", wide ? "w-80 max-md:w-full" : "w-40")} />
                  {wide ? <Bone className="h-3.5 w-32 md:hidden" /> : null}
                </p>
                <p className="col-start-2 row-span-2 row-start-1 flex min-h-11 items-center">
                  <Bone className="h-3.5 w-24" />
                </p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm">
          <Bone className="h-3 w-full" />
          <Bone className="h-3 w-2/3" />
        </p>
      </div>
      <div>
        <div className={cn(profileClasses.previewToggle, "border-card-line hover:bg-card")} />
        <div className="hidden flex-col items-center gap-3 lg:flex">
          <p className="self-start text-lg leading-7">
            <Bone className="h-4 w-44" />
          </p>
          <div className="w-full max-w-75 rounded-[2.5rem] border-8 border-card-muted">
            <div className="h-128 rounded-[2rem] bg-card" />
          </div>
          <p className="max-w-75 text-center text-label">
            <Bone className="h-3 w-64" />
            <Bone className="h-3 w-48" />
          </p>
        </div>
      </div>
    </div>
  );
}

/** Pestaña Plan mientras llega la suscripción (forma del plan pago). */
export function PlanTabSkeleton() {
  return (
    <div aria-hidden="true" className={planSectionClasses.grid}>
      <div className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex flex-col items-start gap-1.5">
            <p className="font-display text-2xl leading-tight">
              <Bone className="h-5 w-36" />
            </p>
            <Bone className="h-6.5 w-56 max-w-full" />
          </div>
          <div className="flex flex-col sm:items-end">
            <p className="font-display text-xl">
              <Bone className="h-4 w-28" />
            </p>
            <p className="text-sm">
              <Bone className="h-3 w-20" />
            </p>
          </div>
        </div>
        <hr className="border-card-line" />
        <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {Array.from({ length: 3 }, (_, index) => (
            <p key={index}>
              <Bone className="h-3 w-48 max-w-full" />
              <Bone className="h-3 w-28 sm:hidden" />
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <Bone className="h-11 w-56" />
          <Bone className="h-11 w-44" />
        </div>
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2 rounded-card border border-card-line bg-card p-5">
          <p className="text-lg leading-7">
            <Bone className="h-4 w-16" />
          </p>
          <p className="py-2 text-sm">
            <Bone className="h-3 w-full" />
          </p>
          <p className="border-t border-card-line py-2 text-sm">
            <Bone className="h-3 w-full" />
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 rounded-card border border-card-line bg-card p-5">
          <p className="text-lg leading-7">
            <Bone className="h-4 w-44" />
          </p>
          <p className="w-full text-sm">
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-1/2" />
          </p>
          <Bone className="h-11 w-44" />
        </div>
      </div>
    </div>
  );
}

/**
 * Barra del negocio mientras se buscan los negocios de la cuenta: el `<h1>`
 * ya está (con "Mi negocio" para el lector de pantalla), la caja del logo, el
 * selector y las pestañas ocupan su lugar definitivo.
 */
export function BusinessHeaderSkeleton({
  sections,
  current,
}: {
  readonly sections: readonly AccountSection[];
  readonly current: AccountSection;
}) {
  return (
    <div className="flex flex-col">
      <div className={businessHeaderClasses.row}>
        <Bone className={cn(businessHeaderClasses.avatar, "rounded-card")} />
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
          <h1 id={PRIVATE_FLOW_TITLE_ID} tabIndex={-1} className={businessHeaderClasses.title}>
            <span className="sr-only">{business.loadingTitle}</span>
            <Bone className="h-5 w-44 max-w-full sm:h-6 sm:w-64" />
          </h1>
          <Bone className={businessHeaderClasses.pillBone} />
        </div>
        <Bone className="h-11 w-24 shrink-0 sm:w-48" />
      </div>
      <div aria-hidden="true" className={businessHeaderClasses.nav}>
        <ul className={businessHeaderClasses.navList}>
          {sections.map((item) => (
            <li key={item} className="flex">
              <span
                className={cn(
                  businessHeaderClasses.navItem,
                  "text-fg-muted",
                  item === current ? "border-card-line font-semibold" : "border-transparent font-medium",
                )}
              >
                {business.nav.items[item]}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Cuenta de cliente mientras se buscan los negocios: el saludo real (el
 * nombre llega de Clerk) y las dos tarjetas con su forma.
 */
export function CustomerAccountSkeleton({
  firstName,
  footer,
}: {
  readonly firstName: string | null;
  readonly footer?: React.ReactNode;
}) {
  return (
    <div className="flex max-w-240 flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h1
          id={PRIVATE_FLOW_TITLE_ID}
          tabIndex={-1}
          className="font-display text-2xl leading-tight font-bold tracking-tight text-balance text-fg md:text-3xl"
        >
          {customer.greeting(firstName)}
        </h1>
        <p className="max-w-160 text-fg-muted">{customer.intro}</p>
      </div>
      <div aria-hidden="true" className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((index) => (
          <div key={index} className="flex flex-col items-start gap-3 rounded-card border border-card-line bg-card p-5 sm:p-6">
            <div className="flex w-full flex-col gap-1">
              <p className="font-display text-xl leading-7">
                <Bone className="h-5 w-56 max-w-full" />
              </p>
              <p>
                <Bone className="h-3.5 w-72 max-w-full" />
                <Bone className="h-3.5 w-40" />
              </p>
            </div>
            {index === 0 ? (
              <Bone className="h-12 w-48 max-sm:w-full" />
            ) : (
              <div className="flex flex-wrap gap-3">
                <Bone className="h-14 w-40 rounded-xl" />
                <Bone className="h-14 w-40 rounded-xl" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="flex flex-col gap-y-1 px-1 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-x-3">
          <p>
            <Bone className="h-3.5 w-36" />
          </p>
          <p className="flex min-h-11 items-center">
            <Bone className="h-3.5 w-52" />
          </p>
        </div>
        <p className="flex min-h-11 items-center">
          <Bone className="h-3.5 w-56" />
        </p>
      </div>
      {footer}
    </div>
  );
}
