/** Copy del hero de presupuesto y del modal de pedido. */
export const presupuestoContent = {
  hero: {
    eyebrow: "Gratis y sin compromiso",
    titleLines: ["Pedí presupuesto", "para tu auto."],
    subtitle:
      "Contanos qué necesita y te responden talleres cerca tuyo. Un minuto, sin vueltas.",
    ctaLabel: "Pedí tu presupuesto",
    note: "Respondemos por WhatsApp en el día.",
    image: {
      src: "/mockup/mockup-chatai.webp",
      alt: "Chat de AutoLibre confirmando los datos de un auto a partir de la patente.",
      width: 786,
      height: 1682,
    },
  },

  modal: {
    title: "Pedí tu presupuesto",
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
        addressLabel: "Dirección",
        addressPlaceholder: "Calle, número, barrio y ciudad",
        addressHint: "Ingresá la dirección exacta para que los talleres puedan ubicarte mejor.",
        addressInvalid: "Ingresá una dirección válida.",
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
          "Acepto que AutoLibre comparta estos datos con talleres de su red para que puedan responderme, según la ",
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
} as const;
