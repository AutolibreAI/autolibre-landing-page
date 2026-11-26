"use client";

import { useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect } from "react";
import { REGISTRO_FLOW_ATTR } from "@/components/proveedores/registro/registro-flow-attr";
import type { ServiceFamilyOption } from "@/lib/autolibre-api";
import { PROVEEDORES_REGISTRO_FLOW_PARAM } from "@/lib/proveedores/query";

/**
 * El flujo con Clerk, en un chunk aparte que se pide SOLO al abrir el flujo
 * (`React.lazy`: el `import()` corre recién en el primer render del flujo).
 * Nunca está en el HTML del server: depende de la sesión del browser.
 */
const RegistroFlow = lazy(() =>
  import("@/components/proveedores/registro/registro-flow").then((module) => ({ default: module.RegistroFlow })),
);

type RegistroFlowMountProps = {
  readonly serviceFamilies: readonly ServiceFamilyOption[];
  /** "Cargando el registro…" ya renderizado en el server (no viaja copy en el JS). */
  readonly loading: React.ReactNode;
};

/**
 * Isla hoja de `/proveedores/registro`, SIN Clerk: decide si se abre el flujo
 * del alta. Abierto con `?alta=1` (los CTA de la landing) o `?next=` (viene de
 * la contratación). Mientras está abierto:
 *
 * - marca `<html data-registro-alta>`: el CSS esconde la landing (header y pie
 *   del sitio incluidos) y queda la pantalla de foco del flujo. El script
 *   inline del `<head>` del layout raíz (`REGISTRO_FLOW_SCRIPT`) pone la misma marca ANTES del primer paint cuando se
 *   carga la URL con el parámetro (vuelta del login de Google, recarga), así
 *   no se ve la landing un instante;
 * - monta `RegistroFlow` (Clerk) con `React.lazy`.
 *
 * Volver atrás (sin el parámetro) desmonta el flujo y vuelve la landing. Lee
 * la URL con `useSearchParams`: en una página estática eso exige un
 * `<Suspense>` (ver la página), cuyo fallback es el mismo "cargando", visible
 * solo con la marca puesta.
 */
export function RegistroFlowMount({ serviceFamilies, loading }: RegistroFlowMountProps) {
  const params = useSearchParams();
  const next = params.get("next");
  const open = params.has(PROVEEDORES_REGISTRO_FLOW_PARAM) || next !== null;

  useEffect(() => {
    const root = document.documentElement;
    if (!open) {
      root.removeAttribute(REGISTRO_FLOW_ATTR);
      return;
    }
    root.setAttribute(REGISTRO_FLOW_ATTR, "");
    window.scrollTo({ top: 0 });
    return () => root.removeAttribute(REGISTRO_FLOW_ATTR);
  }, [open]);

  if (!open) return null;
  return (
    <Suspense fallback={loading}>
      <RegistroFlow serviceFamilies={serviceFamilies} next={next} />
    </Suspense>
  );
}
