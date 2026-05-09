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
      socialProof: "Más de 100 conductores ya se sumaron a la lista de espera.",
    },
    form: {
      tag: "EARLY ACCESS",
      heading: "Accede primero a",
      headingHighlight: "Auto Libre",
      benefits: [
        { id: "benefit-01", text: "Acceso anticipado al lanzamiento." },
        { id: "benefit-02", text: "Precio fundador, bloqueado para siempre." },
        { id: "benefit-03", text: "Tus sugerencias entran directo al roadmap." },
        { id: "benefit-04", text: "Soporte prioritario con el equipo." },
        { id: "benefit-05", text: "Acceso exclusivo a funciones en beta." },
      ],
      microcopy: "Nada de ruido. Solo Auto Libre, cuando esté listo.",
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
          text: "El puerto OBD-II está en tu auto desde 1996. Nunca fue pensado para que vos lo usaras.",
          icon: "plug",
        },
        {
          id: "problem-02",
          text: "Antes esperabas que algo se rompiera. Ahora lo sabés antes.",
          icon: "alert",
        },
        {
          id: "problem-03",
          text: "Pagaste de más porque no sabías. La información también es ahorro.",
          icon: "wallet",
        },
      ],
    },
    features: {
      tag: "QUÉ VAS A PODER HACER",
      heading: "Todo lo que necesitás,",
      headingHighlight: "en un solo lugar.",
      items: [
        {
          id: "feature-01",
          icon: "brain",
          title: "Diagnóstico con IA",
          description: "Entendé qué le pasa a tu auto sin ser mecánico. La IA traduce códigos técnicos a explicaciones claras.",
        },
        {
          id: "feature-02",
          icon: "history",
          title: "Historial digital del auto",
          description: "Todos tus servicios, reparaciones y eventos en un solo lugar. Nada se pierde, todo queda registrado.",

        },
        {
          id: "feature-03",
          icon: "bell",
          title: "La agenda de tu auto",
          description: "VTV, seguro, patente y service con recordatorios automáticos. Te avisamos antes de que algo falle.",
        },
        {
          id: "feature-04",
          icon: "clipboard",
          title: "Buscá, compará, decidí",
          description: "Talleres y repuestos cerca tuyo, comparados por precio y reputación. Vos elegís con toda la info.",
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
          question: "¿Cuánto cuesta AutoLibre? ¿Hay versión gratuita?",
          answer: "Auto Libre está en su etapa de lanzamiento y es completamente gratis para los primeros usuarios. Los precios para nuevos usuarios se definirán más adelante, pero quienes ya estén adentro no se verán afectados.",
        },
        {
          id: "faq-02",
          question: "¿Para qué tipo de usuario está pensado?",
          answer: "Para dos perfiles principales: el dueño de un auto que alguna vez no supo qué le pasaba, cuanto salía o donde llevarlo, y quién gestiona una pequeña flota familiar o empresarial y necesita mantener el control de vencimientos y estado de varios vehículos.",
        },
        {
          id: "faq-03",
          question: "¿Funciona con cualquier auto?",
          answer: "La app funciona con cualquier auto. El diagnóstico por OBD-II requiere un escáner y un auto de 1996 o más nuevo — que es la gran mayoría. ¿Tenés dudas sobre tu modelo? Preguntale al chat.",
        },
        {
          id: "faq-04",
          question: "¿Por qué es diferente a otras apps de diagnóstico?",
          answer: "Las apps tradicionales te muestran el código de error, pero ahí terminan. Auto Libre va varios pasos más: diagnóstico por síntomas (sin necesitar ningún dispositivo), diagnóstico por OBD-II con explicación en lenguaje claro, y gestión de trámites centralizada con recordatorios automáticos.",
        },
        {
          id: "faq-05",
          question: "¿Qué es AutoLibre?",
          answer: "AutoLibre es el asistente inteligente que entiende lo que le pasa a tu auto. Podés describir cualquier síntoma —un ruido raro, una luz en el tablero, algo que no se siente bien— y la IA te explica qué puede estar pasando y si necesitás ir a un taller. Si además conectás un escáner OBD-II, accede directamente a los datos del vehículo para un diagnóstico aún más preciso. También te ayuda a gestionar todos tus trámites obligatorios —VTV, seguro, patente y servicios— para que nunca más tengas que adivinar cuándo actuar.",
        },
        {
          id: "faq-06",
          question: "¿Qué es el puerto OBD-II?",
          answer: "Es una conexión estándar que todos los autos fabricados desde 1996 tienen por ley. Fue creada principalmente por razones ambientales, para estandarizar el diagnóstico de fallas y garantizar que los vehículos cumplieran con las normativas de emisiones contaminantes a largo plazo. Auto Libre te da esa información en lenguaje claro, para que por primera vez seas vos quien toma las decisiones sobre tu vehículo.",
        },
        {
          id: "faq-07",
          question: "¿Cómo empiezo a usar AutoLibre?",
          answer: "Sin escáner: descargá la app y gestioná los vencimientos y usá el diagnóstico por IA. Con escáner: conectá un OBD-II y la app accede a los datos del vehículo en tiempo real. En menos de 5 minutos ya lo tenés funcionando.",
        },
        {
          id: "faq-08",
          question: "¿Cómo se conecta la app con mi auto?",
          answer: "Se utiliza un pequeño dispositivo llamado escáner OBD-II que se enchufa en el puerto de diagnóstico del vehículo (generalmente debajo del volante). La app se comunica con él de forma inalámbrica por Bluetooth.",
        },
        {
          id: "faq-09",
          question: "¿Qué escáner recomiendan usar?",
          answer: "La recomendación principal es el Vgate iCar Pro: bajo consumo de batería, compatibilidad garantizada y estabilidad de conexión probada. También son compatibles el Konnwei KW906 y el ELM327 v1.5. Atención con el ELM327: existen versiones que no son compatibles con iPhone. Aseguráte de que diga \"BLE\" o \"Bluetooth 4.0\" en la descripción antes de comprarlo.",
        },
        {
          id: "faq-10",
          question: "¿Es compatible con iPhone y Android?",
          answer: "Sí. Gracias al uso de Bluetooth Low Energy (BLE), se garantiza conexión estable en iOS y Android. Si se usa ELM327, verificar que la versión sea BLE-compatible antes de usarlo con iPhone.",
        },
        {
          id: "faq-11",
          question: "¿Qué tipo de fallas puede detectar?",
          answer: "Detecta fallas basadas en códigos de error OBD-II (DTC), desde problemas de emisiones y sensores hasta fallos del motor. Cada código se traduce a lenguaje claro con una indicación de urgencia.",
        },
        {
          id: "faq-12",
          question: "¿La IA puede ayudarme a evitar reparaciones costosas?",
          answer: "Sí. Auto Libre está orientado al mantenimiento preventivo: la IA analiza los datos del vehículo y alerta ante señales tempranas de falla. Detectar un problema a tiempo suele costar diez veces menos que repararlo tarde.",
        },
        {
          id: "faq-13",
          question: "¿Puedo usar AutoLibre para comprar o vender un auto usado?",
          answer: "Sí, y es una de las funciones más esperadas —próxima a lanzarse. Si estás comprando, Auto Libre detecta fallas ocultas e identifica si se borraron errores recientemente. Si estás vendiendo, podés generar un certificado de inspección para mostrarle al comprador.",
        },
        {
          id: "faq-14",
          question: "¿Qué trámites puedo gestionar desde la app?",
          answer: "Podés configurar recordatorios automáticos para el vencimiento de la VTV/RTO, la renovación del seguro, el pago de patentes y los servicios de mantenimiento programado. Todo en un solo lugar.",
        },
        {
          id: "faq-15",
          question: "¿La app funciona sin señal en la ruta?",
          answer: "Sí. La conexión entre el escáner y el celular es por Bluetooth y no requiere internet. Los datos se ven en tiempo real aunque no haya señal. Las funciones de IA y los reportes se sincronizan automáticamente al recuperar conexión.",
        },
        {
          id: "faq-16",
          question: "¿Tienen soporte si tengo un problema?",
          answer: "Sí. Podés contactar a contact@autolibre.ai para cualquier consulta.",
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
        { id: "social-linkedin", label: "LinkedIn", href: "https://linkedin.com/company/auto-libre-ai" },
        { id: "social-email", label: "Email", href: "mailto:contact@autolibre.ai" },
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
      welcomeMessage: "Hola! Soy AutoLibreAI. Puedo ayudarte con dudas sobre la app, tu auto, o cualquier consulta que tengas.",
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
