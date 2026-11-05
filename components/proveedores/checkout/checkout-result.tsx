"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead } from "@/components/proveedores/account/private-flow";
import { FlowLayout } from "@/components/proveedores/flow/flow-layout";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { PlanSummaryCard } from "@/components/proveedores/flow/plan-summary-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { StoreLinks } from "@/components/ui/store-links";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { accountContent } from "@/lib/content/account";
import { partnerCheckoutContent, planContent, planDisplayName } from "@/lib/content/partner-checkout";
import { formatDate, isPaidPlanCode } from "@/lib/partner-billing/checkout";
import {
  clearPendingCheckout,
  fetchOwnerPartners,
  fetchSubscription,
  readPendingCheckout,
} from "@/lib/partner-billing/client";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import {
  classifySubscription,
  POLL_INTERVAL_MS,
  shouldKeepPolling,
  type SubscriptionView,
} from "@/lib/partner-billing/subscription";
import type { GetToken } from "@/lib/partner-claims/client";
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

const { result: content, steps } = partnerCheckoutContent;

/** Paso "Pago" del indicador, y "todos completados". */
const PAYMENT_STEP = 2;
const ALL_DONE = steps.items.length;

type CheckoutResultProps = {
  /** `?partnerId=` validado en el server (si backend lo agrega a la `back_url`). */
  readonly partnerIdFromQuery: string | null;
  /** Esta misma URL: vuelta del login. */
  readonly selfPath: string;
};

function ResultSteps({ current }: { readonly current: number }) {
  return <FlowSteps label={steps.label} steps={steps.items} current={current} />;
}

/**
 * Isla client de `/proveedores/contratar/resultado` (spec 212, FR-008,
 * FR-018): la vuelta de Mercado Pago. El estado sale SOLO de
 * `GET /partners/{partnerId}/subscription`; los query params que agrega MP
 * no se leen nunca.
 *
 * Mismo armazón que `/contratar`: indicador de progreso (con "Pago" en curso
 * hasta que el backend confirma) y la tarjeta del plan, si se sabe cuál es.
 */
export function CheckoutResult({ partnerIdFromQuery, selfPath }: CheckoutResultProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const head = { eyebrow: partnerCheckoutContent.eyebrow, title: content.title };

  if (!isLoaded || !isSignedIn) {
    return (
      <PartnerSignIn
        head={{ ...head, intro: content.signInIntro }}
        context={<ResultSteps current={PAYMENT_STEP} />}
        redirectUrl={selfPath}
        loading={!isLoaded}
      />
    );
  }

  return (
    <div className="flex max-w-280 flex-col gap-8">
      <PrivateFlowHead head={{ ...head, intro: content.intro }} />
      <SignedInResult partnerIdFromQuery={partnerIdFromQuery} selfPath={selfPath} />
    </div>
  );
}

type ResultState =
  | { readonly kind: "checking" }
  | { readonly kind: "no-checkout" }
  | { readonly kind: "confirmed"; readonly view: SubscriptionView }
  | { readonly kind: "pending-timeout"; readonly retryHref: string | null }
  | { readonly kind: "free"; readonly retryHref: string }
  | { readonly kind: "unconfirmed" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" };

/**
 * Qué taller consultar (research D7): `?partnerId` ⇒ el checkout guardado en
 * esta pestaña ⇒ el único taller de la cuenta. Con varios y sin pista, no se
 * adivina.
 */
async function resolvePartnerId(fromQuery: string | null, getToken: GetToken): Promise<string | null> {
  if (fromQuery) return fromQuery;
  const pending = readPendingCheckout();
  if (pending) return pending.partnerId;
  const owners = await fetchOwnerPartners(getToken);
  return owners.kind === "ok" && owners.owners.length === 1 ? (owners.owners[0]?.partnerId ?? null) : null;
}

/** El plan que se estaba contratando en esta pestaña, si es uno pago. */
function pendingPlanCode(): string | null {
  const planCode = readPendingCheckout()?.planCode;
  return planCode && isPaidPlanCode(planCode) ? planCode : null;
}

/** Reintentar el plan que se estaba contratando, o `null` si no se sabe cuál. */
function retryHrefFor(planCode: string | null): string | null {
  return planCode && isPaidPlanCode(planCode) ? checkoutHref(PROVEEDORES_CONTRATAR_PATH, planCode) : null;
}

function SignedInResult({ partnerIdFromQuery, selfPath }: CheckoutResultProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [state, setState] = useState<ResultState>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
  // Este componente nunca se renderiza en el server (espera a que Clerk
  // cargue), así que leer `sessionStorage` acá no rompe la hidratación.
  const [planCode, setPlanCode] = useState<string | null>(pendingPlanCode);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const startedAt = Date.now();

    async function poll(partnerId: string) {
      const result = await fetchSubscription(partnerId, getToken);
      if (!active) return;

      if (result.kind !== "ok") {
        setState({ kind: "error", reason: result.kind === "unauthenticated" ? "unauthenticated" : "unknown" });
        return;
      }

      // El plan del backend manda sobre el guardado en la pestaña.
      if (isPaidPlanCode(result.view.planCode)) setPlanCode(result.view.planCode);

      const classification = classifySubscription(result.view);
      if (classification === "pending") {
        if (shouldKeepPolling(classification, Date.now() - startedAt)) {
          timer = setTimeout(() => void poll(partnerId), POLL_INTERVAL_MS);
        } else {
          setState({ kind: "pending-timeout", retryHref: retryHrefFor(result.view.planCode) ?? retryHrefFor(pendingPlanCode()) });
        }
        return;
      }
      if (classification === "confirmed") {
        // Una conversión por checkout: sólo si esta pestaña tenía uno pendiente
        // (recargar la página o volver otro día no la cuenta de nuevo).
        if (readPendingCheckout() && isPaidPlanCode(result.view.planCode)) {
          track(ANALYTICS_EVENTS.planCheckoutConfirmed, {
            plan: result.view.planCode,
            trial: result.view.status === "trialing",
          });
        }
        clearPendingCheckout();
        setState({ kind: "confirmed", view: result.view });
        return;
      }
      if (classification === "free") {
        setState({ kind: "free", retryHref: retryHrefFor(pendingPlanCode()) ?? content.plansLink.href });
        return;
      }
      setState({ kind: "unconfirmed" });
    }

    void resolvePartnerId(partnerIdFromQuery, getToken).then((partnerId) => {
      if (!active) return;
      if (partnerId) void poll(partnerId);
      else setState({ kind: "no-checkout" });
    });

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [getToken, partnerIdFromQuery, attempt]);

  // Foco al título de cada resultado final (no mientras consulta).
  useEffect(() => {
    if (state.kind !== "checking") headingRef.current?.focus();
  }, [state.kind]);

  function checkAgain() {
    setState({ kind: "checking" });
    setAttempt((value) => value + 1);
  }

  async function reauth() {
    await signOut({ redirectUrl: selfPath });
  }

  const plan = planCode ? planContent(planCode) : null;

  return (
    <FlowLayout aside={plan ? <PlanSummaryCard plan={plan} showChange={false} note={null} /> : undefined}>
      <AccountBar selfPath={selfPath} />
      <ResultSteps current={state.kind === "confirmed" ? ALL_DONE : PAYMENT_STEP} />

      {/* Región viva SIEMPRE montada: cada cambio de estado se anuncia. */}
      <div aria-live="polite" aria-atomic="true">
        <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-6 sm:p-8">
          {state.kind === "checking" ? (
            <>
              <span
                aria-hidden="true"
                className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
              >
                <Icon name="spinner" size={24} strokeWidth={2} className="motion-safe:animate-spin" />
              </span>
              <h2 className="font-display text-xl font-bold text-ink">{content.checking.title}</h2>
              <p className="text-ink/70">{content.checking.body}</p>
            </>
          ) : state.kind === "confirmed" ? (
            <ConfirmedResult headingRef={headingRef} view={state.view} />
          ) : state.kind === "pending-timeout" ? (
            <PendingResult headingRef={headingRef} retryHref={state.retryHref} onCheckAgain={checkAgain} />
          ) : (
            <>
              <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
                {state.kind === "free"
                  ? content.free.title
                  : state.kind === "unconfirmed"
                    ? content.unconfirmed.title
                    : state.kind === "no-checkout"
                      ? content.noCheckout.title
                      : content.error.title}
              </h2>
              <p className="text-ink/70">
                {state.kind === "free"
                  ? content.free.body
                  : state.kind === "unconfirmed"
                    ? content.unconfirmed.body
                    : state.kind === "no-checkout"
                      ? content.noCheckout.body
                      : state.reason === "unauthenticated"
                        ? content.unauthenticated
                        : content.error.body}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
                {state.kind === "free" ? (
                  <ButtonLink href={state.retryHref} prefetch={false}>
                    {content.free.retry}
                  </ButtonLink>
                ) : state.kind === "no-checkout" ? (
                  <ButtonLink href={content.noCheckout.cta.href}>{content.noCheckout.cta.label}</ButtonLink>
                ) : state.kind === "error" ? (
                  state.reason === "unauthenticated" ? (
                    <Button type="button" onClick={reauth}>
                      {partnerCheckoutContent.reauth}
                    </Button>
                  ) : (
                    <Button type="button" onClick={checkAgain}>
                      {content.error.retry}
                    </Button>
                  )
                ) : null}
                {state.kind === "no-checkout" ? null : <HelpLink />}
              </div>
            </>
          )}
        </div>
      </div>
    </FlowLayout>
  );
}

function HelpLink() {
  return (
    <a
      href={whatsappUrl(content.help.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
      data-analytics-placement="contratar_resultado"
      className="inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline"
    >
      {content.help.label}
    </a>
  );
}

/**
 * `pending` después de 30 s: puede ser un pago que MP todavía no avisó o un
 * checkout abandonado (no vence). La pantalla no sabe cuál, así que les
 * habla a los dos con una acción cada uno: consultar de nuevo o reintentar.
 */
function PendingResult({
  headingRef,
  retryHref,
  onCheckAgain,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly retryHref: string | null;
  readonly onCheckAgain: () => void;
}) {
  const { pendingTimeout } = content;

  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-12 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
      >
        <Icon name="clock" size={24} strokeWidth={1.8} />
      </span>
      <div className="flex flex-col gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
          {pendingTimeout.title}
        </h2>
        <p className="text-ink/70">{pendingTimeout.body}</p>
      </div>

      <div className="mt-2 flex w-full flex-col divide-y divide-line border-y border-line">
        <div className="flex flex-col items-start gap-3 py-5">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{pendingTimeout.paid.title}</h3>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{pendingTimeout.paid.body}</p>
          </div>
          <Button type="button" onClick={onCheckAgain}>
            {pendingTimeout.paid.cta}
          </Button>
        </div>
        <div className="flex flex-col items-start gap-3 py-5">
          <div>
            <h3 className="font-display text-lg font-bold text-ink">{pendingTimeout.notPaid.title}</h3>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{pendingTimeout.notPaid.body}</p>
          </div>
          {/* Sin prefetch: `/contratar` es otra pantalla privada con su Clerk. */}
          <ButtonLink href={retryHref ?? content.plansLink.href} prefetch={false} variant="outline">
            {retryHref ? pendingTimeout.notPaid.cta : pendingTimeout.choosePlan}
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:gap-6">
        <HelpLink />
        <AccountLink />
      </div>
    </>
  );
}

/** "Ir a mi cuenta": el estado de todos los talleres de la cuenta. */
function AccountLink() {
  return (
    <Link
      href={accountContent.link.href}
      prefetch={false}
      className="inline-flex min-h-11 items-center gap-2 font-semibold text-brand-hover underline-offset-4 hover:underline"
    >
      <Icon name="user" size={18} strokeWidth={1.8} />
      {accountContent.link.label}
    </Link>
  );
}

/**
 * El backend confirmó el plan: celebración sobria (el check en un disco
 * verde, sin animación) y los próximos pasos reales: la app para administrar
 * el taller y ayuda si hay dudas.
 */
function ConfirmedResult({
  headingRef,
  view,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly view: SubscriptionView;
}) {
  const { confirmed } = content;
  const planName = planDisplayName(view.planCode);
  const trialEnd = view.status === "trialing" ? formatDate(view.trialEndsAt) : null;

  return (
    <>
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-brand-hover text-white ring-8 ring-brand/10"
      >
        <Icon name="check" size={28} strokeWidth={2.2} />
      </span>
      <div className="mt-1 flex flex-col gap-2">
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-ink">
          {planName ? confirmed.title(planName) : confirmed.titleWithoutName}
        </h2>
        {trialEnd ? <p className="text-ink/75">{confirmed.trialUntil(trialEnd)}</p> : null}
      </div>

      <div className="mt-2 flex w-full flex-col gap-5 border-t border-line pt-6">
        <h3 className="font-display text-lg font-bold text-ink">{confirmed.nextTitle}</h3>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-ink">{confirmed.next.app.title}</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{confirmed.next.app.body}</p>
          </div>
          <StoreLinks placement="contratar_resultado" />
        </div>
        <div>
          <p className="font-semibold text-ink">{confirmed.next.help.title}</p>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{confirmed.next.help.body}</p>
          <div className="flex flex-col sm:flex-row sm:gap-6">
            <HelpLink />
            <AccountLink />
          </div>
        </div>
      </div>
    </>
  );
}
