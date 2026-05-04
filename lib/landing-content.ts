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
        label: "Conocer verticales",
        href: "#verticals",
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
    },
    verticals: {
      tag: "PRODUCTO",
      heading: "Verticales que construyen",
      headingHighlight: "la experiencia AutoLibre",
      items: [
        {
          id: "vertical-01",
          emoji: "🤖",
          status: "En beta",
          title: "Diagnostico Inteligente",
          description:
            "Traducimos sintomas del auto a pasos accionables para que sepas que pasa y que tan urgente es.",
        },
        {
          id: "vertical-02",
          emoji: "📁",
          status: "En desarrollo",
          title: "Tramites y Documentos",
          description:
            "Gestion unificada de VTV, seguro, patente y multas con recordatorios automatizados.",
        },
        {
          id: "vertical-03",
          emoji: "🛒",
          status: "En desarrollo",
          title: "Marketplace Automotriz",
          description:
            "Comparacion de presupuestos para repuestos y servicios con recomendaciones asistidas por IA.",
        },
        {
          id: "vertical-04",
          emoji: "💳",
          status: "Proximamente",
          title: "Capa Fintech",
          description:
            "Pagos, cuotas y operaciones vehiculares en una sola experiencia integrada.",
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
      legalLabel: "AUTO LIBRE",
      legalLinks: [
        { label: "Terminos", href: "#" },
        { label: "Privacidad", href: "#" },
      ],
      socialLinks: [
        { id: "social-tiktok", label: "TikTok", href: "https://www.tiktok.com/@autolibreai" },
        { id: "social-instagram", label: "Instagram", href: "https://www.instagram.com/autolibreai/" },
        { id: "social-x", label: "X", href: "https://x.com/autolibreai" },
      ],
    },
  },
  visualCheckpoints: [
    { id: "checkpoint-01", label: "Orden de secciones hero > form > verticals > final cta > footer" },
    { id: "checkpoint-02", label: "Tipografia principal en escala fuerte y titulo con highlight cian" },
    { id: "checkpoint-03", label: "CTA primaria mas prominente que acciones secundarias" },
    { id: "checkpoint-04", label: "Tarjetas de verticales con contraste y estados visibles" },
    { id: "checkpoint-05", label: "Sin clipping ni overlap en desktop y mobile" },
  ],
};
