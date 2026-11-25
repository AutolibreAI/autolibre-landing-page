"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { CustomerAccount } from "@/components/cuenta/customer-account";
import { NoPartnerOptions } from "@/components/proveedores/account/no-partner-options";
import { PrivateFlowHead, PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { RegistrationStatus } from "@/components/proveedores/registro/registration-status";
import { providersContent } from "@/lib/content/providers";
import { hasSentApplication } from "@/lib/proveedores/application-hint";
import { SignupIntentChoice } from "@/components/proveedores/account/signup-intent-choice";
import { ANALYTICS_EVENTS, SIGNUP_INTENT_PLACEMENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { setPendingSignupIntent } from "@/lib/auth/pending-signup-intent";
import { SIGNUP_INTENTS, type SignupIntent } from "@/lib/auth/signup-intent";
import { accountContent } from "@/lib/content/account";

const { onboarding, newAccount } = accountContent;

/** Qué ve en `/cuenta` una cuenta SIN negocios (la membresía siempre manda). */
export type NoBusinessView = "partner" | "customer" | "choose";

/**
 * - Intent `partner` (guardado o pendiente) ⇒ `partner`: sumar el negocio.
 * - Sin intent, cuenta de menos de 30 minutos ⇒ `choose`: entró por
 *   "Ingresar" con Google o un email nuevo y nunca eligió.
 * - El resto (intent `customer`, o cuenta vieja sin intent) ⇒ `customer`.
 */
export function noBusinessView(intent: SignupIntent | null, recentAccount: boolean): NoBusinessView {
  if (intent === SIGNUP_INTENTS.partner) return "partner";
  if (intent === null && recentAccount) return "choose";
  return "customer";
}

type NoBusinessAccountProps = {
  readonly view: NoBusinessView;
  readonly firstName: string | null;
  /** "Sesión iniciada como…" (`AccountBar`). */
  readonly footer: React.ReactNode;
};

/**
 * `/cuenta` con sesión y sin negocios: el onboarding de proveedor, la cuenta
 * de cliente o, en una cuenta recién creada sin elección, la pregunta
 * "¿Cómo vas a usar AutoLibre?". Al elegir, el intent queda pendiente
 * (`SignupIntentSync` lo guarda) y la pantalla cambia en el momento.
 */
export function NoBusinessAccount({ view, firstName, footer }: NoBusinessAccountProps) {
  const chose = useRef(false);
  const { user } = useUser();
  const userId = user?.id ?? null;
  // Solicitud de alta enviada desde este navegador y todavía sin aprobar
  // (pista local: el backend no expone el estado de la solicitud). Se lee
  // después de montar para no depender de `localStorage` en el render.
  const [applicationSent, setApplicationSent] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- `localStorage` existe recién en el browser.
    setApplicationSent(userId ? hasSentApplication(userId) : false);
  }, [userId]);

  // Después de elegir, el foco va al `<h1>` de la pantalla nueva.
  useEffect(() => {
    if (view === "choose" || !chose.current) return;
    chose.current = false;
    document.getElementById(PRIVATE_FLOW_TITLE_ID)?.focus();
  }, [view]);

  if (view === "customer") return <CustomerAccount firstName={firstName} footer={footer} />;

  if (view === "partner" && applicationSent) {
    return (
      <div className="flex max-w-180 flex-col gap-8">
        <RegistrationStatus alreadyRegisteredMessage={providersContent.flow.pendingBody} checkout={null} />
        {footer}
      </div>
    );
  }

  if (view === "partner") {
    return (
      <div className="flex max-w-180 flex-col gap-8">
        <PrivateFlowHead head={onboarding} />
        <NoPartnerOptions checkout={null} withRegister />
        {footer}
      </div>
    );
  }

  return (
    <div className="flex max-w-140 flex-col gap-8">
      <PrivateFlowHead head={{ eyebrow: newAccount.eyebrow, title: newAccount.title, intro: newAccount.intro }} />
      <SignupIntentChoice
        submitLabel={newAccount.save}
        onSubmit={(intent) => {
          chose.current = true;
          track(ANALYTICS_EVENTS.signupIntentSelected, { intent, placement: SIGNUP_INTENT_PLACEMENTS.accountNew });
          setPendingSignupIntent(intent);
        }}
      />
      {footer}
    </div>
  );
}
