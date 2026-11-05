"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { CheckoutSignIn } from "@/components/proveedores/checkout/checkout-sign-in";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
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
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";
import { siteConfig } from "@/lib/seo/config";
import { whatsappUrl } from "@/lib/whatsapp";

const { result: content } = partnerCheckoutContent;

type CheckoutResultProps = {
  /** `?partnerId=` validado en el server (si backend lo agrega a la `back_url`). */
  readonly partnerIdFromQuery: string | null;
  /** Esta misma URL: vuelta del login. */
  readonly selfPath: string;
};

/**
 * Isla client de `/proveedores/contratar/resultado` (spec 212, FR-008,
 * FR-018): la vuelta de Mercado Pago. El estado sale SOLO de
 * `GET /partners/{partnerId}/subscription`; los query params que agrega MP
 * no se leen nunca.
 */
export function CheckoutResult({ partnerIdFromQuery, selfPath }: CheckoutResultProps) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <p role="status" className="text-ink/65">
        {partnerCheckoutContent.signIn.loading}
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <CheckoutSignIn
        title={partnerCheckoutContent.signIn.title}
        body={content.unauthenticated}
        redirectUrl={selfPath}
      />
    );
  }

  return <SignedInResult partnerIdFromQuery={partnerIdFromQuery} selfPath={selfPath} />;
}

type ResultState =
  | { readonly kind: "checking" }
  | { readonly kind: "no-checkout" }
  | { readonly kind: "confirmed"; readonly view: SubscriptionView }
  | { readonly kind: "pending-timeout" }
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

/** Reintentar el plan que se estaba contratando, o elegir uno si no se sabe. */
function retryHrefFromPending(): string {
  const planCode = readPendingCheckout()?.planCode;
  return planCode && isPaidPlanCode(planCode)
    ? checkoutHref(PROVEEDORES_CONTRATAR_PATH, planCode)
    : content.plansLink.href;
}

function SignedInResult({ partnerIdFromQuery, selfPath }: CheckoutResultProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
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
          setState({ kind: "pending-timeout" });
        }
        return;
      }
      if (classification === "confirmed") {
        clearPendingCheckout();
        setState({ kind: "confirmed", view: result.view });
        return;
      }
      if (classification === "free") {
        setState({ kind: "free", retryHref: retryHrefFromPending() });
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

  const helpLink = (
    <a
      href={whatsappUrl(content.help.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline"
    >
      {content.help.label}
    </a>
  );

  return (
    // Región viva SIEMPRE montada: cada cambio de estado se anuncia.
    <div aria-live="polite" aria-atomic="true">
      <div className="flex flex-col items-start gap-4 rounded-card border border-line bg-surface p-8">
        {state.kind === "checking" ? (
          <>
            <h2 className="font-display text-xl font-bold text-ink">{content.checking.title}</h2>
            <p className="text-ink/70">{content.checking.body}</p>
          </>
        ) : state.kind === "confirmed" ? (
          <ConfirmedResult headingRef={headingRef} view={state.view} />
        ) : (
          <>
            <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
              {state.kind === "pending-timeout"
                ? content.pendingTimeout.title
                : state.kind === "free"
                  ? content.free.title
                  : state.kind === "unconfirmed"
                    ? content.unconfirmed.title
                    : state.kind === "no-checkout"
                      ? content.noCheckout.title
                      : content.error.title}
            </h2>
            <p className="text-ink/70">
              {state.kind === "pending-timeout"
                ? content.pendingTimeout.body
                : state.kind === "free"
                  ? content.free.body
                  : state.kind === "unconfirmed"
                    ? content.unconfirmed.body
                    : state.kind === "no-checkout"
                      ? content.noCheckout.body
                      : state.reason === "unauthenticated"
                        ? content.unauthenticated
                        : content.error.body}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {state.kind === "pending-timeout" ? (
                <Button type="button" onClick={checkAgain}>
                  {content.pendingTimeout.check}
                </Button>
              ) : state.kind === "free" ? (
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
              {state.kind === "no-checkout" ? null : helpLink}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

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
      <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
        <Icon name="check" size={24} />
      </span>
      <h2 ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
        {planName ? confirmed.title(planName) : confirmed.titleWithoutName}
      </h2>
      {trialEnd ? <p className="text-ink/70">{confirmed.trialUntil(trialEnd)}</p> : null}
      <p className="text-ink">{confirmed.body}</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href={siteConfig.stores.appStore} variant="primary">
          {confirmed.appStore}
        </ButtonLink>
        <ButtonLink href={siteConfig.stores.playStore} variant="outline">
          {confirmed.playStore}
        </ButtonLink>
      </div>
    </>
  );
}
