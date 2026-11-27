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
    title: "Reclamá tu negocio",
    description:
      "Canjeá el código que te mandó el equipo de AutoLibre para administrar el perfil de tu negocio en la red.",
  },

  eyebrow: "Talleres y servicios",
  title: "Reclamá tu negocio",
  intro:
    "Si el equipo de AutoLibre te mandó un código, canjealo acá para administrar el perfil de tu negocio.",
  /** Bajada del panel de login. */
  signInIntro: "Para reclamar tu negocio necesitás una cuenta de AutoLibre. Es la misma de la app.",
  /** Con qué cuenta queda vinculado (fila debajo del formulario). */
  linkedTo: "Lo vas a vincular a la cuenta de",
  switchAccount: "Usar otra cuenta",

  /** Contexto al costado del paso (arriba en mobile): qué es el código. */
  about: {
    title: "Sobre el código de reclamo",
    items: [
      {
        term: "Qué es",
        description: "Una clave que te manda el equipo de AutoLibre para vincular tu negocio a tu cuenta.",
      },
      {
        term: "Cómo se pide",
        description: "Escribile al equipo por WhatsApp: verificamos que sos el dueño y te lo mandamos.",
      },
      {
        term: "Cuánto dura",
        description: "Vence a los 7 días. Si se te venció, pedí uno nuevo.",
      },
    ],
    requestCta: "Pedir mi código por WhatsApp",
    registerPrefix: "¿Tu negocio todavía no está en AutoLibre?",
    registerCta: "Registralo gratis",
    whatsappMessage: "Hola! Quiero reclamar mi taller en AutoLibre. ¿Me pasan el código?",
  },

  form: {
    title: "Escribí tu código",
    label: "Código de reclamo",
    placeholder: "Ej: AL-7K3P-Q9",
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
      "Puede que haya vencido (duran 7 días), que ya se haya usado o que el negocio ya tenga dueño. Si sos el dueño, pedí un código nuevo.",
    requestNew: "Pedir un código nuevo",
    whatsappMessage:
      "Hola! Quiero reclamar mi taller en AutoLibre y el código que tengo no funciona. ¿Me pasan uno nuevo?",
  },

  /** Volver a iniciar sesión después de un 401, sin perder el código. */
  reauth: partnerAccountContent.reauth,

  success: {
    title: (partnerName: string) => `¡Listo! Ya administrás ${partnerName}`,
    titleWithoutName: "¡Listo! Ya administrás tu negocio",
    body: "Desde ahora figurás como dueño del negocio en AutoLibre.",
    /** Supuesto de DECISIONES: el próximo paso lleva a "Mi negocio" (`/cuenta`). */
    profile: {
      title: "Revisá tu perfil",
      body: "Mirá cómo te ven en la app y completá lo que falte.",
    },
    nextTitle: "Próximos pasos",
    plans: {
      title: "Conocé los precios",
      body: "El primer trabajo que te acercamos es gratis. A partir del segundo, pagás un precio fijo por cada trabajo nuevo confirmado.",
      cta: "Ver los precios",
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
