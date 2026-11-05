import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { PROVEEDORES_RECLAMAR_PATH } from "@/lib/proveedores/query";

/**
 * Clerk acotado al canje (research D3): el provider vive en este layout
 * anidado y NUNCA en `app/layout.tsx`, así ninguna página indexable carga
 * JS de Clerk (FR-006, SC-004). La configuración (idioma, sin `dynamic`) es
 * la compartida con `/proveedores/contratar` (spec 212).
 */
export default function ReclamarLayout({ children }: { readonly children: React.ReactNode }) {
  return <ScopedClerkProvider afterSignOutUrl={PROVEEDORES_RECLAMAR_PATH}>{children}</ScopedClerkProvider>;
}
