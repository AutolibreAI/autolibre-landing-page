"use client";

import { useId } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import { claimWithReturnHref } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";

const { noPartner } = partnerCheckoutContent;
const { haveCode } = noPartner;

type NoPartnerOptionsProps = {
  /** Foco al título cuando aparece (lo maneja quien lo monta). */
  readonly headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /**
   * La contratación a la que se vuelve (`?next` del reclamo), con su plan.
   * `null` en `/cuenta`: no hay a dónde volver y el texto no nombra un plan.
   */
  readonly checkout: { readonly returnPath: string; readonly planName: string } | null;
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
export function NoPartnerOptions({ headingRef, checkout }: NoPartnerOptionsProps) {
  const titleId = useId();
  const planName = checkout?.planName ?? null;

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
