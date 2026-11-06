import { partnerAccountContent } from "@/lib/content/partner-account";
import { providersPlansContent } from "@/lib/content/providers-plans";
import { LANDING_PLAN_ID_TO_CODE, type CheckoutFailureKind } from "@/lib/partner-billing/checkout";
import { PROVEEDORES_PLANES_PATH } from "@/lib/proveedores/query";

/**
 * Copy de la contratación de un plan pago (`/proveedores/contratar` y
 * `/proveedores/contratar/resultado`, spec 212). Pantallas privadas
 * (`noindex`): no hay contenido citable, solo lo justo para contratar.
 *
 * Nada de acá promete algo que el backend no confirma: la prueba depende de
 * `trialEligible` (FR-017) y el pago se confirma solo con el estado del
 * backend. Los términos comerciales no se muestran por decisión de producto
 * (2026-11-05): el checkout solo manda su versión vigente.
 *
 * El login es el compartido de `lib/content/partner-account.ts`.
 */

export type LandingPlan = (typeof providersPlansContent.plans)[number];

/** El plan de la página de planes (nombre, bajada, beneficios) por `code` del backend. */
export function planContent(code: string): LandingPlan | null {
  const entry = Object.entries(LANDING_PLAN_ID_TO_CODE).find(([, planCode]) => planCode === code);
  if (!entry) return null;
  return providersPlansContent.plans.find((plan) => plan.id === entry[0]) ?? null;
}

/** Nombre del plan como en la página de planes (FR-013), por `code` del backend. */
export function planDisplayName(code: string): string | null {
  return planContent(code)?.name ?? null;
}

/** Error genérico y reintentable del checkout. */
const genericCheckoutError = "No pudimos iniciar el pago. No se te cobró nada: probá de nuevo en un rato.";

/** Un mensaje por cada rechazo del checkout (research D9). */
const checkoutErrors: Record<CheckoutFailureKind, string> = {
  "payer-email-rejected":
    "Mercado Pago rechazó ese email. Escribí el email de la cuenta de Mercado Pago con la que vas a pagar y probá de nuevo.",
  "invalid-input": "No pudimos validar los datos. Revisá el email y probá de nuevo.",
  unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para seguir con la contratación.",
  disabled: "La contratación online no está disponible ahora. Si querés contratar un plan, hablá con ventas.",
  "not-found": "No encontramos ese taller en tu cuenta.",
  // La UI reintenta sola con la versión vigente; si igual llega, es el genérico.
  "terms-outdated": genericCheckoutError,
  "already-live": "Tu taller ya tiene un plan activo.",
  "in-progress": "Ya hay un pago en curso para este taller. Esperá un momento y probá de nuevo.",
  "rate-limited": "Hiciste muchos intentos. Esperá un minuto y probá de nuevo.",
  unavailable: "Mercado Pago no responde en este momento. No se te cobró nada: probá de nuevo en unos minutos.",
  unknown: genericCheckoutError,
};

/** Estado de una suscripción con acceso, en castellano (solo los confirmados). */
const subscriptionStatusLabels: Record<string, string> = {
  active: "Activo",
  trialing: "En período de prueba",
};

export const partnerCheckoutContent = {
  meta: {
    title: "Contratar un plan para tu taller",
    description:
      "Elegí el taller, revisá el resumen del plan y pagalo con Mercado Pago desde tu cuenta de AutoLibre.",
  },

  eyebrow: "Planes para talleres",
  title: (planName: string) => `Contratá el plan ${planName}`,
  intro: "Son tres pasos: confirmás qué taller, revisás el plan y lo pagás en Mercado Pago.",

  /** Columna de contexto del login: los mismos tres pasos, explicados. */
  signInSteps: [
    { id: "taller", label: "Tu taller", description: "Entrás y elegís a qué taller le aplicás el plan." },
    { id: "plan", label: "Plan", description: "Revisás el plan y su precio." },
    { id: "pago", label: "Pago", description: "Lo pagás en Mercado Pago." },
  ],

  /** `?plan=` que no es un plan pago (o es el gratis). */
  invalidPlan: {
    title: "Elegí un plan para contratar",
    body: "Ese plan no existe o no se contrata online. Mirá los planes disponibles y elegí el que te sirva.",
    cta: { label: "Ver los planes", href: PROVEEDORES_PLANES_PATH },
  },

  /** Indicador de progreso de la contratación (`FlowSteps`). */
  steps: {
    label: "Pasos de la contratación",
    items: [
      { id: "taller", label: "Tu taller" },
      { id: "plan", label: "Plan" },
      { id: "pago", label: "Pago" },
    ],
  },

  /**
   * Tarjeta del plan elegido que acompaña toda la contratación (al costado
   * en desktop, arriba en mobile). No muestra precio a propósito: el precio
   * que vale es el del backend y aparece en el paso "Plan", antes de pagar.
   */
  planCard: {
    title: (planName: string) => `Plan ${planName}`,
    featuresLabel: (planName: string) => `Qué incluye el plan ${planName}`,
    note: "El precio final y si te corresponde el período de prueba los ves antes de pagar.",
    change: { label: "Cambiar de plan", href: PROVEEDORES_PLANES_PATH },
  },

  loading: "Buscando tus talleres…",
  partnersError: "No pudimos cargar tus talleres. Probá de nuevo en un rato.",
  plansError: "No pudimos cargar el precio del plan. Sin el precio no podemos seguir: probá de nuevo.",
  planUnavailable: "Este plan no está disponible para contratar online en este momento.",
  retry: "Reintentar",
  reauth: partnerAccountContent.reauth,

  /**
   * Sesión iniciada pero sin talleres como dueño (US2). Cubre los cuatro
   * casos reales: tiene código (pantalla privada: acá se puede nombrar),
   * aparece (sin explicar cómo se verifica), registró y espera la
   * aprobación (no hay endpoint para ver la solicitud: solo se explica), o
   * no aparece.
   *
   * Lo comparten la contratación (con el plan elegido) y `/cuenta` (sin
   * plan: `planName` en `null`), por eso cada texto recibe el plan.
   */
  noPartner: {
    title: "¿Cómo está tu taller en AutoLibre?",
    body: "Tu cuenta todavía no administra ningún taller. Elegí la opción que te describe y te decimos cómo seguir.",
    options: {
      haveCode: {
        title: "Tengo un código de reclamo",
        body: (planName: string | null) =>
          planName
            ? "Canjealo y el taller queda vinculado a tu cuenta. Después volvés a esta contratación."
            : "Canjealo y el taller queda vinculado a tu cuenta. Después lo ves acá.",
        cta: "Canjear mi código",
      },
      /** Sin explicar el mecanismo de verificación: lo maneja el equipo. */
      listedNoCode: {
        title: "Mi taller ya aparece en AutoLibre",
        body: (planName: string | null) =>
          planName
            ? "Escribinos por WhatsApp y verificamos que sos el dueño. Después volvés a esta contratación."
            : "Escribinos por WhatsApp y verificamos que sos el dueño.",
        cta: "Escribinos por WhatsApp",
        whatsappMessage: (planName: string | null) =>
          planName
            ? `Hola! Mi taller ya aparece en AutoLibre, quiero administrarlo y contratar el plan ${planName}.`
            : "Hola! Mi taller ya aparece en AutoLibre y quiero administrarlo.",
      },
      pendingApproval: {
        title: "Ya registré mi taller y espero la aprobación",
        body: (planName: string | null) =>
          planName
            ? `No hace falta registrarlo de nuevo. Cuando lo aprobemos, el taller queda en esta cuenta y vas a poder contratar el plan ${planName} desde esta misma página.`
            : "No hace falta registrarlo de nuevo. Cuando lo aprobemos, el taller queda en esta cuenta y lo vas a ver acá.",
        cta: "Consultar por mi solicitud",
        whatsappMessage: "Hola! Registré mi taller en AutoLibre y quiero saber cómo va la revisión de la solicitud.",
      },
      notListed: {
        title: "Mi taller no aparece en AutoLibre",
        body: (planName: string | null) =>
          planName
            ? "Registralo gratis con esta misma cuenta. Cuando lo aprobemos, volvés a esta contratación."
            : "Registralo gratis con esta misma cuenta. Cuando lo aprobemos, lo vas a ver acá.",
        cta: "Registrar mi taller",
      },
    },
  },

  partnerPicker: {
    legend: "¿A qué taller le aplicás el plan?",
    required: "Elegí el taller al que le aplicás el plan.",
  },

  summary: {
    title: "Revisá el plan",
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

  /** No se pudo preparar el checkout (falta un dato del backend): se reintenta. */
  prepareError: "No pudimos preparar la contratación. Probá de nuevo.",

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

  /**
   * El taller elegido ya tiene un plan pago con acceso: no se ofrece pagar.
   * Hoy no hay cambio de plan online: lo resuelve ventas.
   */
  activePlan: {
    title: (planName: string) => `Tu taller ya tiene el plan ${planName}`,
    titleWithoutName: "Tu taller ya tiene un plan activo",
    rows: {
      plan: "Plan actual",
      status: "Estado",
      trialUntil: "Prueba hasta",
      accessUntil: "Acceso hasta",
    },
    statusLabel: (status: string | null) => (status ? (subscriptionStatusLabels[status] ?? null) : null),
    canceled: "Baja pedida",
    body: "No hace falta contratarlo de nuevo. Los cambios de plan todavía no se hacen online: si querés pasarte a otro, lo vemos con ventas.",
    accessUntil: (date: string) =>
      `Pediste la baja: tu plan sigue activo hasta el ${date}. Después de esa fecha vas a poder contratar de nuevo.`,
    salesCta: "Cambiar de plan con ventas",
    salesWhatsappMessage: (currentPlan: string | null, wantedPlan: string) =>
      currentPlan
        ? `Hola! Mi taller tiene el plan ${currentPlan} de AutoLibre y quiero pasarme al plan ${wantedPlan}.`
        : `Hola! Mi taller ya tiene un plan de AutoLibre y quiero pasarme al plan ${wantedPlan}.`,
    plansLink: { label: "Ver los planes", href: PROVEEDORES_PLANES_PATH },
  },

  /** `/proveedores/contratar/resultado`: la vuelta de Mercado Pago. */
  result: {
    meta: {
      title: "Estado de tu contratación",
      description: "Consultá si Mercado Pago ya confirmó el pago del plan de tu taller en AutoLibre.",
    },
    title: "Estado de tu contratación",
    intro: "Consultamos a Mercado Pago el estado del pago del plan de tu taller.",
    signInIntro: "Entrá con la cuenta con la que contrataste para ver el estado del pago.",
    checking: {
      title: "Estamos confirmando tu pago",
      body: "Esperá unos segundos mientras Mercado Pago nos confirma el pago. No cierres esta página.",
    },
    confirmed: {
      title: (planName: string) => `¡Listo! Tu taller tiene el plan ${planName}`,
      titleWithoutName: "¡Listo! Tu taller ya tiene su plan",
      trialUntil: (date: string) => `Tu período de prueba sin cargo termina el ${date}.`,
      nextTitle: "Próximos pasos",
      next: {
        app: {
          title: "Administrá tu taller desde la app",
          body: "Entrá a la app de AutoLibre con esta misma cuenta para completar tu perfil y responder pedidos.",
        },
        help: {
          title: "¿Dudas con tu plan?",
          body: "Escribinos por WhatsApp y lo vemos con vos.",
        },
      },
    },
    /**
     * `pending` = el checkout se inició y Mercado Pago todavía no lo autorizó.
     * Incluye a quien pagó y espera la confirmación Y a quien abandonó en MP
     * (no vence). La pantalla no puede saber cuál: les habla a los dos.
     */
    pendingTimeout: {
      title: "Todavía no tenemos la confirmación del pago",
      body: "Puede ser que Mercado Pago todavía no nos haya avisado, o que el pago no se haya completado.",
      paid: {
        title: "Si completaste el pago en Mercado Pago",
        body: "La confirmación puede demorar unos minutos. No vuelvas a pagar: consultá de nuevo en un rato.",
        cta: "Consultar de nuevo",
      },
      notPaid: {
        title: "Si no llegaste a pagar",
        body: "No se te cobró nada. Podés volver a intentarlo cuando quieras.",
        cta: "Volver a intentarlo",
      },
      /** Sin plan guardado en esta pestaña: se elige de nuevo. */
      choosePlan: "Elegir un plan",
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
