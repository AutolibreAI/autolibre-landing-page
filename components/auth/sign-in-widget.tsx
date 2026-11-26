"use client";

import { SignIn, SignUp, useAuth } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { SignupIntentChoice } from "@/components/proveedores/account/signup-intent-choice";
import { track } from "@/lib/analytics/track";
import { ANALYTICS_EVENTS, SIGNUP_INTENT_PLACEMENTS } from "@/lib/analytics/events";
import { setPendingSignupIntent, usePendingSignupIntent } from "@/lib/auth/pending-signup-intent";
import { SIGNUP_INTENTS, type SignupIntent } from "@/lib/auth/signup-intent";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { cn } from "@/lib/utils";

/**
 * Qué cuenta se crea desde este login. Siempre hay "Ingresar" / "Crear
 * cuenta" (el `<SignIn withSignUp>` solo no deja ver que se puede crear una):
 * - `partner` (por defecto): los flujos de proveedor (alta, reclamo,
 *   contratar). "Crear cuenta" va directo al `<SignUp>`, sin preguntar, y el
 *   intent queda pendiente hasta que haya sesión.
 * - `customer`: idem, como cliente.
 * - `ask`: `/cuenta`. "Crear cuenta" pregunta primero "Soy cliente / Tengo un
 *   taller" y recién después muestra el `<SignUp>`.
 */
export type SignupIntentMode = SignupIntent | "ask";

type SignInWidgetProps = {
  /**
   * Adónde vuelve después de entrar o crear la cuenta: el `?redirect=` de
   * `/ingresar`, YA validado en el server (`parseSafeRedirect`).
   */
  readonly redirectUrl: string;
  /** Cliente o proveedor al crear la cuenta (por defecto, `partner`). */
  readonly signupIntent?: SignupIntentMode;
};

/**
 * Isla del login de `/ingresar`: solo el widget de Clerk (el `<h1>`, la
 * bajada y el panel de marca los pinta el server). `routing="hash"` para no
 * crear una ruta catch-all (211 D5): la vuelta de Google entra por
 * `/ingresar?redirect=…#/sso-callback`. Redirección forzada al destino para
 * no perder el plan, el `?next` o el código. La apariencia sale del
 * `ScopedClerkProvider` (`lib/auth/clerk-appearance.ts`).
 *
 * El intent de la cuenta nueva (`signupIntent`) viaja en `sessionStorage`
 * (`lib/auth/pending-signup-intent.ts`) y lo guarda `SignupIntentSync` apenas
 * hay sesión (en `/ingresar` o en la pantalla a la que vuelve).
 */
export function SignInWidget({ redirectUrl, signupIntent = SIGNUP_INTENTS.partner }: SignInWidgetProps) {
  const { isLoaded } = useAuth();
  const loading = !isLoaded;
  const ask = signupIntent === "ask";

  // Flujos sin pregunta: el intent queda pendiente mientras se ve el login.
  // Si la persona entra con una cuenta vieja, el server lo rechaza y se borra.
  useEffect(() => {
    if (!loading && !ask) setPendingSignupIntent(signupIntent);
  }, [loading, ask, signupIntent]);

  return <AccountEntry redirectUrl={redirectUrl} loading={loading} fixedIntent={ask ? null : signupIntent} />;
}

const { entry, intentChoice, signIn } = partnerAccountContent;

type EntryMode = "signIn" | "choose" | "signUp";

/** Recuerda que la pestaña está en "Crear cuenta" (vuelta de Google o del código por email). */
const ENTRY_STORAGE_KEY = "al_signup_entry";

/** El "Registrate" / "Ingresá" del pie de Clerk se reemplaza por nuestras pestañas. */
const withoutFooterAction = { elements: { footerAction: "hidden" } } as const;

/**
 * "Ingresar" / "Crear cuenta". Dos botones con `aria-pressed` (no pestañas
 * ARIA: cada uno cambia lo que hay debajo, sin paneles a la vez). Sin
 * `fixedIntent` (`/cuenta`), "Crear cuenta" pide primero cliente o taller;
 * con `fixedIntent` (flujos de proveedor) va directo al `<SignUp>`.
 *
 * Las pestañas se pintan desde el primer render, aunque Clerk no haya
 * cargado (`loading`): el widget va en un `ClerkSlot` que le reserva el alto,
 * así nada salta cuando monta.
 */
function AccountEntry({
  redirectUrl,
  loading,
  fixedIntent,
}: {
  readonly redirectUrl: string;
  readonly loading: boolean;
  /** Intent que define el destino (flujos de proveedor): no se pregunta. `null` en `/cuenta`. */
  readonly fixedIntent: SignupIntent | null;
}) {
  const pending = usePendingSignupIntent();
  const [mode, setMode] = useState<EntryMode>("signIn");
  /** Lo elegido en esta pantalla (si no hay storage, `pending` queda en `null`). */
  const [chosen, setChosen] = useState<SignupIntent | null>(null);
  const current = fixedIntent ?? chosen ?? pending;
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
    <div className="flex flex-col gap-5">
      <div role="group" aria-label={entry.label} className="grid grid-cols-2 gap-1 rounded-full border border-card-line bg-card p-1">
        <EntryToggle pressed={!creating} onClick={() => change("signIn")}>
          {entry.signIn}
        </EntryToggle>
        <EntryToggle pressed={creating} onClick={() => change(fixedIntent || mode === "signUp" ? "signUp" : "choose")}>
          {entry.signUp}
        </EntryToggle>
      </div>

      {mode === "signIn" ? (
        <ClerkSlot kind="signInBare" loading={loading}>
          <SignIn
            routing="hash"
            withSignUp
            forceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
            appearance={withoutFooterAction}
          />
        </ClerkSlot>
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
        <div className="flex flex-col gap-4">
          {current && !fixedIntent ? (
            <p
              ref={chosenRef}
              tabIndex={-1}
              className="flex flex-wrap items-center justify-between gap-x-3 rounded-full border border-card-line bg-card py-0 pr-2 pl-5"
            >
              <span className="text-sm font-semibold text-fg">{intentChoice.chosen[current]}</span>
              <button
                type="button"
                onClick={() => change("choose")}
                className="inline-flex min-h-11 items-center px-3 text-sm font-semibold text-fg underline underline-offset-4 hover:text-brand-hover"
              >
                {intentChoice.change}
              </button>
            </p>
          ) : null}
          <ClerkSlot kind="signUp" loading={loading}>
            <SignUp
              routing="hash"
              forceRedirectUrl={redirectUrl}
              signInForceRedirectUrl={redirectUrl}
              appearance={withoutFooterAction}
            />
          </ClerkSlot>
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

/**
 * Qué componente de Clerk ocupa el lugar, para reservarle el alto:
 * - `signInBare`: el `<SignIn>`, sin el pie "¿No tenés cuenta? Registrate"
 *   de Clerk (lo reemplazan las pestañas "Ingresar" / "Crear cuenta").
 * - `signUp`: el `<SignUp>`, sin pie.
 */
type ClerkSlotKind = "signInBare" | "signUp";

/**
 * Alto mínimo de cada widget de Clerk YA montado (primer paso: email,
 * "Continuar", divisor, botones sociales y "Secured by Clerk"), medido con la
 * apariencia de `lib/auth/clerk-appearance.ts`. Si cambia la apariencia, se
 * vuelve a medir: si el widget queda más alto que la reserva, la línea legal
 * y el footer saltan cuando Clerk monta.
 */
const slotHeights: Record<ClerkSlotKind, string> = {
  // 280px medidos (2026-11-25).
  signInBare: "min-h-70",
  // 379px medidos: email, contraseña, "Continuar" y los botones sociales.
  signUp: "min-h-95",
};

/**
 * Lugar del widget de Clerk: reserva su alto mientras carga (`loading`, con
 * un esqueleto quieto del formulario) y cuando monta, así nada de lo que
 * sigue se mueve. El `<SignIn>` de Clerk llega vacío y se llena ~1s después.
 */
function ClerkSlot({
  kind,
  loading = false,
  children,
}: {
  readonly kind: ClerkSlotKind;
  readonly loading?: boolean;
  readonly children?: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col", slotHeights[kind])}>
      {loading ? <SignInLoading /> : children}
    </div>
  );
}

/**
 * Mientras Clerk carga: el esqueleto del primer paso (label, email,
 * "Continuar", divisor y los botones sociales), en los tonos de las líneas,
 * sin animación. El texto queda para lectores de pantalla.
 */
function SignInLoading() {
  return (
    <div role="status" className="flex flex-col gap-4">
      <span className="sr-only">{signIn.loading}</span>
      <div aria-hidden="true" className="flex flex-col gap-1.5">
        <span className="h-4 w-32 rounded-full bg-card-line" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
      </div>
      <span aria-hidden="true" className="h-12 rounded-full bg-card-line" />
      <span aria-hidden="true" className="h-px bg-card-line" />
      <div aria-hidden="true" className="grid grid-cols-3 gap-2">
        <span className="h-12 rounded-full border border-card-line bg-card" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
        <span className="h-12 rounded-full border border-card-line bg-card" />
      </div>
    </div>
  );
}
