"use client";

import Link from "next/link";
import { useId } from "react";
import { PrivateFlowHead, type PrivateFlowHeadContent } from "@/components/proveedores/account/private-flow";
import { StepActionButton } from "@/components/proveedores/flow/flow-result";
import { partnerMonogram } from "@/components/proveedores/partner-monogram";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { partnerCheckoutContent, planContent, planDisplayName } from "@/lib/content/partner-checkout";
import {
  formatDate,
  formatPlanPrice,
  type BillingPlan,
  type CheckoutResult,
  type PaidPlanCode,
} from "@/lib/partner-billing/checkout";
import { hasActivePlan, trialNoteFor, type SubscriptionView } from "@/lib/partner-billing/subscription";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const content = partnerCheckoutContent;
const { partnerPicker, summary } = content;

export type PlanState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  /** `plan: null`: el backend no lo ofrece (inactivo o no existe). */
  | { readonly kind: "ready"; readonly plan: BillingPlan | null };

export type SubmitStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "local-error"; readonly field: "partner" | "email"; readonly message: string }
  | { readonly kind: "submitting" }
  | { readonly kind: "redirecting" }
  | { readonly kind: "error"; readonly result: Exclude<CheckoutResult, { kind: "success" }> };

export type OwnerOption = {
  readonly partnerId: string;
  readonly name: string;
  /** `undefined`: cargando; `null`: no se pudo leer. */
  readonly subscription: SubscriptionView | null | undefined;
};

const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

/** Lo que se sabe de un taller, debajo de su nombre. */
function ownerStatus(owner: OwnerOption, trialDays: number | null): string {
  const view = owner.subscription;
  if (view === undefined) return partnerPicker.status.loading;
  if (view === null) return partnerPicker.status.unknown;
  if (hasActivePlan(view)) {
    const name = planDisplayName(view.planCode);
    return view.status === "trialing" ? partnerPicker.status.trialing(name) : partnerPicker.status.active(name);
  }
  return trialDays && trialDays > 0 && view.trialEligible === true
    ? partnerPicker.status.freeWithTrial(trialDays)
    : partnerPicker.status.free;
}

type CheckoutFormViewProps = {
  readonly head: PrivateFlowHeadContent;
  readonly owners: readonly OwnerOption[];
  readonly selectedPartnerId: string | null;
  readonly onSelectPartner: (partnerId: string) => void;
  /** Todos los talleres ya tienen un plan pago: se avisa en lugar de cobrar. */
  readonly activeOwner: OwnerOption | null;
  readonly plan: PlanState;
  readonly planCode: PaidPlanCode;
  readonly planName: string;
  readonly email: string;
  readonly onEmailChange: (value: string) => void;
  readonly emailRef?: React.Ref<HTMLInputElement>;
  readonly messageRef?: React.Ref<HTMLDivElement>;
  readonly status: SubmitStatus;
  /** No se pudo leer la versión de los términos: sin ella el backend rechaza. */
  readonly termsError: boolean;
  readonly canSubmit: boolean;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly onRetryPlan: () => void;
  readonly onReloadTerms: () => void;
  readonly onReauth: () => void;
};

/**
 * La contratación (lienzos `Contratar` y `ContratarMax`): a la izquierda el
 * taller y el email de Mercado Pago; a la derecha "Revisá el plan" con el
 * precio del backend y la prueba. En celular la tarjeta del plan va entre el
 * email y el botón de pago (lo que la persona tiene que ver ANTES de pagar):
 * el DOM sigue ese orden y desde `lg` la tarjeta pasa a la columna derecha
 * con la grilla. El botón de pago queda fuera del `<form>` y lo envía con el
 * atributo `form`.
 *
 * Presentacional: el estado, la carga y el checkout viven en `CheckoutFlow`.
 */
export function CheckoutFormView({
  head,
  owners,
  selectedPartnerId,
  onSelectPartner,
  activeOwner,
  plan,
  planCode,
  planName,
  email,
  onEmailChange,
  emailRef,
  messageRef,
  status,
  termsError,
  canSubmit,
  onSubmit,
  onRetryPlan,
  onReloadTerms,
  onReauth,
}: CheckoutFormViewProps) {
  const formId = useId();
  const emailId = useId();
  const emailHintId = useId();
  const messageId = useId();
  const legendId = useId();

  const billingPlan = plan.kind === "ready" ? plan.plan : null;
  const selected = owners.find((owner) => owner.partnerId === selectedPartnerId) ?? null;
  const busy = status.kind === "submitting" || status.kind === "redirecting";
  const emailError =
    (status.kind === "local-error" && status.field === "email") ||
    (status.kind === "error" && status.result.kind === "payer-email-rejected");
  const partnerError = status.kind === "local-error" && status.field === "partner";
  const message =
    status.kind === "local-error" ? status.message : status.kind === "error" ? content.errors[status.result.kind] : null;
  const accessUntil =
    status.kind === "error" && status.result.kind === "already-live" ? formatDate(status.result.accessUntil) : null;

  const grid = "flex flex-col gap-8 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-16 lg:gap-y-8";
  const left = "lg:col-span-7";
  const right = "lg:col-span-5 lg:col-start-8 lg:row-span-4 lg:row-start-1";

  if (activeOwner?.subscription) {
    return (
      <div className={grid}>
        <PrivateFlowHead head={head} className={left} />
        <ActivePlanNotice
          className={left}
          partnerName={activeOwner.name}
          view={activeOwner.subscription}
          wantedPlanName={planName}
        />
      </div>
    );
  }

  return (
    <div className={grid}>
      <PrivateFlowHead head={head} className={left} />

      <form id={formId} onSubmit={onSubmit} noValidate className={cn(left, "flex flex-col gap-8")}>
        <fieldset aria-describedby={partnerError ? messageId : undefined} className="flex flex-col gap-3">
          <legend id={legendId} className="mb-4 font-display text-2xl font-semibold text-fg">
            {partnerPicker.legend}
          </legend>
          {owners.map((owner) => {
            const disabled = owner.subscription ? hasActivePlan(owner.subscription) : false;
            const checked = owner.partnerId === selectedPartnerId;
            return (
              <label
                key={owner.partnerId}
                className={cn(
                  "flex min-h-18 items-center gap-3.5 rounded-2xl border px-4.5 py-3 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand motion-reduce:transition-none",
                  checked ? "border-action bg-brand-50" : "border-control-line bg-card",
                  disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:border-fg-muted",
                )}
              >
                <input
                  type="radio"
                  name="partnerId"
                  value={owner.partnerId}
                  checked={checked}
                  disabled={disabled}
                  onChange={() => onSelectPartner(owner.partnerId)}
                  className="size-5 shrink-0 accent-action"
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold text-white",
                    disabled ? "bg-fg-subtle" : "bg-action",
                  )}
                >
                  {partnerMonogram(owner.name)}
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="text-base font-semibold text-fg">{owner.name}</span>
                  <span className="text-sm text-fg-muted">
                    {ownerStatus(owner, billingPlan?.trialDays ?? null)}
                  </span>
                </span>
              </label>
            );
          })}
        </fieldset>

        <div className="flex flex-col gap-2">
          <label htmlFor={emailId} className="font-display text-2xl font-semibold text-fg">
            {content.payerEmail.label}
          </label>
          <p id={emailHintId} className="text-base text-fg-muted">
            {content.payerEmail.hint}
          </p>
          <input
            ref={emailRef}
            id={emailId}
            name="payerEmail"
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="none"
            spellCheck={false}
            required
            placeholder={content.payerEmail.placeholder}
            value={email}
            onChange={(event) => onEmailChange(event.target.value)}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? `${emailHintId} ${messageId}` : emailHintId}
            className="mt-2 h-13 w-full rounded-full border border-control-line-strong bg-card px-5 text-base text-fg transition-colors placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action aria-invalid:border-status-alert motion-reduce:transition-none"
          />
        </div>
      </form>

      <div className={cn(right, "flex flex-col gap-3")}>
        <PlanReviewCard
          planCode={planCode}
          planName={planName}
          plan={plan}
          partner={selected}
          onRetryPlan={onRetryPlan}
        />
        <p className="px-1 text-sm text-fg-muted">{summary.footnote}</p>
      </div>

      <div className={cn(left, "flex flex-col gap-3 border-t border-card-line pt-6")}>
        {termsError ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-status-alert">{content.prepareError}</p>
            <Button type="button" variant="outline" size="44" onClick={onReloadTerms}>
              {content.retry}
            </Button>
          </div>
        ) : null}
        <Button
          type="submit"
          form={formId}
          variant="primary"
          size="56"
          block
          disabled={!canSubmit}
          aria-disabled={!canSubmit}
        >
          {busy ? content.submitting : content.submit}
        </Button>
        <p className="flex items-start justify-center gap-2.5 text-center text-sm text-fg-muted">
          <Icon name="lock" size={16} strokeWidth={1.8} className="mt-0.5 shrink-0 text-fg" />
          <span>{content.paymentNote}</span>
        </p>

        {/* Región viva SIEMPRE montada para los errores del envío. */}
        <div aria-live="polite" aria-atomic="true">
          {message ? (
            <div
              ref={messageRef}
              tabIndex={-1}
              className="flex flex-col items-start gap-2 rounded-2xl bg-alert-bg/50 p-5"
            >
              <p id={messageId} className="font-semibold text-status-alert">
                {message}
              </p>
              {accessUntil ? <p className="text-fg-muted">{content.alreadyLive.accessUntil(accessUntil)}</p> : null}
              {status.kind === "error" && status.result.kind === "unauthenticated" ? (
                <Button type="button" variant="outline" size="44" onClick={onReauth}>
                  {content.reauth}
                </Button>
              ) : null}
              {status.kind === "error" && status.result.kind === "disabled" ? (
                <a
                  href={whatsappUrl(content.disabled.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(textLink, "inline-flex min-h-11 items-center")}
                >
                  {content.disabled.salesCta}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/**
 * "Revisá el plan": nombre, qué incluye, taller elegido, precio (el del
 * backend, nunca el de la página de planes) y, si le corresponde la prueba,
 * "Hoy pagás ARS 0". Sin el dato de la prueba se muestra el texto
 * condicional: nunca se promete (FR-017).
 */
export function PlanReviewCard({
  planCode,
  planName,
  plan,
  partner,
  onRetryPlan,
}: {
  readonly planCode: PaidPlanCode;
  readonly planName: string;
  readonly plan: PlanState;
  readonly partner: OwnerOption | null;
  readonly onRetryPlan?: () => void;
}) {
  const titleId = useId();
  const features = planContent(planCode)?.summaryFeatures ?? [];
  const billingPlan = plan.kind === "ready" ? plan.plan : null;
  const subscriptionLoading = partner !== null && partner.subscription === undefined;
  const trialNote = billingPlan ? trialNoteFor(billingPlan.trialDays, partner?.subscription?.trialEligible ?? null) : "none";

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-5 rounded-3xl border border-card-line bg-card p-6 sm:p-7">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-fg-muted">{summary.title}</p>
        <h2 id={titleId} className="font-display text-3xl font-bold tracking-tight text-fg">
          {summary.planTitle(planName)}
        </h2>
      </div>
      {features.length > 0 ? (
        <ul aria-label={content.planCard.featuresLabel(planName)} className="flex flex-col gap-2">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-base text-fg-muted">
              <Icon name="check" size={18} strokeWidth={2.2} className="mt-1 shrink-0 text-brand-hover" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <dl className="flex flex-col gap-3 border-t border-card-line pt-5 text-base">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{summary.partner}</dt>
          <dd className="text-right font-medium text-fg">{partner ? partner.name : "—"}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-fg-muted">{summary.price}</dt>
          <dd className="text-right font-medium text-fg">
            {plan.kind === "loading" ? (
              <span className="text-fg-muted">{summary.loadingPrice}</span>
            ) : plan.kind === "error" ? (
              <span className="flex flex-col items-end gap-2">
                <span className="text-status-alert">{content.plansError}</span>
                {onRetryPlan ? (
                  <Button type="button" variant="outline" size="44" onClick={onRetryPlan}>
                    {content.retry}
                  </Button>
                ) : null}
              </span>
            ) : billingPlan ? (
              <span className="tabular-nums">
                {formatPlanPrice(billingPlan)} {summary.priceNote(billingPlan.priceIncludesVat)}
              </span>
            ) : (
              <span className="text-status-alert">{content.planUnavailable}</span>
            )}
          </dd>
        </div>
      </dl>

      {billingPlan && trialNote !== "none" ? (
        subscriptionLoading ? (
          <p role="status" className="rounded-2xl bg-canvas p-4 text-sm text-fg-muted">
            {summary.trial.loading}
          </p>
        ) : trialNote === "eligible" ? (
          <div className="flex flex-col gap-1 rounded-2xl bg-brand-50 p-4">
            <p className="flex items-baseline justify-between gap-4 font-display text-lg font-semibold text-fg">
              <span>{summary.todayLabel}</span>
              <span className="tabular-nums">{summary.todayAmount}</span>
            </p>
            <p className="text-sm text-fg-muted">{summary.trial.eligible(billingPlan.trialDays)}</p>
          </div>
        ) : (
          <p className="rounded-2xl bg-canvas p-4 text-sm text-fg-muted">
            {trialNote === "used" ? summary.trial.used : summary.trial.conditional(billingPlan.trialDays)}
          </p>
        )
      ) : null}

      <Link href={content.planCard.change.href} className={cn(textLink, "inline-flex min-h-11 items-center self-start")}>
        {content.planCard.change.label}
      </Link>
    </section>
  );
}

/**
 * Los talleres de la cuenta ya tienen un plan con acceso: se avisa de
 * entrada, con el plan y su estado, y no se ofrece pagar. Cambiar de plan no
 * se hace online: el CTA va a ventas con el plan actual y el buscado.
 */
function ActivePlanNotice({
  partnerName,
  view,
  wantedPlanName,
  className,
}: {
  readonly partnerName: string;
  readonly view: SubscriptionView;
  readonly wantedPlanName: string;
  readonly className?: string;
}) {
  const { activePlan } = content;
  const currentPlanName = planDisplayName(view.planCode);
  const statusLabel = view.cancelAtPeriodEnd ? activePlan.canceled : activePlan.statusLabel(view.status);
  const trialUntil = view.status === "trialing" ? formatDate(view.trialEndsAt) : null;
  const until = view.cancelAtPeriodEnd ? formatDate(view.accessUntil) : null;

  const rows = [
    { term: summary.partner, value: partnerName },
    currentPlanName ? { term: activePlan.rows.plan, value: currentPlanName } : null,
    statusLabel ? { term: activePlan.rows.status, value: statusLabel } : null,
    trialUntil ? { term: activePlan.rows.trialUntil, value: trialUntil } : null,
    until ? { term: activePlan.rows.accessUntil, value: until } : null,
  ].filter((row) => row !== null);

  return (
    <div className={cn("flex flex-col gap-5 rounded-3xl border border-card-line bg-card p-6 sm:p-7", className)}>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-2xl font-semibold text-fg">
          {currentPlanName ? activePlan.title(currentPlanName) : activePlan.titleWithoutName}
        </h2>
        <p className="text-base text-fg-muted">{until ? activePlan.accessUntil(until) : activePlan.body}</p>
      </div>
      <dl className="flex flex-col gap-3 border-t border-card-line pt-5 text-base">
        {rows.map((row) => (
          <div key={row.term} className="flex items-baseline justify-between gap-4">
            <dt className="text-fg-muted">{row.term}</dt>
            <dd className="text-right font-medium text-fg">{row.value}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <StepActionButton
          action={{ kind: "link", href: accountContent.link.href, label: partnerAccountContent.myBusiness, primary: true }}
        />
        <StepActionButton
          action={{
            kind: "external",
            href: whatsappUrl(activePlan.salesWhatsappMessage(currentPlanName, wantedPlanName)),
            label: activePlan.salesCta,
            primary: false,
            analytics: {
              "data-analytics-event": ANALYTICS_EVENTS.whatsappClicked,
              "data-analytics-placement": "contratar_plan_activo",
            },
          }}
        />
      </div>
    </div>
  );
}
