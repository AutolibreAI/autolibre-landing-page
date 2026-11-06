"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { NoPartnerOptions } from "@/components/proveedores/account/no-partner-options";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead, type PrivateFlowHeadContent } from "@/components/proveedores/account/private-flow";
import { FlowLayout } from "@/components/proveedores/flow/flow-layout";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { Button, buttonVariants } from "@/components/ui/button";
import { ChoiceRow } from "@/components/ui/choice";
import { Field, Input } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { accountContent } from "@/lib/content/account";
import { partnerCheckoutContent, planDisplayName } from "@/lib/content/partner-checkout";
import type { IconName } from "@/lib/content/types";
import {
  findPlan,
  formatDate,
  formatPlanPrice,
  validatePayerEmail,
  type BillingPlan,
  type CheckoutResult,
  type PaidPlanCode,
} from "@/lib/partner-billing/checkout";
import {
  fetchBillingPlans,
  fetchBillingTerms,
  fetchOwnerPartners,
  fetchSubscription,
  savePendingCheckout,
  startCheckout,
} from "@/lib/partner-billing/client";
import { hasActivePlan, trialNoteFor, type SubscriptionView } from "@/lib/partner-billing/subscription";
import type { Membership } from "@/lib/partner-claims/redeem";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const content = partnerCheckoutContent;

/** Índices de `content.steps.items`. */
const STEP = { partner: 0, plan: 1, payment: 2 } as const;

type SignedInCheckoutProps = {
  readonly planCode: PaidPlanCode;
  /** Nombre del plan como en la página de planes (FR-013). */
  readonly planName: string;
  /** Esta misma URL (`/proveedores/contratar?plan=…`): vuelta del login y del reclamo. */
  readonly selfPath: string;
};

type CheckoutFlowProps = SignedInCheckoutProps & {
  /** Encabezado de la página (el `<h1>` lo pinta la isla). */
  readonly head: PrivateFlowHeadContent;
  /** Tarjeta del plan elegido (server): al costado del paso y en el login. */
  readonly planCard: React.ReactNode;
};

/** Indicador de progreso de la contratación, arriba del paso en curso. */
function CheckoutSteps({ current }: { readonly current: number }) {
  return <FlowSteps label={content.steps.label} steps={content.steps.items} current={current} />;
}

/**
 * Isla client de `/proveedores/contratar` (spec 212). Sin sesión, el login
 * compartido: a la izquierda los tres pasos explicados y el plan elegido, a
 * la derecha la tarjeta de login. Con sesión, el encabezado, la fila de
 * sesión y la contratación, con la tarjeta del plan al costado. La página
 * (server) ya validó el plan.
 */
export function CheckoutFlow({ planCode, planName, selfPath, head, planCard }: CheckoutFlowProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded || !isSignedIn) {
    return (
      <PartnerSignIn
        head={head}
        context={
          <>
            <FlowSteps
              orientation="vertical"
              label={content.steps.label}
              steps={content.signInSteps}
              current={STEP.partner}
            />
            {planCard}
          </>
        }
        redirectUrl={selfPath}
        loading={!isLoaded}
      />
    );
  }

  return (
    <div className="flex max-w-280 flex-col gap-8">
      <PrivateFlowHead head={head} />
      <FlowLayout aside={planCard}>
        <SignedInCheckout planCode={planCode} planName={planName} selfPath={selfPath} />
      </FlowLayout>
    </div>
  );
}

type PartnersState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" }
  | { readonly kind: "ready"; readonly owners: readonly Membership[] };

type PlanState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  /** `plan: null`: el backend no lo ofrece (inactivo o no existe). */
  | { readonly kind: "ready"; readonly plan: BillingPlan | null };

/** Solo la versión vigente de los términos: el texto no se muestra. */
type TermsVersionState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly version: string };

type SubmitStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "local-error"; readonly field: "partner" | "email"; readonly message: string }
  | { readonly kind: "submitting" }
  | { readonly kind: "redirecting" }
  | { readonly kind: "error"; readonly result: Exclude<CheckoutResult, { kind: "success" }> };

function SignedInCheckout({ planCode, planName, selfPath }: SignedInCheckoutProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [partners, setPartners] = useState<PartnersState>({ kind: "loading" });
  const [partnersAttempt, setPartnersAttempt] = useState(0);
  const [plan, setPlan] = useState<PlanState>({ kind: "loading" });
  const [planAttempt, setPlanAttempt] = useState(0);
  const [terms, setTerms] = useState<TermsVersionState>({ kind: "loading" });
  const [termsAttempt, setTermsAttempt] = useState(0);
  /** Ya se va a Mercado Pago: el indicador marca el paso "Pago". */
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchOwnerPartners(getToken).then((result) => {
      if (!active) return;
      setPartners(result.kind === "ok" ? { kind: "ready", owners: result.owners } : { kind: "error", reason: result.kind });
    });
    return () => {
      active = false;
    };
  }, [getToken, partnersAttempt]);

  useEffect(() => {
    let active = true;
    void fetchBillingPlans().then((result) => {
      if (!active) return;
      setPlan(result.ok ? { kind: "ready", plan: findPlan(result.plans, planCode) } : { kind: "error" });
    });
    return () => {
      active = false;
    };
  }, [planCode, planAttempt]);

  // Versión vigente de los términos (`GET /billing/terms`), en segundo plano:
  // el checkout la exige como `termsVersion`. El texto no se muestra.
  useEffect(() => {
    let active = true;
    void fetchBillingTerms().then((result) => {
      if (!active) return;
      setTerms(result.ok ? { kind: "ready", version: result.terms.version } : { kind: "error" });
    });
    return () => {
      active = false;
    };
  }, [termsAttempt]);

  // Foco al título del paso cuando termina de cargar (lectores de pantalla y
  // teclado arrancan desde el contenido nuevo, no desde el principio).
  const panelHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (partners.kind !== "loading") panelHeadingRef.current?.focus();
  }, [partners.kind]);

  function retryPartners() {
    setPartners({ kind: "loading" });
    setPartnersAttempt((attempt) => attempt + 1);
  }

  function retryPlan() {
    setPlan({ kind: "loading" });
    setPlanAttempt((attempt) => attempt + 1);
  }

  function reloadTerms() {
    setTerms({ kind: "loading" });
    setTermsAttempt((attempt) => attempt + 1);
  }

  /**
   * Vuelve a pedir la versión vigente (tras un 409 de versión vieja) y la
   * devuelve. Si falla, deja la que había: el envío muestra el error genérico.
   */
  async function refreshTermsVersion(): Promise<string | null> {
    const result = await fetchBillingTerms();
    if (!result.ok) return null;
    setTerms({ kind: "ready", version: result.terms.version });
    return result.terms.version;
  }

  async function reauth() {
    await signOut({ redirectUrl: selfPath });
  }

  const hasPartner = partners.kind === "ready" && partners.owners.length > 0;
  const step = redirecting ? STEP.payment : hasPartner ? STEP.plan : STEP.partner;

  return (
    <>
      <AccountBar selfPath={selfPath} />
      <CheckoutSteps current={step} />

      {/* Región viva SIEMPRE montada: anuncia la carga y sus errores. */}
      <div aria-live="polite" aria-atomic="true">
        {partners.kind === "loading" ? (
          <p className="text-ink/65">{content.loading}</p>
        ) : partners.kind === "error" ? (
          <div className="flex flex-col items-start gap-3">
            <h2 ref={panelHeadingRef} tabIndex={-1} className="font-medium text-danger">
              {partners.reason === "unauthenticated" ? content.errors.unauthenticated : content.partnersError}
            </h2>
            {partners.reason === "unauthenticated" ? (
              <Button type="button" variant="outline" onClick={reauth}>
                {content.reauth}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={retryPartners}>
                {content.retry}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {partners.kind === "ready" && partners.owners.length === 0 ? (
        <NoPartnerOptions
          headingRef={panelHeadingRef}
          checkout={{ returnPath: selfPath, planName }}
        />
      ) : null}

      {partners.kind === "ready" && partners.owners.length > 0 ? (
        <CheckoutForm
          headingRef={panelHeadingRef}
          owners={partners.owners}
          plan={plan}
          termsVersion={terms}
          planCode={planCode}
          planName={planName}
          defaultEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
          onRetryPlan={retryPlan}
          onReloadTerms={reloadTerms}
          onRefreshTermsVersion={refreshTermsVersion}
          onReauth={reauth}
          onRedirecting={() => setRedirecting(true)}
        />
      ) : null}
    </>
  );
}

const optionLinkClass =
  "inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline";

/** Filas del resumen: término arriba en mobile, a la izquierda desde `sm`. */
const summaryRowClass = "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6";
const summaryTermClass = "text-sm font-semibold text-ink/70 sm:w-24 sm:shrink-0";

/** Ícono de un aviso: ayuda a escanear, no reemplaza al texto. */
function RowIcon({ name }: { readonly name: IconName }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
    >
      <Icon name={name} size={20} strokeWidth={1.8} />
    </span>
  );
}

type CheckoutFormProps = {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly owners: readonly Membership[];
  readonly plan: PlanState;
  readonly termsVersion: TermsVersionState;
  readonly planCode: PaidPlanCode;
  readonly planName: string;
  /** Email principal de la cuenta de Clerk: valor inicial del email de MP (FR-016). */
  readonly defaultEmail: string;
  readonly onRetryPlan: () => void;
  readonly onReloadTerms: () => void;
  /** Pide de nuevo la versión vigente de los términos; `null` si no se pudo. */
  readonly onRefreshTermsVersion: () => Promise<string | null>;
  readonly onReauth: () => void;
  /** El checkout salió bien y se va a Mercado Pago. */
  readonly onRedirecting: () => void;
};

/**
 * Suscripción del taller elegido, pedida ANTES del resumen (research D15):
 * dice si le corresponde la prueba (`trialEligible`) y si ya tiene un plan.
 * `view: null` = no se pudo leer: el resumen cae al texto condicional y el
 * backend igual decide en el checkout.
 */
type PartnerSubscription = { readonly partnerId: string; readonly view: SubscriptionView | null };

function CheckoutForm({
  headingRef,
  owners,
  plan,
  termsVersion,
  planCode,
  planName,
  defaultEmail,
  onRetryPlan,
  onReloadTerms,
  onRefreshTermsVersion,
  onReauth,
  onRedirecting,
}: CheckoutFormProps) {
  const { getToken } = useAuth();
  const [pickedPartnerId, setPickedPartnerId] = useState<string | null>(null);
  // `null` = la persona no lo tocó: vale el email de su cuenta.
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PartnerSubscription | null>(null);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });
  const inFlight = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const summaryId = useId();
  const emailId = useId();
  const emailHintId = useId();
  const messageId = useId();

  // Con un solo taller va preseleccionado (FR-003).
  const partnerId = owners.length === 1 ? (owners[0]?.partnerId ?? null) : pickedPartnerId;
  const partner = owners.find((owner) => owner.partnerId === partnerId) ?? null;

  useEffect(() => {
    if (!partnerId) return;
    let active = true;
    void fetchSubscription(partnerId, getToken).then((result) => {
      if (!active) return;
      setSubscription({ partnerId, view: result.kind === "ok" ? result.view : null });
    });
    return () => {
      active = false;
    };
  }, [partnerId, getToken]);

  // La respuesta guardada solo vale para el taller elegido ahora.
  const partnerSubscription = subscription && subscription.partnerId === partnerId ? subscription : null;
  const subscriptionLoading = partnerId !== null && partnerSubscription === null;
  const activeView =
    partnerSubscription?.view && hasActivePlan(partnerSubscription.view) ? partnerSubscription.view : null;

  const email = emailDraft ?? defaultEmail;
  const billingPlan = plan.kind === "ready" ? plan.plan : null;
  const currentTermsVersion = termsVersion.kind === "ready" ? termsVersion.version : null;
  const busy = status.kind === "submitting" || status.kind === "redirecting";
  const canSubmit = currentTermsVersion !== null && billingPlan !== null && !subscriptionLoading && !busy;

  const emailError =
    (status.kind === "local-error" && status.field === "email") ||
    (status.kind === "error" && status.result.kind === "payer-email-rejected");

  // Foco al mensaje de error del servidor; los errores de un campo llevan el
  // foco al campo.
  useEffect(() => {
    if (status.kind === "error") {
      if (status.result.kind === "payer-email-rejected") emailRef.current?.focus();
      else messageRef.current?.focus();
    } else if (status.kind === "local-error") {
      if (status.field === "email") emailRef.current?.focus();
      else messageRef.current?.focus();
    }
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current || !canSubmit || !currentTermsVersion) return;

    if (!partnerId) {
      setStatus({ kind: "local-error", field: "partner", message: content.partnerPicker.required });
      return;
    }
    const checkedEmail = validatePayerEmail(email);
    if (!checkedEmail.ok) {
      setStatus({
        kind: "local-error",
        field: "email",
        message: checkedEmail.reason === "empty" ? content.payerEmail.empty : content.payerEmail.invalid,
      });
      return;
    }

    inFlight.current = true;
    setStatus({ kind: "submitting" });
    const payerEmail = checkedEmail.email;
    // Términos ocultos por decisión de producto (2026-11-05): se manda la versión vigente sin mostrarla. Revertir cuando el backend haga termsVersion opcional o se vuelvan a mostrar.
    const checkout = (version: string) =>
      startCheckout(partnerId, { planCode, termsVersion: version, payerEmail }, getToken);

    let result = await checkout(currentTermsVersion);
    if (result.kind === "terms-outdated") {
      // La versión cambió con la pantalla abierta: se pide la vigente y se
      // reintenta UNA sola vez. Si vuelve a fallar, error genérico reintentable.
      const freshVersion = await onRefreshTermsVersion();
      result = freshVersion ? await checkout(freshVersion) : { kind: "unknown" };
      if (result.kind === "terms-outdated") result = { kind: "unknown" };
    }
    if (result.kind === "success") {
      // Fallback de la pantalla de resultado si la `back_url` no trae `partnerId`.
      savePendingCheckout({ partnerId, planCode, subscriptionId: result.subscriptionId });
      track(ANALYTICS_EVENTS.planCheckoutRedirected, { plan: planCode });
      setStatus({ kind: "redirecting" });
      onRedirecting();
      window.location.assign(result.initPointUrl);
      return; // `inFlight` queda en true: ya nos vamos a MP.
    }
    inFlight.current = false;
    setStatus({ kind: "error", result });
  }

  const message =
    status.kind === "local-error" ? status.message : status.kind === "error" ? content.errors[status.result.kind] : null;
  const accessUntil =
    status.kind === "error" && status.result.kind === "already-live" ? formatDate(status.result.accessUntil) : null;

  const trialNote = billingPlan
    ? trialNoteFor(billingPlan.trialDays, partnerSubscription?.view?.trialEligible ?? null)
    : "none";

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-8">
      {owners.length > 1 ? (
        <fieldset
          aria-describedby={status.kind === "local-error" && status.field === "partner" ? messageId : undefined}
          className="flex flex-col gap-3"
        >
          <legend className="mb-3 font-display text-lg font-bold text-ink">{content.partnerPicker.legend}</legend>
          {owners.map((owner) => (
            <ChoiceRow
              key={owner.partnerId}
              type="radio"
              name="partnerId"
              label={owner.name}
              checked={partnerId === owner.partnerId}
              onChange={() => setPickedPartnerId(owner.partnerId)}
              className="min-h-11 text-base"
            />
          ))}
        </fieldset>
      ) : null}

      {activeView ? (
        <ActivePlanNotice headingRef={headingRef} view={activeView} wantedPlanName={planName} />
      ) : (
        <>
          <div aria-labelledby={summaryId} role="group" className="rounded-card border border-line bg-surface p-6">
            <h2 id={summaryId} ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
              {content.summary.title}
            </h2>
            <dl className="mt-4 flex flex-col gap-3">
              <div className={summaryRowClass}>
                <dt className={summaryTermClass}>{content.summary.partner}</dt>
                <dd className="font-semibold text-ink">{partner ? partner.name : "—"}</dd>
              </div>
              <div className={summaryRowClass}>
                <dt className={summaryTermClass}>{content.summary.plan}</dt>
                <dd className="text-ink">{planName}</dd>
              </div>
              <div className={summaryRowClass}>
                <dt className={summaryTermClass}>{content.summary.price}</dt>
                <dd className="text-ink">
                  {plan.kind === "loading" ? (
                    <span className="text-ink/65">{content.summary.loadingPrice}</span>
                  ) : plan.kind === "error" ? (
                    <span className="flex flex-col items-start gap-2">
                      <span className="text-danger">{content.plansError}</span>
                      <Button type="button" variant="outline" size="sm" className="min-h-11" onClick={onRetryPlan}>
                        {content.retry}
                      </Button>
                    </span>
                  ) : billingPlan ? (
                    <>
                      <span className="font-display text-2xl font-bold tabular-nums">{formatPlanPrice(billingPlan)}</span>{" "}
                      <span className="text-ink/65">{content.summary.priceNote(billingPlan.priceIncludesVat)}</span>
                    </>
                  ) : (
                    <span className="text-danger">{content.planUnavailable}</span>
                  )}
                </dd>
              </div>
            </dl>
            {billingPlan && trialNote !== "none" ? (
              <p
                className={cn(
                  "mt-5 flex items-start gap-2.5 rounded-field px-4 py-3 text-sm leading-relaxed",
                  trialNote === "eligible" && !subscriptionLoading
                    ? "bg-brand/8 text-ink"
                    : "bg-surface-subtle text-ink/75",
                )}
              >
                <Icon name="info" size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-brand-hover" />
                <span>
                  {subscriptionLoading
                    ? content.summary.trial.loading
                    : trialNote === "eligible"
                      ? content.summary.trial.eligible(billingPlan.trialDays)
                      : trialNote === "used"
                        ? content.summary.trial.used
                        : content.summary.trial.conditional(billingPlan.trialDays)}
                </span>
              </p>
            ) : null}
          </div>

          <Field
            label={content.payerEmail.label}
            htmlFor={emailId}
            required
            hint={content.payerEmail.hint}
            hintId={emailHintId}
          >
            <Input
              ref={emailRef}
              id={emailId}
              name="payerEmail"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              value={email}
              onChange={(event) => setEmailDraft(event.target.value)}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? `${emailHintId} ${messageId}` : emailHintId}
              // 16px: menos dispara el zoom de iOS al enfocar.
              className="text-base"
            />
          </Field>

          <div className="flex flex-col gap-3">
            {/* Sin la versión de los términos el backend rechaza el checkout: error genérico y reintento. */}
            {termsVersion.kind === "error" ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-danger">{content.prepareError}</p>
                <Button type="button" variant="outline" className="min-h-11" onClick={onReloadTerms}>
                  {content.retry}
                </Button>
              </div>
            ) : null}
            <Button type="submit" size="lg" block disabled={!canSubmit} aria-disabled={!canSubmit}>
              {busy ? content.submitting : content.submit}
            </Button>
            <p className="text-sm text-ink/65">{content.paymentNote}</p>
          </div>
        </>
      )}

      {/* Región viva SIEMPRE montada para los errores del envío. */}
      <div aria-live="polite" aria-atomic="true">
        {message ? (
          <div ref={messageRef} tabIndex={-1} className="flex flex-col items-start gap-3">
            <p id={messageId} className="font-medium text-danger">
              {message}
            </p>
            {accessUntil ? <p className="text-ink/75">{content.alreadyLive.accessUntil(accessUntil)}</p> : null}
            {status.kind === "error" ? <ErrorAction kind={status.result.kind} onReauth={onReauth} /> : null}
          </div>
        ) : null}
      </div>
    </form>
  );
}

/**
 * El taller elegido ya tiene un plan con acceso: se avisa de entrada, con el
 * plan y su estado a la vista, y no se ofrece pagar. Cambiar de plan no se
 * hace online: el CTA va a ventas con el plan actual y el buscado en el
 * mensaje.
 */
function ActivePlanNotice({
  headingRef,
  view,
  wantedPlanName,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly view: SubscriptionView;
  readonly wantedPlanName: string;
}) {
  const { activePlan } = content;
  const currentPlanName = planDisplayName(view.planCode);
  const statusLabel = view.cancelAtPeriodEnd ? activePlan.canceled : activePlan.statusLabel(view.status);
  const trialUntil = view.status === "trialing" ? formatDate(view.trialEndsAt) : null;
  const until = view.cancelAtPeriodEnd ? formatDate(view.accessUntil) : null;

  const rows = [
    currentPlanName ? { term: activePlan.rows.plan, value: currentPlanName } : null,
    statusLabel ? { term: activePlan.rows.status, value: statusLabel } : null,
    trialUntil ? { term: activePlan.rows.trialUntil, value: trialUntil } : null,
    until ? { term: activePlan.rows.accessUntil, value: until } : null,
  ].filter((row) => row !== null);

  return (
    <div className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6">
      <div className="flex items-start gap-4">
        <RowIcon name="shield-check" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
            {currentPlanName ? activePlan.title(currentPlanName) : activePlan.titleWithoutName}
          </h2>
          <p className="text-ink/70">{until ? activePlan.accessUntil(until) : activePlan.body}</p>
        </div>
      </div>

      {rows.length > 0 ? (
        <dl className="flex flex-col gap-3 border-t border-line pt-4">
          {rows.map((row) => (
            <div key={row.term} className={summaryRowClass}>
              <dt className={summaryTermClass}>{row.term}</dt>
              <dd className="font-semibold text-ink">{row.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6">
        <a
          href={whatsappUrl(activePlan.salesWhatsappMessage(currentPlanName, wantedPlanName))}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="contratar_plan_activo"
          className={cn(buttonVariants({ variant: "outline" }), "min-h-11 self-start")}
        >
          {activePlan.salesCta}
        </a>
        <Link href={activePlan.plansLink.href} className={cn(optionLinkClass, "self-start")}>
          {activePlan.plansLink.label}
        </Link>
        {/* Sin prefetch: `/cuenta` es otra pantalla privada con su Clerk. */}
        <Link href={accountContent.link.href} prefetch={false} className={cn(optionLinkClass, "self-start")}>
          {accountContent.link.label}
        </Link>
      </div>
    </div>
  );
}

/** La acción que acompaña a cada error, si tiene una. */
function ErrorAction({ kind, onReauth }: { readonly kind: CheckoutResult["kind"]; readonly onReauth: () => void }) {
  if (kind === "unauthenticated") {
    return (
      <Button type="button" variant="outline" onClick={onReauth}>
        {content.reauth}
      </Button>
    );
  }
  if (kind === "disabled") {
    return (
      <a
        href={whatsappUrl(content.disabled.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className={optionLinkClass}
      >
        {content.disabled.salesCta}
      </a>
    );
  }
  return null;
}
