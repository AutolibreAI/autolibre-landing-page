import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { PROVEEDORES_REGISTRO_FORMULARIO_PATH } from "@/lib/proveedores/query";

/**
 * Clerk acotado al formulario de alta (spec 212, US3, research D16). Es un
 * segmento HIJO de `/proveedores/registro`: la página indexable de registro
 * (el padre) no pasa por este layout y no carga Clerk.
 */
export default function RegistroFormularioLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <ScopedClerkProvider afterSignOutUrl={PROVEEDORES_REGISTRO_FORMULARIO_PATH}>{children}</ScopedClerkProvider>
  );
}
