/**
 * Marca en `<html>` mientras el flujo del alta está abierto. La pone el
 * script inline de la página (antes del primer paint) y la mantiene
 * `RegistroFlowMount`. Con ella, `in-data-[registro-alta]:hidden` esconde la
 * landing y `in-data-[registro-alta]:block` muestra el "cargando".
 *
 * Archivo aparte y sin imports: lo usa la isla de la landing y no tiene que
 * arrastrar copy al bundle.
 */
export const REGISTRO_FLOW_ATTR = "data-registro-alta";
