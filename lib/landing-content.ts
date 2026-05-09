import type { LandingPageContent } from "@/lib/landing-types";

export const landingPageContent: LandingPageContent = {
  brand: {
    name: "AUTO LIBRE",
    badge: "COMING SOON",
    year: "2026",
  },
  sections: {
    hero: {
      eyebrow: "AUTOLIBRE AI",
      headingLineOne: "Tu auto, bajo control.",
      headingLineTwo: "Muy pronto.",
      description:
        "La primera app argentina de gestion de autos con IA. Diagnostico, VTV, multas, repuestos y pagos en un solo lugar.",
      mainAction: {
        label: "Quiero acceso temprano",
        href: "#form-section",
      },
      secondaryAction: {
        label: "Conocer mas",
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
        { id: "benefit-04", text: "Roadmap con mejoras semanales y feedback real." },
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
          title: "Diagnostico en lenguaje humano",
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
          description: "Te avisamos antes de que venzan tu VTV, seguro, patente o que tu auto necesite atencion.",
        },
        {
          id: "feature-04",
          icon: "clipboard",
          title: "Gestion de tramites",
          description: "VTV, seguro, patente, servicios. Todo organizado y con recordatorios automaticos.",
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
          question: "Necesito conocimientos mecanicos para usar AutoLibre?",
          answer: "No. AutoLibre traduce todo a lenguaje simple. No necesitas saber nada de mecanica para entender que le pasa a tu auto.",
        },
        {
          id: "faq-02",
          question: "Funciona con cualquier auto?",
          answer: "AutoLibre funciona con cualquier vehiculo que tenga puerto OBD-II, que es estandar en todos los autos fabricados desde 1996.",
        },
        {
          id: "faq-03",
          question: "Mis datos son privados?",
          answer: "Absolutamente. Tus datos son tuyos. No los vendemos ni compartimos. Usamos encriptacion de nivel bancario.",
        },
        {
          id: "faq-04",
          question: "Cuando lanza?",
          answer: "Estamos en beta cerrada. Sumate a la lista de espera para ser de los primeros en acceder cuando abramos.",
        },
        {
          id: "faq-05",
          question: "Que necesito para conectarme?",
          answer: "Solo un escaner OBD-II compatible (te recomendamos uno en la app) y tu smartphone. La conexion es por Bluetooth.",
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
