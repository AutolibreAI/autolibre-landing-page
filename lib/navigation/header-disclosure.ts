/**
 * Aviso entre los paneles del header (el menú de cuenta y el submenú de
 * "Proveedores") para que haya UNO solo abierto a la vez. Son dos islas
 * separadas sin estado en común: la que se abre lo avisa con un evento en
 * `document` y la otra se cierra. Sin contexto ni store: no hay un padre
 * client que las envuelva (el header es un Server Component).
 *
 * Solo para el navegador: se llama desde efectos.
 */
const HEADER_DISCLOSURE_EVENT = "autolibre:header-disclosure-open";

/** Avisa que el panel `id` se abrió. */
export function announceHeaderDisclosure(id: string): void {
  document.dispatchEvent(new CustomEvent<string>(HEADER_DISCLOSURE_EVENT, { detail: id }));
}

/** Llama a `onOther` cuando se abre un panel que no es `id`. Devuelve la baja. */
export function onOtherHeaderDisclosure(id: string, onOther: () => void): () => void {
  function listener(event: Event) {
    if ((event as CustomEvent<string>).detail !== id) onOther();
  }
  document.addEventListener(HEADER_DISCLOSURE_EVENT, listener);
  return () => document.removeEventListener(HEADER_DISCLOSURE_EVENT, listener);
}
