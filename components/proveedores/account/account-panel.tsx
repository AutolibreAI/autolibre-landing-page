"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { NoPartnerOptions } from "@/components/proveedores/account/no-partner-options";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead } from "@/components/proveedores/account/private-flow";
import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { planDisplayName } from "@/lib/content/partner-checkout";
import { formatDate } from "@/lib/partner-billing/checkout";
import { fetchOwnerPartners, fetchSubscription } from "@/lib/partner-billing/client";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import { classifySubscription, type SubscriptionView } from "@/lib/partner-billing/subscription";
import type { Membership } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_CONTRATAR_PATH, PROVEEDORES_CONTRATAR_RESULTADO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { page } = accountContent;

const linkClass =
  "inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline";

type AccountPanelProps = {
  /** `/cuenta`: vuelta del login y de "Usar otra cuenta". */
  readonly selfPath: string;
};

/**
 * Isla client de `/cuenta`. Sin sesión, el login compartido de los flujos de
 * talleres; con sesión, la fila de sesión (quién sos, otra cuenta, cerrar
 * sesión) y tus talleres con el estado de su plan. Sin talleres, los mismos
 * caminos que el panel "sin taller" de la contratación.
 */
export function AccountPanel({ selfPath }: AccountPanelProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const head = { eyebrow: page.eyebrow, title: page.title };

  if (!isLoaded || !isSignedIn) {
    return (
      <PartnerSignIn head={{ ...head, intro: page.signInIntro }} redirectUrl={selfPath} loading={!isLoaded} />
    );
  }

  return (
    <div className="flex max-w-180 flex-col gap-8">
      <PrivateFlowHead head={{ ...head, intro: page.intro }} />
      <SignedInAccount selfPath={selfPath} />
    </div>
  );
}

type PartnersState =
  | { readonly kind: "loading" }
  | { readonly kind: "error"; readonly reason: "unauthenticated" | "unknown" }
  | { readonly kind: "ready"; readonly owners: readonly Membership[] };

function SignedInAccount({ selfPath }: AccountPanelProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const [partners, setPartners] = useState<PartnersState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    void fetchOwnerPartners(getToken).then((result) => {
      if (!active) return;
      setPartners(result.kind === "ok" ? { kind: "ready", owners: result.owners } : { kind: "error", reason: result.kind });
    });
    return () => {
      active = false;
    };
  }, [getToken, attempt]);

  function retry() {
    setPartners({ kind: "loading" });
    setAttempt((value) => value + 1);
  }

  return (
    <div className="flex flex-col gap-8">
      <AccountBar selfPath={selfPath} />

      <div aria-live="polite" aria-atomic="true">
        {partners.kind === "loading" ? (
          <p className="text-ink/65">{page.partners.loading}</p>
        ) : partners.kind === "error" ? (
          <div className="flex flex-col items-start gap-3">
            <p className="font-medium text-danger">
              {partners.reason === "unauthenticated" ? page.partners.unauthenticated : page.partners.error}
            </p>
            {partners.reason === "unauthenticated" ? (
              <Button type="button" variant="outline" onClick={() => void signOut({ redirectUrl: selfPath })}>
                {partnerAccountContent.reauth}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={retry}>
                {page.partners.retry}
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {partners.kind === "ready" && partners.owners.length === 0 ? (
        <NoPartnerOptions headingRef={headingRef} checkout={null} placementPrefix="cuenta" />
      ) : null}

      {partners.kind === "ready" && partners.owners.length > 0 ? (
        <section aria-labelledby="cuenta-talleres-titulo" className="flex flex-col gap-4">
          <h2 id="cuenta-talleres-titulo" className="font-display text-xl font-bold text-ink">
            {page.partners.title}
          </h2>
          <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
            {partners.owners.map((owner) => (
              <PartnerRow key={owner.partnerId} partner={owner} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

type SubscriptionState =
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "ready"; readonly view: SubscriptionView };

/** Qué se muestra del plan: el rótulo, su estado y el tono del estado. */
function describePlan(view: SubscriptionView): {
  readonly plan: string;
  readonly status: string | null;
  readonly tone: "ok" | "neutral";
  readonly kind: ReturnType<typeof classifySubscription>;
} {
  const kind = classifySubscription(view);
  const name = planDisplayName(view.planCode);
  const planLabel = name ? page.plan.named(name) : page.plan.unnamed;
  const { status } = page.plan;

  if (kind === "free") return { plan: page.plan.free, status: null, tone: "neutral", kind };
  if (kind === "pending") return { plan: planLabel, status: status.pending, tone: "neutral", kind };
  if (kind === "confirmed") {
    if (view.cancelAtPeriodEnd) {
      return { plan: planLabel, status: status.canceled(formatDate(view.accessUntil)), tone: "neutral", kind };
    }
    if (view.status === "trialing") {
      return { plan: planLabel, status: status.trialing(formatDate(view.trialEndsAt)), tone: "ok", kind };
    }
    return { plan: planLabel, status: status.active, tone: "ok", kind };
  }
  return { plan: planLabel, status: status.other, tone: "neutral", kind };
}

/** Un taller de la cuenta con el estado de su plan y la acción que corresponde. */
function PartnerRow({ partner }: { readonly partner: Membership }) {
  const { getToken } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    void fetchSubscription(partner.partnerId, getToken).then((result) => {
      if (!active) return;
      setSubscription(result.kind === "ok" ? { kind: "ready", view: result.view } : { kind: "error" });
    });
    return () => {
      active = false;
    };
  }, [partner.partnerId, getToken]);

  const described = subscription.kind === "ready" ? describePlan(subscription.view) : null;
  const currentPlanName = subscription.kind === "ready" ? planDisplayName(subscription.view.planCode) : null;

  return (
    <li className="flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-col gap-2">
        <h3 className="font-display text-lg leading-snug font-bold text-ink">{partner.name}</h3>
        {subscription.kind === "loading" ? (
          <p className="text-sm text-ink/65">{page.plan.loading}</p>
        ) : subscription.kind === "error" || !described ? (
          <p className="text-sm text-ink/70">{page.plan.error}</p>
        ) : (
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
            <span className="font-semibold text-ink">{described.plan}</span>
            {described.status ? (
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-label font-semibold",
                  described.tone === "ok" ? "bg-brand/10 text-brand-hover" : "bg-surface-muted text-ink/75",
                )}
              >
                {described.status}
              </span>
            ) : null}
          </p>
        )}
      </div>

      {described ? (
        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
          {described.kind === "free" ? (
            <>
              {/* Sin prefetch: la contratación es otra pantalla privada. */}
              <ButtonLink
                href={checkoutHref(PROVEEDORES_CONTRATAR_PATH, "plus")}
                prefetch={false}
                size="sm"
                className="min-h-11 self-start"
              >
                {page.actions.choose}
              </ButtonLink>
              <Link href={page.actions.allPlans.href} className={cn(linkClass, "self-start")}>
                {page.actions.allPlans.label}
              </Link>
            </>
          ) : described.kind === "pending" ? (
            <ButtonLink
              href={`${PROVEEDORES_CONTRATAR_RESULTADO_PATH}?${new URLSearchParams({ partnerId: partner.partnerId }).toString()}`}
              prefetch={false}
              variant="outline"
              size="sm"
              className="min-h-11 self-start"
            >
              {page.actions.pending}
            </ButtonLink>
          ) : (
            <a
              href={whatsappUrl(page.actions.changePlanWhatsapp(partner.name, currentPlanName))}
              target="_blank"
              rel="noopener noreferrer"
              data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
              data-analytics-placement="cuenta_cambiar_plan"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 self-start")}
            >
              {page.actions.changePlan}
            </a>
          )}
        </div>
      ) : null}
    </li>
  );
}
