"use client";

import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState } from "react";
import { CheckoutSignIn } from "@/components/proveedores/checkout/checkout-sign-in";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChoiceRow } from "@/components/ui/choice";
import { Field, Input } from "@/components/ui/form-controls";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { partnerCheckoutContent, planDisplayName } from "@/lib/content/partner-checkout";
import {
  findPlan,
  formatDate,
  formatPlanPrice,
  termsParagraphs,
  validatePayerEmail,
  type BillingPlan,
  type CheckoutResult,
  type PaidPlanCode,
  type PartnerTerms,
} from "@/lib/partner-billing/checkout";
import {
  fetchBillingPlans,
  fetchBillingTerms,
  fetchOwnerPartners,
  fetchSubscription,
  savePendingCheckout,
  startCheckout,
} from "@/lib/partner-billing/client";
import { claimWithReturnHref } from "@/lib/partner-billing/return-path";
import { hasActivePlan, trialNoteFor, type SubscriptionView } from "@/lib/partner-billing/subscription";
import type { Membership } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

const content = partnerCheckoutContent;

type CheckoutFlowProps = {
  readonly planCode: PaidPlanCode;
  /** Nombre del plan como en la página de planes (FR-013). */
  readonly planName: string;
  /** Esta misma URL (`/proveedores/contratar?plan=…`): vuelta del login y del reclamo. */
  readonly selfPath: string;
};

/**
 * Isla client de `/proveedores/contratar` (spec 212). Sin sesión muestra el
 * `<SignIn>`; con sesión, la contratación. La página (server) ya validó el
 * plan y tiene el `<h1>`.
 */
export function CheckoutFlow({ planCode, planName, selfPath }: CheckoutFlowProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <p role="status" className="text-ink/65">
        {content.signIn.loading}
      </p>
    );
  }

  if (!isSignedIn) {
    return <CheckoutSignIn title={content.signIn.title} body={content.signIn.body} redirectUrl={selfPath} />;
  }

  return <SignedInCheckout planCode={planCode} planName={planName} selfPath={selfPath} />;
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

type TermsState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly terms: PartnerTerms };

type SubmitStatus =
  | { readonly kind: "idle" }
  | { readonly kind: "local-error"; readonly field: "partner" | "email"; readonly message: string }
  | { readonly kind: "submitting" }
  | { readonly kind: "redirecting" }
  | { readonly kind: "error"; readonly result: Exclude<CheckoutResult, { kind: "success" }> };

function SignedInCheckout({ planCode, planName, selfPath }: CheckoutFlowProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { user } = useUser();

  const [partners, setPartners] = useState<PartnersState>({ kind: "loading" });
  const [partnersAttempt, setPartnersAttempt] = useState(0);
  const [plan, setPlan] = useState<PlanState>({ kind: "loading" });
  const [planAttempt, setPlanAttempt] = useState(0);
  const [terms, setTerms] = useState<TermsState>({ kind: "loading" });
  const [termsAttempt, setTermsAttempt] = useState(0);

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

  // Términos: única fuente `GET /billing/terms` (texto + versión).
  useEffect(() => {
    let active = true;
    void fetchBillingTerms().then((result) => {
      if (!active) return;
      setTerms(result.ok ? { kind: "ready", terms: result.terms } : { kind: "error" });
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

  async function reauth() {
    await signOut({ redirectUrl: selfPath });
  }

  return (
    <div className="flex flex-col gap-8">
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
        <NoPartnerPanel headingRef={panelHeadingRef} selfPath={selfPath} />
      ) : null}

      {partners.kind === "ready" && partners.owners.length > 0 ? (
        <CheckoutForm
          headingRef={panelHeadingRef}
          owners={partners.owners}
          plan={plan}
          terms={terms}
          planCode={planCode}
          planName={planName}
          defaultEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
          onRetryPlan={retryPlan}
          onReloadTerms={reloadTerms}
          onReauth={reauth}
        />
      ) : null}
    </div>
  );
}

const optionLinkClass =
  "inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline";

/** Filas del resumen: término arriba en mobile, a la izquierda desde `sm`. */
const summaryRowClass = "flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6";
const summaryTermClass = "text-sm font-semibold text-ink/70 sm:w-20 sm:shrink-0";

/** Sin talleres como dueño (US2): reclamar uno existente o registrar uno nuevo. */
function NoPartnerPanel({
  headingRef,
  selfPath,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly selfPath: string;
}) {
  const { noPartner } = content;
  const titleId = useId();

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-6">
      <div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
          {noPartner.title}
        </h2>
        <p className="mt-2 text-ink/70">{noPartner.body}</p>
      </div>
      <ul className="grid gap-4 md:grid-cols-2">
        <Card as="li" className="flex flex-col gap-3 p-6">
          <h3 className="font-display text-lg font-bold text-ink">{noPartner.claim.title}</h3>
          <p className="flex-1 text-ink/70">{noPartner.claim.body}</p>
          {/* Sin prefetch: el reclamo es otra pantalla privada con su Clerk. */}
          <ButtonLink href={claimWithReturnHref(PROVEEDORES_RECLAMAR_PATH, selfPath)} prefetch={false} block>
            {noPartner.claim.cta}
          </ButtonLink>
          <a
            href={whatsappUrl(noPartner.requestCode.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className={optionLinkClass}
          >
            {noPartner.requestCode.label}
          </a>
        </Card>
        <Card as="li" className="flex flex-col gap-3 p-6">
          <h3 className="font-display text-lg font-bold text-ink">{noPartner.register.title}</h3>
          <p className="flex-1 text-ink/70">{noPartner.register.body}</p>
          <ButtonLink href={noPartner.register.href} variant="outline" block>
            {noPartner.register.cta}
          </ButtonLink>
        </Card>
      </ul>
    </div>
  );
}

type CheckoutFormProps = {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly owners: readonly Membership[];
  readonly plan: PlanState;
  readonly terms: TermsState;
  readonly planCode: PaidPlanCode;
  readonly planName: string;
  /** Email principal de la cuenta de Clerk: valor inicial del email de MP (FR-016). */
  readonly defaultEmail: string;
  readonly onRetryPlan: () => void;
  readonly onReloadTerms: () => void;
  readonly onReauth: () => void;
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
  terms,
  planCode,
  planName,
  defaultEmail,
  onRetryPlan,
  onReloadTerms,
  onReauth,
}: CheckoutFormProps) {
  const { getToken } = useAuth();
  const [pickedPartnerId, setPickedPartnerId] = useState<string | null>(null);
  // `null` = la persona no lo tocó: vale el email de su cuenta.
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  // Se acepta UNA versión: si los términos cambian, hay que aceptar de nuevo.
  const [acceptedVersion, setAcceptedVersion] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<PartnerSubscription | null>(null);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });
  const inFlight = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  const summaryId = useId();
  const emailId = useId();
  const emailHintId = useId();
  const termsId = useId();
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
  const currentTerms = terms.kind === "ready" ? terms.terms : null;
  const termsAccepted = currentTerms !== null && acceptedVersion === currentTerms.version;
  const busy = status.kind === "submitting" || status.kind === "redirecting";
  const canSubmit = termsAccepted && billingPlan !== null && !subscriptionLoading && !busy;

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
    if (inFlight.current || !canSubmit || !currentTerms) return;

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
    const result = await startCheckout(
      partnerId,
      // La versión es la del texto que la persona aceptó, tal como vino del backend.
      { planCode, termsVersion: currentTerms.version, payerEmail: checkedEmail.email },
      getToken,
    );
    if (result.kind === "success") {
      // Fallback de la pantalla de resultado si la `back_url` no trae `partnerId`.
      savePendingCheckout({ partnerId, planCode, subscriptionId: result.subscriptionId });
      track(ANALYTICS_EVENTS.planCheckoutRedirected, { plan: planCode });
      setStatus({ kind: "redirecting" });
      window.location.assign(result.initPointUrl);
      return; // `inFlight` queda en true: ya nos vamos a MP.
    }
    inFlight.current = false;
    if (result.kind === "terms-outdated") {
      // Términos nuevos: se vuelven a pedir y hay que aceptarlos otra vez.
      setAcceptedVersion(null);
      onReloadTerms();
    }
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
        <ActivePlanNotice headingRef={headingRef} view={activeView} />
      ) : (
        <>
          <div aria-labelledby={summaryId} role="group" className="rounded-card border border-line bg-surface p-6">
            <h2 id={summaryId} ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
              {content.summary.title}
            </h2>
            <dl className="mt-4 flex flex-col gap-3">
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
                      <span className="font-display text-2xl font-bold">{formatPlanPrice(billingPlan)}</span>{" "}
                      <span className="text-ink/65">{content.summary.priceNote(billingPlan.priceIncludesVat)}</span>
                    </>
                  ) : (
                    <span className="text-danger">{content.planUnavailable}</span>
                  )}
                </dd>
              </div>
              <div className={summaryRowClass}>
                <dt className={summaryTermClass}>{content.summary.partner}</dt>
                <dd className="text-ink">{partner ? partner.name : "—"}</dd>
              </div>
            </dl>
            {billingPlan && trialNote !== "none" ? (
              <p className="mt-4 text-sm leading-relaxed text-ink/70">
                {subscriptionLoading
                  ? content.summary.trial.loading
                  : trialNote === "eligible"
                    ? content.summary.trial.eligible(billingPlan.trialDays)
                    : trialNote === "used"
                      ? content.summary.trial.used
                      : content.summary.trial.conditional(billingPlan.trialDays)}
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
            {terms.kind === "loading" ? (
              <p className="text-ink/65">{content.terms.loading}</p>
            ) : terms.kind === "error" ? (
              <div className="flex flex-col items-start gap-2">
                <p className="text-danger">{content.terms.error}</p>
                <Button type="button" variant="outline" onClick={onReloadTerms}>
                  {content.retry}
                </Button>
              </div>
            ) : (
              <>
                {/* El texto (del backend) está en el DOM aunque el <details> esté cerrado. */}
                <details className="rounded-field border border-line bg-surface-subtle p-4">
                  <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-ink">
                    {content.terms.summary}
                  </summary>
                  <div className="mt-3 flex flex-col gap-3 text-sm leading-relaxed text-ink/75">
                    <p className="text-xs font-semibold text-ink/60">{content.terms.version(terms.terms.version)}</p>
                    {termsParagraphs(terms.terms.text).map((paragraph, index) => (
                      <p key={index} className="whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </details>
                <label htmlFor={termsId} className="flex min-h-11 cursor-pointer items-center gap-3 text-ink">
                  <input
                    id={termsId}
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(event) => setAcceptedVersion(event.target.checked ? terms.terms.version : null)}
                    className="size-5 shrink-0 accent-brand"
                  />
                  <span>{content.terms.checkbox}</span>
                </label>
              </>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" size="lg" block disabled={!canSubmit} aria-disabled={!canSubmit}>
              {busy ? content.submitting : content.submit}
            </Button>
            <p className="text-sm text-ink/65">{termsAccepted ? content.paymentNote : content.terms.required}</p>
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

/** El taller elegido ya tiene un plan con acceso: se avisa de entrada y no se ofrece pagar. */
function ActivePlanNotice({
  headingRef,
  view,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly view: SubscriptionView;
}) {
  const { activePlan } = content;
  const currentPlanName = planDisplayName(view.planCode);
  const until = view.cancelAtPeriodEnd ? formatDate(view.accessUntil) : null;

  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-line bg-surface p-6">
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
        {currentPlanName ? activePlan.title(currentPlanName) : activePlan.titleWithoutName}
      </h2>
      <p className="text-ink/70">{until ? activePlan.accessUntil(until) : activePlan.body}</p>
      <a
        href={whatsappUrl(content.disabled.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        className={optionLinkClass}
      >
        {content.disabled.salesCta}
      </a>
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
