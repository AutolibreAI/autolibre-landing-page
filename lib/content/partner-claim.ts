import { partnerAccountContent } from "@/lib/content/partner-account";
import type { RedeemFailureKind } from "@/lib/partner-claims/redeem";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";

/**
 * Copy de la pantalla de canje del código de reclamo (`/proveedores/reclamar`,
 * spec 211). Es una pantalla privada (`noindex`): no hay contenido citable,
 * solo lo justo para que el dueño del taller canjee su código.
 *
 * El login es el compartido de `lib/content/partner-account.ts`.
 */

/**
 * Un mensaje por cada rechazo. El de `invalid-code` es UNO solo a propósito:
 * el backend responde 404 sea cual sea la causa (no existe, venció, se usó,
 * taller archivado o con dueño) y la pantalla no puede insinuar ninguna. Las
 * causas posibles se listan TODAS juntas en `invalidCode.causes`.
 */
const errorMessages: Record<RedeemFailureKind, string> = {
  "invalid-code": "No pudimos canjear ese código.",
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

  eyebrow: "Talleres",
  title: "Reclamá tu taller",
  intro:
    "Si el equipo de AutoLibre te mandó un código, canjealo acá para administrar el perfil de tu taller. Usá la misma cuenta que en la app.",

  /** Columna de contexto del login: qué viene después de entrar. */
  steps: {
    label: "Cómo es el reclamo",
    items: [
      { id: "cuenta", label: "Entrá o creá tu cuenta", description: "La misma de la app de AutoLibre." },
      { id: "codigo", label: "Escribí tu código", description: "El que te mandó el equipo de AutoLibre." },
      { id: "administrar", label: "Administrá tu taller", description: "Elegí un plan y completá tu perfil." },
    ],
  },

  /** Contexto al costado del paso (arriba en mobile): qué es el código. */
  about: {
    title: "Sobre el código de reclamo",
    items: [
      {
        term: "Qué es",
        description: "Una clave que te manda el equipo de AutoLibre para vincular tu taller a tu cuenta.",
      },
      {
        term: "Cómo se pide",
        description: "Escribile al equipo de AutoLibre por WhatsApp: verificamos que sos el dueño y te lo mandamos.",
      },
      {
        term: "Cuánto dura",
        description: "Vence a los 7 días. Si se te venció, pedí uno nuevo.",
      },
    ],
    requestCta: "Pedir mi código por WhatsApp",
    whatsappMessage: "Hola! Quiero reclamar mi taller en AutoLibre. ¿Me pasan el código?",
  },

  form: {
    title: "Escribí tu código",
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

  /**
   * Acompaña al error de `invalid-code`: TODAS las causas posibles juntas,
   * sin decir cuál fue (FR-010), y la salida: pedir otro código.
   */
  invalidCode: {
    causes:
      "Puede que haya vencido (duran 7 días), que ya se haya usado o que el taller ya tenga dueño. Si sos el dueño, pedí un código nuevo.",
    requestNew: "Pedir un código nuevo",
    whatsappMessage:
      "Hola! Quiero reclamar mi taller en AutoLibre y el código que tengo no funciona. ¿Me pasan uno nuevo?",
  },

  /** Volver a iniciar sesión después de un 401, sin perder el código. */
  reauth: partnerAccountContent.reauth,

  success: {
    title: (partnerName: string) => `¡Listo! Ya administrás ${partnerName}`,
    titleWithoutName: "¡Listo! Ya administrás tu taller",
    body: "Desde ahora figurás como dueño del taller en AutoLibre.",
    nextTitle: "Próximos pasos",
    plans: {
      title: "Elegí tu plan",
      body: "Con el plan Gratis tu taller ya aparece en la red. Con un plan pago recibís más pedidos por WhatsApp.",
      cta: "Elegí tu plan",
      href: PROVEEDORES_PLANES_PATH,
    },
    /**
     * Hoy el taller se administra desde la app (2026-11-04). Cuando exista el
     * panel para talleres, este bloque apunta ahí.
     */
    app: {
      title: "Administrá tu perfil desde la app",
      body: "Entrá a la app de AutoLibre con esta misma cuenta para completar el perfil de tu taller.",
    },
    /**
     * Cuando el reclamo vino de la contratación de un plan (spec 212): el
     * próximo paso principal es volver a esa contratación.
     */
    continueCheckout: {
      title: "Seguí con tu plan",
      text: "Ya podés seguir con la contratación del plan que elegiste.",
      cta: "Seguir con la contratación",
    },
  },
} as const;
