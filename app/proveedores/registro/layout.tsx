import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

/**
 * Clerk acotado al alta de talleres (spec 212, US3, research D16). El
 * formulario exige la cuenta de AutoLibre, así que `/proveedores/registro`
 * es la única página indexable que carga Clerk: los links hacia acá desde
 * páginas públicas van con `prefetch={false}` para no bajarlo antes de tiempo.
 */
export default function RegistroLayout({ children }: { readonly children: React.ReactNode }) {
  return <ScopedClerkProvider afterSignOutUrl={PROVEEDORES_REGISTRO_PATH}>{children}</ScopedClerkProvider>;
}
