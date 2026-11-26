import { useSyncExternalStore } from "react";
import { isSignupIntent, type SignupIntent } from "@/lib/auth/signup-intent";

/**
 * Intent PENDIENTE de guardar: lo eligió la persona (o lo fijó un flujo de
 * proveedor) antes de tener cuenta, y viaja en `sessionStorage` hasta que hay
 * sesión y `SignupIntentSync` lo manda a `POST /api/account/intent`.
 *
 * `sessionStorage` y no la URL: sobrevive a la ida y vuelta de Google, a la
 * verificación por código y a las recargas de la misma pestaña, y no queda en
 * el historial. Se borra cuando el server responde algo definitivo (guardado,
 * ya existía o ventana cerrada); ante un error de red o del server queda y se
 * reintenta en la próxima carga de una pantalla con Clerk.
 *
 * Es solo una preferencia de la persona: el server decide si la guarda.
 */
const STORAGE_KEY = "al_signup_intent";

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function readPendingSignupIntent(): SignupIntent | null {
  try {
    const value = window.sessionStorage.getItem(STORAGE_KEY);
    return isSignupIntent(value) ? value : null;
  } catch {
    return null;
  }
}

export function setPendingSignupIntent(intent: SignupIntent) {
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === intent) return;
    window.sessionStorage.setItem(STORAGE_KEY, intent);
  } catch {
    // Sin storage (modo privado estricto): el intent no viaja; la cuenta
    // queda como cliente y `/cuenta` ofrece "Sumá tu negocio".
  }
  emit();
}

export function clearPendingSignupIntent() {
  try {
    if (window.sessionStorage.getItem(STORAGE_KEY) === null) return;
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    return;
  }
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** El intent pendiente, reactivo. `null` en el server y en la hidratación. */
export function usePendingSignupIntent(): SignupIntent | null {
  return useSyncExternalStore(subscribe, readPendingSignupIntent, () => null);
}
