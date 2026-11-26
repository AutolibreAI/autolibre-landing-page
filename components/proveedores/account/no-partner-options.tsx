"use client";

import { useId } from "react";
import { ButtonLink } from "@/components/ui/button";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { Icon } from "@/components/ui/icon";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import { claimWithReturnHref } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_RECLAMAR_PATH, PROVEEDORES_REGISTRO_ALTA_PATH } from "@/lib/proveedores/query";

const { noPartner } = partnerCheckoutContent;
const { haveCode, account } = noPartner;

type NoPartnerOptionsProps = {
  /** Foco al título cuando aparece (lo maneja quien lo monta). */
  readonly headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /**
   * La contratación a la que se vuelve (`?next` del reclamo), con su plan.
   * `null` en `/cuenta`: no hay a dónde volver y el texto no nombra un plan.
   */
  readonly checkout: { readonly returnPath: string; readonly planName: string } | null;
  /**
   * `/cuenta` de una cuenta de proveedor sin negocio (registro 2026-11-24):
   * las dos salidas, "Registrar mi negocio" y "Canjear mi código", con copy
   * de "tu negocio". La contratación no lo pasa y sigue con el código solo.
   */
  readonly withRegister?: boolean;
};

/**
 * Sin talleres como dueño: un solo camino, canjear el código de reclamo (y
 * volver a la contratación con `?next`). La usan la contratación
 * (`/proveedores/contratar`) y `/cuenta`.
 *
 * Antes listaba cuatro casos ("ya aparece", "espero la aprobación", "no
 * aparece"); se sacaron el 2026-11-06 por decisión de producto: hacían ruido
 * y confundían.
 */
export function NoPartnerOptions({ headingRef, checkout, withRegister = false }: NoPartnerOptionsProps) {
  const titleId = useId();
  const planName = checkout?.planName ?? null;

  if (withRegister) {
    return (
      <div role="group" aria-labelledby={titleId} className="flex flex-col gap-4">
        <div>
          <h2 id={titleId} ref={headingRef} tabIndex={-1} className="font-display text-xl leading-7 font-bold text-fg">
            {account.title}
          </h2>
          <p className="mt-1 text-base text-fg-muted">{account.body}</p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          <OptionCard
            icon="plus"
            title={account.register.title}
            body={account.register.body}
            cta={account.register.cta}
            href={PROVEEDORES_REGISTRO_ALTA_PATH}
            primary
            analytics={{ event: ANALYTICS_EVENTS.partnerRegisterStarted, placement: "cuenta_onboarding_registrar" }}
          />
          <OptionCard
            icon="shield-check"
            title={account.claim.title}
            body={account.claim.body}
            cta={account.claim.cta}
            href={PROVEEDORES_RECLAMAR_PATH}
            analytics={{ event: ANALYTICS_EVENTS.partnerClaimStarted, placement: "cuenta_onboarding_reclamar" }}
          />
        </ul>
      </div>
    );
  }

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-5">
      <div>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
          {noPartner.title}
        </h2>
        <p className="mt-2 text-ink/70">{noPartner.body}</p>
      </div>
      <div className="flex gap-4 rounded-card border border-line bg-surface p-5 sm:p-6">
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
        >
          <Icon name="shield-check" size={20} strokeWidth={1.8} />
        </span>
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h3 className="font-display text-lg leading-snug font-bold text-ink">{haveCode.title}</h3>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{haveCode.body(planName)}</p>
          </div>
          {/* Sin prefetch: el reclamo es otra pantalla privada con su Clerk. */}
          <ButtonLink
            href={
              checkout ? claimWithReturnHref(PROVEEDORES_RECLAMAR_PATH, checkout.returnPath) : PROVEEDORES_RECLAMAR_PATH
            }
            prefetch={false}
            size="sm"
            className="min-h-11 self-start"
          >
            {haveCode.cta}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/**
 * Tarjeta de una salida de "Sumá tu negocio" (`/cuenta`, sistema AutoLibre
 * AI): ícono y título en una línea, la bajada y la acción. Compacta: las dos
 * salidas entran juntas en la primera pantalla.
 */
function OptionCard({
  icon,
  title,
  body,
  cta,
  href,
  primary = false,
  analytics,
}: {
  readonly icon: "plus" | "shield-check";
  readonly title: string;
  readonly body: string;
  readonly cta: string;
  readonly href: string;
  readonly primary?: boolean;
  readonly analytics: { readonly event: string; readonly placement: string };
}) {
  return (
    <li className="flex flex-col items-start gap-3 rounded-card border border-card-line bg-card p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-canvas text-fg">
          <Icon name={icon} size={20} strokeWidth={1.8} />
        </span>
        <h3 className="font-display text-lg leading-snug font-bold text-fg">{title}</h3>
      </div>
      <p className="flex-1 text-base text-fg-muted">{body}</p>
      {/* Sin prefetch: el alta y el reclamo son pantallas privadas con su Clerk. */}
      <ButtonLink
        href={href}
        prefetch={false}
        variant={primary ? "primary" : "outline"}
        size="44"
        data-analytics-event={analytics.event}
        data-analytics-placement={analytics.placement}
      >
        {cta}
      </ButtonLink>
    </li>
  );
}
