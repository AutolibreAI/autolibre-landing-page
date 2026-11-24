/**
 * Texto de "¿Qué le pasa?" que se escribe FUERA de `/pedido` (banda del
 * directorio, tarjeta del perfil de proveedor) y llega al módulo de pedido ya
 * cargado. Viaja por `sessionStorage` y NO por la URL: lo que escribe la
 * persona no puede terminar en el `$pageview` de PostHog, en el `PageView`
 * de Meta ni en los logs (regla de `lib/analytics/events.ts`: nunca lo que
 * escribe la persona).
 *
 * Se lee una sola vez y se borra: volver a `/pedido` otro día no trae un
 * texto viejo.
 */

const KEY = "al_pedido_que";
/** Tope defensivo: es una descripción corta, no un documento. */
const MAX_LENGTH = 500;

export function savePedidoPrefill(text: string): void {
  const value = text.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);
  try {
    if (value) window.sessionStorage.setItem(KEY, value);
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Sin almacenamiento (modo privado estricto): el pedido arranca vacío.
  }
}

/** El texto guardado (y lo borra), o `""`. */
export function takePedidoPrefill(): string {
  try {
    const value = window.sessionStorage.getItem(KEY) ?? "";
    window.sessionStorage.removeItem(KEY);
    return value.slice(0, MAX_LENGTH);
  } catch {
    return "";
  }
}
