import type { IconName } from "@/lib/content/types";
import { siteConfig } from "@/lib/seo/config";

/**
 * Fila con ícono: la usan el rail de `/pedido` y la línea de tiempo del
 * éxito. El `satisfies` es lo que hace fallar en compilación un ícono que
 * no exista en `components/ui/icon.tsx`.
 */
type IconRow = {
  readonly icon: IconName;
  readonly title: string;
  readonly body: string;
};

/** Copy de la sección de presupuesto de la home (`QuotesSection`), del modal de pedido y de la página /pedido. */
export const presupuestoContent = {
  section: {
    titleLines: ["Pedí presupuesto", "para tu auto."],
    subtitle:
      "Contanos qué necesita y te responden talleres cerca tuyo. Un minuto, sin vueltas.",
    ctaLabel: "Pedí tu presupuesto",
    /**
     * Salida secundaria por WhatsApp. Link propio y no
     * `siteConfig.contact.whatsapp`: el genérico trae precargado "Me interesa
     * comprar un escáner!", que acá no tiene sentido. wa.me solo acepta
     * dígitos: sin `+`, sin espacios y sin guiones.
     */
    whatsapp: {
      label: "Consultanos por WhatsApp",
      href: `https://wa.me/${siteConfig.contact.phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent("¡Hola! Quiero pedir un presupuesto para mi auto.")}`,
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
        stillSearchingHint: "Puede tardar unos segundos más, estamos confirmando tu auto en el registro.",
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
        whatsappPlaceholder: "11 2345 6789",
        whatsappHint: "Te escribimos por acá con las respuestas.",
        whatsappInvalid: "Ingresá un WhatsApp válido.",
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

  /** Landing dedicada `/pedido`: la que se comparte por WhatsApp. */
  page: {
    meta: {
      title: "Pedí presupuesto para tu auto",
      description:
        "Contanos qué necesita tu auto y te responden talleres cerca tuyo. Gratis, sin compromiso, en un minuto.",
    },
    title: "Pedí presupuesto para tu auto.",
    subtitle:
      "Contanos qué necesita y te responden talleres cerca tuyo. Un minuto, sin vueltas.",
    proof: [
      {
        icon: "car",
        title: "Empezá con la patente",
        body: "Con la patente ya sabemos marca, modelo y año. No tenés que buscar nada.",
      },
      {
        icon: "pin",
        title: "Talleres de tu zona",
        body: "Le pasamos tu pedido solo a los talleres que trabajan cerca tuyo.",
      },
      {
        icon: "bell",
        title: "Respuesta en el día",
        body: "Te escribimos por WhatsApp con las primeras respuestas.",
      },
    ] as const satisfies readonly IconRow[],
    reassurance:
      "Gratis y sin compromiso. Usamos tus datos solo para pasarle el pedido a los talleres.",
    privacyLink: "Cómo cuidamos tus datos",
    backHome: "Volver al inicio",
  },

  /** Éxito en `/pedido`: acá no hay modal que cerrar, hay página que seguir. */
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
} as const;
