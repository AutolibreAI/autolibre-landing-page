"use client";

import { useId, useState } from "react";
import { AppPreview } from "@/components/cuenta/app-preview";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import type { OwnerPartnerProfile } from "@/lib/account/partner-profile";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

const { referral, summary, review } = accountContent.business;

/**
 * "Tu código para clientes" (el código de referido, `partner_referral_codes`)
 * y cuántos clientes guardaron el taller (`preferred_partners`). APAGADO
 * (`ACCOUNT_FEATURES.referralCode`): el dueño no tiene lectura del código.
 */
export function ReferralCodeCard({ code, savedCount }: { readonly code: string; readonly savedCount: number }) {
  const titleId = useId();
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      // Sin permiso de portapapeles: el código igual se ve y se puede seleccionar.
    }
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-4 rounded-card border border-card-line bg-card p-6">
      <div>
        <h3 id={titleId} className="font-display text-xl font-bold text-fg">
          {referral.title}
        </h3>
        <p className="mt-1.5 text-control leading-relaxed text-fg-muted">{referral.body}</p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-card border border-dashed border-control-line-strong py-1.5 pr-1.5 pl-4">
        <p className="font-mono text-lg font-semibold tracking-widest text-fg">{code}</p>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex h-11 items-center rounded-full border border-action bg-card px-4 font-display text-sm font-semibold text-fg hover:bg-brand-50"
        >
          <span aria-live="polite">{copied ? referral.copied : referral.copy}</span>
        </button>
      </div>
      <p className="text-sm text-fg-muted">{referral.saved(savedCount)}</p>
    </section>
  );
}

/** "¿Necesitás una mano?": WhatsApp de AutoLibre con el nombre del negocio. */
export function HelpLink({ partnerName }: { readonly partnerName: string }) {
  const titleId = useId();
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1 px-1">
      <h3 id={titleId} className="font-medium text-fg">
        {summary.help.title}
      </h3>
      <a
        href={whatsappUrl(summary.help.message(partnerName))}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement="cuenta_ayuda"
        className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-fg underline underline-offset-4"
      >
        <Icon name="whatsapp" size={18} strokeWidth={1.8} className="text-whatsapp" />
        {summary.help.cta}
        <span className="sr-only">{accountContent.business.externalHint}</span>
      </a>
    </section>
  );
}

/**
 * Estado "En revisión": el alta se mandó y el equipo todavía no la aprobó.
 * APAGADO (`ACCOUNT_FEATURES.reviewStatus`): el dueño no tiene lectura de su
 * solicitud. Sin pestañas: no hay pedidos ni plan todavía.
 */
export function ReviewStatus({
  titleId,
  submittedAt,
  data,
  profile,
}: {
  readonly titleId: string;
  /** Fecha del envío, ya en texto ("22 de noviembre"). */
  readonly submittedAt: string;
  readonly data: readonly { readonly label: string; readonly value: string }[];
  readonly profile: OwnerPartnerProfile | null;
}) {
  const dataTitleId = useId();
  const meanwhileId = useId();
  const steps = [
    { key: "sent", state: "done", title: review.steps.sent.title, body: review.steps.sent.body(submittedAt) },
    { key: "review", state: "current", title: review.steps.review.title, body: review.steps.review.body },
    { key: "published", state: "upcoming", title: review.steps.published.title, body: review.steps.published.body },
  ] as const;
  const status = partnerAccountContent.stepStatus;

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-14">
      <div className="flex flex-col gap-7">
        <div className="max-w-150">
          <h2 id={titleId} className="font-display text-3xl leading-tight font-bold text-fg md:text-4xl">
            {review.title}
          </h2>
          <p className="mt-2.5 text-lead leading-relaxed text-fg-muted">{review.body}</p>
        </div>
        <ol className="flex flex-col">
          {steps.map((step, index) => (
            <li key={step.key} className="flex gap-3.5">
              <div className="flex flex-col items-center" aria-hidden="true">
                {step.state === "done" ? (
                  <span className="flex size-6 items-center justify-center rounded-full bg-action text-white">
                    <Icon name="check" size={12} strokeWidth={3.2} />
                  </span>
                ) : step.state === "current" ? (
                  <span className="size-6 rounded-full border-7 border-action" />
                ) : (
                  <span className="size-6 rounded-full border border-control-line-strong" />
                )}
                {index < steps.length - 1 ? (
                  <span className={step.state === "done" ? "w-px flex-1 bg-action" : "w-px flex-1 bg-control-line-strong"} />
                ) : null}
              </div>
              <div className="pb-5">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-fg">
                  {step.title}
                  <span className="sr-only">({status[step.state]})</span>
                  {step.state === "current" ? (
                    <span aria-hidden="true" className="rounded-full bg-status-pending-bg px-2.5 py-0.5 text-xs text-status-pending">
                      {review.now}
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-fg-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section aria-labelledby={dataTitleId} className="rounded-card border border-card-line bg-card p-6">
          <h3 id={dataTitleId} className="font-display text-xl font-bold text-fg">
            {review.dataTitle}
          </h3>
          <dl className="mt-3">
            {data.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-x-5 gap-y-0.5 border-t border-card-line py-3">
                <dt className="w-full font-medium text-fg sm:w-40">{row.label}</dt>
                <dd className="min-w-0 flex-1 text-fg-muted">{row.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-sm text-fg-muted">
            {review.fix}{" "}
            <a
              href={whatsappUrl(review.fixMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-fg underline underline-offset-4"
            >
              {review.fixCta}
            </a>{" "}
            {review.fixTail}
          </p>
        </section>

        <section aria-labelledby={meanwhileId} className="flex flex-wrap items-center justify-between gap-5 px-1">
          <div className="max-w-110">
            <h3 id={meanwhileId} className="font-display text-xl font-bold text-fg">
              {review.meanwhile.title}
            </h3>
            <p className="mt-1.5 leading-relaxed text-fg-muted">{review.meanwhile.body}</p>
          </div>
          <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="outline" size="48">
            {review.meanwhile.cta}
          </ButtonLink>
        </section>
      </div>
      {profile ? <AppPreview profile={profile} headingLevel="h3" /> : null}
    </div>
  );
}
