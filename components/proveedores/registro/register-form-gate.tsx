"use client";

import { useAuth } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { ProviderForm } from "@/components/forms/provider-form";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead, type PrivateFlowHeadContent } from "@/components/proveedores/account/private-flow";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { planDisplayName } from "@/lib/content/partner-checkout";
import { parsePlanParam } from "@/lib/partner-billing/checkout";
import { safeContinuePath, withReturnHref } from "@/lib/partner-billing/return-path";
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";

type RegisterFormGateProps = {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  /** Esta misma URL: vuelta del login y link para volver a entrar. */
  readonly selfPath: string;
  /** Encabezado de la página (el `<h1>` lo pinta la isla). */
  readonly head: PrivateFlowHeadContent;
  /** Contexto del login: los pasos del registro. */
  readonly context: React.ReactNode;
};

/** Origen ficticio para leer la query de una ruta relativa ya validada. */
const PLACEHOLDER_ORIGIN = "https://autolibre.invalid";

/**
 * `?next=` del formulario: la contratación de la que vino la persona (desde
 * el panel "sin taller" de `/proveedores/contratar`). Se valida igual que en
 * el reclamo (solo rutas bajo `/proveedores/contratar`, research D10) y se
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
 * Isla client de `/proveedores/registro/formulario` (spec 212, US3). Sin
 * sesión muestra el login compartido (dos columnas: los pasos del registro
 * y la tarjeta de login; vuelta forzada a esta URL con su `?next`); con
 * sesión, la fila de sesión y el formulario de alta, que manda el token de
 * Clerk en cada envío.
 *
 * Lee `?next` con `useSearchParams`: la página es estática (ISR), así que la
 * isla va adentro de un `<Suspense>` (ver la página).
 *
 * Una vez que el formulario apareció, NO se desmonta aunque Clerk pase a "sin
 * sesión" (la sesión venció o se cerró en otra pestaña): desmontarlo borraría
 * todo lo escrito. En ese caso `getToken` no da token, el envío no sale (nunca
 * se manda anónimo) y el formulario pide volver a entrar en otra pestaña.
 */
export function RegisterFormGate({ serviceFamilies, selfPath, head, context }: RegisterFormGateProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [formShown, setFormShown] = useState(false);
  const checkout = checkoutFromNext(useSearchParams().get("next"));
  const returnPath = checkout ? withReturnHref(selfPath, checkout.href) : selfPath;

  // Estado derivado en el render (patrón de React para "recordar" un valor
  // previo): sin efecto ni render extra.
  if (isSignedIn && !formShown) setFormShown(true);

  if (!formShown && !isSignedIn) {
    return <PartnerSignIn head={head} context={context} redirectUrl={returnPath} loading={!isLoaded} />;
  }

  // El formulario es una sola columna de lectura: ancho `narrow` (720px),
  // alineado a la izquierda con el header como el resto de la página.
  return (
    <div className="flex max-w-180 flex-col gap-8">
      <PrivateFlowHead head={head} />
      <AccountBar selfPath={returnPath} />
      <ProviderForm
        serviceFamilies={serviceFamilies}
        getToken={getToken}
        reauthHref={returnPath}
        checkout={checkout}
      />
    </div>
  );
}
