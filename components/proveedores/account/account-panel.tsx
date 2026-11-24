"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { BusinessAccount } from "@/components/cuenta/business-account";
import { SignOutConfirm } from "@/components/cuenta/sign-out-confirm";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { Section } from "@/components/ui/section";
import type { AccountSection } from "@/lib/account/sections";
import { clearRoleHint } from "@/lib/auth/role-hint";
import { accountContent } from "@/lib/content/account";

const { page } = accountContent;

type AccountPanelProps = {
  /** `/cuenta` sin query: base de las secciones y vuelta de "No, seguir en mi cuenta". */
  readonly selfPath: string;
  /** `/cuenta` con la query actual: vuelta del login (no se pierde la sección ni el negocio). */
  readonly currentPath: string;
  /**
   * Nombre de la cookie `__client_uat` de la instancia (calculado en el
   * server): ata la pista de rol del header a esta sesión.
   */
  readonly sessionCookie: string | null;
  readonly section: AccountSection;
  readonly requestedPartnerId: string | null;
  /** `?salir=1`: el "Cerrar sesión" del menú del header público. */
  readonly signOutRequested: boolean;
};

/**
 * Isla client de `/cuenta`. Sin sesión, el login compartido de los flujos de
 * talleres (`PartnerSignIn`) con "Ingresar" / "Crear cuenta", y "Crear
 * cuenta" pregunta cliente o taller (`signupIntent="ask"`); con sesión,
 * `BusinessAccount`: "Mi negocio" si hay membresía, y si no, el onboarding de
 * proveedor o la cuenta de cliente según el intent.
 *
 * `?salir=1` (el header no carga Clerk y no puede cerrar la sesión él mismo):
 * - Con sesión: una CONFIRMACIÓN ("¿Cerrar sesión?"). La sesión se cierra
 *   recién con el botón. Antes se cerraba sola al abrir el link, así que
 *   cualquiera podía mandarlo y desloguearte con un GET.
 * - Sin sesión: no hay nada que cerrar; se limpia la URL y la pista de rol.
 */
export function AccountPanel({
  selfPath,
  currentPath,
  sessionCookie,
  section,
  requestedPartnerId,
  signOutRequested,
}: AccountPanelProps) {
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || isSignedIn || !signOutRequested) return;
    clearRoleHint();
    window.history.replaceState(null, "", selfPath);
  }, [isLoaded, isSignedIn, signOutRequested, selfPath]);

  if (!isLoaded || !isSignedIn) {
    return (
      <Section tone="canvas" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <PartnerSignIn
          head={{ eyebrow: page.eyebrow, title: page.title, intro: page.signInIntro }}
          redirectUrl={signOutRequested ? selfPath : currentPath}
          loading={!isLoaded}
          signupIntent="ask"
        />
      </Section>
    );
  }

  if (signOutRequested) {
    return (
      <Section tone="canvas" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <SignOutConfirm selfPath={selfPath} />
      </Section>
    );
  }

  return (
    <BusinessAccount
      basePath={selfPath}
      selfPath={currentPath}
      sessionCookie={sessionCookie}
      section={section}
      requestedPartnerId={requestedPartnerId}
    />
  );
}
