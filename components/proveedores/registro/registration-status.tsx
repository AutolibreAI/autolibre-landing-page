"use client";

import { useEffect, useRef } from "react";
import { SuccessHead } from "@/components/proveedores/flow/flow-result";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { providersContent } from "@/lib/content/providers";
import { siteContent } from "@/lib/content/site";
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
 * Lo que ve el negocio después de enviar el alta (lienzo `Alta`, paso
 * "Enviado"): una pantalla de ESTADO, no un "gracias" con un botón al inicio.
 * Línea de tiempo de tres pasos (enviada ✓ → en revisión, ahora →
 * publicada) y qué puede hacer mientras tanto (precios, o volver a la
 * contratación si vino de ahí).
 *
 * El 409 "ya te teníamos anotado" usa la misma pantalla: la solicitud existe
 * y alguien la va a mirar. Mostrarlo como error haría que la persona
 * reintente o piense que el sitio no anda.
 *
 * El `<h1>` es el de la pantalla (el del paso se fue con el formulario). El
 * foco va al título al aparecer: el lector de pantalla arranca desde acá.
 */
export function RegistrationStatus({ alreadyRegisteredMessage, checkout }: RegistrationStatusProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    // 640px como máximo: también se ve suelta (refresh con la solicitud en
    // revisión), fuera de la columna del alta, y a lo ancho se desarma.
    <div className="flex max-w-160 flex-col gap-6">
      <SuccessHead
        headingRef={headingRef}
        title={alreadyRegisteredMessage ? success.alreadyRegisteredTitle : success.title}
        body={alreadyRegisteredMessage ?? success.description}
      />

      <section aria-labelledby="alta-estado" className="flex flex-col gap-4 rounded-2xl bg-canvas p-5 sm:p-6">
        <h2 id="alta-estado" className="text-sm font-semibold text-fg">
          {success.timeline.label}
        </h2>
        <FlowSteps
          orientation="vertical"
          label={success.timeline.label}
          steps={success.timeline.steps}
          current={IN_REVIEW}
          currentBadge={success.timeline.currentBadge}
        />
      </section>

      <section aria-labelledby="alta-mientras" className="flex flex-col gap-3">
        <h2 id="alta-mientras" className="font-display text-lg font-semibold text-fg">
          {success.nextTitle}
        </h2>
        {checkout ? (
          <>
            <p className="text-base text-fg-muted">{success.checkout.body(checkout.planName)}</p>
            {/* Sin prefetch: la contratación es otra pantalla privada. */}
            <ButtonLink href={checkout.href} prefetch={false} variant="primary" size="48" className="self-start">
              {success.checkout.cta(checkout.planName)}
            </ButtonLink>
          </>
        ) : (
          <>
            <p className="text-base text-fg-muted">{success.plans.body}</p>
            <ButtonLink href={PROVEEDORES_PLANES_PATH} variant="primary" size="48" className="self-start">
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
          className="inline-flex min-h-11 items-center gap-2 self-start font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none"
        >
          <Icon name="chat" size={18} strokeWidth={1.8} className="text-brand-hover" />
          {success.help.label}
          <span className="sr-only"> {siteContent.nav.externalHint}</span>
        </a>
      </section>
    </div>
  );
}
