import { esUY } from "@clerk/localizations";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkAppearance } from "@/lib/auth/clerk-appearance";

type ScopedClerkProviderProps = {
  /** Adónde vuelve la persona al cerrar sesión: la misma pantalla privada. */
  readonly afterSignOutUrl: string;
  readonly children: React.ReactNode;
};

/**
 * Clerk acotado a las pantallas privadas de talleres (`/proveedores/reclamar`,
 * `/proveedores/contratar`, `/proveedores/registro/formulario` y `/cuenta`).
 * Se monta SOLO desde el `layout.tsx` anidado de cada una y NUNCA en
 * `app/layout.tsx`: ninguna página indexable carga JS de Clerk.
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
