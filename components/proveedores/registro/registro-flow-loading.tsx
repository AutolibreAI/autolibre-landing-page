import { FlowMain, FlowShell } from "@/components/proveedores/flow/flow-shell";
import { providersContent } from "@/lib/content/providers";
import { PROVEEDORES_REGISTRO_FLOW_PARAM } from "@/lib/proveedores/query";
import { REGISTRO_FLOW_ATTR } from "@/components/proveedores/registro/registro-flow-attr";


/**
 * Script inline (va en el HTML del server, antes de la landing): si la URL
 * trae `?alta` o `?next`, marca `<html>` antes de pintar. Sin JS no corre y
 * se ve la landing, que es lo correcto (el flujo necesita JS).
 */
export const REGISTRO_FLOW_SCRIPT = `try{var p=new URLSearchParams(location.search);if(p.has("${PROVEEDORES_REGISTRO_FLOW_PARAM}")||p.has("next"))document.documentElement.setAttribute("${REGISTRO_FLOW_ATTR}","")}catch(e){}`;

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
