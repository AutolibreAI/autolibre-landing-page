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
     * "Así te llega la respuesta": el mismo pedido por WhatsApp y en la app,
     * en paralelo. Del lado de la app, los videos reales del flujo nuevo
     * (`public/videos/`); del lado de WhatsApp, un chat de muestra cuyos
     * datos (pedido AL-22123, Toyota Corolla en Tigre, los tres talleres y
     * sus precios) son los mismos que aparecen en los videos. Talleres,
     * precios y mensajes son de ejemplo y se rotula a la vista (`note`):
     * no son datos reales ni una promesa de precio.
     */
    example: {
      title: "Así te llega la respuesta",
      intro:
        "Las propuestas te llegan por WhatsApp o en la app, como prefieras. Vos elegís: nada se confirma sin que lo decidas.",
      whatsapp: { label: "Por WhatsApp" },
      app: {
        label: "En la app",
        download: "Bajá la app gratis",
        scan: "Escaneá el código con la cámara del celular.",
        qrAlt: "Código QR para bajar la app de AutoLibre",
      },
      compare: {
        intro:
          "Mirá cómo avanza el mismo pedido por WhatsApp y en la app, paso a paso.",
        toggleLabel: "Ver cómo llega la respuesta",
        chatName: "AutoLibre",
        chatInitial: "A",
        note: "Ejemplo ilustrativo: talleres, precios y mensajes son de muestra.",
        typing: "escribiendo…",
        pause: "Pausar",
        play: "Reproducir",
        beatsLabel: "Los pasos: tocá uno para verlo",
        /** Un paso por video, en el mismo orden que `videos`. */
        beats: [
          { title: "Pedís", body: "Qué le pasa al auto, dónde y para cuándo." },
          {
            title: "Comparás las propuestas",
            body: "Precio, distancia y qué incluye cada una.",
          },
          {
            title: "Elegís",
            body: "Coordinás el turno directo con el taller.",
          },
        ],
        /**
         * Videos reales de la app (sin audio). `start`/`end` en segundos:
         * de `comparing-quote` se saltea la espera inicial (0 a 17 s).
         */
        videos: [
          {
            src: "/videos/creating-quote.mp4",
            poster: "/videos/posters/creating-quote.webp",
            start: 0.5,
            end: 24.3,
            label:
              "La app: armás el pedido (qué, auto, dónde, cuándo y tu WhatsApp) y lo enviás.",
          },
          {
            src: "/videos/comparing-quote.mp4",
            poster: "/videos/posters/comparing-quote.webp",
            start: 17,
            end: 44.4,
            label:
              "La app: te llegan 3 propuestas y las comparás lado a lado antes de elegir.",
          },
          {
            src: "/videos/choosing-quote.mp4",
            poster: "/videos/posters/choosing-quote.webp",
            start: 0,
            end: 7.9,
            label:
              "La app: elegiste el taller y tenés cómo llegar y cómo escribirle.",
          },
        ],
        /**
         * Cuándo aparece cada mensaje del chat: en qué video (`clip`) y en qué
         * segundo, atado a lo que pasa en la app en ese momento. `step` es el
         * paso que usan los `data-on` del chat (ver `.cmp` en globals.css).
         */
        cues: [
          { clip: 0, at: 2, step: 1 }, // Empezás a cargar el pedido.
          { clip: 0, at: 19.3, step: 2 }, // "Tu pedido fue enviado".
          { clip: 0, at: 22.5, step: 3 }, // "Estamos buscando quién te ayude".
          { clip: 1, at: 20, step: 4 }, // "Te llegaron 3 propuestas".
          { clip: 1, at: 41, step: 5 }, // "¿Elegís a Taller Isidro?".
          { clip: 2, at: 1, step: 6 }, // Taller elegido.
        ],
      },
      /** Quién habla en cada globo, solo para lectores de pantalla. */
      you: "Vos:",
      us: "AutoLibre:",
      userMessage:
        "Hola! Quiero hacer el service. Tengo un Toyota Corolla y estoy en Tigre.",
      confirmation: {
        intro:
          "Hola! Te escribo desde AutoLibre.ai por el pedido AL-22123. Tenemos registrado:",
        lines: ["Toyota Corolla · NHJ877", "Service", "Tigre, esta semana"],
      },
      proposalsIntro: "Te llegaron 3 propuestas:",
      providers: [
        { name: "1. Taller Isidro", price: "$ 225.000", detail: "12 km" },
        {
          name: "2. Hasser Performance",
          price: "Desde $ 240.000",
          detail: "18 km",
        },
        { name: "3. Mecánica JP", price: "A confirmar", detail: "49 km" },
      ],
      reply: "Me quedo con Taller Isidro.",
      final:
        "Listo. Te pasamos el contacto de Taller Isidro para que coordines el turno.",
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
      slugs: [
        "vtv-pba-turno-que-llevar",
        "que-hacer-si-chocas",
        "consultar-y-pagar-multas",
      ],
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
