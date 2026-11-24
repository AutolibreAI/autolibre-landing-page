"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import {
  CheckingView,
  ConfirmedView,
  MessageView,
  PendingView,
} from "@/components/proveedores/checkout/checkout-result-views";
import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { useFlowSignOut } from "@/components/proveedores/flow/use-flow-sign-out";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { syncRoleHint } from "@/lib/auth/role-hint";
import { partnerCheckoutContent, planDisplayName } from "@/lib/content/partner-checkout";
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
import { PROVEEDORES_CONTRATAR_PATH, PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";

const { result: content, steps } = partnerCheckoutContent;

/** Paso "Pago" del indicador, y "todos completados". */
const PAYMENT_STEP = 2;
const ALL_DONE = steps.items.length;

type CheckoutResultProps = {
  /** `?partnerId=` validado en el server (si backend lo agrega a la `back_url`). */
  readonly partnerIdFromQuery: string | null;
  /** Esta misma URL: vuelta del login. */
  readonly selfPath: string;
  /** Cookie `__client_uat` de la instancia (para la pista de rol del header). */
  readonly sessionCookie: string | null;
};

type ResultState =
  | { readonly kind: "checking" }
  | { readonly kind: "no-checkout" }
  | { readonly kind: "confirmed"; readonly view: SubscriptionView }
  | { readonly kind: "pending-timeout"; readonly retryHref: string | null }
  | { readonly kind: "free"; readonly retryHref: string }
  | { readonly kind: "unconfirmed" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" };

/**
 * Isla client de `/proveedores/contratar/resultado` (spec 212, FR-008,
 * FR-018): la vuelta de Mercado Pago. El estado sale SOLO de
 * `GET /partners/{partnerId}/subscription`; los query params que agrega MP
 * no se leen nunca. Misma pantalla de foco que `/contratar`, con "Pago" en
 * curso hasta que el backend confirma.
 */
export function CheckoutResult({ partnerIdFromQuery, selfPath, sessionCookie }: CheckoutResultProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const session = useFlowSignOut();
  const [confirmed, setConfirmed] = useState(false);
  const signedIn = isLoaded && isSignedIn;

  return (
    <FlowShell
      steps={{ label: steps.label, items: steps.items, current: confirmed ? ALL_DONE : PAYMENT_STEP }}
      helpMessage={content.help.whatsappMessage}
      helpPlacement="contratar_resultado_encabezado"
      signOut={signedIn ? { onClick: () => void session.leave(PROVEEDORES_PLANES_PATH), pending: session.pending } : null}
    >
      <FlowMain>
        {signedIn ? (
          <SignedInResult
            partnerIdFromQuery={partnerIdFromQuery}
            sessionCookie={sessionCookie}
            onConfirmed={setConfirmed}
            onReauth={() => void session.leave(selfPath)}
          />
        ) : (
          <PartnerSignIn intro={content.signInIntro} showJoin={false} redirectUrl={selfPath} loading={!isLoaded} />
        )}
      </FlowMain>
    </FlowShell>
  );
}

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

function SignedInResult({
  partnerIdFromQuery,
  sessionCookie,
  onConfirmed,
  onReauth,
}: {
  readonly partnerIdFromQuery: string | null;
  readonly sessionCookie: string | null;
  /** Setter de estado (estable): no reinicia la consulta en cada render. */
  readonly onConfirmed: (confirmed: boolean) => void;
  readonly onReauth: () => void;
}) {
  const { getToken } = useAuth();
  const [state, setState] = useState<ResultState>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
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

      const classification = classifySubscription(result.view);
      if (classification === "pending") {
        if (shouldKeepPolling(classification, Date.now() - startedAt)) {
          timer = setTimeout(() => void poll(partnerId), POLL_INTERVAL_MS);
        } else {
          setState({
            kind: "pending-timeout",
            retryHref: retryHrefFor(result.view.planCode) ?? retryHrefFor(pendingPlanCode()),
          });
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
        // Es dueño de un negocio con plan: el header público muestra "Ir a mi negocio".
        syncRoleHint(sessionCookie, true);
        setState({ kind: "confirmed", view: result.view });
        onConfirmed(true);
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
  }, [getToken, partnerIdFromQuery, attempt, sessionCookie, onConfirmed]);

  // Foco al título de cada resultado final (no mientras consulta).
  useEffect(() => {
    if (state.kind !== "checking") headingRef.current?.focus();
  }, [state.kind]);

  function checkAgain() {
    setState({ kind: "checking" });
    setAttempt((value) => value + 1);
  }

  // Región viva SIEMPRE montada: cada cambio de estado se anuncia.
  return (
    <div aria-live="polite" aria-atomic="true">
      {state.kind === "checking" ? (
        <CheckingView />
      ) : state.kind === "confirmed" ? (
        <ConfirmedView
          headingRef={headingRef}
          planName={planDisplayName(state.view.planCode)}
          trialEnd={state.view.status === "trialing" ? formatDate(state.view.trialEndsAt) : null}
        />
      ) : state.kind === "pending-timeout" ? (
        <PendingView headingRef={headingRef} retryHref={state.retryHref} onCheckAgain={checkAgain} />
      ) : state.kind === "free" ? (
        <MessageView
          headingRef={headingRef}
          title={content.free.title}
          body={content.free.body}
          action={{ kind: "link", href: state.retryHref, label: content.free.retry, primary: true }}
        />
      ) : state.kind === "unconfirmed" ? (
        <MessageView headingRef={headingRef} title={content.unconfirmed.title} body={content.unconfirmed.body} action={null} />
      ) : state.kind === "no-checkout" ? (
        <MessageView
          headingRef={headingRef}
          title={content.noCheckout.title}
          body={content.noCheckout.body}
          action={{ kind: "link", href: content.noCheckout.cta.href, label: content.noCheckout.cta.label, primary: true }}
          showHelp={false}
        />
      ) : (
        <MessageView
          headingRef={headingRef}
          title={content.error.title}
          body={state.reason === "unauthenticated" ? content.unauthenticated : content.error.body}
          action={
            state.reason === "unauthenticated"
              ? { kind: "button", onClick: onReauth, label: partnerCheckoutContent.reauth, primary: true }
              : { kind: "button", onClick: checkAgain, label: content.error.retry, primary: true }
          }
        />
      )}
    </div>
  );
}
