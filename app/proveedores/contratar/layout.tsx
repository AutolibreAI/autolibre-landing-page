import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { PROVEEDORES_CONTRATAR_PATH } from "@/lib/proveedores/query";

/**
 * Clerk acotado a la contratación (spec 212, research D2): cubre
 * `/proveedores/contratar` y `/proveedores/contratar/resultado`. Nunca en
 * `app/layout.tsx`: la página de planes, que linkea acá, no carga Clerk.
 */
export default function ContratarLayout({ children }: { readonly children: React.ReactNode }) {
  return <ScopedClerkProvider afterSignOutUrl={PROVEEDORES_CONTRATAR_PATH}>{children}</ScopedClerkProvider>;
}
