"use client";

import { SignIn } from "@clerk/nextjs";
import {
  SignInLayout,
  SignInLoading,
  type PrivateFlowHeadContent,
} from "@/components/proveedores/account/private-flow";

type PartnerSignInProps = {
  /** Encabezado de la pantalla: su `intro` es la bajada del panel si no hay `intro`. */
  readonly head?: PrivateFlowHeadContent;
  /** Encabezado ya renderizado (en el server), arriba del panel. Ver `SignInLayout`. */
  readonly headSlot?: React.ReactNode;
  /** Lo que acompaña al login, arriba del título: pasos del flujo, plan elegido… */
  readonly context?: React.ReactNode;
  /** Adónde vuelve después de entrar o crear la cuenta: la misma URL (con su query). */
  readonly redirectUrl: string;
  /** Clerk todavía no cargó: el panel muestra el "cargando". */
  readonly loading?: boolean;
  /** Bajada del panel "Ingresá o creá tu cuenta" (opcional). */
  readonly intro?: string;
  /** "¿Tenés un taller o un servicio? Sumá tu negocio" (por defecto, sí). */
  readonly showJoin?: boolean;
};

/**
 * Paso de login de TODAS las pantallas privadas de negocios (reclamo, alta,
 * contratación, resultado y `/cuenta`): el panel único "Ingresá o creá tu
 * cuenta" (lienzo `Ingresar`) con el `<SignIn>` de Clerk adentro.
 * `routing="hash"` para no crear una ruta catch-all (211 D5) y redirección
 * forzada a la misma URL para no perder el plan, el `?next` o el código. La
 * apariencia sale del `ScopedClerkProvider` (`lib/auth/clerk-appearance.ts`).
 */
export function PartnerSignIn({
  head,
  headSlot,
  context,
  redirectUrl,
  loading = false,
  intro,
  showJoin,
}: PartnerSignInProps) {
  return (
    <SignInLayout head={head} headSlot={headSlot} context={context} intro={intro} showJoin={showJoin}>
      {loading ? (
        <SignInLoading />
      ) : (
        <SignIn routing="hash" withSignUp forceRedirectUrl={redirectUrl} signUpForceRedirectUrl={redirectUrl} />
      )}
    </SignInLayout>
  );
}
