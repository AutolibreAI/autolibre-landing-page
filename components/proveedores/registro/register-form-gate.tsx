"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { ProviderForm } from "@/components/forms/provider-form";
import { CheckoutSignIn } from "@/components/proveedores/checkout/checkout-sign-in";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { providersContent } from "@/lib/content/providers";

const content = providersContent.formPage;

type RegisterFormGateProps = {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  /** Esta misma URL: vuelta del login y link para volver a entrar. */
  readonly selfPath: string;
};

/**
 * Isla client de `/proveedores/registro/formulario` (spec 212, US3). Sin
 * sesión muestra el `<SignIn>` (mismo componente que la contratación: hash
 * routing, `withSignUp`, vuelta forzada a esta URL); con sesión, el formulario
 * de alta, que manda el token de Clerk en cada envío.
 *
 * Una vez que el formulario apareció, NO se desmonta aunque Clerk pase a "sin
 * sesión" (la sesión venció o se cerró en otra pestaña): desmontarlo borraría
 * todo lo escrito. En ese caso `getToken` no da token, el envío no sale (nunca
 * se manda anónimo) y el formulario pide volver a entrar en otra pestaña.
 */
export function RegisterFormGate({ serviceFamilies, selfPath }: RegisterFormGateProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [formShown, setFormShown] = useState(false);

  // Estado derivado en el render (patrón de React para "recordar" un valor
  // previo): sin efecto ni render extra.
  if (isSignedIn && !formShown) setFormShown(true);

  if (!formShown) {
    if (!isLoaded) {
      return (
        <p role="status" className="text-ink/65">
          {content.loading}
        </p>
      );
    }
    if (!isSignedIn) {
      return <CheckoutSignIn title={content.signIn.title} body={content.signIn.body} redirectUrl={selfPath} />;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-display text-xl font-bold text-ink">{content.formTitle}</h2>
      <ProviderForm serviceFamilies={serviceFamilies} getToken={getToken} reauthHref={selfPath} />
    </div>
  );
}
