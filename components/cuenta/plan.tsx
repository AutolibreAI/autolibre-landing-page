"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { rowActionClass } from "@/components/cuenta/styles";
import { CancelSubscription } from "@/components/proveedores/account/cancel-subscription";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { livePlanCode, type PlanState } from "@/lib/account/plan-state";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { planContent, planDisplayName } from "@/lib/content/partner-checkout";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { siteContent } from "@/lib/content/site";
import { formatDate, formatPlanPrice, type BillingPlan } from "@/lib/partner-billing/checkout";
import { canCancelSubscription, type SubscriptionView } from "@/lib/partner-billing/subscription";
import { PROVEEDORES_CONTRATAR_RESULTADO_PATH, PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { plan: copy } = accountContent.business;
const { page } = accountContent;

/**
 * Precios vigentes (modelo por trabajo confirmado, 2026-11-26): salen de la
 * página de precios para no escribir los números dos veces. Un negocio sin
 * suscripción ve esto en lugar del viejo "Contratar el plan Plus": no hay
 * checkout de packs, el pack se compra por WhatsApp.
 */
const [, jobOffer, packOffer] = providersPlansContent.plans;

/** "Comprar el pack": WhatsApp con el mensaje del pack de la página de precios. */
function PackWhatsappButton({
  placement,
  variant,
  block,
}: {
  readonly placement: string;
  readonly variant: "primary" | "light";
  readonly block?: boolean;
}) {
  return (
    <ButtonAnchor
      href={whatsappUrl(packOffer.cta.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      size="44"
      block={block}
      data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
      data-analytics-placement={placement}
    >
      {packOffer.cta.label}
      <span className="sr-only"> {siteContent.nav.externalHint}</span>
    </ButtonAnchor>
  );
}

/** Datos del plan que comparten el Resumen y la pestaña Plan. */
export type PlanData = {
  readonly state: PlanState;
  readonly view: SubscriptionView;
  /** Catálogo de `GET /billing/plans` (`null` si no cargó: sin precio ni tope). */
  readonly plans: readonly BillingPlan[] | null;
  readonly limits: Readonly<Record<string, number>>;
};

function planLabel(code: string): string {
  const name = planDisplayName(code);
  return name ? copy.named(name) : copy.unnamed;
}

function findPlan(plans: readonly BillingPlan[] | null, code: string): BillingPlan | null {
  return plans?.find((plan) => plan.code === code) ?? null;
}

/** Pill del estado del plan, o `null` en Gratis. */
function PlanStatus({ state }: { readonly state: PlanState }) {
  switch (state.kind) {
    case "trial":
      return <StatusPill tone="ok">{copy.status.trial(formatDate(state.until))}</StatusPill>;
    case "active":
      return <StatusPill tone="ok">{copy.status.active}</StatusPill>;
    case "canceling":
      return <StatusPill tone="neutral">{copy.status.canceling(formatDate(state.until))}</StatusPill>;
    case "pending":
      return (
        <StatusPill tone="pending">{copy.status.pending(planDisplayName(state.requestedPlan) ?? copy.unnamed)}</StatusPill>
      );
    case "other":
      return <StatusPill tone="neutral">{copy.status.other}</StatusPill>;
    case "free":
      return null;
  }
}

/** Aviso del pago pendiente (arriba de todo en el Resumen y en Plan). */
export function PendingPaymentBanner({ partnerId, requestedPlan }: { readonly partnerId: string; readonly requestedPlan: string }) {
  const name = planDisplayName(requestedPlan) ?? copy.unnamed;
  return (
    <div
      role="status"
      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-card bg-status-pending-bg px-5 py-4 sm:px-6"
    >
      <div className="flex max-w-180 min-w-0 flex-[1_1_22rem] flex-col gap-1">
        <p className="font-semibold text-fg">{copy.pendingBanner.title(name)}</p>
        <p className="text-control text-fg-muted">{copy.pendingBanner.body}</p>
      </div>
      {/* Sin prefetch: la pantalla de resultado carga su propio Clerk. */}
      <ButtonLink
        href={`${PROVEEDORES_CONTRATAR_RESULTADO_PATH}?${new URLSearchParams({ partnerId }).toString()}`}
        prefetch={false}
        variant="primary"
        size="44"
      >
        {copy.pendingBanner.cta}
      </ButtonLink>
    </div>
  );
}

/** Clases de la tarjeta "Tu plan" del Resumen: las comparte su esqueleto de carga. */
export const planSummaryClasses = {
  card: "flex flex-col gap-2.5 rounded-card border border-card-line bg-card px-5 py-3 sm:px-6",
  head: "flex min-h-11 items-center justify-between gap-3",
  title: "font-display text-xl leading-7 font-bold text-fg",
  text: "text-sm text-fg-muted",
} as const;

/**
 * Tarjeta del plan en el Resumen: plan, estado, tope y la acción que
 * corresponde. Con plan pago, "Ver mi plan" es una acción chica en la misma
 * línea del nombre; sin suscripción, la tarjeta cuenta el precio por trabajo y
 * ofrece el pack por WhatsApp (ya no se venden planes desde la cuenta).
 */
export function PlanSummaryCard({
  data,
  planHref,
  usage,
}: {
  readonly data: PlanData;
  readonly planHref: string;
  /** Uso del mes: solo con la bandera `usage` (no hay endpoint). */
  readonly usage: { readonly used: number } | null;
}) {
  const titleId = useId();
  const live = livePlanCode(data.state);
  const limit = live ? (data.limits[live] ?? null) : null;
  const offerPack = data.state.kind === "free" || data.state.kind === "other";

  return (
    <section aria-labelledby={titleId} className={planSummaryClasses.card}>
      <div className={planSummaryClasses.head}>
        <h3 id={titleId} className={planSummaryClasses.title}>
          {live ? planLabel(live) : copy.jobs.title}
        </h3>
        {live ? (
          <Link href={planHref} scroll={false} className={rowActionClass}>
            {copy.seePlan}
            <Icon name="arrow-right" size={16} strokeWidth={2} />
          </Link>
        ) : null}
      </div>
      {data.state.kind !== "free" ? (
        <div className="-mt-1 flex">
          <PlanStatus state={data.state} />
        </div>
      ) : null}

      {usage ? (
        <UsageMeter used={usage.used} limit={live ? limit : null} paid={live !== null} />
      ) : live ? (
        limit ? (
          <p className={planSummaryClasses.text}>{copy.limit(limit)}</p>
        ) : null
      ) : (
        <p className={planSummaryClasses.text}>{copy.jobs.summary(jobOffer.price)}</p>
      )}

      {!live && offerPack ? (
        <div className="flex flex-col gap-2 pb-1">
          <p className={planSummaryClasses.text}>{copy.pack.summary(packOffer.price, jobOffer.price)}</p>
          <PackWhatsappButton placement="cuenta_resumen_pack" variant="primary" block />
          <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="44" block>
            {copy.seePrices}
          </ButtonLink>
        </div>
      ) : null}
    </section>
  );
}

/** Barra de uso del mes (con la bandera `usage`). */
function UsageMeter({ used, limit, paid }: { readonly used: number; readonly limit: number | null; readonly paid: boolean }) {
  if (!limit) return null;
  const ratio = Math.min(1, used / limit);
  return (
    <div className="flex flex-col gap-2">
      <p className="flex justify-between gap-3 text-sm">
        <span className="font-semibold text-fg">{paid ? copy.usage.paidLabel : copy.usage.freeLabel}</span>
        <span className="text-fg-muted">{copy.usage.of(used, limit)}</span>
      </p>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={copy.usage.aria(used, limit)}
        className="h-2 overflow-hidden rounded-full bg-card-muted"
      >
        {/* Ancho calculado: es el dato, no un valor de diseño. */}
        <span className="block h-full rounded-full bg-action" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}

function FeatureList({
  items,
  dark = false,
  columns = false,
}: {
  readonly items: readonly string[];
  readonly dark?: boolean;
  /** Dos columnas desde `sm` (la tarjeta del plan pago, que es ancha). */
  readonly columns?: boolean;
}) {
  return (
    <ul className={cn("grid gap-x-6 gap-y-2 text-sm", columns && "sm:grid-cols-2")}>
      {items.map((item) => (
        <li key={item} className={cn("flex gap-2", dark ? "text-on-dark" : "text-fg-muted")}>
          <Icon
            name="check"
            size={16}
            strokeWidth={2.2}
            className={cn("mt-0.5 shrink-0", dark ? "text-brand-200" : "text-brand-hover")}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

/** Clases de la pestaña Plan: las comparte su esqueleto de carga. */
export const planSectionClasses = {
  title: "font-display text-2xl leading-tight font-bold text-fg",
  grid: "grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]",
} as const;

/** Pestaña Plan. */
export function PlanSection({
  data,
  partner,
  titleId,
  selfPath,
  usage,
  onCanceled,
}: {
  readonly data: PlanData;
  readonly partner: { readonly partnerId: string; readonly name: string };
  readonly titleId: string;
  /** `/cuenta` con su query: adónde vuelve el login si la sesión venció. */
  readonly selfPath: string;
  readonly usage: { readonly used: number } | null;
  readonly onCanceled: () => void;
}) {
  const live = livePlanCode(data.state);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (notice) noticeRef.current?.focus();
  }, [notice]);

  function handleCanceled(accessUntil: string | null) {
    setNotice(accessUntil ? page.cancel.success(formatDate(accessUntil)) : page.cancel.successPending);
    onCanceled();
  }

  const limit = live ? (data.limits[live] ?? null) : null;

  const cancelCard =
    live && data.view && canCancelSubscription(data.view) && !notice ? (
      <section aria-labelledby={`${titleId}-baja`} className="flex flex-col items-start gap-2 rounded-card border border-card-line bg-card p-5">
        <h3 id={`${titleId}-baja`} className="font-display text-lg font-bold text-fg">
          {copy.cancel.title}
        </h3>
        <p className="text-sm text-fg-muted">{copy.cancel.body(planLabel(live))}</p>
        <CancelSubscription
          partnerId={partner.partnerId}
          partnerName={partner.name}
          planLabel={planLabel(live)}
          view={data.view}
          selfPath={selfPath}
          onCanceled={handleCanceled}
        />
      </section>
    ) : null;

  const usageCard = usage ? (
    <section aria-labelledby={`${titleId}-uso`} className="flex flex-col gap-3 rounded-card border border-card-line bg-card p-5">
      <h3 id={`${titleId}-uso`} className="font-display text-lg font-bold text-fg">
        {copy.usage.title}
      </h3>
      <UsageMeter used={usage.used} limit={live ? limit : null} paid={live !== null} />
    </section>
  ) : null;

  return (
    <div className="flex flex-col gap-5">
      <h2 id={titleId} className={planSectionClasses.title}>
        {copy.title}
      </h2>

      {data.state.kind === "pending" ? (
        <PendingPaymentBanner partnerId={partner.partnerId} requestedPlan={data.state.requestedPlan} />
      ) : null}

      {/* Región viva siempre montada (si no, no se anuncia), sin ocupar lugar mientras está vacía. */}
      <div aria-live="polite" aria-atomic="true" className="-mt-5 not-empty:mt-0">
        {notice ? (
          <p ref={noticeRef} tabIndex={-1} role="status" className="rounded-card bg-brand-50 px-5 py-4 font-medium text-fg">
            {notice}
          </p>
        ) : null}
      </div>

      {live ? (
        // Plan pago: el plan a la izquierda; pago, uso y la baja al costado.
        <div className={planSectionClasses.grid}>
          <PaidPlanCard data={data} live={live} partnerName={partner.name} />
          <aside className="flex flex-col gap-5">
            {usageCard}
            <PaymentCard state={data.state} titleId={`${titleId}-pago`} />
            {cancelCard}
          </aside>
        </div>
      ) : (
        // Sin suscripción: el precio por trabajo y el pack lado a lado desde `lg`.
        <div className="grid items-stretch gap-5 lg:grid-cols-2">
          <section
            aria-labelledby={`${titleId}-trabajo`}
            className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h3 id={`${titleId}-trabajo`} className="font-display text-2xl font-bold text-fg">
                {copy.jobs.title}
              </h3>
              <p className="flex flex-col sm:items-end">
                <span className="font-display text-xl font-bold text-fg">{jobOffer.price}</span>
                <span className="text-sm text-fg-muted">{jobOffer.priceNote}</span>
              </p>
            </div>
            <hr className="border-card-line" />
            <FeatureList items={[copy.jobs.firstFree, copy.jobs.fromSecond(jobOffer.price), ...jobOffer.features]} />
          </section>

          {data.state.kind !== "pending" ? (
            <section aria-labelledby={`${titleId}-pack`} className="flex flex-col gap-4 rounded-card bg-action p-5 text-white sm:p-6">
              <div className="flex flex-col gap-1.5">
                <h3 id={`${titleId}-pack`} className="font-display text-xl leading-tight font-bold">
                  {copy.pack.title}
                </h3>
                <p className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-display text-xl font-bold">{packOffer.price}</span>
                  <span className="text-sm text-on-dark-muted">{packOffer.priceNote}</span>
                </p>
              </div>
              <FeatureList items={[packOffer.description, ...packOffer.features]} dark />
              <div className="mt-auto flex flex-wrap items-center gap-3">
                <PackWhatsappButton placement="cuenta_plan_pack" variant="light" />
                <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outlineDark" size="44">
                  {copy.seePrices}
                </ButtonLink>
              </div>
              <p className="text-sm text-on-dark-muted">{copy.pack.note}</p>
            </section>
          ) : null}
          {usageCard}
        </div>
      )}
    </div>
  );
}

function PaidPlanCard({
  data,
  live,
  partnerName,
}: {
  readonly data: PlanData;
  readonly live: string;
  readonly partnerName: string;
}) {
  const titleId = useId();
  const billing = findPlan(data.plans, live);
  const content = planContent(live);
  const limit = data.limits[live] ?? null;
  const features = [
    ...(content?.features ?? []).filter((item) => !item.startsWith("Todo lo")),
    ...(content?.features ?? []).filter((item) => item.startsWith("Todo lo")),
  ];

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex flex-col items-start gap-1.5">
          <h3 id={titleId} className="font-display text-2xl leading-tight font-bold text-fg">
            {planLabel(live)}
          </h3>
          <PlanStatus state={data.state} />
        </div>
        {billing ? (
          <p className="flex flex-col sm:items-end">
            <span className="font-display text-xl font-bold text-fg">{formatPlanPrice(billing)}</span>
            <span className="text-sm text-fg-muted">{copy.perMonth(billing.priceIncludesVat)}</span>
          </p>
        ) : null}
      </div>
      <hr className="border-card-line" />
      {features.length > 0 ? (
        <FeatureList items={features} columns />
      ) : limit ? (
        <p className="text-sm text-fg-muted">{copy.limit(limit)}</p>
      ) : null}
      <div className="flex flex-wrap gap-3 pt-1">
        <ButtonAnchor
          href={whatsappUrl(page.actions.changePlanWhatsapp(partnerName, planDisplayName(live)))}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="44"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="cuenta_cambiar_plan"
        >
          {page.actions.changePlan}
        </ButtonAnchor>
        <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="44">
          {copy.seePrices}
        </ButtonLink>
      </div>
    </section>
  );
}

/** "Pago": medio y la fecha que corresponde según el estado (sin el email: el GET no lo trae). */
function PaymentCard({ state, titleId }: { readonly state: PlanState; readonly titleId: string }) {
  const rows: { readonly label: string; readonly value: string }[] = [
    { label: copy.payment.method, value: copy.payment.methodValue },
  ];
  const date =
    state.kind === "trial"
      ? { label: copy.payment.firstCharge, value: formatDate(state.until) }
      : state.kind === "active"
        ? { label: copy.payment.periodEnd, value: formatDate(state.periodEnd) }
        : state.kind === "canceling"
          ? { label: copy.payment.accessUntil, value: formatDate(state.until) }
          : null;
  if (date?.value) rows.push({ label: date.label, value: date.value });

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2 rounded-card border border-card-line bg-card p-5">
      <h3 id={titleId} className="font-display text-lg font-bold text-fg">
        {copy.payment.title}
      </h3>
      <dl className="flex flex-col text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4 border-t border-card-line py-2 first:border-t-0">
            <dt className="text-fg-muted">{row.label}</dt>
            <dd className="text-right font-medium text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
