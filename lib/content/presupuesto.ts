import type { IconName } from "@/lib/content/types";
import type { ArWhatsappError } from "@/lib/phone";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Fila con ícono: la usan los pasos de `/pedido` y la línea de tiempo del
 * éxito. El `satisfies` es lo que hace fallar en compilación un ícono que
 * no exista en `components/ui/icon.tsx`.
 */
type IconRow = {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
};

/**
 * Mensaje precargado del chat de WhatsApp para pedir presupuesto. Lo usan la
 * home y `/pedido`. OJO: el QR de `/pedido` (`components/ui/qr-code.tsx`)
 * codifica la URL armada con este texto: si cambia, hay que regenerarlo.
 */
const PEDIDO_WHATSAPP_TEXT = "¡Hola! Quiero pedir un presupuesto para mi auto.";

/** Pregunta frecuente de `/pedido`. `link` convierte un tramo de la respuesta en link. */
type PedidoFaqItem = {
  readonly question: string;
  /** Texto plano completo: es lo que ve la persona y lo que va al `FAQPage`. */
  readonly answer: string;
  readonly link?: { readonly text: string; readonly href: string };
};

/**
 * Errores del WhatsApp (ver `parseArWhatsapp` en `lib/phone.ts`). Los usan el
 * form de `/pedido` y el modal de la home. `{n}` = cantidad de dígitos.
 */
const WHATSAPP_ERRORS = {
  empty: "Ingresá tu WhatsApp con código de área. Ej: 11 2345-6789",
  missing_area_code: "Falta el código de área. Ej: 11 2345-6789",
  too_short_one: "Al número le falta 1 dígito.",
  too_short: "Al número le faltan {n} dígitos.",
  too_long_one: "El número tiene 1 dígito de más.",
  too_long: "El número tiene {n} dígitos de más.",
  invalid_area_code: "Revisá el código de área. Ej: 11, 221 o 351.",
  fake: "Revisá el número: parece incompleto.",
} as const;

/** Mensaje para un WhatsApp inválido, con la cantidad de dígitos si aplica. */
export function whatsappErrorMessage(error: ArWhatsappError, diff = 0): string {
  if (error === "too_short" || error === "too_long") {
    return diff === 1
      ? WHATSAPP_ERRORS[`${error}_one`]
      : WHATSAPP_ERRORS[error].replace("{n}", String(diff));
  }
  return WHATSAPP_ERRORS[error];
}

/** Copy de la sección de presupuesto de la home (`QuotesSection`), del modal de pedido y de la página /pedido. */
export const presupuestoContent = {
  section: {
    titleLines: ["Resolvemos todo", "para tu auto."],
    subtitle:
      "Contanos qué necesita y te responden talleres cerca tuyo. Un minuto, sin vueltas.",
    ctaLabel: "Pedí tu presupuesto",
    /**
     * Salida secundaria por WhatsApp. Link propio y no
     * `siteConfig.contact.whatsapp`: el genérico trae precargado "Me interesa
     * comprar un escáner!", que acá no tiene sentido.
     */
    whatsapp: {
      label: "Consultanos por WhatsApp",
      href: whatsappUrl(PEDIDO_WHATSAPP_TEXT),
    },
    /**
     * Link de texto a `/pedido`, debajo de los botones: la landing de pedido
     * explica el paso a paso y la FAQ. Texto descriptivo (no "ver más") para
     * que el ancla diga a dónde lleva.
     */
    pageLink: {
      label: "Ver cómo funciona el pedido de presupuesto",
      href: "/pedido",
    },
  },

  modal: {
    title: "Pedí tu presupuesto",
    /** Mientras llega el chunk del formulario (se carga al abrir el modal). */
    loading: "Cargando el formulario…",
    back: "Atrás",
    continue: "Continuar",
    submitLabel: "Enviar pedido",
    submitLoadingLabel: "Enviando...",
    genericError: "Algo salió mal. Por favor intentá de nuevo.",

    steps: {
      plate: {
        heading: "¿Cuál es la patente de tu auto?",
        placeholder: "AB123CD",
        hint: "Con la patente ya sabemos marca, modelo y año.",
        invalidHint: "Ingresá una patente válida.",
        searchLabel: "Buscar mi auto",
        searchingLabel: "Buscando...",
        stillSearchingHint:
          "Puede tardar unos segundos más, estamos confirmando tu auto en el registro.",
        foundLabel: "Encontramos",
        foundConfirm: "Sí, es mi auto",
        foundReject: "No es mi auto, corregir",
        notFound:
          "No pudimos confirmarlo automáticamente, pero podés seguir igual.",
        unavailable:
          "No pudimos verificarlo en este momento. Podés seguir igual, lo confirmamos nosotros.",
        continueAnyway: "Continuar de todas formas",
      },
      contact: {
        heading: "¿Cómo te contactamos?",
        whatsappLabel: "WhatsApp",
        whatsappPlaceholder: "11 2345-6789",
        whatsappHint: "Te escribimos por acá con las respuestas.",
        addressLabel: "Zona o localidad",
        addressPlaceholder: "Palermo, San Isidro, La Plata...",
        addressHint: "Así buscamos talleres que trabajen cerca tuyo.",
        addressInvalid: "Ingresá tu zona o localidad.",
        emailLabel: "Email (opcional)",
        emailPlaceholder: "tu@email.com",
        emailInvalid: "Ingresá un email válido.",
      },
      need: {
        heading: "¿Qué necesita tu auto?",
        placeholder:
          "Contanos el síntoma, o pegá lo que ya te presupuestaron en un taller.",
        hint: "Cuanto más detalle, mejores respuestas vas a recibir.",
        invalidHint: "Contanos qué necesita tu auto.",
      },
      consent: {
        heading: "Último paso",
        prefix:
          "Acepto que AutoLibre comparta los datos de mi auto y la descripción del problema con talleres de su red, y que me envíe sus respuestas por WhatsApp, según la ",
        privacyLinkLabel: "Política de Privacidad",
        suffix: ".",
      },
    },

    success: {
      title: "¡Listo! Tu pedido ya está en camino.",
      description:
        "Te escribimos por WhatsApp en el día con las primeras respuestas.",
      closeLabel: "Cerrar",
      whatsappFallback: "¿Preferís avisarnos por WhatsApp directamente?",
      whatsappLinkLabel: "Escribinos por WhatsApp",
    },
  },

  /** Copy del progreso del flujo, compartido entre el modal y la página. */
  flow: {
    stepNames: ["Tu auto", "Tus datos", "Qué necesitás", "Confirmar"],
    stepLabel: "Paso {step} de {total}",
    nextLabel: "Después: {next}",
  },

  /**
   * Restos del layout `page` de `QuoteFlow` (la `/pedido` anterior). Hoy nadie
   * renderiza `QuoteFlow` con `layout="page"`, pero el componente todavía
   * soporta esa variante y la lee. Se va junto con esa variante.
   */
  page: {
    backHome: "Volver al inicio",
  },

  /** Éxito del layout `page` de `QuoteFlow` (ver `page` arriba). */
  successPage: {
    title: "¡Listo! Tu pedido ya está en camino.",
    description:
      "Te escribimos por WhatsApp en el día con las primeras respuestas.",
    timelineTitle: "Qué pasa ahora",
    timeline: [
      {
        icon: "check",
        title: "Recibido",
        body: "Tu pedido ya quedó registrado.",
      },
      {
        icon: "document",
        title: "Lo vemos nosotros",
        body: "Se lo pasamos a los talleres que trabajan en tu zona.",
      },
      {
        icon: "bell",
        title: "Te contactamos",
        body: "Te escribimos por WhatsApp en el día.",
      },
    ] as const satisfies readonly IconRow[],
    app: {
      title: "Seguí tu pedido desde la app",
      items: [
        "Mirá las respuestas de los talleres en un solo lugar",
        "Guardá documentación y vencimientos de tu auto",
        "Diagnóstico con IA cuando algo suena raro",
      ],
    },
  },

  /**
   * Landing `/pedido`: la que se comparte por WhatsApp y en anuncios. Un
   * pedido de presupuesto a proveedores de la zona, por WhatsApp (CTA
   * principal) o dejando los datos en un form.
   *
   * Vocabulario: "proveedores", no "talleres" (la red incluye servicios que
   * no son talleres). Nada de métricas ni testimonios: solo lo que hoy es
   * verdad (gratis, AMBA, respuesta en el día).
   */
  pedidoPage: {
    meta: {
      title: "Presupuestos gratis para tu auto, por WhatsApp",
      description:
        "Contanos qué le pasa a tu auto y te pasamos Presupuestos de proveedores en tu zona en AMBA por WhatsApp. Te respondemos en el día, gratis y sin compromiso.",
      breadcrumb: "Pedir presupuesto",
      homeBreadcrumb: "Inicio",
    },

    /** Barra superior de la vista mobile del form (logo). */
    header: {
      logoAlt: "AutoLibre.AI",
    },

    /** Todos los botones de WhatsApp de la página abren el mismo chat. */
    whatsapp: {
      text: PEDIDO_WHATSAPP_TEXT,
      label: "Escribinos por WhatsApp",
    },

    hero: {
      badge: "Gratis · Proveedores en AMBA",
      title: "Presupuestos de proveedores en tu zona, por WhatsApp.",
      subtitle:
        "Contanos qué le pasa a tu auto y te respondemos en el día. Gratis y sin compromiso.",
      /** Debajo del botón de WhatsApp: por qué elegir este camino. */
      whatsappNote: "Lo más rápido: hablás directo con nosotros.",
      divider: "o",
      formCta: "Prefiero que me escriban",
      checks: [
        "Sin llamadas de proveedores: hablás con nosotros",
        "No hace falta bajar ninguna app",
      ],
      qr: {
        title: "¿Estás en la compu?",
        body: "Escaneá el código con tu celular y seguí la charla desde WhatsApp.",
        alt: "Código QR que abre el chat de WhatsApp de AutoLibre en tu celular",
      },
    },

    steps: {
      title: "Cómo funciona",
      items: [
        {
          icon: "chat",
          title: "Nos escribís",
          body: "Contanos qué necesitás y en qué zona.",
        },
        {
          icon: "pin",
          title: "Consultamos proveedores cerca tuyo",
          body: "Le pasamos tu pedido a los proveedores que trabajan en tu zona.",
        },
        {
          icon: "receipt",
          title: "Te pasamos los presupuestos",
          body: "Te llegan por WhatsApp y elegís vos. Sin compromiso.",
        },
      ] as const satisfies readonly IconRow[],
    },

    /**
     * Chat de ejemplo. Los proveedores, teléfonos y precios son INVENTADOS y
     * así se rotula en pantalla ("Ejemplo ilustrativo", en el `figcaption`):
     * no son datos reales ni una promesa de precio.
     */
    example: {
      title: "Así te llega la respuesta",
      caption: "Ejemplo ilustrativo",
      /** Quién habla en cada globo, solo para lectores de pantalla. */
      you: "Vos:",
      us: "AutoLibre:",
      userMessage:
        "Hola! Quiero hacer el service. Tengo un Toyota Corolla y estoy en Tigre.",
      confirmationLines: [
        "Hola! Te escribo desde AutoLibre.ai por el pedido AL-1037.",
        "Tenemos registrado:",
        "- TOYOTA COROLLA XEI 1.8 M/T 2013",
        "- Quiero hacer el service",
        "- Tigre",
        "Ya estamos trabajando, cualquier duda o corrección avisanos!",
      ],
      providers: [
        {
          name: "1. Host Garage",
          service: "Service completo: aceite y filtros",
          address: "Av. Italia 100",
          phone: "+54 9 11 1111-1111",
          price: "$ 100.000",
          eta: "Mañana",
        },
        {
          name: "2. HyG Garage",
          service: "Service completo: aceite y filtros",
          address: "Solis 2000",
          phone: "+54 9 11 2222-2222",
          price: "$ 125.000",
          eta: "Hoy",
        },
      ],
      /** Decorativos: se ocultan a lectores de pantalla. */
      emoji: { address: "📍", phone: "📞", price: "💵", eta: "⏱️" },
    },

    faq: {
      title: "Preguntas frecuentes",
      items: [
        {
          question: "¿Cuánto cuesta?",
          answer:
            "Nada. Solo le pagás al proveedor si decidís hacer el trabajo.",
        },
        {
          question: "¿Me van a llamar los proveedores?",
          answer:
            "No. Hablás con nosotros hasta que elijas un proveedor. Vos le escribís a ellos.",
        },
        {
          question: "¿Qué datos necesitan?",
          answer:
            "Tu WhatsApp y tu zona. La patente nos ahorra preguntas, pero es opcional.",
        },
        {
          question: "¿Tengo que bajar una app?",
          answer:
            "No. Todo pasa por WhatsApp. Pero si querés centralizar todo, es gratis.",
          link: { text: "es gratis", href: "/descarga" },
        },
      ] as const satisfies readonly PedidoFaqItem[],
    },

    ctaBand: {
      // Espacio duro entre "a" y "tu": si el título se parte, la preposición
      // no queda colgando al final de la línea ("…le pasa / a tu vehículo").
      title: "Contanos qué le pasa a tu vehículo",
      subtitle: "Te respondemos en el día.",
      formCta: "Prefiero que me escriban",
    },

    stickyBar: {
      /** Nombre del landmark de la barra fija (lectores de pantalla). */
      label: "Pedí tu presupuesto",
      formCta: "o dejanos tus datos",
    },

    form: {
      /** Es la alternativa al chat: el título lo dice (en desktop va al lado del botón de WhatsApp). */
      title: "¿Preferís que te escribamos?",
      subtitle: "Dejanos tus datos y te pasamos los presupuestos por WhatsApp en el día.",
      back: "Volver",
      optional: "(opcional)",
      fields: {
        zona: {
          label: "¿En qué zona estás?",
          placeholder: "Barrio o localidad",
          error: "Contanos en qué zona estás.",
        },
        problema: {
          label: "¿Qué le pasa al auto?",
          placeholder: "O contalo con tus palabras. Ej: hace un ruido al frenar",
          error: "Contanos qué le pasa al auto.",
          /**
           * Atajos para no tipear en el teléfono: cada uno suma (o saca) su
           * texto en el campo. Son categorías de pedido, no un catálogo de
           * servicios garantizados.
           */
          quickPicks: {
            label: "Tocá lo que corresponda",
            items: [
              "Service",
              "Frenos",
              "Luz en el tablero",
              "Batería",
              "No arranca",
              "Ruido raro",
              "Neumáticos",
              "Chapa y pintura",
            ],
          },
        },
        patente: {
          label: "Patente",
          placeholder: "AB 123 CD",
          hint: "Si la ponés, ya sabemos marca, modelo y año.",
          error: "Revisá la patente. Por ejemplo: AB123CD o ABC123.",
          /** Estado del lookup en clasific.ar, debajo del campo. Nunca bloquea el envío. */
          status: {
            validating: "Validando patente…",
            valid: "Patente validada",
            unverified: "No pudimos validarla, podés enviar igual.",
          },
        },
        whatsapp: {
          label: "Tu WhatsApp",
          prefix: "+54",
          /** Lo que lee un lector de pantalla en lugar de "+54". */
          prefixLabel: "Código de país +54.",
          placeholder: "11 2345-6789",
          hint: "Solo lo usamos para mandarte los presupuestos.",
        },
      },
      submit: "Pedir presupuestos",
      submitting: "Enviando…",
      free: "Gratis y sin compromiso",
      legal:
        "Al pedir presupuestos aceptás que compartamos tu consulta con proveedores de nuestra red y te respondamos por WhatsApp.",
      privacyLink: "Cómo cuidamos tus datos",
      genericError:
        "No pudimos mandar tu pedido. Probá de nuevo o escribinos por WhatsApp.",
    },

    confirmation: {
      title: "¡Listo! Ya tenemos tu pedido",
      /** Cumple lo que prometió el form ("te escribimos"): el chat es opcional. */
      body: "Te escribimos por WhatsApp en el día con los presupuestos.",
      whatsappLabel: "Mandanos un mensaje ahora",
      /** `{code}` se reemplaza por el código del pedido (p. ej. `AL-1042`). */
      whatsappTextWithCode:
        "¡Hola! Hice el pedido {code} en la web de AutoLibre.",
      whatsappText:
        "¡Hola! Hice un pedido de presupuesto en la web de AutoLibre.",
      fallback: "Es opcional: así nos tenés agendados y seguimos la charla por ahí.",
      orderLabel: "Tu pedido",
      /** `{code}` = código público del pedido (`AL-1042`): se muestra `#AL-1042`. */
      orderCode: "#{code}",
      noPlate: "sin patente",
    },
  },
} as const;
