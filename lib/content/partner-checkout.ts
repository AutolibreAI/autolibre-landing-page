import { providersPlansContent } from "@/lib/content/providers-plans";
import { LANDING_PLAN_ID_TO_CODE, type CheckoutFailureKind } from "@/lib/partner-billing/checkout";
import { PROVEEDORES_PLANES_PATH, PROVEEDORES_REGISTRO_FORMULARIO_PATH } from "@/lib/proveedores/query";

/**
 * Copy de la contratación de un plan pago (`/proveedores/contratar` y
 * `/proveedores/contratar/resultado`, spec 212). Pantallas privadas
 * (`noindex`): no hay contenido citable, solo lo justo para contratar.
 *
 * Nada de acá promete algo que el backend no confirma: la prueba depende de
 * `trialEligible` (FR-017) y el pago se confirma solo con el estado del
 * backend. El TEXTO de los términos comerciales no vive acá: sale de
 * `GET /billing/terms` (research D15); acá solo está la copy de la UI.
 */

/** Nombre del plan como en la página de planes (FR-013), por `code` del backend. */
export function planDisplayName(code: string): string | null {
  const entry = Object.entries(LANDING_PLAN_ID_TO_CODE).find(([, planCode]) => planCode === code);
  if (!entry) return null;
  return providersPlansContent.plans.find((plan) => plan.id === entry[0])?.name ?? null;
}

/** Un mensaje por cada rechazo del checkout (research D9). */
const checkoutErrors: Record<CheckoutFailureKind, string> = {
  "payer-email-rejected":
    "Mercado Pago rechazó ese email. Escribí el email de la cuenta de Mercado Pago con la que vas a pagar y probá de nuevo.",
  "invalid-input": "No pudimos validar los datos. Revisá el email y probá de nuevo.",
  unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para seguir con la contratación.",
  disabled: "La contratación online no está disponible ahora. Si querés contratar un plan, hablá con ventas.",
  "not-found": "No encontramos ese taller en tu cuenta.",
  "terms-outdated":
    "Los términos comerciales cambiaron mientras estabas en esta pantalla. Leé la versión nueva y aceptala para seguir.",
  "already-live": "Tu taller ya tiene un plan activo.",
  "in-progress": "Ya hay un pago en curso para este taller. Esperá un momento y probá de nuevo.",
  "rate-limited": "Hiciste muchos intentos. Esperá un minuto y probá de nuevo.",
  unavailable: "Mercado Pago no responde en este momento. No se te cobró nada: probá de nuevo en unos minutos.",
  unknown: "No pudimos iniciar el pago. No se te cobró nada: probá de nuevo en un rato.",
};

export const partnerCheckoutContent = {
  meta: {
    title: "Contratar un plan para tu taller",
    description:
      "Elegí el taller, revisá el resumen del plan y pagalo con Mercado Pago desde tu cuenta de AutoLibre.",
  },

  title: (planName: string) => `Contratá el plan ${planName}`,
  intro: "Usá la misma cuenta de AutoLibre que en la app. El pago se hace en Mercado Pago.",

  /** `?plan=` que no es un plan pago (o es el gratis). */
  invalidPlan: {
    title: "Elegí un plan para contratar",
    body: "Ese plan no existe o no se contrata online. Mirá los planes disponibles y elegí el que te sirva.",
    cta: { label: "Ver los planes", href: PROVEEDORES_PLANES_PATH },
  },

  signIn: {
    title: "Iniciá sesión o creá tu cuenta",
    body: "Primero entrá con tu cuenta de AutoLibre. Después elegís el taller y confirmás el plan.",
    loading: "Cargando el inicio de sesión…",
  },

  loading: "Buscando tus talleres…",
  partnersError: "No pudimos cargar tus talleres. Probá de nuevo en un rato.",
  plansError: "No pudimos cargar el precio del plan. Sin el precio no podemos seguir: probá de nuevo.",
  planUnavailable: "Este plan no está disponible para contratar online en este momento.",
  retry: "Reintentar",
  reauth: "Iniciar sesión de nuevo",

  /** Sesión iniciada pero sin talleres como dueño (US2). */
  noPartner: {
    title: "Para contratar un plan necesitás un taller en tu cuenta",
    body: "Tu cuenta todavía no figura como dueña de ningún taller. Elegí cómo seguir:",
    claim: {
      title: "Mi taller ya está en AutoLibre",
      body: "Canjeá el código que te mandó el equipo de AutoLibre para vincular el taller a tu cuenta. Después volvés a este plan.",
      cta: "Reclamar mi taller",
    },
    requestCode: {
      label: "¿No tenés el código? Pedíselo al equipo por WhatsApp",
      whatsappMessage: "Hola! Quiero contratar un plan para mi taller y necesito el código para reclamarlo en AutoLibre.",
    },
    register: {
      title: "Todavía no lo registré",
      body: "Registralo gratis con esta misma cuenta. Cuando aprobemos tu taller, queda en tu cuenta y vas a poder contratar el plan.",
      cta: "Registrar mi taller",
      // Directo al formulario (spec 212, US3): la persona ya tiene sesión.
      href: PROVEEDORES_REGISTRO_FORMULARIO_PATH,
    },
  },

  partnerPicker: {
    legend: "¿A qué taller le aplicás el plan?",
    required: "Elegí el taller al que le aplicás el plan.",
  },

  summary: {
    title: "Resumen",
    plan: "Plan",
    price: "Precio",
    partner: "Taller",
    /** Aclaración del precio según `priceIncludesVat` del backend. */
    priceNote: (includesVat: boolean) => (includesVat ? "por mes, IVA incluido" : "por mes + IVA"),
    /**
     * Prueba (una vez por taller en su vida), según `trialEligible` de
     * `GET /partners/{id}/subscription` (research D15). Sin el dato, el texto
     * condicional: nunca se promete (FR-017).
     */
    trial: {
      eligible: (trialDays: number) => `Incluye ${trialDays} días de prueba sin cargo.`,
      used: "Tu taller ya usó su período de prueba: el plan se cobra desde el primer mes.",
      conditional: (trialDays: number) =>
        `Si es la primera vez que tu taller contrata un plan, tenés ${trialDays} días de prueba sin cargo. Si ya la usó, el cobro arranca cuando confirmás en Mercado Pago.`,
      loading: "Revisando si a tu taller le corresponde el período de prueba…",
    },
    loadingPrice: "Cargando el precio…",
  },

  payerEmail: {
    label: "Email de tu cuenta de Mercado Pago",
    hint: "Tiene que ser el email de la cuenta de Mercado Pago con la que vas a pagar. Si no coincide, Mercado Pago rechaza el pago.",
    empty: "Escribí el email de tu cuenta de Mercado Pago.",
    invalid: "Revisá el email: no parece válido.",
  },

  /** Solo la copy de la UI: el texto y la versión salen de `GET /billing/terms`. */
  terms: {
    summary: "Leer los términos comerciales para talleres",
    version: (version: string) => `Versión ${version}`,
    loading: "Cargando los términos…",
    error: "No pudimos cargar los términos comerciales. Sin leerlos no podés contratar: probá de nuevo.",
    checkbox: "Acepto los términos comerciales para talleres",
    required: "Aceptá los términos para continuar.",
  },

  submit: "Pagar con Mercado Pago",
  submitting: "Te llevamos a Mercado Pago…",
  paymentNote: "Vas a terminar el pago en Mercado Pago. AutoLibre no ve ni guarda los datos de tu tarjeta.",

  errors: checkoutErrors,

  alreadyLive: {
    /** Con la baja pedida, el backend manda hasta cuándo sigue el acceso. */
    accessUntil: (date: string) =>
      `Pediste la baja: tu plan sigue activo hasta el ${date}. Después de esa fecha vas a poder contratar de nuevo.`,
  },

  disabled: {
    salesCta: "Hablar con ventas",
    whatsappMessage: providersPlansContent.sales.whatsappMessage,
  },

  /** El taller elegido ya tiene un plan pago con acceso: no se ofrece pagar. */
  activePlan: {
    title: (planName: string) => `Tu taller ya tiene el plan ${planName}`,
    titleWithoutName: "Tu taller ya tiene un plan activo",
    accessUntil: (date: string) =>
      `Pediste la baja: tu plan sigue activo hasta el ${date}. Después de esa fecha vas a poder contratar de nuevo.`,
    body: "No hace falta contratarlo de nuevo. Si querés cambiar de plan, hablá con ventas.",
  },

  /** `/proveedores/contratar/resultado`: la vuelta de Mercado Pago. */
  result: {
    meta: {
      title: "Estado de tu contratación",
      description: "Consultá si Mercado Pago ya confirmó el pago del plan de tu taller en AutoLibre.",
    },
    title: "Estado de tu contratación",
    checking: {
      title: "Estamos confirmando tu pago",
      body: "Esperá unos segundos mientras Mercado Pago nos confirma el pago. No cierres esta página.",
    },
    confirmed: {
      title: (planName: string) => `¡Listo! Tu taller tiene el plan ${planName}`,
      titleWithoutName: "¡Listo! Tu taller ya tiene su plan",
      trialUntil: (date: string) => `Tu período de prueba sin cargo termina el ${date}.`,
      body: "Para administrar tu taller, entrá a la app de AutoLibre con esta misma cuenta.",
      appStore: "Descargar en App Store",
      playStore: "Descargar en Google Play",
    },
    pendingTimeout: {
      title: "Tu pago está pendiente de confirmación",
      body: "Mercado Pago todavía no nos confirmó el pago. Puede tardar unos minutos: volvé a esta página más tarde para ver el estado.",
      check: "Consultar de nuevo",
    },
    free: {
      title: "No se registró ningún pago",
      body: "Tu taller sigue con el plan Gratis y no se te cobró nada. Si cancelaste o el pago no salió, podés intentar de nuevo.",
      retry: "Volver a intentar",
    },
    unconfirmed: {
      title: "No pudimos confirmar tu plan",
      body: "El estado de tu suscripción no está activo. Si tenés dudas, escribinos por WhatsApp.",
    },
    error: {
      title: "No pudimos consultar el estado de tu plan",
      body: "Probá de nuevo en unos minutos.",
      retry: "Consultar de nuevo",
    },
    noCheckout: {
      title: "No encontramos una contratación en curso",
      body: "Si ya pagaste, volvé a esta página desde el mismo navegador. Si no, elegí un plan para empezar.",
      cta: { label: "Ver los planes", href: PROVEEDORES_PLANES_PATH },
    },
    unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para ver el estado de tu plan.",
    help: {
      label: "Escribinos por WhatsApp",
      whatsappMessage: "Hola! Contraté un plan para mi taller en AutoLibre y quiero consultar el estado del pago.",
    },
    plansLink: { label: "Ver los planes", href: PROVEEDORES_PLANES_PATH },
  },
} as const;
