import type { IconName } from "@/lib/content/types";

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
 * Mensaje precargado del chat de WhatsApp de `/pedido`: el mismo que el del
 * módulo de pedido y la barra fija ("Pedir propuestas", DECISIONES 24-11).
 */
const PEDIDO_WHATSAPP_TEXT = "¡Hola! Quiero pedir propuestas para mi auto.";

/** Pregunta frecuente de `/pedido`. `link` convierte un tramo de la respuesta en link. */
type PedidoFaqItem = {
  readonly question: string;
  /** Texto plano completo: es lo que ve la persona y lo que va al `FAQPage`. */
  readonly answer: string;
  readonly link?: { readonly text: string; readonly href: string };
};

// Errores del WhatsApp: viven en `whatsapp-errors.ts` (ver ahí por qué).
export { whatsappErrorMessage } from "./whatsapp-errors";

/** Copy del modal de pedido (`quote-flow`) y de la página /pedido. */
export const presupuestoContent = {
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
   * Landing `/pedido` (rediseño 2026-11, fase 4a: `Pedido` y
   * `Pedido-celular` del lienzo). El formulario es el módulo de pedido
   * (`components/modulo-pedido`); WhatsApp queda como segunda opción.
   *
   * Vocabulario: "Pedir propuestas" en botones y migas. "Presupuesto" queda
   * solo en el H1 y el title, por SEO (DECISIONES 24-11). "Proveedores", no
   * "talleres" (la red incluye servicios que no son talleres). Nada de
   * métricas ni testimonios: solo lo que hoy es verdad (gratis, AMBA,
   * respuesta en el día).
   */
  pedidoPage: {
    meta: {
      title: "Presupuestos gratis para tu auto, por WhatsApp",
      description:
        "Contanos qué le pasa a tu auto y recibí presupuestos de proveedores de tu zona en AMBA por WhatsApp. Te respondemos en el día, gratis y sin compromiso.",
      breadcrumb: "Pedir propuestas",
      homeBreadcrumb: "Inicio",
      breadcrumbLabel: "Migas de pan",
    },

    /** Todos los WhatsApp de la página abren el mismo chat (el del módulo). */
    whatsapp: {
      text: PEDIDO_WHATSAPP_TEXT,
      label: "Escribinos por WhatsApp",
    },

    hero: {
      badge: "Gratis · Proveedores en AMBA",
      title: "Presupuestos para tu auto, de proveedores en tu zona.",
      subtitle:
        "Contanos qué le pasa a tu auto y te respondemos en el día. Gratis y sin compromiso.",
      checks: [
        "Sin llamadas de proveedores: hablás con nosotros",
        "No hace falta bajar ninguna app",
        "Solo le pagás al proveedor si hacés el trabajo",
      ],
    },

    /**
     * Chat de ejemplo. Los proveedores, direcciones y precios son INVENTADOS
     * (ya estaban publicados así antes del rediseño) y se rotula en pantalla
     * ("Ejemplo ilustrativo", en el `figcaption`): no son datos reales ni
     * una promesa de precio. El lienzo usa "[Proveedor A]" y "$ [precio]".
     */
    example: {
      title: "Así te llega la respuesta",
      paragraphs: [
        "Te confirmamos el pedido por WhatsApp y te vamos pasando las propuestas a medida que llegan, con precio, tiempos y dirección.",
        "Vos elegís. Nada se confirma sin que lo decidas.",
      ],
      caption: "Ejemplo ilustrativo",
      /** Quién habla en cada globo, solo para lectores de pantalla. */
      you: "Vos:",
      us: "AutoLibre:",
      userMessage:
        "Hola! Quiero hacer el service. Tengo un Toyota Corolla y estoy en Tigre.",
      confirmation: {
        intro: "Hola! Te escribo desde AutoLibre.ai por el pedido AL-1037. Tenemos registrado:",
        lines: ["Toyota Corolla XEI 1.8 M/T 2013", "Quiero hacer el service", "Tigre"],
        outro: "Ya estamos trabajando, cualquier duda o corrección avisanos!",
      },
      providers: [
        {
          name: "1. Host Garage",
          service: "Service completo: aceite y filtros",
          price: "$ 100.000",
          eta: "Mañana",
          address: "Av. Italia 100",
        },
        {
          name: "2. HyG Garage",
          service: "Service completo: aceite y filtros",
          price: "$ 125.000",
          eta: "Hoy",
          address: "Solis 2000",
        },
      ],
    },

    steps: {
      title: "Cómo funciona",
      items: [
        {
          number: "01",
          title: "Nos contás",
          body: "Qué necesitás y en qué zona, por acá o por WhatsApp.",
        },
        {
          number: "02",
          title: "Consultamos proveedores cerca tuyo",
          body: "Le pasamos tu pedido a los proveedores que trabajan en tu zona.",
        },
        {
          number: "03",
          title: "Te pasamos las propuestas",
          body: "Te llegan por WhatsApp y elegís vos. Sin compromiso.",
        },
      ],
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
            "Qué le pasa al auto, tu zona y tu WhatsApp. La patente es opcional, pero con ella ya sabemos marca, modelo y año, y te respondemos más rápido.",
        },
        {
          question: "¿Tengo que bajar una app?",
          answer:
            "No. Todo pasa por acá o por WhatsApp. Pero si querés centralizar todo, es gratis.",
          link: { text: "es gratis", href: "/descarga" },
        },
      ] as const satisfies readonly PedidoFaqItem[],
    },

    /**
     * Guías relacionadas (columna al lado de la FAQ). Slugs de notas reales
     * del blog: si alguna deja de existir en Hygraph, no se muestra.
     */
    guides: {
      title: "Guías que te pueden servir",
      slugs: ["vtv-pba-turno-que-llevar", "que-hacer-si-chocas", "consultar-y-pagar-multas"],
      all: "Ver todas las guías",
    },

    ctaBand: {
      title: "Contanos qué le pasa a tu vehículo",
      subtitle: "Te respondemos en el día.",
      formCta: "Hacé tu pedido",
    },

    /** Nombre del landmark de la barra fija en celular. */
    mobileBarLabel: "Pedí propuestas",
  },
} as const;
