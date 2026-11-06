import { ACCOUNT_PATH } from "@/lib/account/paths";
import {
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_REGISTRO_FORMULARIO_PATH,
} from "@/lib/proveedores/query";

/**
 * Copy de la cuenta de talleres: la fila "Sesión iniciada como…" de las
 * pantallas privadas (`AccountBar`) y la página `/cuenta` ("Mi cuenta").
 * Pantallas privadas (`noindex`): no hay contenido citable.
 */
export const accountContent = {
  /** Fila de sesión de las pantallas privadas y de `/cuenta`. */
  bar: {
    label: "Tu sesión",
    signedInAs: "Sesión iniciada como",
    /** Sin email ni nombre en la cuenta (raro, pero posible). */
    fallbackName: "tu cuenta de AutoLibre",
    switchAccount: "Usar otra cuenta",
    signOut: "Cerrar sesión",
    signingOut: "Cerrando sesión…",
  },

  /** Link secundario desde los éxitos y avisos de los flujos. */
  link: { label: "Ir a mi cuenta", href: ACCOUNT_PATH },

  page: {
    meta: {
      title: "Mi cuenta",
      description: "Tu cuenta de AutoLibre para talleres: tus talleres, el estado de sus planes y la sesión.",
    },
    eyebrow: "Talleres",
    title: "Mi cuenta",
    intro: "Tus talleres en AutoLibre y el estado de sus planes.",
    signInIntro: "Entrá para ver tus talleres y el estado de sus planes.",

    partners: {
      title: "Tus talleres",
      loading: "Buscando tus talleres…",
      error: "No pudimos cargar tus talleres. Probá de nuevo en un rato.",
      unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para ver tus talleres.",
      retry: "Reintentar",
    },

    /** Estado del plan de cada taller (de `GET /partners/{id}/subscription`). */
    plan: {
      loading: "Consultando el plan…",
      error: "No pudimos consultar el plan de este taller.",
      free: "Plan Gratis",
      named: (planName: string) => `Plan ${planName}`,
      unnamed: "Plan pago",
      status: {
        active: "Activo",
        trialing: (date: string | null) => (date ? `En prueba hasta el ${date}` : "En período de prueba"),
        pending: "Pago pendiente de confirmación",
        canceled: (date: string | null) => (date ? `Baja pedida: activo hasta el ${date}` : "Baja pedida"),
        other: "Sin confirmar",
      },
    },

    actions: {
      /** Sin plan pago: contratar (el plan se cambia en la tarjeta del checkout). */
      choose: "Contratar el plan Plus",
      allPlans: { label: "Ver todos los planes", href: PROVEEDORES_PLANES_PATH },
      /** `pending`: la pantalla de resultado consulta el estado y ofrece reintentar. */
      pending: "Ver el estado del pago",
      /** Plan activo: no hay cambio de plan online. */
      changePlan: "Cambiar de plan con ventas",
      changePlanWhatsapp: (partnerName: string, planName: string | null) =>
        planName
          ? `Hola! Mi taller ${partnerName} tiene el plan ${planName} de AutoLibre y quiero cambiar de plan.`
          : `Hola! Mi taller ${partnerName} tiene un plan de AutoLibre y quiero cambiar de plan.`,
    },

    /**
     * Baja de un plan pago (`POST /partners/{id}/subscription/cancellation`).
     * Se confirma en la misma fila, sin `window.confirm`.
     */
    cancel: {
      trigger: "Cancelar suscripción",
      title: (partnerName: string) => `¿Cancelar la suscripción de ${partnerName}?`,
      /** `date`: fin de la prueba si está en prueba; si no, fin del período pago. */
      keepsPlan: (planLabel: string, date: string | null) =>
        date
          ? `Tu taller mantiene el ${planLabel} hasta el ${date}. Después pasa al plan Gratis y no se te vuelve a cobrar.`
          : `Tu taller mantiene el ${planLabel} hasta el final del período en curso. Después pasa al plan Gratis y no se te vuelve a cobrar.`,
      trialUsed: "Si cancelás durante la prueba, la prueba cuenta como usada: si más adelante volvés a contratar, el plan se cobra desde el primer mes.",
      mercadoPagoWarning:
        "Cancelá desde acá y no desde tu cuenta de Mercado Pago: si la cancelás allá, tu taller pierde el plan en el momento, aunque ya hayas pagado el mes.",
      confirm: "Sí, cancelar la suscripción",
      confirming: "Cancelando…",
      keep: "No, mantener el plan",
      success: (date: string | null) =>
        date
          ? `Listo, cancelamos la suscripción. Tu taller mantiene el plan hasta el ${date} y después pasa a Gratis.`
          : "Listo, cancelamos la suscripción. Tu taller mantiene el plan hasta el final del período y después pasa a Gratis.",
      /** `accessUntil: null`: solo había un pago sin confirmar, y se canceló. */
      successPending: "Listo, la contratación pendiente quedó cancelada. Tu taller sigue en el plan Gratis.",
      errors: {
        retryable: "No pudimos cancelar la suscripción y no se cambió nada. Probá de nuevo en un momento.",
        notFound:
          "No pudimos cancelar la suscripción de este taller. Actualizá la página para ver el estado actual de su plan.",
        unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para cancelar la suscripción.",
      },
      retry: "Reintentar",
    },
  },

  /**
   * Sumar otro taller a la cuenta. `/cuenta` y `/proveedores/reclamar` son las
   * únicas pantallas que pueden nombrar el código de reclamo (ambas
   * `noindex`): este copy no se reutiliza en páginas públicas.
   */
  more: {
    title: "¿Tenés otro taller?",
    body: "Sumalo a tu cuenta para manejarlo desde acá.",
    register: {
      label: "Cargar otro taller",
      description: "Si todavía no aparece en AutoLibre.",
      href: PROVEEDORES_REGISTRO_FORMULARIO_PATH,
    },
    claim: {
      label: "Reclamar un taller",
      description: "Si ya aparece en AutoLibre y te dimos un código de reclamo.",
      href: PROVEEDORES_RECLAMAR_PATH,
    },
  },
} as const;
