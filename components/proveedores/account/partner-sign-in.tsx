"use client";

import { SignIn } from "@clerk/nextjs";
import {
  SignInLayout,
  SignInLoading,
  type PrivateFlowHeadContent,
} from "@/components/proveedores/account/private-flow";

type PartnerSignInProps = {
  /** Encabezado de la pantalla (rótulo, `<h1>`, bajada). Sin él, lo pinta la página. */
  readonly head?: PrivateFlowHeadContent;
  /** Encabezado ya renderizado (en el server), en lugar de `head`. Ver `SignInLayout`. */
  readonly headSlot?: React.ReactNode;
  /** Columna de contexto: pasos del flujo, plan elegido… */
  readonly context?: React.ReactNode;
  /** Adónde vuelve después de entrar o crear la cuenta: la misma URL (con su query). */
  readonly redirectUrl: string;
  /** Clerk todavía no cargó: la tarjeta muestra el "cargando". */
  readonly loading?: boolean;
};

/**
 * Paso de login de TODAS las pantallas privadas de talleres (reclamo, alta,
 * contratación, resultado y `/cuenta`): `SignInLayout` con el `<SignIn>` de
 * Clerk adentro. `routing="hash"` para no crear una ruta catch-all (211 D5)
 * y redirección forzada a la misma URL para no perder el plan, el `?next` o
 * el código. La apariencia sale del `ScopedClerkProvider`.
 */
export function PartnerSignIn({ head, headSlot, context, redirectUrl, loading = false }: PartnerSignInProps) {
  return (
    <SignInLayout head={head} headSlot={headSlot} context={context}>
      {loading ? (
        <SignInLoading />
      ) : (
        <SignIn routing="hash" withSignUp forceRedirectUrl={redirectUrl} signUpForceRedirectUrl={redirectUrl} />
      )}
    </SignInLayout>
  );
}
