"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { accountContent } from "@/lib/content/account";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";
import { whatsappUrl } from "@/lib/whatsapp";

const { success } = providersContent.form;

/** Índice del paso "En revisión" en `success.timeline.steps`. */
const IN_REVIEW = 1;

type RegistrationStatusProps = {
  /**
   * Mensaje del backend cuando la solicitud ya existía (409 de la ruta). Se
   * muestra como lo que es: la misma solicitud, en revisión.
   */
  readonly alreadyRegisteredMessage: string | null;
  /** La contratación de la que vino la persona (`?next` ya validado), con su plan. */
  readonly checkout: { readonly href: string; readonly planName: string } | null;
};

/**
 * Lo que ve el taller después de enviar el alta: una pantalla de ESTADO, no
 * un "gracias" con un botón al inicio. Línea de tiempo de tres pasos
 * (enviada ✓ → en revisión, ahora → publicada), qué pasa ahora, y qué puede
 * hacer mientras tanto (planes, o volver a la contratación si vino de ahí).
 *
 * El 409 "ya te teníamos anotado" usa la misma pantalla: la solicitud existe
 * y alguien la va a mirar. Mostrarlo como error haría que la persona
 * reintente o piense que el sitio no anda.
 *
 * El foco va al título al aparecer: reemplaza al formulario entero y el
 * lector de pantalla tiene que arrancar desde acá.
 */
export function RegistrationStatus({ alreadyRegisteredMessage, checkout }: RegistrationStatusProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col gap-8 rounded-card bg-surface p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand-hover"
        >
          <Icon name="check" size={24} strokeWidth={2} />
        </span>
        <div className="flex flex-col gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-ink">
            {alreadyRegisteredMessage ? success.alreadyRegisteredTitle : success.title}
          </h2>
          <p className="text-ink/72">{alreadyRegisteredMessage ?? success.description}</p>
        </div>
      </div>

      <FlowSteps
        orientation="vertical"
        label={success.timeline.label}
        steps={success.timeline.steps}
        current={IN_REVIEW}
        currentBadge={success.timeline.currentBadge}
      />

      <div className="flex flex-col gap-4 border-t border-line pt-6">
        <h3 className="font-display text-lg font-bold text-ink">{success.nextTitle}</h3>
        {checkout ? (
          <>
            <p className="text-[0.9375rem] leading-relaxed text-ink/72">{success.checkout.body(checkout.planName)}</p>
            {/* Sin prefetch: la contratación es otra pantalla privada. */}
            <ButtonLink href={checkout.href} prefetch={false} variant="outline" className="min-h-11 self-start">
              {success.checkout.cta(checkout.planName)}
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="text-[0.9375rem] leading-relaxed text-ink/72">{success.plans.body}</p>
            <ButtonLink href={PROVEEDORES_PLANES_PATH} className="min-h-11 self-start">
              {success.plans.cta}
            </ButtonLink>
          </>
        )}
        <a
          href={whatsappUrl(success.help.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
          data-analytics-placement="registro_enviado"
          className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          <Icon name="whatsapp" size={18} strokeWidth={1.8} />
          {success.help.label}
        </a>
        {/* Sin prefetch: `/cuenta` es otra pantalla privada con su Clerk. */}
        <Link
          href={accountContent.link.href}
          prefetch={false}
          className="-mt-3 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          <Icon name="user" size={18} strokeWidth={1.8} />
          {accountContent.link.label}
        </Link>
      </div>
    </div>
  );
}
