"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef } from "react";
import { ANALYTICS_EVENTS } from "@/lib/analytics/events";
import { track } from "@/lib/analytics/track";
import { clearPendingSignupIntent, usePendingSignupIntent } from "@/lib/auth/pending-signup-intent";
import { readSignupIntent } from "@/lib/auth/signup-intent";
import { saveSignupIntent } from "@/lib/auth/signup-intent-client";

/**
 * Guarda el intent pendiente (`sessionStorage`) apenas hay sesión: un
 * `POST /api/account/intent` por carga de página, con el Bearer de Clerk.
 * No pinta nada. Vive en `ScopedClerkProvider`, así cubre `/cuenta` y los
 * flujos de proveedor (alta, reclamo, contratar), que desmontan el login al
 * entrar.
 *
 * - Si la cuenta ya tiene intent, no llama: borra el pendiente.
 * - `saved` / `existing`: recarga el usuario de Clerk (así `useUser` trae la
 *   metadata nueva) y borra el pendiente.
 * - `rejected` (cuenta de más de 30 minutos): borra el pendiente.
 * - `failed`: lo deja; se reintenta en la próxima carga. Nunca bloquea.
 */
export function SignupIntentSync() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const pending = usePendingSignupIntent();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user || !pending || attempted.current) return;
    if (readSignupIntent(user.publicMetadata)) {
      clearPendingSignupIntent();
      return;
    }
    attempted.current = true;
    void saveSignupIntent(pending, () => getToken()).then(async (result) => {
      track(ANALYTICS_EVENTS.signupIntentSaved, {
        intent: result.kind === "saved" || result.kind === "existing" ? result.intent : pending,
        result: result.kind,
      });
      if (result.kind === "failed") return;
      if (result.kind !== "rejected") {
        try {
          await user.reload();
        } catch {
          // La metadata llega en la próxima carga; la pantalla ya usa el pendiente.
        }
      }
      clearPendingSignupIntent();
    });
  }, [isLoaded, isSignedIn, user, pending, getToken]);

  return null;
}
