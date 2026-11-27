"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSignInRedirect } from "@/components/auth/use-sign-in-redirect";
import { PROVIDER_FORM_STEPS, ProviderForm } from "@/components/forms/provider-form";
import { ExistingBusiness } from "@/components/proveedores/registro/existing-business";
import { RegistrationStatus } from "@/components/proveedores/registro/registration-status";
import { fetchOwnerPartners } from "@/lib/partner-billing/client";
import { clearApplicationSent, hasSentApplication, markApplicationSent } from "@/lib/proveedores/application-hint";
import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { useFlowSignOut } from "@/components/proveedores/flow/use-flow-sign-out";
import { AltaLayout, AltaSkeleton } from "@/components/proveedores/registro/alta-layout";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { buildSignInHref } from "@/lib/auth/sign-in-redirect";
import { planDisplayName } from "@/lib/content/partner-checkout";
import { providersContent } from "@/lib/content/providers";
import { parsePlanParam } from "@/lib/partner-billing/checkout";
import { safeContinuePath, withReturnHref } from "@/lib/partner-billing/return-path";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_REGISTRO_ALTA_PATH,
  PROVEEDORES_REGISTRO_ANOTHER_PARAM,
  PROVEEDORES_REGISTRO_PATH,
  resolveAltaEntry,
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

/**
 * `/proveedores/registro?alta=1`, con el `?next` de la contratación si lo hay
 * y `&otro=1` si la persona pidió cargar un negocio más (así la intención
 * sobrevive a la vuelta por `/ingresar` cuando la sesión venció).
 */
function flowPath(checkout: { readonly href: string } | null, another: boolean): string {
  const base = checkout
    ? `${withReturnHref(PROVEEDORES_REGISTRO_PATH, checkout.href)}&alta=1`
    : PROVEEDORES_REGISTRO_ALTA_PATH;
  return another ? `${base}&${PROVEEDORES_REGISTRO_ANOTHER_PARAM}=1` : base;
}

/**
 * El flujo del alta (lienzos `IngresarNegocio` y `Alta`), dentro del
 * `ScopedClerkProvider` que monta `RegistroFlow` recién cuando la persona
 * abre el flujo (la landing no carga Clerk). Pantalla de foco (`FlowShell`)
 * con el formulario en pasos, que manda el token de Clerk en cada envío.
 *
 * El login es `/ingresar?redirect=<esta URL>`: los CTA de la landing ya
 * linkean ahí (con sesión, `proxy.ts` devuelve directo al alta). `proxy.ts`
 * NO corre en esta ruta (la landing es pública e indexable), así que si
 * alguien abre `?alta=1` sin sesión, `useSignInRedirect` lo manda a
 * `/ingresar` mientras se ve el esqueleto.
 *
 * Una vez que el formulario apareció, NO se desmonta aunque Clerk pase a "sin
 * sesión" (la sesión venció o se cerró en otra pestaña): desmontarlo borraría
 * todo lo escrito. En ese caso `getToken` no da token, el envío no sale (nunca
 * se manda anónimo) y el formulario pide volver a entrar en otra pestaña.
 */
/**
 * Qué ve una cuenta con sesión al abrir el alta, antes de tocar nada:
 * - `checking`: se consulta `GET /partners/me/memberships`.
 * - `existing`: ya es dueña de un negocio aprobado → se lo mostramos.
 * - `pending`: mandó una solicitud que todavía no se aprobó (pista local) →
 *   "en revisión", también después de un refresh.
 * - `form`: el formulario. Si la consulta falla, se cae acá: nunca bloquea.
 *
 * Con `&otro=1` ("Cargar otro taller" de `/cuenta`) se entra directo en
 * `form`, sin consultar: la persona ya dijo que quiere cargar un negocio más
 * (`resolveAltaEntry`).
 */
type Entry =
  | { readonly kind: "checking" }
  | { readonly kind: "existing"; readonly names: readonly string[] }
  | { readonly kind: "pending" }
  | { readonly kind: "form" };

export function RegisterFormGate({ serviceFamilies, next }: RegisterFormGateProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const session = useFlowSignOut();
  const [formShown, setFormShown] = useState(false);
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  // Intención explícita de cargar OTRO negocio: `&otro=1` en la URL o, después,
  // "Registrar otro negocio" de la vista de negocios existentes.
  const [another, setAnother] = useState(useSearchParams().has(PROVEEDORES_REGISTRO_ANOTHER_PARAM));
  const [entry, setEntry] = useState<Entry>(another ? { kind: "form" } : { kind: "checking" });
  const checkout = checkoutFromNext(next);
  const returnPath = flowPath(checkout, another);
  const userId = user?.id ?? null;

  // Estado derivado en el render (patrón de React para "recordar" un valor
  // previo): sin efecto ni render extra.
  if (isSignedIn && !formShown) setFormShown(true);

  // Una sola consulta por cuenta: la membresía manda sobre la pista local.
  useEffect(() => {
    if (!isSignedIn || !userId || another) return;
    let cancelled = false;
    void fetchOwnerPartners(getToken).then((result) => {
      if (cancelled) return;
      const owners = result.kind === "ok" ? result.owners : [];
      const kind = resolveAltaEntry({
        another: false,
        ownsBusiness: owners.length > 0,
        applicationSent: hasSentApplication(userId),
      });
      if (kind === "existing") {
        clearApplicationSent(userId);
        setEntry({ kind, names: owners.map((owner) => owner.name) });
        return;
      }
      setEntry({ kind });
    });
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, userId, getToken, another]);

  useSignInRedirect(isLoaded && !isSignedIn && !formShown, returnPath);

  if (!formShown && !isSignedIn) {
    return (
      <FlowShell helpMessage={flow.help.whatsappMessage} helpPlacement="registro_encabezado">
        <FlowMain>
          <AltaSkeleton />
        </FlowMain>
      </FlowShell>
    );
  }

  const signOut = isSignedIn ? { onClick: () => void session.leave(PROVEEDORES_REGISTRO_PATH), pending: session.pending } : null;

  // Con sesión, antes del formulario: ¿ya tiene negocio o una solicitud en revisión?
  // Solo mientras no empezó a cargar el formulario (`entry` pasa a `form`).
  if (isSignedIn && entry.kind !== "form" && !done) {
    return (
      <FlowShell helpMessage={flow.help.whatsappMessage} helpPlacement="registro_encabezado" signOut={signOut}>
        <FlowMain>
          {entry.kind === "checking" ? (
            // Esqueleto con la grilla del formulario (lo más común que sigue).
            <AltaSkeleton />
          ) : entry.kind === "existing" ? (
            <ExistingBusiness
              names={entry.names}
              checkout={checkout}
              onRegisterAnother={() => {
                setAnother(true);
                setEntry({ kind: "form" });
              }}
            />
          ) : (
            <RegistrationStatus alreadyRegisteredMessage={flow.pendingBody} checkout={checkout} />
          )}
        </FlowMain>
      </FlowShell>
    );
  }

  return (
    <FlowShell
      helpMessage={flow.help.whatsappMessage}
      helpPlacement="registro_encabezado"
      progress={{ current: done ? PROVIDER_FORM_STEPS : step + 1, total: PROVIDER_FORM_STEPS }}
      signOut={signOut}
    >
      <FlowMain>
        <AltaLayout
          step={step}
          totalSteps={PROVIDER_FORM_STEPS}
          done={done}
          accountName={user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? null}
          // Otra cuenta = sin la intención "otro negocio": se vuelve a chequear qué tiene.
          onSwitchAccount={() => void session.leave(buildSignInHref(flowPath(checkout, false)))}
          switching={session.pending}
        >
          <ProviderForm
            serviceFamilies={serviceFamilies}
            getToken={getToken}
            reauthHref={buildSignInHref(returnPath)}
            checkout={checkout}
            step={step}
            onStepChange={setStep}
            onDone={() => {
              if (userId) markApplicationSent(userId);
              setDone(true);
            }}
          />
        </AltaLayout>
      </FlowMain>
    </FlowShell>
  );
}
