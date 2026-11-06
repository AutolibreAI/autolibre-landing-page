"use client";

import { useId } from "react";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { partnerCheckoutContent } from "@/lib/content/partner-checkout";
import type { IconName } from "@/lib/content/types";
import { claimWithReturnHref, withReturnHref } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_RECLAMAR_PATH, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { noPartner } = partnerCheckoutContent;

const linkClass =
  "inline-flex min-h-11 items-center font-semibold text-brand-hover underline-offset-4 hover:underline";

/** Acción secundaria de una opción: contorno, chica, pero con los 44px de alto. */
const outlineActionClass = cn(buttonVariants({ variant: "outline", size: "sm" }), "min-h-11 self-start");

function RowIcon({ name }: { readonly name: IconName }) {
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted text-brand-hover"
    >
      <Icon name={name} size={20} strokeWidth={1.8} />
    </span>
  );
}

function Option({
  icon,
  title,
  body,
  children,
}: {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
  readonly children: React.ReactNode;
}) {
  return (
    <li className="flex gap-4 p-5 sm:p-6">
      <RowIcon name={icon} />
      <div className="flex min-w-0 flex-col gap-3">
        <div>
          <h3 className="font-display text-lg leading-snug font-bold text-ink">{title}</h3>
          <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{body}</p>
        </div>
        {children}
      </div>
    </li>
  );
}

type NoPartnerOptionsProps = {
  /** Foco al título cuando aparece (lo maneja quien lo monta). */
  readonly headingRef?: React.RefObject<HTMLHeadingElement | null>;
  /**
   * La contratación a la que se vuelve (`?next` del reclamo y del alta), con
   * su plan. `null` en `/cuenta`: no hay a dónde volver y los textos no
   * nombran un plan.
   */
  readonly checkout: { readonly returnPath: string; readonly planName: string } | null;
  /** `placement` de los WhatsApp (`whatsapp_clicked`). */
  readonly placementPrefix: string;
};

/**
 * Sin talleres como dueño: una lista de decisión con los cuatro casos reales.
 * Una sola tarjeta con filas (no cuatro tarjetas iguales): se lee como
 * "¿cuál es tu caso?" y no como un menú de productos. La usan la
 * contratación (`/proveedores/contratar`) y `/cuenta`.
 *
 * - Tengo código → reclamar (y volver a la contratación con `?next`).
 * - Ya aparece → WhatsApp, sin explicar el mecanismo de verificación.
 * - Registré y espero → solo se explica: no hay endpoint para ver la
 *   solicitud, y ofrecer "registrar" otra vez duplicaría la solicitud.
 * - No aparece → alta (con `?next` si hay contratación).
 */
export function NoPartnerOptions({ headingRef, checkout, placementPrefix }: NoPartnerOptionsProps) {
  const { haveCode, listedNoCode, pendingApproval, notListed } = noPartner.options;
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
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-surface">
        <Option icon="shield-check" title={haveCode.title} body={haveCode.body(planName)}>
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
        </Option>

        <Option icon="whatsapp" title={listedNoCode.title} body={listedNoCode.body(planName)}>
          <a
            href={whatsappUrl(listedNoCode.whatsappMessage(planName))}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement={`${placementPrefix}_ya_aparece`}
            className={outlineActionClass}
          >
            {listedNoCode.cta}
          </a>
        </Option>

        <Option icon="clock" title={pendingApproval.title} body={pendingApproval.body(planName)}>
          <a
            href={whatsappUrl(pendingApproval.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
            data-analytics-placement={`${placementPrefix}_solicitud_pendiente`}
            className={cn(linkClass, "-my-2 self-start")}
          >
            {pendingApproval.cta}
          </a>
        </Option>

        <Option icon="wrench" title={notListed.title} body={notListed.body(planName)}>
          {/* Directo al formulario (la persona ya tiene sesión); con `?next`
              el éxito del alta ofrece volver a la contratación. */}
          <ButtonLink
            href={
              checkout
                ? withReturnHref(PROVEEDORES_REGISTRO_PATH, checkout.returnPath)
                : PROVEEDORES_REGISTRO_PATH
            }
            prefetch={false}
            variant="outline"
            size="sm"
            className="min-h-11 self-start"
          >
            {notListed.cta}
          </ButtonLink>
        </Option>
      </ul>
    </div>
  );
}
