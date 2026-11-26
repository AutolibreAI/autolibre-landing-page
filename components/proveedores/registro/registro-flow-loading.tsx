import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_REGISTRO_FLOW_PARAM, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";
import { REGISTRO_FLOW_ATTR } from "@/components/proveedores/registro/registro-flow-attr";


/**
 * Script inline: si la URL es `/proveedores/registro` y trae `?alta` o
 * `?next`, marca `<html>` antes de pintar. Sin JS no corre y se ve la
 * landing, que es lo correcto (el flujo necesita JS).
 *
 * Vive en el `<head>` del layout raíz y NO en la página: el layout solo se
 * renderiza en la carga dura, pero la página también se renderiza en el
 * cliente al navegar hacia ella (el CTA "Sumá tu negocio"), y ahí React 19
 * tira "Encountered a script tag while rendering React component" (el script
 * nunca corre en el cliente). En la navegación del cliente la marca la pone
 * `RegistroFlowMount` en su efecto, así que acá alcanza con la carga dura.
 */
export const REGISTRO_FLOW_SCRIPT = `try{var p=new URLSearchParams(location.search);if(location.pathname.replace(/\\/$/,"")==="${PROVEEDORES_REGISTRO_PATH}"&&(p.has("${PROVEEDORES_REGISTRO_FLOW_PARAM}")||p.has("next")))document.documentElement.setAttribute("${REGISTRO_FLOW_ATTR}","")}catch(e){}`;

const { flow } = providersContent;

/**
 * "Cargando el registro…" con la pantalla de foco del flujo: mientras baja el
 * chunk de Clerk (o antes de hidratar, en el fallback del `<Suspense>`).
 * Sin estado ni hooks: sirve en el server y en la isla.
 */
export function RegistroFlowLoading({ landmarks = true }: { readonly landmarks?: boolean }) {
  return (
    <FlowShell helpMessage={flow.help.whatsappMessage} helpPlacement="registro_encabezado" landmarks={landmarks}>
      <FlowMain>
        <p role="status" className="mx-auto max-w-110 text-fg-muted">
          {flow.loading}
        </p>
      </FlowMain>
    </FlowShell>
  );
}
