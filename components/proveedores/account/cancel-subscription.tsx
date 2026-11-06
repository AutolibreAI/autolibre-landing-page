"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { accountContent } from "@/lib/content/account";
import { formatDate, isPaidPlanCode } from "@/lib/partner-billing/checkout";
import { cancelSubscription } from "@/lib/partner-billing/client";
import { cancellationAccessDate, type SubscriptionView } from "@/lib/partner-billing/subscription";

const { cancel } = accountContent.page;

type Phase =
  | { readonly kind: "closed" }
  | { readonly kind: "open" }
  | { readonly kind: "submitting" }
  | { readonly kind: "error"; readonly reason: "retryable" | "not-found" | "unauthenticated" };

type CancelSubscriptionProps = {
  readonly partnerId: string;
  readonly partnerName: string;
  /** "Plan Plus", "Plan pago"…: el mismo rótulo que muestra la fila. */
  readonly planLabel: string;
  readonly view: SubscriptionView;
  /** La baja quedó pedida: la fila avisa y vuelve a consultar el estado. */
  readonly onCanceled: (accessUntil: string | null) => void;
};

/**
 * "Cancelar suscripción" de un taller con plan pago vivo. La confirmación se
 * abre en la misma fila (sin `window.confirm` ni modal): un grupo con su
 * título, al que va el foco; "No, mantener el plan" o Escape lo cierran y el
 * foco vuelve al botón. El POST es idempotente, así que "Reintentar" es seguro.
 */
export function CancelSubscription({ partnerId, partnerName, planLabel, view, onCanceled }: CancelSubscriptionProps) {
  const { getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>({ kind: "closed" });
  const panelId = useId();
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const wasOpen = useRef(false);

  const isOpen = phase.kind !== "closed";

  // Foco al título al abrir; de vuelta al botón al cerrar (no en el primer render).
  useEffect(() => {
    if (isOpen && !wasOpen.current) titleRef.current?.focus();
    if (!isOpen && wasOpen.current) triggerRef.current?.focus();
    wasOpen.current = isOpen;
  }, [isOpen]);

  const plan = isPaidPlanCode(view.planCode) ? view.planCode : null;
  const trial = view.status === "trialing";

  async function confirm() {
    setPhase({ kind: "submitting" });
    if (plan) track(ANALYTICS_EVENTS.subscriptionCancelRequested, { plan, trial });

    const result = await cancelSubscription(partnerId, getToken);
    if (result.kind === "success") {
      if (plan) track(ANALYTICS_EVENTS.subscriptionCancelSucceeded, { plan, trial });
      onCanceled(result.accessUntil);
      return;
    }
    if (plan) {
      track(ANALYTICS_EVENTS.subscriptionCancelFailed, {
        plan,
        reason: result.kind === "not-found" ? "not_found" : result.kind,
      });
    }
    setPhase({ kind: "error", reason: result.kind });
  }

  if (!isOpen) {
    return (
      <Button
        ref={triggerRef}
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 self-start"
        aria-expanded={false}
        aria-controls={panelId}
        onClick={() => setPhase({ kind: "open" })}
      >
        {cancel.trigger}
      </Button>
    );
  }

  const submitting = phase.kind === "submitting";
  const error = phase.kind === "error" ? phase.reason : null;
  // Con un 404 o la sesión vencida, reintentar no cambia nada: solo se cierra.
  const canSubmit = error === null || error === "retryable";

  return (
    <div
      id={panelId}
      role="group"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !submitting) setPhase({ kind: "closed" });
      }}
      className="flex basis-full flex-col gap-3 rounded-card border border-line bg-surface-muted p-4 sm:p-5"
    >
      <h4 id={titleId} ref={titleRef} tabIndex={-1} className="font-display text-base font-bold text-ink">
        {cancel.title(partnerName)}
      </h4>
      <p className="leading-relaxed text-ink/75">
        {cancel.keepsPlan(planLabel, formatDate(cancellationAccessDate(view)))}
      </p>
      {trial ? <p className="leading-relaxed text-ink/75">{cancel.trialUsed}</p> : null}
      <p className="leading-relaxed font-semibold text-ink">{cancel.mercadoPagoWarning}</p>

      <div aria-live="polite" aria-atomic="true">
        {error ? (
          <p className="font-medium text-danger">
            {error === "retryable"
              ? cancel.errors.retryable
              : error === "not-found"
                ? cancel.errors.notFound
                : cancel.errors.unauthenticated}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {canSubmit ? (
          <Button
            type="button"
            size="sm"
            className="min-h-11 bg-danger hover:bg-danger/90"
            // `aria-disabled` y no `disabled`: el foco se queda en el botón mientras responde.
            aria-disabled={submitting}
            onClick={() => {
              if (!submitting) void confirm();
            }}
          >
            {submitting ? cancel.confirming : error === "retryable" ? cancel.retry : cancel.confirm}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11"
          disabled={submitting}
          onClick={() => setPhase({ kind: "closed" })}
        >
          {cancel.keep}
        </Button>
      </div>
    </div>
  );
}
