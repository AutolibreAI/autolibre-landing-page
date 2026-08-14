/**
 * Configuración SEO global. Todo lo que se repite entre páginas
 * (URL canónica base, nombre del sitio, OG por defecto) vive acá.
 */

export const siteConfig = {
  name: "AutoLibre",
  legalName: "AutoLibre.AI",
  /**
   * URL absoluta del sitio. Se usa como `metadataBase`, así todas las
   * rutas relativas de canonical/OG se resuelven a absolutas solas.
   */
  url: "https://autolibre.ai",
  locale: "es_AR",
  lang: "es-AR",
  title: "AutoLibre · Todo lo de tu auto, en un solo lugar",
  description:
    "Documentación, vencimientos, historial, diagnóstico con IA y talleres cerca tuyo. Toda la información de tu auto ordenada en una sola app. Early access en Argentina.",
  keywords: [
    "app para autos",
    "historial de vehículo",
    "diagnóstico OBD2 con IA",
    "vencimientos VTV seguro patente",
    "talleres mecánicos AMBA",
    "presupuesto taller online",
    "mantenimiento preventivo auto",
  ],
  ogImage: {
    url: "/brand/og-image.png",
    width: 1200,
    height: 630,
    alt: "AutoLibre — todo lo de tu auto, en un solo lugar",
  },
  contact: {
    email: "contact@autolibre.ai",
    /** Formato legible, para mostrar en pantalla. */
    phone: "+54 9 11 7280-4347",
    /** E.164 — es el formato que pide schema.org y el que entiende `tel:`. */
    phoneE164: "+5491172804347",
    /** wa.me sólo acepta dígitos: sin +, sin espacios y sin guiones. */
    whatsapp: "https://wa.me/5491172804347?text=Hola!%20Me%20interesa%20comprar%20un%20escáner!",
  },
  social: [
    "https://www.tiktok.com/@autolibreai",
    "https://www.instagram.com/autolibreai/",
    "https://x.com/autolibreai",
    "https://linkedin.com/company/auto-libre-ai",
  ],
} as const;

export type SiteConfig = typeof siteConfig;
