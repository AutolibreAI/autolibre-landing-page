"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { NoPartnerOptions } from "@/components/proveedores/account/no-partner-options";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead } from "@/components/proveedores/account/private-flow";
import {
  CheckoutFormView,
  type OwnerOption,
  type PlanState,
  type SubmitStatus,
} from "@/components/proveedores/checkout/checkout-views";
import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { useFlowSignOut } from "@/components/proveedores/flow/use-flow-sign-out";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import { findPlan, validatePayerEmail, type PaidPlanCode } from "@/lib/partner-billing/checkout";
import {
  fetchBillingPlans,
  fetchBillingTerms,
  fetchOwnerPartners,
  fetchSubscription,
  savePendingCheckout,
  startCheckout,
} from "@/lib/partner-billing/client";
import { hasActivePlan, type SubscriptionView } from "@/lib/partner-billing/subscription";
import type { Membership } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";

const content = partnerCheckoutContent;

/** Índices de `content.steps.items`. */
const STEP = { partner: 0, plan: 1, payment: 2 } as const;

type CheckoutFlowProps = {
  readonly planCode: PaidPlanCode;
  /** Nombre del plan como en la página de planes (FR-013). */
  readonly planName: string;
  /** Esta misma URL (`/proveedores/contratar?plan=…`): vuelta del login y del reclamo. */
  readonly selfPath: string;
};

/**
 * Isla client de `/proveedores/contratar` (spec 212; lienzos `Contratar` y
 * `ContratarMax`). Pinta la pantalla entera con el encabezado de foco
 * (`FlowShell`, con los pasos Tu taller · Plan · Pago): sin sesión, el panel
 * "Ingresá o creá tu cuenta"; con sesión, la contratación. La página (server)
 * ya validó el plan.
 */
export function CheckoutFlow({ planCode, planName, selfPath }: CheckoutFlowProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const session = useFlowSignOut();
  /** Ya se va a Mercado Pago: el indicador marca el paso "Pago". */
  const [redirecting, setRedirecting] = useState(false);
  const signedIn = isLoaded && isSignedIn;
  const step = !signedIn ? STEP.partner : redirecting ? STEP.payment : STEP.plan;

  return (
    <FlowShell
      steps={{ label: content.steps.label, items: content.steps.items, current: step }}
      helpMessage={content.result.help.whatsappMessage}
      helpPlacement="contratar_encabezado"
      signOut={signedIn ? { onClick: () => void session.leave(PROVEEDORES_PLANES_PATH), pending: session.pending } : null}
    >
      <FlowMain>
        {signedIn ? (
          <SignedInCheckout
            planCode={planCode}
            planName={planName}
            selfPath={selfPath}
            onRedirecting={() => setRedirecting(true)}
            onReauth={() => void session.leave(selfPath)}
          />
        ) : (
          <PartnerSignIn
            intro={content.signInIntro(planName)}
            showJoin={false}
            redirectUrl={selfPath}
            loading={!isLoaded}
          />
        )}
      </FlowMain>
    </FlowShell>
  );
}

type PartnersState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" }
  | { readonly kind: "ready"; readonly owners: readonly Membership[] };

/** Solo la versión vigente de los términos: el texto no se muestra. */
type TermsVersionState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly version: string };

/**
 * Suscripción de cada taller, pedida ANTES de pagar (research D15): dice si
 * le corresponde la prueba y si ya tiene un plan. `undefined` = cargando;
 * `null` = no se pudo leer (el backend igual decide en el checkout).
 */
type Subscriptions = Readonly<Record<string, SubscriptionView | null>>;

type SignedInCheckoutProps = CheckoutFlowProps & {
  readonly onRedirecting: () => void;
  readonly onReauth: () => void;
};

function SignedInCheckout({ planCode, planName, selfPath, onRedirecting, onReauth }: SignedInCheckoutProps) {
  const { getToken } = useAuth();
  const { user } = useUser();

  const [partners, setPartners] = useState<PartnersState>({ kind: "loading" });
  const [partnersAttempt, setPartnersAttempt] = useState(0);
  const [plan, setPlan] = useState<PlanState>({ kind: "loading" });
  const [planAttempt, setPlanAttempt] = useState(0);
  const [terms, setTerms] = useState<TermsVersionState>({ kind: "loading" });
  const [termsAttempt, setTermsAttempt] = useState(0);
  const [subscriptions, setSubscriptions] = useState<Subscriptions>({});

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

  // La suscripción de CADA taller (casi siempre uno o dos): así cada opción
  // dice qué plan tiene y si le corresponde la prueba, y las que ya tienen un
  // plan pago no se pueden elegir.
  useEffect(() => {
    if (partners.kind !== "ready") return;
    let active = true;
    for (const owner of partners.owners) {
      void fetchSubscription(owner.partnerId, getToken).then((result) => {
        if (!active) return;
        setSubscriptions((current) => ({
          ...current,
          [owner.partnerId]: result.kind === "ok" ? result.view : null,
        }));
      });
    }
    return () => {
      active = false;
    };
  }, [partners, getToken]);

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

  // Foco al título de la página cuando termina de cargar (lectores de
  // pantalla y teclado arrancan desde el contenido nuevo).
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (partners.kind === "error") errorHeadingRef.current?.focus();
  }, [partners.kind]);

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

  const head = { eyebrow: content.eyebrow, title: content.title(planName), intro: content.intro };

  if (partners.kind === "loading") {
    return (
      <div className="flex flex-col gap-6">
        <PrivateFlowHead head={head} />
        <p role="status" className="text-fg-muted">
          {content.loading}
        </p>
      </div>
    );
  }

  if (partners.kind === "error") {
    return (
      <div className="flex flex-col items-start gap-6">
        <PrivateFlowHead head={head} />
        <div role="alert" className="flex flex-col items-start gap-3">
          <h2 ref={errorHeadingRef} tabIndex={-1} className="font-display text-xl font-semibold text-status-alert">
            {partners.reason === "unauthenticated" ? content.errors.unauthenticated : content.partnersError}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="48"
            onClick={() => {
              if (partners.reason === "unauthenticated") onReauth();
              else {
                setPartners({ kind: "loading" });
                setPartnersAttempt((attempt) => attempt + 1);
              }
            }}
          >
            {partners.reason === "unauthenticated" ? content.reauth : content.retry}
          </Button>
        </div>
      </div>
    );
  }

  if (partners.owners.length === 0) {
    return (
      <div className="flex max-w-160 flex-col gap-8">
        <PrivateFlowHead head={head} />
        <NoPartnerOptions checkout={{ returnPath: selfPath, planName }} />
      </div>
    );
  }

  const owners: OwnerOption[] = partners.owners.map((owner) => ({
    partnerId: owner.partnerId,
    name: owner.name,
    subscription: subscriptions[owner.partnerId],
  }));

  return (
    <CheckoutForm
      head={head}
      owners={owners}
      plan={plan}
      termsVersion={terms}
      planCode={planCode}
      planName={planName}
      defaultEmail={user?.primaryEmailAddress?.emailAddress ?? ""}
      getToken={getToken}
      onRetryPlan={() => {
        setPlan({ kind: "loading" });
        setPlanAttempt((attempt) => attempt + 1);
      }}
      onReloadTerms={() => {
        setTerms({ kind: "loading" });
        setTermsAttempt((attempt) => attempt + 1);
      }}
      onRefreshTermsVersion={refreshTermsVersion}
      onReauth={onReauth}
      onRedirecting={onRedirecting}
    />
  );
}

type CheckoutFormProps = {
  readonly head: { readonly eyebrow: string; readonly title: string; readonly intro: string };
  readonly owners: readonly OwnerOption[];
  readonly plan: PlanState;
  readonly termsVersion: TermsVersionState;
  readonly planCode: PaidPlanCode;
  readonly planName: string;
  /** Email principal de la cuenta de Clerk: valor inicial del email de MP (FR-016). */
  readonly defaultEmail: string;
  readonly getToken: () => Promise<string | null>;
  readonly onRetryPlan: () => void;
  readonly onReloadTerms: () => void;
  /** Pide de nuevo la versión vigente de los términos; `null` si no se pudo. */
  readonly onRefreshTermsVersion: () => Promise<string | null>;
  readonly onReauth: () => void;
  /** El checkout salió bien y se va a Mercado Pago. */
  readonly onRedirecting: () => void;
};

function CheckoutForm({
  head,
  owners,
  plan,
  termsVersion,
  planCode,
  planName,
  defaultEmail,
  getToken,
  onRetryPlan,
  onReloadTerms,
  onRefreshTermsVersion,
  onReauth,
  onRedirecting,
}: CheckoutFormProps) {
  const [pickedPartnerId, setPickedPartnerId] = useState<string | null>(null);
  // `null` = la persona no lo tocó: vale el email de su cuenta.
  const [emailDraft, setEmailDraft] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>({ kind: "idle" });
  const inFlight = useRef(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  // Los que ya tienen un plan pago no se pueden elegir. Si queda uno solo
  // elegible, va preseleccionado (FR-003).
  const eligible = owners.filter((owner) => !(owner.subscription && hasActivePlan(owner.subscription)));
  const partnerId = pickedPartnerId ?? (eligible.length === 1 ? (eligible[0]?.partnerId ?? null) : null);
  const partner = owners.find((owner) => owner.partnerId === partnerId) ?? null;
  // Todos los talleres ya tienen un plan: se avisa con el primero.
  const allActive = eligible.length === 0 && owners.every((owner) => owner.subscription !== undefined);
  const activeOwner = allActive ? (owners[0] ?? null) : null;

  const email = emailDraft ?? defaultEmail;
  const billingPlan = plan.kind === "ready" ? plan.plan : null;
  const currentTermsVersion = termsVersion.kind === "ready" ? termsVersion.version : null;
  const subscriptionLoading = partner !== null && partner.subscription === undefined;
  const busy = status.kind === "submitting" || status.kind === "redirecting";
  const canSubmit = currentTermsVersion !== null && billingPlan !== null && !subscriptionLoading && !busy;

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

  return (
    <CheckoutFormView
      head={head}
      owners={owners}
      selectedPartnerId={partnerId}
      onSelectPartner={setPickedPartnerId}
      activeOwner={activeOwner}
      plan={plan}
      planCode={planCode}
      planName={planName}
      email={email}
      onEmailChange={setEmailDraft}
      emailRef={emailRef}
      messageRef={messageRef}
      status={status}
      termsError={termsVersion.kind === "error"}
      canSubmit={canSubmit}
      onSubmit={handleSubmit}
      onRetryPlan={onRetryPlan}
      onReloadTerms={onReloadTerms}
      onReauth={onReauth}
    />
  );
}
