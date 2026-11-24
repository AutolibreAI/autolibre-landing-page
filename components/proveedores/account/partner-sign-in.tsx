"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import {
  SignInLayout,
  SignInLoading,
  type PrivateFlowHeadContent,
} from "@/components/proveedores/account/private-flow";
import { SignupIntentChoice } from "@/components/proveedores/account/signup-intent-choice";
import { track } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS, SIGNUP_INTENT_PLACEMENTS } from "@/lib/analytics/events";
import { setPendingSignupIntent, usePendingSignupIntent } from "@/lib/auth/pending-signup-intent";
import { SIGNUP_INTENTS, type SignupIntent } from "@/lib/auth/signup-intent";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { cn } from "@/lib/utils";

/**
 * Qué cuenta se crea desde este login:
 * - `partner` (por defecto): los flujos de proveedor (alta, reclamo,
 *   contratar). No se pregunta: el `<SignIn withSignUp>` de siempre, y el
 *   intent queda pendiente hasta que haya sesión.
 * - `customer`: idem, como cliente.
 * - `ask`: `/cuenta`. "Ingresar" / "Crear cuenta"; "Crear cuenta" pregunta
 *   primero "Soy cliente / Tengo un taller" y recién después muestra el
 *   `<SignUp>`.
 */
export type SignupIntentMode = SignupIntent | "ask";

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
  /** Cliente o proveedor al crear la cuenta (por defecto, `partner`). */
  readonly signupIntent?: SignupIntentMode;
};

/**
 * Paso de login de TODAS las pantallas privadas de negocios (reclamo, alta,
 * contratación, resultado y `/cuenta`): el panel único "Ingresá o creá tu
 * cuenta" (lienzo `Ingresar`) con el `<SignIn>` de Clerk adentro.
 * `routing="hash"` para no crear una ruta catch-all (211 D5) y redirección
 * forzada a la misma URL para no perder el plan, el `?next` o el código. La
 * apariencia sale del `ScopedClerkProvider` (`lib/auth/clerk-appearance.ts`).
 *
 * El intent de la cuenta nueva (`signupIntent`) viaja en `sessionStorage`
 * (`lib/auth/pending-signup-intent.ts`) y lo guarda `SignupIntentSync` apenas
 * hay sesión.
 */
export function PartnerSignIn({
  head,
  headSlot,
  context,
  redirectUrl,
  loading = false,
  intro,
  showJoin,
  signupIntent = SIGNUP_INTENTS.partner,
}: PartnerSignInProps) {
  const ask = signupIntent === "ask";

  // Flujos sin pregunta: el intent queda pendiente mientras se ve el login.
  // Si la persona entra con una cuenta vieja, el server lo rechaza y se borra.
  useEffect(() => {
    if (!loading && !ask) setPendingSignupIntent(signupIntent);
  }, [loading, ask, signupIntent]);

  return (
    <SignInLayout head={head} headSlot={headSlot} context={context} intro={intro} showJoin={showJoin}>
      {loading ? (
        <SignInLoading />
      ) : ask ? (
        <AccountEntry redirectUrl={redirectUrl} />
      ) : (
        <SignIn routing="hash" withSignUp forceRedirectUrl={redirectUrl} signUpForceRedirectUrl={redirectUrl} />
      )}
    </SignInLayout>
  );
}

const { entry, intentChoice } = partnerAccountContent;

type EntryMode = "signIn" | "choose" | "signUp";

/** Recuerda que la pestaña está en "Crear cuenta" (vuelta de Google o del código por email). */
const ENTRY_STORAGE_KEY = "al_signup_entry";

/** El "Registrate" / "Ingresá" del pie de Clerk se reemplaza por nuestras pestañas. */
const withoutFooterAction = { elements: { footerAction: "hidden" } } as const;

/**
 * "Ingresar" / "Crear cuenta" de `/cuenta`. Dos botones con `aria-pressed`
 * (no pestañas ARIA: cada uno cambia lo que hay debajo, sin paneles a la
 * vez). "Crear cuenta" pide primero cliente o taller.
 */
function AccountEntry({ redirectUrl }: { readonly redirectUrl: string }) {
  const pending = usePendingSignupIntent();
  const [mode, setMode] = useState<EntryMode>("signIn");
  /** Lo elegido en esta pantalla (si no hay storage, `pending` queda en `null`). */
  const [chosen, setChosen] = useState<SignupIntent | null>(null);
  const current = chosen ?? pending;
  const chosenRef = useRef<HTMLParagraphElement>(null);
  const focusChosen = useRef(false);

  // Vuelta de Google o recarga en la verificación por email: Clerk sigue en
  // una ruta del hash (`#/sso-callback`, `#/verify-email-address`) y tiene que
  // encontrar el `<SignUp>` montado, no el `<SignIn>`.
  useEffect(() => {
    if (!pending || window.location.hash.length < 3) return;
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- se lee `sessionStorage` recién en el browser.
      if (window.sessionStorage.getItem(ENTRY_STORAGE_KEY) === "signUp") setMode("signUp");
    } catch {
      return;
    }
  }, [pending]);

  useEffect(() => {
    if (mode === "signUp" && focusChosen.current) {
      focusChosen.current = false;
      chosenRef.current?.focus();
    }
  }, [mode]);

  function change(next: EntryMode) {
    setMode(next);
    try {
      if (next === "signUp") window.sessionStorage.setItem(ENTRY_STORAGE_KEY, "signUp");
      else window.sessionStorage.removeItem(ENTRY_STORAGE_KEY);
    } catch {
      // Sin storage: solo se pierde volver a "Crear cuenta" tras una recarga.
    }
  }

  const creating = mode !== "signIn";

  return (
    <div className="flex flex-col gap-6">
      <div role="group" aria-label={entry.label} className="grid grid-cols-2 gap-1 rounded-full border border-card-line bg-card p-1">
        <EntryToggle pressed={!creating} onClick={() => change("signIn")}>
          {entry.signIn}
        </EntryToggle>
        <EntryToggle pressed={creating} onClick={() => change(mode === "signUp" ? "signUp" : "choose")}>
          {entry.signUp}
        </EntryToggle>
      </div>

      {mode === "signIn" ? (
        <SignIn
          routing="hash"
          withSignUp
          forceRedirectUrl={redirectUrl}
          signUpForceRedirectUrl={redirectUrl}
          appearance={withoutFooterAction}
        />
      ) : mode === "choose" ? (
        <SignupIntentChoice
          initial={current}
          onSubmit={(intent) => {
            setChosen(intent);
            setPendingSignupIntent(intent);
            track(ANALYTICS_EVENTS.signupIntentSelected, {
              intent,
              placement: SIGNUP_INTENT_PLACEMENTS.accountCreate,
            });
            focusChosen.current = true;
            change("signUp");
          }}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {current ? (
          <p
            ref={chosenRef}
            tabIndex={-1}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-card border border-card-line bg-card px-4 py-2"
          >
            <span className="font-semibold text-fg">
              {intentChoice.chosen[current]}
            </span>
            <button
              type="button"
              onClick={() => change("choose")}
              className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
            >
              {intentChoice.change}
            </button>
          </p>
          ) : null}
          <SignUp
            routing="hash"
            forceRedirectUrl={redirectUrl}
            signInForceRedirectUrl={redirectUrl}
            appearance={withoutFooterAction}
          />
        </div>
      )}
    </div>
  );
}

function EntryToggle({
  pressed,
  onClick,
  children,
}: {
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "h-11 rounded-full font-display text-control font-semibold transition-colors motion-reduce:transition-none",
        pressed ? "bg-action text-white" : "text-fg hover:bg-brand-50",
      )}
    >
      {children}
    </button>
  );
}
