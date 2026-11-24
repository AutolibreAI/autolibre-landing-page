"use client";

import Link from "next/link";
import { useId } from "react";
import { PrivateFlowHead, PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { NextStepCard, SuccessHead } from "@/components/proveedores/flow/flow-result";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { siteContent } from "@/lib/content/site";
import type { RedeemFailureKind } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const content = partnerClaimContent;
const { form, about, invalidCode, success } = content;

const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

/**
 * "Sobre el código de reclamo": al costado del formulario en desktop y
 * debajo en celular (no empuja el código fuera de la primera pantalla).
 * Sirve también a quien llegó sin código: tiene a mano cómo pedirlo.
 */
export function ClaimAbout() {
  return (
    <aside
      aria-labelledby="reclamar-codigo-titulo"
      className="flex flex-col gap-5 rounded-3xl bg-canvas p-6 sm:p-7"
    >
      <h2 id="reclamar-codigo-titulo" className="font-display text-xl font-semibold text-fg">
        {about.title}
      </h2>
      <dl className="flex flex-col gap-4">
        {about.items.map((item) => (
          <div key={item.term} className="flex flex-col gap-1">
            <dt className="text-base font-semibold text-fg">{item.term}</dt>
            <dd className="text-base text-fg-muted">{item.description}</dd>
          </div>
        ))}
      </dl>
      <a
        href={whatsappUrl(about.whatsappMessage)}
        target="_blank"
        rel="noopener noreferrer"
        data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
        data-analytics-placement="reclamar_pedir_codigo"
        className="inline-flex h-12 items-center gap-2 self-start rounded-full border border-action bg-card px-6 font-display text-control font-semibold text-fg transition-colors hover:bg-brand-50 motion-reduce:transition-none"
      >
        <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
        {about.requestCta}
        <span className="sr-only"> {siteContent.nav.externalHint}</span>
      </a>
      <p className="text-sm text-fg-muted">
        {about.registerPrefix}{" "}
        <Link href={PROVEEDORES_REGISTRO_PATH} className={textLink}>
          {about.registerCta}
        </Link>
      </p>
    </aside>
  );
}

export type ClaimFormViewProps = {
  readonly code: string;
  readonly onCodeChange: (value: string) => void;
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  readonly submitting: boolean;
  /** Mensaje de error a la vista (local o del backend), o `null`. */
  readonly message: string | null;
  /** Motivo del backend, para la acción que acompaña al error. */
  readonly reason: RedeemFailureKind | null;
  readonly inputRef?: React.Ref<HTMLInputElement>;
  readonly messageRef?: React.Ref<HTMLDivElement>;
  /** Con qué cuenta queda vinculado (email o nombre). */
  readonly accountName: string | null;
  readonly onSwitchAccount: () => void;
  readonly onReauth: () => void;
  readonly switching: boolean;
};

/**
 * Formulario del canje (lienzos `Reclamar` y `ReclamarError`): encabezado,
 * código en píldora con el botón al lado, el error con las causas posibles y
 * con qué cuenta se vincula. Presentacional: el estado y el canje viven en
 * `ClaimForm`.
 */
export function ClaimFormView({
  code,
  onCodeChange,
  onSubmit,
  submitting,
  message,
  reason,
  inputRef,
  messageRef,
  accountName,
  onSwitchAccount,
  onReauth,
  switching,
}: ClaimFormViewProps) {
  const inputId = useId();
  const hintId = useId();
  const messageId = useId();
  const invalid = message !== null;

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-16">
      <div className="flex min-w-0 flex-col gap-8 lg:max-w-150 lg:flex-1">
        <PrivateFlowHead head={{ eyebrow: content.eyebrow, title: content.title, intro: content.intro }} />

        <form onSubmit={onSubmit} noValidate aria-labelledby={PRIVATE_FLOW_TITLE_ID} className="flex flex-col gap-2">
          <label htmlFor={inputId} className="text-label font-semibold text-fg">
            {form.label}
          </label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              ref={inputRef}
              id={inputId}
              name="code"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              placeholder={form.placeholder}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={invalid ? true : undefined}
              aria-describedby={invalid ? `${hintId} ${messageId}` : hintId}
              // 16px o más: menos dispara el zoom de iOS. Mayúsculas solo
              // visuales: el valor viaja tal cual (el backend normaliza).
              className={cn(
                "h-14 min-w-0 flex-1 rounded-full border bg-card px-6 font-mono text-lg tracking-widest text-fg uppercase transition-colors placeholder:text-fg-subtle hover:border-fg-muted focus-visible:border-action motion-reduce:transition-none",
                invalid ? "border-2 border-status-alert" : "border-control-line-strong",
              )}
            />
            <Button type="submit" variant="primary" size="56" disabled={submitting} aria-disabled={submitting}>
              {submitting ? form.submitting : form.submit}
            </Button>
          </div>
          <p id={hintId} className="text-label text-fg-muted">
            {form.hint}
          </p>

          {/* Región viva SIEMPRE montada: si apareciera junto con el mensaje,
              los lectores de pantalla no lo anunciarían (FR-017). */}
          <div aria-live="polite" aria-atomic="true">
            {message ? (
              <div
                ref={messageRef}
                tabIndex={-1}
                className="mt-3 flex flex-col items-start gap-2 rounded-2xl bg-alert-bg/50 p-5"
              >
                <p id={messageId} className="font-semibold text-status-alert">
                  {message}
                </p>
                {reason === "invalid-code" ? (
                  <>
                    <p className="text-base text-fg-muted">{invalidCode.causes}</p>
                    <a
                      href={whatsappUrl(invalidCode.whatsappMessage)}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                      data-analytics-placement="reclamar_codigo_nuevo"
                      className={cn(textLink, "inline-flex min-h-11 items-center gap-2")}
                    >
                      <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
                      {invalidCode.requestNew}
                      <span className="sr-only"> {siteContent.nav.externalHint}</span>
                    </a>
                  </>
                ) : null}
                {reason === "unauthenticated" ? (
                  <Button type="button" variant="outline" size="44" onClick={onReauth}>
                    {content.reauth}
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </form>

        {accountName ? (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-card-line pt-6 text-base text-fg-muted">
            <span>
              {content.linkedTo} <strong className="font-semibold text-fg">{accountName}</strong>
            </span>
            <button
              type="button"
              onClick={onSwitchAccount}
              disabled={switching}
              className={cn(textLink, "inline-flex min-h-11 items-center disabled:cursor-wait")}
            >
              {switching ? partnerAccountContent.flowHeader.signingOut : content.switchAccount}
            </button>
          </p>
        ) : null}
      </div>

      <div className="lg:w-112 lg:shrink-0">
        <ClaimAbout />
      </div>
    </div>
  );
}

/**
 * El canje salió (lienzo `ReclamarListo`): "¡Listo! Ya administrás {negocio}"
 * y los próximos pasos. Si vino de contratar un plan (`?next`), lo principal
 * es volver a esa contratación; si no, "Mi negocio" (`/cuenta`, supuesto de
 * DECISIONES) y elegir un plan.
 */
export function ClaimSuccessView({
  headingRef,
  partnerName,
  continueHref,
}: {
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
  readonly partnerName: string | null;
  readonly continueHref: string | null;
}) {
  return (
    <div className="mx-auto flex w-full max-w-160 flex-col gap-8">
      <SuccessHead
        headingRef={headingRef}
        title={partnerName ? success.title(partnerName) : success.titleWithoutName}
        body={success.body}
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-fg-muted">{partnerAccountContent.nextSteps}</p>
        {continueHref ? (
          <NextStepCard
            title={success.continueCheckout.title}
            body={success.continueCheckout.text}
            action={{ kind: "link", href: continueHref, label: success.continueCheckout.cta, primary: true }}
          />
        ) : null}
        <NextStepCard
          title={success.profile.title}
          body={success.profile.body}
          action={{
            kind: "link",
            href: accountContent.link.href,
            label: partnerAccountContent.myBusiness,
            primary: !continueHref,
          }}
        />
        {continueHref ? null : (
          <NextStepCard
            title={success.plans.title}
            body={success.plans.body}
            action={{ kind: "link", href: success.plans.href, label: success.plans.cta, primary: false }}
          />
        )}
      </div>
    </div>
  );
}
