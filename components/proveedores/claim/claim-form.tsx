"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { AccountBar } from "@/components/proveedores/account/account-bar";
import { PartnerSignIn } from "@/components/proveedores/account/partner-sign-in";
import { PrivateFlowHead, type PrivateFlowHeadContent } from "@/components/proveedores/account/private-flow";
import { FlowLayout } from "@/components/proveedores/flow/flow-layout";
import { Button, ButtonLink, buttonVariants } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Icon } from "@/components/ui/icon";
import { StoreLinks } from "@/components/ui/store-links";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { accountContent } from "@/lib/content/account";
import { partnerClaimContent } from "@/lib/content/partner-claim";
import { fetchClaimedPartnerName, redeemClaimCode } from "@/lib/partner-claims/client";
import { validateCode, type RedeemFailureKind } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";
import { cn } from "@/lib/utils";
import { whatsappUrl } from "@/lib/whatsapp";

const { form, validation, errors, invalidCode, success } = partnerClaimContent;

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
   * la contratación de un plan (spec 212). `null` ⇒ el próximo paso es elegir
   * un plan o ir a la app.
   */
  readonly continueHref?: string | null;
  /** Esta misma URL (con `?next` si lo hay): vuelta del login. */
  readonly selfPath?: string;
  /** Encabezado de la página (el `<h1>` lo pinta la isla). */
  readonly head: PrivateFlowHeadContent;
  /** Contexto del login: los pasos del reclamo. */
  readonly signInContext: React.ReactNode;
  /** "Sobre el código" (server): al costado del formulario y en el login. */
  readonly about: React.ReactNode;
};

/**
 * Isla client del canje (`/proveedores/reclamar`). Sin sesión muestra el
 * `<SignIn>` de Clerk (el compartido de los flujos de talleres) y, con
 * sesión, el formulario.
 *
 * El código es estado de este componente y nunca se borra ante un error
 * (FR-012, FR-013): el `<SignIn>` y el formulario son ramas del mismo
 * componente, así que volver a iniciar sesión no lo pierde.
 */
export function ClaimForm({
  continueHref = null,
  selfPath = PROVEEDORES_RECLAMAR_PATH,
  head,
  signInContext,
  about,
}: ClaimFormProps) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { signOut } = useClerk();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const inFlight = useRef(false);
  const successRef = useRef<HTMLHeadingElement>(null);
  const inputId = useId();
  const hintId = useId();
  const messageId = useId();
  const formTitleId = useId();

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
        // Nunca el código ni el taller: sólo si el canje vino de contratar un plan.
        track(ANALYTICS_EVENTS.partnerClaimRedeemed, continueHref ? { from_checkout: true } : {});
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

  if (!isLoaded || !isSignedIn) {
    return (
      <PartnerSignIn
        head={head}
        context={
          <>
            {signInContext}
            {about}
          </>
        }
        redirectUrl={selfPath}
        loading={!isLoaded}
      />
    );
  }

  const message =
    status.kind === "local-error"
      ? status.message
      : status.kind === "error"
        ? errors[status.reason]
        : null;

  return (
    <div className="flex max-w-220 flex-col gap-8">
      <PrivateFlowHead head={head} />
      <FlowLayout aside={about} asideOnMobile="bottom">
    <div className="flex flex-col gap-6">
      <AccountBar selfPath={selfPath} />
      {status.kind === "success" ? null : (
        <form
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby={formTitleId}
          className="flex flex-col gap-5 rounded-card border border-line bg-surface p-6 sm:p-8"
        >
          <h2 id={formTitleId} className="font-display text-xl font-bold text-ink">
            {form.title}
          </h2>
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
              // Mayúsculas solo visuales: el valor viaja tal cual (el backend
              // normaliza mayúsculas y guiones, FR-007).
              className="h-12 font-display text-lg font-semibold tracking-widest uppercase"
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
          <ClaimSuccess headingRef={successRef} partnerName={status.partnerName} continueHref={continueHref} />
        ) : message ? (
          <div className="flex flex-col items-start gap-3 rounded-card border border-alert-fg/25 bg-alert-bg/60 p-5">
            <p id={messageId} className="flex items-start gap-2.5 font-semibold text-danger">
              <Icon name="alert" size={20} strokeWidth={1.8} className="mt-0.5 shrink-0" />
              <span>{message}</span>
            </p>
            {status.kind === "error" && status.reason === "invalid-code" ? (
              <>
                <p className="text-[0.9375rem] leading-relaxed text-ink/80">{invalidCode.causes}</p>
                <a
                  href={whatsappUrl(invalidCode.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-analytics-event={ANALYTICS_EVENTS.whatsappClicked}
                  data-analytics-placement="reclamar_codigo_nuevo"
                  className={cn(buttonVariants({ variant: "outline" }), "min-h-11 bg-surface")}
                >
                  <Icon name="whatsapp" size={18} strokeWidth={1.8} />
                  {invalidCode.requestNew}
                </a>
              </>
            ) : null}
            {status.kind === "error" && status.reason === "unauthenticated" ? (
              <Button type="button" variant="outline" className="bg-surface" onClick={handleReauth}>
                {partnerClaimContent.reauth}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
      </FlowLayout>
    </div>
  );
}

/**
 * El canje salió: "¡Listo! Ya administrás {taller}" y los próximos pasos.
 * Si vino de contratar un plan (`?next`), lo principal es volver a esa
 * contratación; si no, elegir un plan. Siempre, la app para administrar el
 * perfil (hoy no hay panel web).
 *
 * El perfil público no se ofrece: la membresía que devuelve el backend no
 * trae el slug del taller.
 */
function ClaimSuccess({
  headingRef,
  partnerName,
  continueHref,
}: {
  readonly headingRef: React.RefObject<HTMLHeadingElement | null>;
  readonly partnerName: string | null;
  readonly continueHref: string | null;
}) {
  return (
    <div className="flex flex-col gap-8 rounded-card border border-line bg-surface p-6 sm:p-8">
      <div className="flex flex-col items-start gap-4">
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-brand-hover text-white ring-8 ring-brand/10"
        >
          <Icon name="check" size={28} strokeWidth={2.2} />
        </span>
        <div className="mt-1 flex flex-col gap-2">
          <h2 ref={headingRef} tabIndex={-1} className="font-display text-2xl font-bold text-ink">
            {partnerName ? success.title(partnerName) : success.titleWithoutName}
          </h2>
          <p className="text-ink/72">{success.body}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-line pt-6">
        <h3 className="font-display text-lg font-bold text-ink">{success.nextTitle}</h3>

        {continueHref ? (
          <div className="flex flex-col items-start gap-3">
            <div>
              <p className="font-semibold text-ink">{success.continueCheckout.title}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{success.continueCheckout.text}</p>
            </div>
            <ButtonLink href={continueHref} prefetch={false} size="lg">
              {success.continueCheckout.cta}
              <Icon name="arrow-right" size={18} strokeWidth={2} />
            </ButtonLink>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-3">
            <div>
              <p className="font-semibold text-ink">{success.plans.title}</p>
              <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{success.plans.body}</p>
            </div>
            <ButtonLink href={success.plans.href} size="lg">
              {success.plans.cta}
              <Icon name="arrow-right" size={18} strokeWidth={2} />
            </ButtonLink>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div>
            <p className="font-semibold text-ink">{success.app.title}</p>
            <p className="mt-1 text-[0.9375rem] leading-relaxed text-ink/70">{success.app.body}</p>
          </div>
          <StoreLinks placement="reclamar_exito" />
        </div>

        {/* Sin prefetch: `/cuenta` es otra pantalla privada con su Clerk. */}
        <Link
          href={accountContent.link.href}
          prefetch={false}
          className="-my-2 inline-flex min-h-11 items-center gap-2 self-start font-semibold text-brand-hover underline-offset-4 hover:underline"
        >
          <Icon name="user" size={18} strokeWidth={1.8} />
          {accountContent.link.label}
        </Link>
      </div>
    </div>
  );
}
