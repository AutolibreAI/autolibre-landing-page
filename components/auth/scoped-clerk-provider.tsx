import { esUY } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";

type ScopedClerkProviderProps = {
  /** Adónde vuelve la persona al cerrar sesión: la misma pantalla privada. */
  readonly afterSignOutUrl: string;
  readonly children: React.ReactNode;
};

/**
 * Clerk acotado a las pantallas de talleres que piden la cuenta
 * (`/proveedores/reclamar`, `/proveedores/contratar`, `/proveedores/registro`
 * y `/cuenta`). Se monta SOLO desde el `layout.tsx` anidado de cada una y
 * NUNCA en `app/layout.tsx`. La única indexable que lo carga es
 * `/proveedores/registro` (la página ES el formulario del alta desde el
 * 2026-11-05); los links públicos hacia ella van sin prefetch.
 *
 * Sin `dynamic`: el provider no lee la sesión en el server (no llama a
 * `auth()`), la sesión la resuelve el browser y no hace falta
 * `clerkMiddleware` / `proxy.ts` (211, research D4).
 *
 * Idioma: `esUY` porque usa voseo ("Ingresá", "Seleccioná"), igual que el
 * resto del sitio; `esES` y `esMX` tutean.
 *
 * Apariencia: UNA sola, centralizada en `lib/auth/clerk-appearance.ts`.
 */
export function ScopedClerkProvider({ afterSignOutUrl, children }: ScopedClerkProviderProps) {
  return (
    <ClerkProvider localization={esUY} afterSignOutUrl={afterSignOutUrl} appearance={clerkAppearance}>
      {children}
    </ClerkProvider>
  );
}
