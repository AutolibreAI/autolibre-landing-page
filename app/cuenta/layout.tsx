import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { ACCOUNT_PATH } from "@/lib/account/paths";

/**
 * Clerk acotado a "Mi cuenta", igual que `/proveedores/reclamar` y
 * `/proveedores/contratar`: el provider vive en este layout anidado y NUNCA
 * en `app/layout.tsx`, así ninguna página indexable carga JS de Clerk.
 */
export default function CuentaLayout({ children }: { readonly children: React.ReactNode }) {
  return <ScopedClerkProvider afterSignOutUrl={ACCOUNT_PATH}>{children}</ScopedClerkProvider>;
}
