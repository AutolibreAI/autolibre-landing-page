/**
 * Marca LOCAL de "esta cuenta ya mandó una solicitud de alta" para que el
 * estado "en revisión" sobreviva a un refresh de `/proveedores/registro?alta=1`.
 *
 * Existe porque el backend todavía no expone el estado de la solicitud
 * (`partner_applications`) a su dueño: es una pista de UI, no un dato. Va
 * atada al id de Clerk, así otra cuenta en el mismo navegador no la hereda.
 * La fuente de verdad sigue siendo la membresía: si la cuenta ya es dueña de
 * un taller, se muestra el taller y la marca se borra.
 */
const PREFIX = "al_alta_enviada:";

/** Vence a los 60 días: una solicitud descartada no deja la pantalla trabada para siempre. */
const MAX_AGE_MS = 60 * 24 * 60 * 60 * 1000;

function key(userId: string): string {
  return `${PREFIX}${userId}`;
}

export function markApplicationSent(userId: string): void {
  try {
    window.localStorage.setItem(key(userId), String(Date.now()));
  } catch {
    // Sin storage: el "en revisión" no sobrevive al refresh, como antes.
  }
}

export function hasSentApplication(userId: string): boolean {
  try {
    const raw = window.localStorage.getItem(key(userId));
    if (!raw) return false;
    const sentAt = Number(raw);
    if (!Number.isFinite(sentAt) || Date.now() - sentAt > MAX_AGE_MS) {
      window.localStorage.removeItem(key(userId));
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function clearApplicationSent(userId: string): void {
  try {
    window.localStorage.removeItem(key(userId));
  } catch {
    return;
  }
}
