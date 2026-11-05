"use client";

import { SignIn, useAuth, useClerk } from "@clerk/nextjs";
import { useEffect, useId, useRef, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { fetchClaimedPartnerName, redeemClaimCode } from "@/lib/partner-claims/client";
import { validateCode, type RedeemFailureKind } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { siteConfig } from "@/lib/seo/config";

const { form, signIn, validation, errors, success } = partnerClaimContent;

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
   * la contratación de un plan (spec 212). `null` ⇒ el próximo paso es la app.
   */
  readonly continueHref?: string | null;
  /** Esta misma URL (con `?next` si lo hay): vuelta del login. */
  readonly selfPath?: string;
};

/**
 * Isla client del canje (`/proveedores/reclamar`). Sin sesión muestra el
 * `<SignIn>` de Clerk (permite crear cuenta) y, con sesión, el formulario.
 *
 * El código es estado de este componente y nunca se borra ante un error
 * (FR-012, FR-013): el `<SignIn>` y el formulario son ramas del mismo
 * componente, así que volver a iniciar sesión no lo pierde.
 */
export function ClaimForm({ continueHref = null, selfPath = PROVEEDORES_RECLAMAR_PATH }: ClaimFormProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inFlight = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const inputId = useId();
  const hintId = useId();
  const messageId = useId();

  // Código guardado antes de un re-login que recargó la página.
  useEffect(() => {
    const pending = takePendingCode();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sessionStorage solo existe en el browser: no se puede leer en el render inicial sin romper la hidratación.
    if (pending) setCode(pending);
  }, []);

  useEffect(() => {
    if (status.kind === "success") successRef.current?.focus();
  }, [status.kind]);

  const submitting = status.kind === "submitting";

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
    await signOut({ redirectUrl: selfPath });
  }

  if (!isLoaded) {
    return (
      <p role="status" className="text-ink/65">
        {signIn.loading}
      </p>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-ink">{signIn.title}</h2>
          <p className="mt-2 text-ink/70">{signIn.body}</p>
        </div>
        <SignIn
          routing="hash"
          withSignUp
          forceRedirectUrl={selfPath}
          signUpForceRedirectUrl={selfPath}
          // El encabezado de Clerk trae su propio `<h1>`: la página ya tiene
          // uno, y el `h2` de arriba hace de título de este paso.
          appearance={{ elements: { header: "hidden" } }}
        />
      </div>
    );
  }

  const message =
    status.kind === "local-error"
      ? status.message
      : status.kind === "error"
        ? errors[status.reason]
        : null;

  return (
    <div className="flex flex-col gap-6">
      {status.kind === "success" ? null : (
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <Field label={form.label} htmlFor={inputId} hint={form.hint} hintId={hintId}>
            <Input
              id={inputId}
              name="code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              autoComplete="one-time-code"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={message ? true : undefined}
              aria-describedby={message ? `${hintId} ${messageId}` : hintId}
              // 16px: menos dispara el zoom de iOS al enfocar.
              className="text-base tracking-wide"
            />
          </Field>
          <Button type="submit" size="lg" block disabled={submitting} aria-disabled={submitting}>
            {submitting ? form.submitting : form.submit}
          </Button>
        </form>
      )}

      {/* Región viva SIEMPRE montada: si apareciera junto con el mensaje, los
          lectores de pantalla no lo anunciarían (FR-017). */}
      <div aria-live="polite" aria-atomic="true">
        {status.kind === "success" ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-line bg-surface p-8 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-brand/10 text-brand">
              <Icon name="check" size={24} />
            </span>
            <h2 ref={successRef} tabIndex={-1} className="font-display text-xl font-bold text-ink">
              {status.partnerName ? success.title(status.partnerName) : success.titleWithoutName}
            </h2>
            <p className="text-ink/70">{success.body}</p>
            {continueHref ? (
              <>
                <p className="mt-2 text-ink">{success.continueCheckout.text}</p>
                <ButtonLink href={continueHref} variant="primary" size="lg">
                  {success.continueCheckout.cta}
                </ButtonLink>
              </>
            ) : (
              <>
                <p className="mt-2 text-ink">{success.nextStep.text}</p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href={siteConfig.stores.appStore} variant="primary">
                    {success.nextStep.appStore}
                  </ButtonLink>
                  <ButtonLink href={siteConfig.stores.playStore} variant="outline">
                    {success.nextStep.playStore}
                  </ButtonLink>
                </div>
              </>
            )}
          </div>
        ) : message ? (
          <div className="flex flex-col items-start gap-3">
            <p id={messageId} className="font-medium text-danger">
              {message}
            </p>
            {status.kind === "error" && status.reason === "unauthenticated" ? (
              <Button type="button" variant="outline" onClick={handleReauth}>
                {partnerClaimContent.reauth}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
