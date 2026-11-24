"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState } from "react";
import { PROVIDER_FORM_STEPS, ProviderForm } from "@/components/forms/provider-form";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { FlowSteps } from "@/components/proveedores/flow/flow-steps";
import { useFlowSignOut } from "@/components/proveedores/flow/use-flow-sign-out";
import { AltaLayout } from "@/components/proveedores/registro/alta-layout";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { planDisplayName } from "@/lib/content/partner-checkout";
import { providersContent } from "@/lib/content/providers";
import { parsePlanParam } from "@/lib/partner-billing/checkout";
import { safeContinuePath, withReturnHref } from "@/lib/partner-billing/return-path";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_REGISTRO_ALTA_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

const { flow } = providersContent;

type RegisterFormGateProps = {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  /** `?next=` tal cual vino en la URL (se valida acá). */
  readonly next: string | null;
};

/** Origen ficticio para leer la query de una ruta relativa ya validada. */
const PLACEHOLDER_ORIGIN = "https://autolibre.invalid";

/**
 * `?next=` del alta: la contratación de la que vino la persona (desde el
 * panel "sin taller" de `/proveedores/contratar`). Se valida igual que en el
 * reclamo (solo rutas bajo `/proveedores/contratar`, research D10) y se
 * descarta si no trae un plan pago reconocible.
 */
function checkoutFromNext(raw: string | null): { readonly href: string; readonly planName: string } | null {
  const href = safeContinuePath(raw ?? undefined, PROVEEDORES_CONTRATAR_PATH);
  if (!href) return null;
  const planCode = parsePlanParam(new URL(href, PLACEHOLDER_ORIGIN).searchParams.get("plan") ?? undefined);
  const planName = planCode ? planDisplayName(planCode) : null;
  return planName ? { href, planName } : null;
}

/** `/proveedores/registro?alta=1`, con el `?next` de la contratación si lo hay. */
function flowPath(checkout: { readonly href: string } | null): string {
  return checkout ? `${withReturnHref(PROVEEDORES_REGISTRO_PATH, checkout.href)}&alta=1` : PROVEEDORES_REGISTRO_ALTA_PATH;
}

/**
 * El flujo del alta (lienzos `IngresarNegocio` y `Alta`), dentro del
 * `ScopedClerkProvider` que monta `RegistroFlow` recién cuando la persona
 * abre el flujo (la landing no carga Clerk). Pantalla de foco (`FlowShell`):
 * sin sesión, los tres pasos y el panel "Ingresá o creá tu cuenta" (vuelta
 * forzada a esta URL); con sesión, el formulario en pasos, que manda el
 * token de Clerk en cada envío.
 *
 * Una vez que el formulario apareció, NO se desmonta aunque Clerk pase a "sin
 * sesión" (la sesión venció o se cerró en otra pestaña): desmontarlo borraría
 * todo lo escrito. En ese caso `getToken` no da token, el envío no sale (nunca
 * se manda anónimo) y el formulario pide volver a entrar en otra pestaña.
 */
export function RegisterFormGate({ serviceFamilies, next }: RegisterFormGateProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const session = useFlowSignOut();
  const [formShown, setFormShown] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const checkout = checkoutFromNext(next);
  const returnPath = flowPath(checkout);

  // Estado derivado en el render (patrón de React para "recordar" un valor
  // previo): sin efecto ni render extra.
  if (isSignedIn && !formShown) setFormShown(true);

  if (!formShown && !isSignedIn) {
    return (
      <FlowShell helpMessage={flow.help.whatsappMessage} helpPlacement="registro_encabezado">
        <FlowMain>
          <PartnerSignIn
            intro={flow.signInIntro}
            showJoin={false}
            redirectUrl={returnPath}
            loading={!isLoaded}
            context={
              <FlowSteps label={flow.signInSteps.label} steps={flow.signInSteps.items} current={0} className="flex-wrap" />
            }
          />
        </FlowMain>
      </FlowShell>
    );
  }

  return (
    <FlowShell
      helpMessage={flow.help.whatsappMessage}
      helpPlacement="registro_encabezado"
      progress={{ current: done ? PROVIDER_FORM_STEPS : step + 1, total: PROVIDER_FORM_STEPS }}
      signOut={isSignedIn ? { onClick: () => void session.leave(PROVEEDORES_REGISTRO_PATH), pending: session.pending } : null}
    >
      <FlowMain>
        <AltaLayout
          step={step}
          totalSteps={PROVIDER_FORM_STEPS}
          done={done}
          accountName={user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? null}
          onSwitchAccount={() => void session.leave(returnPath)}
          switching={session.pending}
        >
          <ProviderForm
            serviceFamilies={serviceFamilies}
            getToken={getToken}
            reauthHref={returnPath}
            checkout={checkout}
            step={step}
            onStepChange={setStep}
            onDone={() => setDone(true)}
          />
        </AltaLayout>
      </FlowMain>
    </FlowShell>
  );
}
