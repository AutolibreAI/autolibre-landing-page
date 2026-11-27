import { QUOTE_CHIPS, QUOTE_TABS, type QuoteChip, type QuoteTab } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/**
 * Copy del módulo de pedido (`components/modulo-pedido`): la pieza de
 * conversión que comparten el Home y `/pedido` (rediseño 2026-11, fase 3).
 *
 * Vocabulario: "Pedir propuestas" (DECISIONES 24-11). "Presupuesto" queda
 * solo en el H1 y el title de `/pedido`, por SEO.
 *
 * Nada inventado: Auxilio y Multas llevan a los aliados que ya están en el
 * Home (`homeContent.allies`, con sus mismas URLs).
 *
 * Seguros y Financiación (2026-11-27, pedido de producto; revierte el "sin
 * pestaña Seguro" del 2026-11-24): son CONSULTAS que se envían por
 * formulario (`/api/consulta`) y se guardan en el backend. WhatsApp queda
 * solo como salida si el envío falla. El copy no promete cotización,
 * aprobación ni plazos: solo dice lo que pasa.
 */

/** Ícono 3D de la app (WebP en `public/images/pedido/`, al doble del tamaño de uso). */
type ModuloIcon = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

/**
 * Campo de una pestaña de consulta (`ModuloConsultaForm`). Solo datos
 * serializables: viaja como prop del server a la isla.
 *
 * - `format`: validación y normalización que aplica la isla (`cuit`: 11
 *   dígitos con dígito verificador, `lib/cuit.ts`; `plate`: `lib/plate.ts`;
 *   `postal-code`: 4 dígitos, o un CPA del que se toman sus 4 dígitos; `age`:
 *   entero de 18 a 99; `email`: `isValidConsultaEmail` de
 *   `lib/consulta-fields.ts`, con trim y minúsculas).
 * - `error`: campo requerido vacío. `invalid`: formato incorrecto.
 * - `kind: "whatsapp"`: el mismo control de Taller (`WhatsappInput` con el
 *   `+54` fijo, `parseArWhatsapp` de `lib/phone.ts`). Sus errores salen de
 *   `lib/content/whatsapp-errors.ts`, los mismos de Taller.
 */
export type ConsultaField =
  | {
      readonly kind: "text";
      readonly name: string;
      readonly label: string;
      readonly required: boolean;
      /** Aclaración junto al label de un campo opcional. */
      readonly optional?: string;
      readonly placeholder?: string;
      readonly hint?: string;
      readonly autoComplete?: string;
      readonly inputMode?: "text" | "numeric" | "email";
      readonly format?: "cuit" | "plate" | "postal-code" | "age" | "email";
      readonly error?: string;
      readonly invalid?: string;
    }
  | {
      readonly kind: "select";
      readonly name: string;
      readonly label: string;
      readonly required: boolean;
      readonly optional?: string;
      /** Opción vacía inicial. */
      readonly placeholder: string;
      readonly hint?: string;
      readonly autoComplete?: string;
      readonly options: readonly { readonly id: string; readonly label: string }[];
      readonly error?: string;
    }
  | {
      readonly kind: "whatsapp";
      readonly name: string;
      readonly label: string;
      readonly required: true;
      /** `+54`, fijo delante del campo. */
      readonly prefix: string;
      /** El prefijo, para lectores de pantalla. */
      readonly prefixLabel: string;
      readonly placeholder: string;
      readonly hint?: string;
    };

/**
 * Copy de una pestaña de consulta: panel (server) + form (isla). La consulta
 * se envía por formulario (`/api/consulta`) y se guarda en el backend.
 */
export type ConsultaContent = {
  readonly title: string;
  /** Bajada del panel. */
  readonly body: string;
  /** Datos propios de la pestaña. */
  readonly fields: readonly ConsultaField[];
  /** Contacto (WhatsApp y email): va después, en su propia fila. */
  readonly contact: readonly ConsultaField[];
  /**
   * Consentimiento: casilla desmarcada y obligatoria, como la de Taller. El
   * texto va partido para meter el link a `/privacidad` (lo arma el server).
   */
  readonly consent: {
    readonly prefix: string;
    readonly privacyLink: string;
    readonly suffix: string;
    readonly error: string;
  };
  readonly submit: string;
  /** Texto del botón y del aviso a lectores de pantalla durante el envío. */
  readonly submitting: string;
  /** Texto del botón después de un error de envío (los datos siguen cargados). */
  readonly retry: string;
  /** Debajo del botón, partida para meter el link a `/privacidad`. */
  readonly note: { readonly prefix: string; readonly suffix: string };
  /**
   * Confirmación. Sin plazos ni promesas: recibimos la consulta y AutoLibre
   * contacta a la persona por los datos que dejó.
   */
  readonly success: {
    readonly title: string;
    readonly body: string;
    /**
     * Número de consulta que devuelve el backend (`SG-1001`, `FN-1001`), en
     * negrita entre `before` y `after`. Sin código, la oración no va.
     */
    readonly code: { readonly before: string; readonly after: string };
    /** Vuelve al form vacío. */
    readonly again: string;
  };
  readonly errors: {
    /** 5xx, 503 o sin red: no se pudo enviar. */
    readonly failed: string;
    /** 400 sin mensaje de la route. */
    readonly rejected: string;
    /** 429 sin mensaje de la route. */
    readonly rateLimited: string;
    /** Salida por WhatsApp (solo en el error): texto y botón. */
    readonly whatsappPrompt: string;
    readonly whatsappLabel: string;
  };
  /**
   * Primera línea del mensaje de WhatsApp de la salida de error; después va
   * un renglón por campo.
   */
  readonly messageIntro: string;
};

/** Lo que comparten las dos consultas. */
const consultaForm = {
  submit: "Enviar consulta",
  submitting: "Enviando…",
  retry: "Reintentar",
  success: {
    title: "Recibimos tu consulta",
    code: { before: "Tu número de consulta es ", after: "." },
    again: "Hacer otra consulta",
  },
  errors: {
    failed: "No pudimos enviar tu consulta. Tus datos siguen cargados: probá de nuevo.",
    rejected: "No pudimos enviar tu consulta con estos datos. Revisalos y probá de nuevo.",
    rateLimited: "Recibimos demasiadas consultas seguidas. Esperá un minuto y probá de nuevo.",
    whatsappPrompt: "Si sigue sin funcionar, mandanos la consulta por WhatsApp.",
    whatsappLabel: "Mandarla por WhatsApp",
  },
} as const;

/**
 * Contacto de las dos consultas: WhatsApp
 * y email, requeridos. Mismo placeholder y prefijo que el WhatsApp de Taller.
 */
const consultaContacto = [
  {
    kind: "whatsapp",
    name: "whatsapp",
    label: "Tu WhatsApp",
    required: true,
    prefix: "+54",
    prefixLabel: "Código de país +54.",
    placeholder: "11 2345-6789",
    hint: "Con código de área, sin el 0 ni el 15.",
  },
  {
    kind: "text",
    name: "email",
    label: "Email",
    required: true,
    placeholder: "nombre@ejemplo.com",
    autoComplete: "email",
    inputMode: "email",
    format: "email",
    error: "Ingresá tu email.",
    invalid: "Revisá el email. Por ejemplo: nombre@ejemplo.com.",
  },
] as const satisfies readonly ConsultaField[];

/**
 * Consentimiento de las consultas. NO es el de Taller: aquel habla de
 * compartir la consulta con proveedores de la red, y acá no está definido
 * con quién se comparten estos datos (aseguradoras, financieras). Versión
 * mínima verdadera: AutoLibre los usa para contactar a la persona por su
 * consulta. Si producto define terceros, se actualiza acá y en
 * `lib/content/privacidad.ts`.
 */
const consultaConsent = {
  prefix: "Acepto que AutoLibre use estos datos para contactarme por esta consulta, según la ",
  privacyLink: "Política de Privacidad",
  suffix: ".",
  error: "Para enviar la consulta tenés que aceptar que usemos tus datos para contactarte.",
} as const;

const consultaNombre = {
  kind: "text",
  name: "nombre",
  label: "Nombre completo",
  required: true,
  autoComplete: "name",
  placeholder: "Nombre y apellido",
  error: "Decinos tu nombre completo.",
} as const satisfies ConsultaField;

const [asistir24, sinfotomultas] = homeContent.allies.slides;

/**
 * ¿El pedido hecho en la web ya aparece en la app? HOY NO: los pedidos de la
 * web no quedan asociados a ninguna cuenta (0 de 31 pedidos web con
 * `user_id`, 2026-11-24). Mientras esté en `false`, el estado enviado dice
 * "Así se ve en la app" y NUNCA "Tu pedido ya está en la app" ni "Seguí este
 * pedido desde el celular". Se prende (y se revisa el copy de `linked`)
 * cuando el backend vincule el pedido a la cuenta por el WhatsApp.
 */
export const APP_VINCULADA = false;

/** Ilustración del bloque de la app: captura real (WebP 432x600, el doble del uso). */
type AppScreen = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

export const moduloPedidoContent = {
  /** Nombre del `tablist` (no se ve). */
  tablistLabel: "Qué necesitás",

  tabs: [
    {
      id: QUOTE_TABS.taller,
      label: "Taller",
      icon: { src: "/images/pedido/taller.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.auxilio,
      label: "Auxilio",
      icon: { src: "/images/pedido/auxilio.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.multas,
      label: "Multas",
      icon: { src: "/images/pedido/multas.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.seguros,
      label: "Seguros",
      icon: { src: "/images/pedido/seguro.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.financiacion,
      label: "Financiación",
      icon: { src: "/images/pedido/financiacion.webp", width: 104, height: 104 },
    },
  ] as const satisfies readonly {
    readonly id: QuoteTab;
    readonly label: string;
    readonly icon: ModuloIcon;
  }[],

  /** Pestaña Taller: el único pedido que entra al backend (`/api/presupuesto`). */
  taller: {
    problema: {
      label: "¿Qué le pasa?",
      /**
       * Ejemplos que rotan en el placeholder (cada ~3 s, ver
       * `useRotatingPlaceholder`). El primero es el del HTML del server y el
       * que queda fijo con `prefers-reduced-motion`. Cortos: en un celular de
       * 360px el campo no muestra mucho más de 30 caracteres.
       */
      placeholders: [
        "Ej.: hace ruido al frenar",
        "Ej.: se prendió una luz en el tablero",
        "Ej.: el aire no enfría",
        "Ej.: tiembla el volante",
        "Ej.: el service de los 10.000 km",
      ],
      error: "Contanos qué le pasa al auto.",
    },
    zona: {
      label: "¿Dónde estás?",
      placeholder: "Barrio o localidad",
      error: "Contanos en qué zona estás.",
    },
    next: "Pedir propuestas",

    chips: {
      label: "Lo más pedido",
      /**
       * Completan "¿Qué le pasa?" con su texto. Son categorías de pedido, no
       * un catálogo de servicios garantizados.
       */
      items: [
        {
          id: QUOTE_CHIPS.service,
          label: "Service",
          icon: { src: "/images/pedido/service.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.luzTablero,
          label: "Luz en el tablero",
          icon: { src: "/images/pedido/luz-tablero.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.alineacion,
          label: "Alineación y balanceo",
          icon: { src: "/images/pedido/alineacion.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.frenos,
          label: "Frenos",
          icon: { src: "/images/pedido/frenos.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.aire,
          label: "Aire acondicionado",
          icon: { src: "/images/pedido/aire.webp", width: 56, height: 56 },
        },
      ] as const satisfies readonly {
        readonly id: QuoteChip;
        readonly label: string;
        readonly icon: ModuloIcon;
      }[],
    },

    whatsapp: {
      prompt: "¿Preferís chatear?",
      label: "Pedilo por WhatsApp",
      text: "¡Hola! Quiero pedir propuestas para mi auto.",
    },

    /**
     * Contacto del paso final (`RequestFlowOverlay`): WhatsApp, patente y
     * consentimiento. Para cuándo, repuestos y km: `lib/content/request-flow.ts`.
     */
    contact: {
      whatsapp: {
        prefix: "+54",
        prefixLabel: "Código de país +54.",
        placeholder: "11 2345-6789",
      },
      patente: {
        label: "Patente",
        optional: "(opcional, recomendada)",
        placeholder: "AB 123 CD",
        hint: "Con la patente ya sabemos marca, modelo y año, y los proveedores te responden más rápido.",
        error: "Revisá la patente. Por ejemplo: AB123CD o ABC123.",
        status: {
          validating: "Validando patente…",
          valid: "Patente validada",
          unverified: "No pudimos validarla, podés enviar igual.",
        },
      },
      submit: "Enviar pedido",
      submitting: "Enviando…",
      /**
       * Consentimiento explícito (decisión de producto, 2026-11-24): checkbox
       * visible, desmarcado por defecto y obligatorio para enviar. El texto va
       * partido para meter los dos links (los arma el server).
       */
      consent: {
        prefix:
          "Acepto que AutoLibre comparta mi consulta y mi WhatsApp con proveedores de su red para que me respondan, según los ",
        termsLink: "Términos y Condiciones",
        middle: " y la ",
        privacyLink: "Política de Privacidad",
        suffix: ".",
        error: "Para enviar el pedido tenés que aceptar que compartamos tu consulta con los proveedores.",
      },
      note: "Tu WhatsApp lo usamos solo para avisarte de este pedido.",
      genericError: "No pudimos mandar tu pedido. Probá de nuevo o escribinos por WhatsApp.",
    },

    /**
     * Confirmación, adentro de la pantalla limpia (el título está en
     * `requestFlowContent.success`). Abajo, el bloque de la app (`appPromo`).
     */
    sent: {
      /**
       * Código público que devuelve el envío (`AL-1042`), en negrita entre
       * `before` y `after`. Si el backend no lo devuelve, la oración no va:
       * nunca se inventa un número.
       */
      code: { before: "Tu pedido es el ", prefix: "#", after: ". " },
      body: "Te escribimos por WhatsApp en el día con las propuestas.",
    },

    /**
     * Bloque "Así se ve en la app" del estado enviado (ajuste del
     * 2026-11-24). Copy honesto según `APP_VINCULADA`: con el flag apagado
     * muestra cómo se ve un pedido en la app, sin decir que ESTE pedido ya
     * está ahí.
     */
    appPromo: {
      unlinked: {
        eyebrow: "Así se ve en la app",
        title: "Con la app ves las propuestas apenas llegan",
        body: "Comparás precio, distancia y qué incluye cada una, y elegís el taller en un toque.",
        next: "Tus próximos pedidos los hacés y los seguís desde ahí.",
      },
      /** Solo con `APP_VINCULADA`. Revisar antes de prenderlo. */
      linked: {
        eyebrow: "Tu pedido ya está en la app",
        title: "Seguí este pedido desde el celular",
        body: "Entrá con el mismo WhatsApp y vas a encontrar tu pedido con cada propuesta que llegue.",
        next: "Entrá con el WhatsApp que pusiste en el pedido.",
      },
      /** Nombre de la fila de pasos (no se ve; la fila es navegable con teclado). */
      stepsLabel: "Cómo se ve un pedido en la app",
      steps: [
        {
          title: "Te avisamos con cada respuesta",
          body: "Ves cuántas propuestas llegaron sin esperar el mensaje.",
          screen: { src: "/images/app/app-propuestas.webp", width: 432, height: 600 },
        },
        {
          title: "Las comparás lado a lado",
          body: "Precio, distancia y qué incluye cada una, con la recomendada marcada.",
          screen: { src: "/images/app/app-elegir.webp", width: 432, height: 600 },
        },
        {
          title: "Elegís y coordinás",
          body: "Te abrimos WhatsApp con el mensaje listo para el taller.",
          screen: { src: "/images/app/app-elegiste.webp", width: 432, height: 600 },
        },
      ] as const satisfies readonly {
        readonly title: string;
        readonly body: string;
        readonly screen: AppScreen;
      }[],
      download: {
        title: "Bajá la app gratis",
        /** Solo desde `lg`, junto al QR. */
        scan: "Escaneá el código con la cámara del celular.",
        qrAlt: "Código QR para bajar la app de AutoLibre",
      },
      whatsappFallback: "¿Preferís no bajarla? No pasa nada: te mandamos todo por WhatsApp.",
    },
  },

  auxilio: {
    title: "¿Te quedaste en el camino?",
    body: "La grúa de Asistir24 te lleva directo a un taller de la red AutoLibre. Atención las 24 horas.",
    cta: { label: asistir24.badgeCta.label, href: asistir24.badgeCta.href },
  },

  multas: {
    title: "¿Tenés multas?",
    body: "Antes de pagar, mirá cuánto se pueden reducir con Sin Fotomultas. Gestión legal en CABA y Provincia de Buenos Aires.",
    cta: { label: sinfotomultas.cta.label, href: sinfotomultas.cta.href },
  },

  /**
   * Errores que responde `/api/consulta` (alta de las consultas en el
   * backend). El form muestra los de 400 y 429 tal cual
   * llegan; por eso la route nunca reenvía el texto del backend (está en
   * inglés y es del DTO): lo traduce a uno de estos o al error del campo.
   */
  consultaErrors: {
    invalid: "Revisá los datos de la consulta.",
    nameTooLong: "El nombre es demasiado largo: como máximo, 120 caracteres.",
    rejected: consultaForm.errors.rejected,
    rateLimited: consultaForm.errors.rateLimited,
    unavailable: "El servicio no está disponible en este momento.",
    generic: "No pudimos registrar tu consulta. Por favor intentá de nuevo.",
  },

  /** Pestaña Seguros: consulta por formulario (ver arriba). */
  seguros: {
    title: "¿Buscás seguro para tu vehículo?",
    body: "Contanos qué cobertura te interesa y dejanos tus datos para que te contactemos.",
    fields: [
      consultaNombre,
      // Edad y código postal: requeridos (pedido de producto, 2026-11-27).
      // La edad es la de quien va a asegurar el vehículo; no se pide fecha
      // de nacimiento.
      {
        kind: "text",
        name: "edad",
        label: "Edad",
        required: true,
        placeholder: "Ej.: 35",
        hint: "La de quien va a asegurar el vehículo.",
        autoComplete: "off",
        inputMode: "numeric",
        format: "age",
        error: "Decinos la edad de quien va a asegurar el vehículo.",
        invalid: "La edad tiene que ser un número entre 18 y 99.",
      },
      {
        kind: "text",
        name: "codigo-postal",
        label: "Código postal",
        required: true,
        placeholder: "Ej.: 1425",
        hint: "Los 4 números de tu código postal.",
        autoComplete: "postal-code",
        inputMode: "numeric",
        format: "postal-code",
        error: "Ingresá tu código postal.",
        invalid: "Revisá el código postal: son 4 números. Por ejemplo: 1425.",
      },
      {
        kind: "text",
        name: "patente",
        label: "Patente",
        // Requerida acá por decisión de producto (2026-11-27). La de Taller
        // (`taller.contact.patente`) es otra definición y sigue opcional.
        required: true,
        placeholder: "AB 123 CD",
        autoComplete: "off",
        format: "plate",
        error: "Ingresá la patente del vehículo.",
        invalid: "Revisá la patente. Por ejemplo: AB123CD o ABC123.",
      },
      {
        kind: "select",
        name: "cobertura",
        label: "Cobertura que buscás",
        required: true,
        placeholder: "Elegí una opción",
        options: [
          { id: "responsabilidad-civil", label: "Responsabilidad civil" },
          { id: "terceros-completo", label: "Terceros completo" },
          { id: "todo-riesgo", label: "Todo riesgo" },
          { id: "asesoramiento", label: "No sé, quiero asesoramiento" },
        ],
        error: "Elegí qué cobertura buscás.",
      },
    ],
    contact: consultaContacto,
    consent: consultaConsent,
    messageIntro: "¡Hola! Quiero consultar por un seguro para mi vehículo.",
    ...consultaForm,
    note: {
      prefix: "Guardamos tu consulta para poder contactarte, según la ",
      suffix: ".",
    },
    success: {
      ...consultaForm.success,
      body: "Te vamos a contactar por el WhatsApp o el email que nos dejaste.",
    },
  },

  /**
   * Pestaña Financiación: consulta por formulario (ver arriba). No es un
   * producto de crédito: nada de "te aprobamos" ni tasas o plazos.
   */
  financiacion: {
    title: "¿Necesitás financiar un gasto del vehículo?",
    body: "Contanos para qué lo necesitás y dejanos tus datos para que te contactemos.",
    fields: [
      consultaNombre,
      {
        kind: "text",
        name: "cuit",
        label: "CUIT",
        required: true,
        placeholder: "20-12345678-6",
        hint: "11 dígitos, con o sin guiones.",
        autoComplete: "off",
        inputMode: "numeric",
        format: "cuit",
        error: "Ingresá tu CUIT.",
        invalid: "Revisá el CUIT: tienen que ser 11 dígitos válidos.",
      },
      {
        kind: "select",
        name: "sexo",
        label: "Sexo",
        // Requerido por decisión de producto (2026-11-27).
        required: true,
        placeholder: "Elegí una opción",
        hint: "Como figura en tu DNI.",
        autoComplete: "sex",
        options: [
          { id: "femenino", label: "Femenino" },
          { id: "masculino", label: "Masculino" },
          { id: "x", label: "X / No binario" },
        ],
        error: "Elegí el sexo que figura en tu DNI.",
      },
      {
        kind: "select",
        name: "motivo",
        label: "Motivo del financiamiento",
        required: true,
        placeholder: "Elegí una opción",
        options: [
          { id: "arreglo-mecanico", label: "Arreglo mecánico o reparación" },
          { id: "chapa-pintura", label: "Chapa y pintura" },
          { id: "service", label: "Service o mantenimiento" },
          { id: "neumaticos", label: "Neumáticos" },
          { id: "bateria-repuestos", label: "Batería o repuestos" },
          { id: "patentes", label: "Deuda de patentes" },
          { id: "multas", label: "Multas o infracciones" },
          { id: "vtv", label: "VTV o verificación técnica" },
          { id: "transferencia", label: "Transferencia o gastos de gestoría" },
          { id: "seguro", label: "Seguro (cuotas adeudadas o anualidad)" },
          { id: "gnc", label: "Equipo de GNC" },
          { id: "otro", label: "Otro gasto del vehículo" },
        ],
        error: "Elegí para qué necesitás el financiamiento.",
      },
    ],
    contact: consultaContacto,
    consent: consultaConsent,
    messageIntro: "¡Hola! Quiero consultar por financiación para un gasto de mi vehículo.",
    ...consultaForm,
    note: {
      prefix:
        "Es una consulta, no una solicitud ni una aprobación de crédito. Guardamos tu consulta para poder contactarte, según la ",
      suffix: ".",
    },
    success: {
      ...consultaForm.success,
      body: "Te vamos a contactar por el WhatsApp o el email que nos dejaste. Es una consulta, no una solicitud ni una aprobación de crédito.",
    },
  },
} as const;
