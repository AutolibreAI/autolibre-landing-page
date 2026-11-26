"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useSyncExternalStore } from "react";
import { useSignInRedirect } from "@/components/auth/use-sign-in-redirect";
import { ACCOUNT_SECTION_CLASS, BusinessAccount } from "@/components/cuenta/business-account";
import { BusinessDashboardSkeleton } from "@/components/cuenta/business-dashboard";
import { CustomerAccountSkeleton } from "@/components/cuenta/skeletons";
import { SignOutConfirm } from "@/components/cuenta/sign-out-confirm";
import { PRIVATE_FLOW_TITLE_ID } from "@/components/proveedores/account/private-flow";
import { Section } from "@/components/ui/section";
import type { AccountSection } from "@/lib/account/sections";
import { clearRoleHint, readAccountHint, type AccountHint } from "@/lib/auth/role-hint";
import { accountContent } from "@/lib/content/account";

const { page } = accountContent;

type AccountPanelProps = {
  /** `/cuenta` sin query: base de las secciones y vuelta de "No, seguir en mi cuenta". */
  readonly selfPath: string;
  /** `/cuenta` con la query actual: vuelta de `/ingresar` (no se pierde la sección ni el negocio). */
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
  /**
   * Pista de sesión y rol leída en el server (cookies `__client_uat` y
   * `al_role`, ver `lib/auth/role-hint.ts`). Con ella el HTML del server ya
   * trae el esqueleto correcto mientras carga Clerk. Sin ella se lee en el
   * browser después de hidratar.
   */
  readonly accountHint?: AccountHint;
};

/** Las cookies no avisan cuando cambian: la pista se lee una vez por render. */
function subscribeNoop() {
  return () => {};
}

/**
 * Isla client de `/cuenta`. Sin sesión no se llega acá: `proxy.ts` manda a
 * `/ingresar?redirect=<esta URL>` ("Ingresar" / "Crear cuenta", y "Crear
 * cuenta" pregunta cliente o taller). Con sesión, `BusinessAccount`: "Mi
 * negocio" si hay membresía, y si no, el onboarding de proveedor o la cuenta
 * de cliente según el intent. Si la sesión vence con la página abierta, de
 * vuelta a `/ingresar` (`useSignInRedirect`).
 *
 * `?salir=1` (el header no carga Clerk y no puede cerrar la sesión él mismo):
 * - Con sesión: una CONFIRMACIÓN ("¿Cerrar sesión?"). La sesión se cierra
 *   recién con el botón. Antes se cerraba sola al abrir el link, así que
 *   cualquiera podía mandarlo y desloguearte con un GET.
 * - Sin sesión: no hay nada que cerrar. Lo resuelve `proxy.ts` (borra la
 *   pista de rol y manda a `/ingresar`); acá, el mismo respaldo.
 */
export function AccountPanel({
  selfPath,
  currentPath,
  sessionCookie,
  section,
  requestedPartnerId,
  signOutRequested,
  accountHint,
}: AccountPanelProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const browserHint = useSyncExternalStore(
    subscribeNoop,
    () => readAccountHint(sessionCookie),
    () => null,
  );
  const hint = accountHint ?? browserHint;

  const signedOut = isLoaded && !isSignedIn;
  useEffect(() => {
    if (signedOut && signOutRequested) clearRoleHint();
  }, [signedOut, signOutRequested]);
  useSignInRedirect(signedOut, signOutRequested ? selfPath : currentPath);

  // Mientras carga Clerk (el proxy ya vio la sesión), el esqueleto de SU
  // pantalla: el tablero si la pista dice proveedor, y si no, la cuenta de
  // cliente. Nada salta cuando Clerk confirma.
  if (!isLoaded || !isSignedIn) {
    if (signOutRequested && !signedOut) {
      return (
        <Section tone="canvas" spacing="md" aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
          <SignOutConfirm selfPath={selfPath} />
        </Section>
      );
    }
    if (hint === "proveedor") return <BusinessDashboardSkeleton section={section} />;
    return (
      <Section tone="canvas" spacing="sm" className={ACCOUNT_SECTION_CLASS} aria-labelledby={PRIVATE_FLOW_TITLE_ID}>
        <p role="status" className="sr-only">
          {page.partners.loading}
        </p>
        <CustomerAccountSkeleton firstName={null} />
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
