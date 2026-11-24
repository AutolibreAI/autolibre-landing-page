"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { ClaimFormView, ClaimSuccessView } from "@/components/proveedores/claim/claim-views";
import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { useFlowSignOut } from "@/components/proveedores/flow/use-flow-sign-out";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { syncRoleHint } from "@/lib/auth/role-hint";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { fetchClaimedPartnerName, redeemClaimCode } from "@/lib/partner-claims/client";
import { validateCode, type RedeemFailureKind } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";

const { validation, errors, about } = partnerClaimContent;

/**
 * Respaldo del código mientras la persona vuelve a iniciar sesión tras un
 * 401 (FR-012). El estado de React alcanza si el componente sigue montado;
 * esto cubre el caso de que Clerk recargue la página. Solo vive en esta
 * pestaña y se borra apenas se recupera.
 */
const PENDING_CODE_KEY = "autolibre:reclamar:codigo";

function savePendingCode(code: string) {
  try {
    sessionStorage.setItem(PENDING_CODE_KEY, code);
  } catch {
    // Sin storage (modo privado, bloqueado): queda el estado de React.
  }
}

function takePendingCode(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_CODE_KEY);
    sessionStorage.removeItem(PENDING_CODE_KEY);
    return code;
  } catch {
    return null;
  }
}

type Status =
  | { readonly kind: "idle" }
  | { readonly kind: "submitting" }
  | { readonly kind: "local-error"; readonly message: string }
  | { readonly kind: "error"; readonly reason: RedeemFailureKind }
  | { readonly kind: "success"; readonly partnerName: string | null };

type ClaimFormProps = {
  /**
   * Ruta (ya validada en el server) a la que se ofrece volver tras el canje:
   * la contratación de un plan (spec 212). `null` ⇒ los próximos pasos son
   * "Mi negocio" y los planes.
   */
  readonly continueHref?: string | null;
  /** Esta misma URL (con `?next` si lo hay): vuelta del login. */
  readonly selfPath?: string;
  /** Cookie `__client_uat` de la instancia (para la pista de rol del header). */
  readonly sessionCookie: string | null;
};

/**
 * Isla client del canje (`/proveedores/reclamar`). Pinta la pantalla entera
 * con el encabezado de foco (`FlowShell`): sin sesión, el panel "Ingresá o
 * creá tu cuenta"; con sesión, el formulario (lienzos `Reclamar`,
 * `ReclamarError`) y, al canjear, el resultado (`ReclamarListo`).
 *
 * El código es estado de este componente y nunca se borra ante un error
 * (FR-012, FR-013): el login y el formulario son ramas del mismo componente,
 * así que volver a iniciar sesión no lo pierde.
 *
 * Al canjear, la persona pasa a ser dueña de un negocio: se escribe la pista
 * de rol del header público (`al_role`), igual que lo hace `/cuenta`.
 */
export function ClaimForm({ continueHref = null, selfPath = PROVEEDORES_RECLAMAR_PATH, sessionCookie }: ClaimFormProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const session = useFlowSignOut();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inFlight = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Código guardado antes de un re-login que recargó la página.
  useEffect(() => {
    const pending = takePendingCode();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage solo existe en el browser: no se puede leer en el render inicial sin romper la hidratación.
    if (pending) setCode(pending);
  }, []);

  useEffect(() => {
    if (status.kind === "success") successRef.current?.focus();
    // Un error del código vuelve al campo; el resto, al mensaje.
    else if (status.kind === "local-error") inputRef.current?.focus();
    else if (status.kind === "error") messageRef.current?.focus();
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return; // FR-014: un solo canje a la vez.

    const checked = validateCode(code);
    if (!checked.ok) {
      setStatus({
        kind: "local-error",
        message: checked.reason === "empty" ? validation.empty : validation.tooLong,
      });
      return;
    }

    inFlight.current = true;
    setStatus({ kind: "submitting" });
    try {
      const result = await redeemClaimCode(checked.code, getToken);
      if (result.kind === "success") {
        // Nunca el código ni el negocio: sólo si el canje vino de contratar un plan.
        track(ANALYTICS_EVENTS.partnerClaimRedeemed, continueHref ? { from_checkout: true } : {});
        // Ya es dueño de un negocio: el header público muestra "Ir a mi negocio".
        syncRoleHint(sessionCookie, true);
        const partnerName = await fetchClaimedPartnerName(result.partnerId, getToken);
        setStatus({ kind: "success", partnerName });
        setCode("");
      } else {
        setStatus({ kind: "error", reason: result.kind });
      }
    } finally {
      inFlight.current = false;
    }
  }

  async function handleReauth() {
    savePendingCode(code);
    await session.leave(selfPath);
  }

  const signedIn = isLoaded && isSignedIn;

  return (
    <FlowShell
      helpMessage={about.whatsappMessage}
      helpPlacement="reclamar_encabezado"
      signOut={signedIn ? { onClick: () => void session.leave("/"), pending: session.pending } : null}
    >
      {!signedIn ? (
        <FlowMain>
          <PartnerSignIn
            intro={partnerClaimContent.signInIntro}
            showJoin={false}
            redirectUrl={selfPath}
            loading={!isLoaded}
          />
        </FlowMain>
      ) : status.kind === "success" ? (
        <FlowMain>
          <ClaimSuccessView headingRef={successRef} partnerName={status.partnerName} continueHref={continueHref} />
        </FlowMain>
      ) : (
        <FlowMain>
          <ClaimFormView
            code={code}
            onCodeChange={setCode}
            onSubmit={handleSubmit}
            submitting={status.kind === "submitting"}
            message={
              status.kind === "local-error" ? status.message : status.kind === "error" ? errors[status.reason] : null
            }
            reason={status.kind === "error" ? status.reason : null}
            inputRef={inputRef}
            messageRef={messageRef}
            accountName={user?.primaryEmailAddress?.emailAddress ?? user?.fullName ?? null}
            onSwitchAccount={() => void handleReauth()}
            onReauth={() => void handleReauth()}
            switching={session.pending}
          />
        </FlowMain>
      )}
    </FlowShell>
  );
}
