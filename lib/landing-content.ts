import type { LandingPageContent } from "@/lib/landing-types";

export const landingPageContent: LandingPageContent = {
  brand: {
    name: "AUTO LIBRE",
    badge: "COMING SOON",
    year: "2026",
  },
  sections: {
    hero: {
      eyebrow: "AUTO LIBRE AI",
      headingLineOne: "Hablá con tu auto.",
      headingLineTwo: "Muy pronto.",
      description:
        "Información y diagnóstico inteligente en un solo lugar.",
      mainAction: {
        label: "Quiero acceso temprano",
        href: "#form-section",
      },
      secondaryAction: {
        label: "Conocer más",
        href: "#problem",
      },
      socialProof: "Mas de 490 conductores ya se sumaron a la lista de espera.",
    },
    form: {
      tag: "EARLY ACCESS",
      heading: "Accede primero a",
      headingHighlight: "AutoLibreAI",
      benefits: [
        { id: "benefit-01", text: "Diagnostico inteligente en lenguaje simple." },
        { id: "benefit-02", text: "Alertas proactivas de VTV, seguro y patente." },
        { id: "benefit-03", text: "Comparacion guiada de repuestos y servicios." },
        { id: "benefit-04", text: "Notificaciones cuando te toca un mantenimiento." },
        { id: "benefit-05", text: "Canal preferencial para usuarios early adopters." },
      ],
      microcopy: "Sin spam. Solo tu auto, cuando este listo.",
      reasonOptions: [
        "Gestion administrativa",
        "Diagnostico con IA",
        "Marketplace",
        "Otra",
      ],
    },
    verticals: {
      tag: "PRODUCTO",
      heading: "Verticales que construyen",
      headingHighlight: "la experiencia AutoLibre",
      items: [
        {
          id: "vertical-01",
          emoji: "robot",
          status: "En beta",
          title: "Diagnostico Inteligente",
          description:
            "Traducimos sintomas del auto a pasos accionables para que sepas que pasa y que tan urgente es.",
        },
        {
          id: "vertical-02",
          emoji: "folder",
          status: "En desarrollo",
          title: "Tramites y Documentos",
          description:
            "Gestion unificada de VTV, seguro, patente y multas con recordatorios automatizados.",
        },
        {
          id: "vertical-03",
          emoji: "cart",
          status: "En desarrollo",
          title: "Marketplace Automotriz",
          description:
            "Comparacion de presupuestos para repuestos y servicios con recomendaciones asistidas por IA.",
        },
        {
          id: "vertical-04",
          emoji: "card",
          status: "Proximamente",
          title: "Capa Fintech",
          description:
            "Pagos, cuotas y operaciones vehiculares en una sola experiencia integrada.",
        },
      ],
    },
    problem: {
      tag: "EL PROBLEMA",
      heading: "Tu auto tiene datos.",
      headingHighlight: "Nunca fueron tuyos.",
      items: [
        {
          id: "problem-01",
          text: "El puerto OBD-II esta en tu auto desde 1996. Nunca fue pensado para que vos lo usaras.",
          icon: "plug",
        },
        {
          id: "problem-02",
          text: "Antes esperabas que algo se rompiera. Ahora lo sabes antes.",
          icon: "alert",
        },
        {
          id: "problem-03",
          text: "Pagaste de mas porque no sabias. La informacion tambien es ahorro.",
          icon: "wallet",
        },
      ],
    },
    features: {
      tag: "QUE VAS A PODER HACER",
      heading: "Todo lo que necesitas,",
      headingHighlight: "en un solo lugar.",
      items: [
        {
          id: "feature-01",
          icon: "brain",
          title: "Diagnostico con IA",
          description: "Entende que le pasa a tu auto sin ser mecanico. La IA traduce codigos tecnicos a explicaciones claras.",
        },
        {
          id: "feature-02",
          icon: "history",
          title: "Historial digital del auto",
          description: "Todos los servicios, reparaciones y eventos en un solo lugar. Tu auto tiene memoria.",
        },
        {
          id: "feature-03",
          icon: "bell",
          title: "Alertas proactivas",
          description: "Tu auto te habla antes de que algo falle. Recibí alertas tempranas, antes de que sean un problema caro.",
        },
        {
          id: "feature-04",
          icon: "clipboard",
          title: "Gestion de tramites",
          description: "VTV, seguro, patente y service en un solo lugar. Nunca más una multa por olvido ni una mañana perdida tratando de recordar qué vence cuándo.",
        },
      ],
    },
    faqs: {
      tag: "PREGUNTAS FRECUENTES",
      heading: "Dudas comunes,",
      headingHighlight: "respuestas claras.",
      items: [
        {
          id: "faq-01",
          question: "Que es AutoLibre?",
          answer: "AutoLibre es el asistente inteligente que entiende lo que le pasa a tu auto. Podes describir cualquier sintoma —un ruido raro, una luz en el tablero, algo que no se siente bien— y la IA te explica que puede estar pasando y si necesitas ir a un taller. Si ademas conectas un escaner OBD-II, accede directamente a los datos del vehiculo para un diagnostico aun mas preciso. Tambien te ayuda a gestionar todos tus tramites obligatorios —VTV, seguro, patente y servicios— para que nunca mas tengas que adivinar cuando actuar.",
        },
        {
          id: "faq-02",
          question: "Que es el puerto OBD-II?",
          answer: "Es una conexion estandar que todos los autos fabricados desde 1996 tienen por ley. Fue creada para que los talleres puedan leer el estado interno del vehiculo, pero las automotrices nunca quisieron que vos, como dueno del auto, pudieras acceder a esa informacion directamente. AutoLibre te da esa informacion en lenguaje claro, para que por primera vez seas vos quien toma las decisiones sobre tu vehiculo.",
        },
        {
          id: "faq-03",
          question: "Por que es diferente a otras apps de diagnostico?",
          answer: "Las apps tradicionales te muestran el codigo de error, pero ahi terminan. AutoLibre va varios pasos mas: diagnostico por sintomas (sin necesitar ningun dispositivo), diagnostico por OBD-II con explicacion en lenguaje claro, y gestion de tramites centralizada con recordatorios automaticos.",
        },
        {
          id: "faq-04",
          question: "Para que tipo de usuario esta pensado?",
          answer: "Para dos perfiles principales: el dueno de un auto que no es mecanico (quien alguna vez vio una luz en el tablero sin saber que hacer), y quien gestiona una pequena flota familiar o empresarial y necesita mantener el control de vencimientos y estado de varios vehiculos.",
        },
        {
          id: "faq-05",
          question: "Como se conecta la app con mi auto?",
          answer: "Se utiliza un pequeno dispositivo llamado escaner OBD-II que se enchufa en el puerto de diagnostico del vehiculo (generalmente debajo del volante). La app se comunica con el de forma inalambrica por Bluetooth.",
        },
        {
          id: "faq-06",
          question: "Que escaner recomiendan usar?",
          answer: "La recomendacion principal es el Vgate iCar Pro: bajo consumo de bateria, compatibilidad garantizada y estabilidad de conexion probada. Tambien son compatibles el Konnwei KW906 y el ELM327 v1.5. Atencion con el ELM327: existen versiones que no son compatibles con iPhone. Asegurate de que diga \"BLE\" o \"Bluetooth 4.0\" en la descripcion antes de comprarlo.",
        },
        {
          id: "faq-07",
          question: "Es compatible con iPhone y Android?",
          answer: "Si. Gracias al uso de Bluetooth Low Energy (BLE), se garantiza conexion estable en iOS y Android. Si se usa ELM327, verificar que la version sea BLE-compatible antes de usarlo con iPhone.",
        },
        {
          id: "faq-08",
          question: "Funciona con cualquier auto?",
          answer: "Es compatible con la gran mayoria de los autos fabricados desde 1996, incluyendo Toyota, Volkswagen, Ford, Chevrolet, Renault, Peugeot, Honda, Nissan y muchas mas.",
        },
        {
          id: "faq-09",
          question: "Que tipo de fallas puede detectar?",
          answer: "Detecta fallas basadas en codigos de error OBD-II (DTC), desde problemas de emisiones y sensores hasta fallos del motor. Cada codigo se traduce a lenguaje claro con una indicacion de urgencia.",
        },
        {
          id: "faq-10",
          question: "La IA puede ayudarme a evitar reparaciones costosas?",
          answer: "Si. AutoLibre esta orientado al mantenimiento preventivo: la IA analiza los datos del vehiculo y alerta ante senales tempranas de falla. Detectar un problema a tiempo suele costar diez veces menos que repararlo tarde.",
        },
        {
          id: "faq-11",
          question: "Puedo usar AutoLibre para comprar o vender un auto usado?",
          answer: "Si, y es una de las funciones mas esperadas —proxima a lanzarse. Si estas comprando, AutoLibre detecta fallas ocultas e identifica si se borraron errores recientemente. Si estas vendiendo, podes generar un certificado de inspeccion para mostrarle al comprador.",
        },
        {
          id: "faq-12",
          question: "Que tramites puedo gestionar desde la app?",
          answer: "Podes configurar recordatorios automaticos para el vencimiento de la VTV/RTO, la renovacion del seguro, el pago de patentes y los servicios de mantenimiento programado. Todo en un solo lugar.",
        },
        {
          id: "faq-13",
          question: "Mis datos y los del vehiculo estan seguros?",
          answer: "Absolutamente. Solo vos tenes acceso a la telemetria de tu auto. Nunca se comparten ni venden datos a terceros.",
        },
        {
          id: "faq-14",
          question: "La app funciona sin senal en la ruta?",
          answer: "Si. La conexion entre el escaner y el celular es por Bluetooth y no requiere internet. Los datos se ven en tiempo real aunque no haya senal. Las funciones de IA y los reportes se sincronizan automaticamente al recuperar conexion.",
        },
        {
          id: "faq-15",
          question: "Cuanto cuesta AutoLibre? Hay version gratuita?",
          answer: "AutoLibre esta en su etapa de lanzamiento y es completamente gratis para los primeros usuarios. Los precios para nuevos usuarios se definiran mas adelante, pero quienes ya esten adentro no se veran afectados.",
        },
        {
          id: "faq-16",
          question: "Como empiezo a usar AutoLibre?",
          answer: "Sin escaner: descarga la app y gestioná los vencimientos y usa el diagnostico por IA. Con escaner: conecta un OBD-II y la app accede a los datos del vehiculo en tiempo real. En menos de 5 minutos ya lo tenes funcionando.",
        },
        {
          id: "faq-17",
          question: "Tienen soporte si tengo un problema?",
          answer: "Si. Podes contactar a contact@autolibre.ai para consultas sobre escaneres, conexion o interpretacion de diagnosticos.",
        },
      ],
    },
    finalCta: {
      heading: "El futuro de gestionar tu auto",
      headingHighlight: "empieza ahora",
      description: "Sumate a la lista de acceso temprano y recibi novedades primero.",
      action: {
        label: "Reservar mi lugar",
        href: "#form-section",
      },
    },
    footer: {
      closingPhrase: "Tu auto es tuyo. La informacion tambien.",
      legalLabel: "AUTO LIBRE",
      legalLinks: [
        { label: "Terminos", href: "#" },
        { label: "Privacidad", href: "#" },
      ],
      socialLinks: [
        { id: "social-tiktok", label: "TikTok", href: "https://www.tiktok.com/@autolibreai" },
        { id: "social-instagram", label: "Instagram", href: "https://www.instagram.com/autolibreai/" },
        { id: "social-x", label: "X", href: "https://x.com/autolibreai" },
        { id: "social-linkedin", label: "LinkedIn", href: "https://linkedin.com/company/autolibreai" },
        { id: "social-email", label: "Email", href: "mailto:hola@autolibre.ai" },
      ],
      secondaryCta: {
        label: "Reservar mi lugar",
        href: "#form-section",
      },
    },
    chat: {
      fabTooltip: "Preguntale a AutoLibre",
      panelTitle: "AutoLibre AI",
      placeholder: "Pregunta sobre tu auto...",
      welcomeMessage: "Hola! Soy el asistente de AutoLibre. Puedo ayudarte con dudas sobre la app, tu auto, o cualquier consulta que tengas.",
    },
  },
  visualCheckpoints: [
    { id: "checkpoint-01", label: "Orden de secciones hero > form > problem > features > faqs > footer" },
    { id: "checkpoint-02", label: "Tipografia principal en escala fuerte y titulo con highlight cian" },
    { id: "checkpoint-03", label: "CTA primaria mas prominente que acciones secundarias" },
    { id: "checkpoint-04", label: "Tarjetas de features con contraste y estados visibles" },
    { id: "checkpoint-05", label: "Sin clipping ni overlap en desktop y mobile" },
    { id: "checkpoint-06", label: "Chat FAB visible en todas las secciones" },
  ],
};
