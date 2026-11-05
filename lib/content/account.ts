import { ACCOUNT_PATH } from "@/lib/account/paths";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";

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
  },
} as const;
