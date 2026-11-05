import type { RedeemFailureKind } from "@/lib/partner-claims/redeem";

/**
 * Copy de la pantalla de canje del código de reclamo (`/proveedores/reclamar`,
 * spec 211). Es una pantalla privada (`noindex`): no hay contenido citable,
 * solo lo justo para que el dueño del taller canjee su código.
 */

/**
 * Un mensaje por cada rechazo. El de `invalid-code` es UNO solo a propósito:
 * el backend responde 404 sea cual sea la causa (no existe, venció, se usó,
 * taller archivado o con dueño) y la pantalla no puede insinuar ninguna.
 */
const errorMessages: Record<RedeemFailureKind, string> = {
  "invalid-code": "El código no es válido o ya venció. Pedile uno nuevo al equipo de AutoLibre.",
  "invalid-input": "Revisá el código: tiene que tener entre 1 y 32 caracteres.",
  unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para canjear el código: lo que escribiste queda guardado.",
  "rate-limited": "Hiciste muchos intentos. Esperá un minuto y probá de nuevo.",
  unknown: "No pudimos procesar el canje. Probá de nuevo en un rato.",
};

export const partnerClaimContent = {
  meta: {
    title: "Reclamá tu taller",
    description:
      "Canjeá el código que te mandó el equipo de AutoLibre para administrar el perfil de tu taller en la red.",
  },

  title: "Reclamá tu taller",
  intro:
    "Si el equipo de AutoLibre te mandó un código, canjealo acá para administrar el perfil de tu taller. Usá la misma cuenta que en la app.",

  signIn: {
    title: "Iniciá sesión o creá tu cuenta",
    body: "Primero entrá con tu cuenta de AutoLibre. Después escribís el código.",
    loading: "Cargando el inicio de sesión…",
  },

  form: {
    label: "Código de reclamo",
    hint: "Escribilo tal como te llegó. No importan las mayúsculas ni los guiones.",
    submit: "Canjear código",
    submitting: "Canjeando…",
  },

  /** Error local, antes de mandar nada (no consume un intento). */
  validation: {
    empty: "Escribí el código que te mandó el equipo de AutoLibre.",
    tooLong: "El código tiene como máximo 32 caracteres. Revisá que esté bien copiado.",
  },

  errors: errorMessages,

  /** Volver a iniciar sesión después de un 401, sin perder el código. */
  reauth: "Iniciar sesión de nuevo",

  success: {
    title: (partnerName: string) => `¡Listo! Ya administrás ${partnerName}`,
    titleWithoutName: "¡Listo! Ya administrás tu taller",
    body: "Desde ahora figurás como dueño del taller en AutoLibre.",
    /**
     * Próximo paso: hoy el taller se administra desde la app (2026-11-04).
     * Cuando exista el panel para talleres, este bloque apunta ahí.
     */
    nextStep: {
      text: "Para administrar tu taller, entrá a la app de AutoLibre con esta misma cuenta.",
      appStore: "Descargar en App Store",
      playStore: "Descargar en Google Play",
    },
    /**
     * Cuando el reclamo vino de la contratación de un plan (spec 212): el
     * próximo paso es volver a esa contratación.
     */
    continueCheckout: {
      text: "Ya podés seguir con la contratación del plan que elegiste.",
      cta: "Seguir con la contratación",
    },
  },
} as const;
