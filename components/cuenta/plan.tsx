"use client";

import { useEffect, useId, useRef, useState } from "react";
import { CancelSubscription } from "@/components/proveedores/account/cancel-subscription";
import { ButtonAnchor, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StatusPill } from "@/components/ui/status-pill";
import { livePlanCode, trialOfferFor, type PlanState } from "@/lib/account/plan-state";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { planContent, planDisplayName } from "@/lib/content/partner-checkout";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { formatDate, formatPlanPrice, type BillingPlan } from "@/lib/partner-billing/checkout";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import { canCancelSubscription, type SubscriptionView } from "@/lib/partner-billing/subscription";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_CONTRATAR_RESULTADO_PATH,
  PROVEEDORES_PLANES_PATH,
} from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { plan: copy } = accountContent.business;
const { page } = accountContent;

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

/** Texto de la prueba debajo de "Contratar el plan Plus": solo lo que el backend confirma. */
function TrialNote({ data, className }: { readonly data: PlanData; readonly className?: string }) {
  const plus = findPlan(data.plans, "plus");
  const offer = trialOfferFor(plus?.trialDays ?? null, data.view.trialEligible);
  if (offer.kind === "none") return null;
  return (
    <p className={cn("text-label text-fg-muted", className)}>
      {offer.kind === "days" ? copy.trial.days(offer.days) : copy.trial.conditional}
    </p>
  );
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

/** Tarjeta "Tu plan" del Resumen: plan, estado, tope y la acción que corresponde. */
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
  const plusLimit = data.limits.plus ?? null;
  const offerPlus = data.state.kind === "free" || data.state.kind === "other";

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-6">
      <div className="flex flex-col items-start gap-1">
        <p className="text-sm font-medium text-fg-muted">{copy.yourPlan}</p>
        <h3 id={titleId} className="font-display text-3xl font-bold text-fg">
          {live ? planLabel(live) : copy.free}
        </h3>
        <PlanStatus state={data.state} />
      </div>

      {usage ? (
        <UsageMeter used={usage.used} limit={live ? limit : 1} paid={live !== null} />
      ) : (
        <p className="text-control text-fg-muted">{live && limit ? copy.limit(limit) : copy.freeLimit}</p>
      )}

      {live ? (
        <ButtonLink href={planHref} variant="outline" size="48" block scroll={false}>
          {copy.seePlan}
        </ButtonLink>
      ) : offerPlus ? (
        <div className="flex flex-col gap-2">
          {plusLimit ? <p className="text-control text-fg-muted">{copy.upsell.title(plusLimit)}.</p> : null}
          <ButtonLink
            href={checkoutHref(PROVEEDORES_CONTRATAR_PATH, "plus")}
            prefetch={false}
            variant="primary"
            size="48"
            block
            data-analytics-event={ANALYTICS_EVENTS.planCheckoutStarted}
            data-analytics-placement="cuenta_resumen"
            data-analytics-plan="plus"
          >
            {copy.contractPlus}
          </ButtonLink>
          <TrialNote data={data} className="text-center" />
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

function FeatureList({ items, dark = false }: { readonly items: readonly string[]; readonly dark?: boolean }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li key={item} className={cn("flex gap-2.5", dark ? "text-on-dark" : "text-fg-muted")}>
          <Icon
            name="check"
            size={18}
            strokeWidth={2.2}
            className={cn("mt-0.5 shrink-0", dark ? "text-brand-200" : "text-brand-hover")}
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

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

  const freeContent = planContent("free") ?? providersPlansContent.plans[0];
  const plusPlan = findPlan(data.plans, "plus");
  const plusContent = planContent("plus");
  const limit = live ? (data.limits[live] ?? null) : null;

  return (
    <div className="flex flex-col gap-7">
      <h2 id={titleId} className="font-display text-3xl font-bold text-fg">
        {copy.title}
      </h2>

      {data.state.kind === "pending" ? (
        <PendingPaymentBanner partnerId={partner.partnerId} requestedPlan={data.state.requestedPlan} />
      ) : null}

      <div aria-live="polite" aria-atomic="true">
        {notice ? (
          <p ref={noticeRef} tabIndex={-1} role="status" className="rounded-card bg-brand-50 px-5 py-4 font-medium text-fg">
            {notice}
          </p>
        ) : null}
      </div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)]">
        <div className="flex flex-col gap-6">
          {live ? (
            <PaidPlanCard data={data} live={live} partnerName={partner.name} />
          ) : (
            <>
              <section
                aria-labelledby={`${titleId}-gratis`}
                className="flex flex-col gap-5 rounded-card border border-card-line bg-card p-6 sm:p-7"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col items-start gap-1">
                    <p className="text-sm font-medium text-fg-muted">{copy.yourPlan}</p>
                    <h3 id={`${titleId}-gratis`} className="font-display text-3xl font-bold text-fg">
                      {copy.free}
                    </h3>
                  </div>
                  <p className="font-display text-2xl font-bold text-fg">{copy.freePrice}</p>
                </div>
                <hr className="border-card-line" />
                <FeatureList items={freeContent?.features ?? []} />
              </section>

              {data.state.kind !== "pending" ? (
                <section
                  aria-labelledby={`${titleId}-plus`}
                  className="flex flex-col gap-5 rounded-card bg-action p-6 text-white sm:p-7"
                >
                  <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-brand-200">{copy.upsell.eyebrow}</p>
                    <h3 id={`${titleId}-plus`} className="font-display text-2xl leading-tight font-bold">
                      {copy.upsell.title(data.limits.plus ?? null)}
                    </h3>
                    {plusPlan ? (
                      <p className="flex flex-wrap items-baseline gap-x-2">
                        <span className="font-display text-2xl font-bold">{formatPlanPrice(plusPlan)}</span>
                        <span className="text-sm text-on-dark-muted">{copy.perMonth(plusPlan.priceIncludesVat)}</span>
                      </p>
                    ) : null}
                  </div>
                  <FeatureList items={(plusContent?.features ?? []).filter((item) => !item.startsWith("Todo lo"))} dark />
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                    <ButtonLink
                      href={checkoutHref(PROVEEDORES_CONTRATAR_PATH, "plus")}
                      prefetch={false}
                      variant="light"
                      size="48"
                      data-analytics-event={ANALYTICS_EVENTS.planCheckoutStarted}
                      data-analytics-placement="cuenta_plan"
                      data-analytics-plan="plus"
                    >
                      {copy.contractPlus}
                    </ButtonLink>
                    <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outlineDark" size="48">
                      {copy.allPlans}
                    </ButtonLink>
                  </div>
                  <div className="flex flex-col gap-1 text-sm text-on-dark-muted">
                    <TrialNoteDark data={data} />
                    <p>{copy.upsell.note}</p>
                  </div>
                </section>
              ) : null}
            </>
          )}

          {live && data.view && canCancelSubscription(data.view) && !notice ? (
            <section
              aria-labelledby={`${titleId}-baja`}
              className="flex flex-col items-start gap-3 rounded-card border border-card-line bg-card p-6 sm:p-7"
            >
              <h3 id={`${titleId}-baja`} className="font-display text-xl font-bold text-fg">
                {copy.cancel.title}
              </h3>
              <p className="leading-relaxed text-fg-muted">{copy.cancel.body(planLabel(live))}</p>
              <CancelSubscription
                partnerId={partner.partnerId}
                partnerName={partner.name}
                planLabel={planLabel(live)}
                view={data.view}
                selfPath={selfPath}
                onCanceled={handleCanceled}
              />
            </section>
          ) : null}
        </div>

        <aside className="flex flex-col gap-6">
          {usage ? (
            <section
              aria-labelledby={`${titleId}-uso`}
              className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-6"
            >
              <h3 id={`${titleId}-uso`} className="font-display text-xl font-bold text-fg">
                {copy.usage.title}
              </h3>
              <UsageMeter used={usage.used} limit={live ? limit : 1} paid={live !== null} />
            </section>
          ) : null}
          {live ? <PaymentCard state={data.state} titleId={`${titleId}-pago`} /> : null}
        </aside>
      </div>
    </div>
  );
}

function TrialNoteDark({ data }: { readonly data: PlanData }) {
  const plus = findPlan(data.plans, "plus");
  const offer = trialOfferFor(plus?.trialDays ?? null, data.view.trialEligible);
  if (offer.kind === "none") return null;
  return <p>{offer.kind === "days" ? copy.trial.days(offer.days) : copy.trial.conditional}</p>;
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
    <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-card border border-card-line bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col items-start gap-1.5">
          <p className="text-sm font-medium text-fg-muted">{copy.yourPlan}</p>
          <h3 id={titleId} className="font-display text-3xl font-bold text-fg">
            {planLabel(live)}
          </h3>
          <PlanStatus state={data.state} />
        </div>
        {billing ? (
          <p className="flex flex-col items-end">
            <span className="font-display text-2xl font-bold text-fg">{formatPlanPrice(billing)}</span>
            <span className="text-sm text-fg-muted">{copy.perMonth(billing.priceIncludesVat)}</span>
          </p>
        ) : null}
      </div>
      <hr className="border-card-line" />
      {features.length > 0 ? (
        <FeatureList items={features} />
      ) : limit ? (
        <p className="text-fg-muted">{copy.limit(limit)}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <ButtonAnchor
          href={whatsappUrl(page.actions.changePlanWhatsapp(partnerName, planDisplayName(live)))}
          target="_blank"
          rel="noopener noreferrer"
          variant="primary"
          size="48"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="cuenta_cambiar_plan"
        >
          {page.actions.changePlan}
        </ButtonAnchor>
        <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="48">
          {copy.allPlans}
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
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-6">
      <h3 id={titleId} className="font-display text-xl font-bold text-fg">
        {copy.payment.title}
      </h3>
      <dl className="flex flex-col gap-2.5">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-4">
            <dt className="text-fg-muted">{row.label}</dt>
            <dd className="text-right text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
