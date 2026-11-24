"use client";

import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { NextStepCard, StepActionButton, SuccessHead, type StepAction } from "@/components/proveedores/flow/flow-result";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import { siteContent } from "@/lib/content/site";
import { whatsappUrl } from "@/lib/whatsapp";

const { result: content } = partnerCheckoutContent;

/** Atributos de medición del WhatsApp de ayuda del resultado. */
const helpAnalytics = {
  "data-analytics-event": ANALYTICS_EVENTS.whatsappClicked,
  "data-analytics-placement": "contratar_resultado",
} as const;

/** Columna centrada de 640px de los estados del resultado. */
function ResultColumn({ children }: { readonly children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-160 flex-col gap-8">{children}</div>;
}

/** "Escribinos por WhatsApp" como link de texto. */
function HelpLink() {
  return (
    <a
      href={whatsappUrl(content.help.whatsappMessage)}
      target="_blank"
      rel="noopener noreferrer"
      {...helpAnalytics}
      className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none"
    >
      <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
      {content.help.label}
      <span className="sr-only"> {siteContent.nav.externalHint}</span>
    </a>
  );
}

/**
 * "Estamos confirmando tu pago" (lienzo `ContratarConfirmando`): el spinner
 * gira solo sin `prefers-reduced-motion`; el texto dice lo mismo sin él.
 */
export function CheckingView() {
  return (
    <div className="mx-auto flex max-w-160 flex-col items-center gap-4 text-center">
      <span aria-hidden="true" className="text-fg">
        <Icon name="spinner" size={52} strokeWidth={1.6} className="motion-safe:animate-spin" />
      </span>
      <h1
        id={PRIVATE_FLOW_TITLE_ID}
        tabIndex={-1}
        className="font-display text-4xl font-bold tracking-tight text-balance text-fg md:text-5xl"
      >
        {content.checking.title}
      </h1>
      <p className="text-lead text-fg-muted md:text-lead-lg">{content.checking.body}</p>
    </div>
  );
}

/**
 * El backend confirmó el plan (lienzo `ContratarListo`). Próximos pasos:
 * "Mi negocio" (`/cuenta`, supuesto de DECISIONES) para completar el perfil,
 * y WhatsApp si hay dudas.
 */
export function ConfirmedView({
  headingRef,
  planName,
  trialEnd,
}: {
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
  readonly planName: string | null;
  readonly trialEnd: string | null;
}) {
  const { confirmed } = content;
  return (
    <ResultColumn>
      <SuccessHead
        headingRef={headingRef}
        title={planName ? confirmed.title(planName) : confirmed.titleWithoutName}
        body={trialEnd ? confirmed.trialUntil(trialEnd) : undefined}
      />
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold text-fg-muted">{confirmed.nextTitle}</p>
        <NextStepCard
          title={confirmed.next.profile.title}
          body={confirmed.next.profile.body}
          action={{ kind: "link", href: accountContent.link.href, label: partnerAccountContent.myBusiness, primary: true }}
        />
        <NextStepCard
          title={confirmed.next.help.title}
          body={confirmed.next.help.body}
          action={{
            kind: "external",
            href: whatsappUrl(content.help.whatsappMessage),
            label: confirmed.next.help.cta,
            primary: false,
            analytics: helpAnalytics,
            icon: "chat",
          }}
        />
      </div>
    </ResultColumn>
  );
}

/**
 * `pending` después de 30 s (lienzo `ContratarPendiente`): puede ser un pago
 * que MP todavía no avisó o un checkout abandonado (no vence). La pantalla
 * no sabe cuál, así que les habla a los dos con una acción cada uno.
 */
export function PendingView({
  headingRef,
  retryHref,
  onCheckAgain,
}: {
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
  readonly retryHref: string | null;
  readonly onCheckAgain: () => void;
}) {
  const { pendingTimeout } = content;
  const cards: ReadonlyArray<{ title: string; body: string; action: StepAction }> = [
    {
      title: pendingTimeout.paid.title,
      body: pendingTimeout.paid.body,
      action: { kind: "button", onClick: onCheckAgain, label: pendingTimeout.paid.cta, primary: true },
    },
    {
      title: pendingTimeout.notPaid.title,
      body: pendingTimeout.notPaid.body,
      action: {
        kind: "link",
        href: retryHref ?? content.plansLink.href,
        label: retryHref ? pendingTimeout.notPaid.cta : pendingTimeout.choosePlan,
        primary: false,
      },
    },
  ];

  return (
    <ResultColumn>
      <SuccessHead headingRef={headingRef} title={pendingTimeout.title} body={pendingTimeout.body} icon="none" />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <div key={card.title} className="flex flex-col gap-4 rounded-2xl border border-card-line bg-card p-5 sm:p-6">
            <div className="flex flex-1 flex-col gap-1">
              <h2 className="font-display text-lg font-semibold text-fg">{card.title}</h2>
              <p className="text-base text-fg-muted">{card.body}</p>
            </div>
            <StepActionButton action={card.action} block />
          </div>
        ))}
      </div>
      <HelpLink />
    </ResultColumn>
  );
}

/**
 * Los demás finales (sin pago registrado, sin confirmar, sin contratación en
 * curso, error al consultar): título, texto, una acción y la ayuda.
 */
export function MessageView({
  headingRef,
  title,
  body,
  action,
  showHelp = true,
}: {
  readonly headingRef?: React.Ref<HTMLHeadingElement>;
  readonly title: string;
  readonly body: string;
  readonly action: StepAction | null;
  readonly showHelp?: boolean;
}) {
  return (
    <ResultColumn>
      <SuccessHead headingRef={headingRef} title={title} body={body} icon="none" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
        {action ? <StepActionButton action={action} /> : null}
        {showHelp ? <HelpLink /> : null}
      </div>
    </ResultColumn>
  );
}
