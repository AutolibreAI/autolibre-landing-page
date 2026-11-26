import { esUY } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { SignupIntentSync } from "@/components/auth/signup-intent-sync";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";

type ScopedClerkProviderProps = {
  /** Adónde vuelve la persona al cerrar sesión: la misma pantalla privada. */
  readonly afterSignOutUrl: string;
  readonly children: React.ReactNode;
};

/**
 * Clerk acotado a las pantallas que piden la cuenta (`/ingresar`,
 * `/proveedores/reclamar`, `/proveedores/contratar` y `/cuenta`, desde el
 * `layout.tsx` anidado de cada una) y al flujo del alta de
 * `/proveedores/registro`, que lo monta `RegistroFlow` recién cuando la
 * persona abre el flujo (`?alta=1`, import diferido): desde la fase 5 del
 * rediseño, NINGUNA página indexable carga Clerk. NUNCA en `app/layout.tsx`.
 *
 * Sin `dynamic`: el provider no lee la sesión en el server (no llama a
 * `auth()`), la sesión la resuelve el browser. `proxy.ts` (2026-11-26) corre
 * `clerkMiddleware` SOLO en las rutas privadas y en `/ingresar`, para mandar
 * a `/ingresar` sin sesión; ninguna página pública lo paga (211, research D4).
 *
 * Idioma: `esUY` porque usa voseo ("Ingresá", "Seleccioná"), igual que el
 * resto del sitio; `esES` y `esMX` tutean.
 *
 * Apariencia: UNA sola, centralizada en `lib/auth/clerk-appearance.ts`.
 *
 * `SignupIntentSync`: guarda en Clerk la elección "cliente / taller" de una
 * cuenta nueva apenas hay sesión (`lib/auth/signup-intent.ts`).
 */
export function ScopedClerkProvider({ afterSignOutUrl, children }: ScopedClerkProviderProps) {
  return (
    <ClerkProvider localization={esUY} afterSignOutUrl={afterSignOutUrl} appearance={clerkAppearance}>
      <SignupIntentSync />
      {children}
    </ClerkProvider>
  );
}
