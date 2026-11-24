"use client";

import { ScopedClerkProvider } from "@/components/auth/scoped-clerk-provider";
import { RegisterFormGate } from "@/components/proveedores/registro/register-form-gate";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

type RegistroFlowProps = {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  readonly next: string | null;
};

/**
 * El flujo del alta CON Clerk. Este módulo es el ÚNICO de
 * `/proveedores/registro` que importa Clerk, y lo carga `RegistroFlowMount`
 * con `next/dynamic` recién cuando se abre el flujo (`?alta=1` o `?next=`):
 * la landing pública no baja ni un byte de Clerk (antes, 395 KB y ~1 s de
 * bloqueo en celular). El provider vive acá y no en un `layout.tsx` de la
 * ruta por eso mismo.
 */
export function RegistroFlow({ serviceFamilies, next }: RegistroFlowProps) {
  return (
    <ScopedClerkProvider afterSignOutUrl={PROVEEDORES_REGISTRO_PATH}>
      <RegisterFormGate serviceFamilies={serviceFamilies} next={next} />
    </ScopedClerkProvider>
  );
}
