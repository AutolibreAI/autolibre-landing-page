import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { ACCOUNT_PATH } from "@/lib/account/paths";

/**
 * Clerk acotado al login dedicado, como en `/cuenta` y los flujos privados:
 * el provider vive en este layout anidado y NUNCA en `app/layout.tsx`. Sin
 * `PageShell`: `/ingresar` es una pantalla completa, sin el header ni el pie
 * del sitio.
 */
export default function IngresarLayout({ children }: { readonly children: React.ReactNode }) {
  return <ScopedClerkProvider afterSignOutUrl={ACCOUNT_PATH}>{children}</ScopedClerkProvider>;
}
