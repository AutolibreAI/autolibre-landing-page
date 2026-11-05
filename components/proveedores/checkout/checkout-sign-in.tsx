"use client";

import { SignIn } from "@clerk/nextjs";

type CheckoutSignInProps = {
  readonly title: string;
  readonly body: string;
  /** Adónde vuelve después de entrar o crear la cuenta: la misma URL (con `?plan`). */
  readonly redirectUrl: string;
};

/**
 * Paso de login de la contratación (FR-002), igual que en el canje (211 D5):
 * `<SignIn routing="hash" withSignUp>` para no crear una ruta catch-all, y
 * redirección forzada a la misma URL para no perder el plan elegido.
 */
export function CheckoutSignIn({ title, body, redirectUrl }: CheckoutSignInProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
        <p className="mt-2 text-ink/70">{body}</p>
      </div>
      <SignIn
        routing="hash"
        withSignUp
        forceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
        // El encabezado de Clerk trae su propio `<h1>`: la página ya tiene
        // uno, y el `h2` de arriba hace de título de este paso.
        appearance={{ elements: { header: "hidden" } }}
      />
    </div>
  );
}
