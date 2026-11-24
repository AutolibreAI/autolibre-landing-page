import { MARKETING_PROVIDERS_COUNT, traction } from "@/lib/content/about";
import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";
import { siteConfig } from "@/lib/seo/config";

/**
 * Cifra de proveedores para textos de marketing (DECISIONES del rediseño,
 * 24-11-2026: "+150"). El directorio (`/proveedores`) muestra el conteo real.
 */
export { MARKETING_PROVIDERS_COUNT };
// Vive en `about.ts` (junto a `traction`) para que `/sobre-nosotros` la use
// sin importar este archivo (`home.ts` ya importa `about.ts`).

/** Ícono 3D de la app (WebP en `public/images/servicios/`, al doble del tamaño de uso). */
type ServiceIcon = { readonly src: string; readonly width: number; readonly height: number };

const serviceIcon = (name: string): ServiceIcon => ({
  src: `/images/servicios/${name}.webp`,
  width: 128,
  height: 128,
});

/**
 * Copy del Home (rediseño 2026-11, fase 4a: `Main` y `Home-celular` del
 * lienzo). Un objeto por sección, en el mismo orden que la página. La
 * conversión principal es el módulo de pedido del hero; WhatsApp queda
 * visible como segunda opción (dentro del módulo y en la barra fija).
 */
export const homeContent = {
  /**
   * Title y description del Home, orientados al pedido (DECISIONES:
   * pendiente del equipo). Opción aplicada (A). La alternativa (B) queda en
   * `docs/rediseno-2026-11/INFORME.md`, fase 4a. El Home no recibe el
   * template `%s · AutoLibre` del layout: la marca va escrita acá.
   */
  meta: {
    title: "AutoLibre · Pedí propuestas de talleres cerca tuyo, gratis",
    description: `Contá qué le pasa a tu auto y recibí propuestas de talleres y proveedores de tu zona por WhatsApp, en el día. Gratis y sin compromiso. ${MARKETING_PROVIDERS_COUNT} proveedores en AMBA.`,
    breadcrumb: "Inicio",
  },

  /**
   * Hero. El `<h1>` es el eslogan actual del sitio (opción conservadora; el
   * lienzo propone también "¿Qué necesita tu auto?", que queda anotada en el
   * INFORME como alternativa). Sin palabras rotativas: el diseño nuevo no
   * las trae.
   */
  hero: {
    title: "Todo tu auto, en un solo lugar.",
    subtitle:
      "Hacé tu pedido y recibí propuestas de talleres y proveedores cerca tuyo. Gratis y sin compromiso.",
    /**
     * Cifras de la fila de abajo. Solo publicables: "+150" (decisión del
     * 24-11) y "700+" vehículos (`traction` de `about.ts`, ver PRODUCT.md).
     */
    facts: [
      { id: "proveedores", value: MARKETING_PROVIDERS_COUNT, label: "proveedores en la red" },
      { id: "vehiculos", value: traction.vehicles, label: "vehículos cargados" },
      { id: "respuesta", value: "En el día", label: "te respondemos" },
    ],
  },

  /** "Todo lo que podés pedir": cada servicio lleva a `/pedido`. */
  services: {
    title: "Todo lo que podés pedir",
    subtitle: "Hoy operamos en AMBA y estamos ampliando.",
    items: [
      { id: "mecanica", label: "Mecánica", icon: serviceIcon("mecanica") },
      { id: "service", label: "Service", icon: serviceIcon("service") },
      { id: "frenos", label: "Frenos", icon: serviceIcon("frenos") },
      { id: "alineacion", label: "Alineación y balanceo", icon: serviceIcon("alineacion") },
      { id: "luz-tablero", label: "Luz en el tablero", icon: serviceIcon("luz-tablero") },
      { id: "aire", label: "Aire acondicionado", icon: serviceIcon("aire") },
    ],
    alsoLabel: "También:",
    also: [
      "Suspensión",
      "Electricidad",
      "Baterías",
      "Tren delantero",
      "Chapa y pintura",
      "Gomería",
      "Detailing",
      "Inspección pre-compra",
    ],
    more: "+20 servicios más",
    href: "/pedido",
  },

  /**
   * Cómo funciona. El lienzo suma un ejemplo de propuestas con
   * "[Proveedor A]" y "$ [precio]": no hay datos reales para eso, así que no
   * se muestra (anotado en el INFORME).
   */
  howItWorks: {
    eyebrow: "Cómo funciona",
    title: "Un pedido, varias respuestas.",
    steps: [
      {
        id: "cf-01",
        number: "01",
        title: "Contás qué pasa",
        body: "Por acá, por WhatsApp o desde la app. Con la patente ya sabemos marca, modelo y año.",
      },
      {
        id: "cf-02",
        number: "02",
        title: "Te llegan propuestas",
        body: "De proveedores que trabajan en tu zona. Te las mandamos por WhatsApp, en el día.",
      },
      {
        id: "cf-03",
        number: "03",
        title: "Comparás y elegís",
        body: "Nada se confirma sin que lo decidas. El trabajo queda en el historial de tu auto.",
      },
    ],
  },

  /**
   * Beneficios de aliados: negocios con una alianza real con AutoLibre. El
   * lienzo suma La Esquina del Neumático ("20% OFF"): sigue afuera hasta que
   * producto lo confirme (pendiente en DECISIONES, pedido explícito del
   * 2026-11-17). Los `href` son los mismos que ya publicaba el Home.
   */
  allies: {
    title: "Beneficios de nuestros aliados",
    items: [
      {
        id: "asistir24",
        highlight: "24 horas",
        tone: "brand-50",
        partner: "Asistir24",
        title: "Del auxilio al taller, sin vueltas.",
        body: "La grúa te lleva directo a un taller de la red AutoLibre.",
        cta: { label: "Pedí auxilio", href: "https://asistir24.com.ar/" },
      },
      {
        id: "sinfotomultas",
        highlight: "7 a 10 días",
        tone: "on-dark",
        partner: "Sin Fotomultas",
        title: "Reducí tus multas de tránsito.",
        body: "Libre deuda en 7 a 10 días. Gestión legal en CABA y Provincia de Buenos Aires.",
        cta: { label: "Consultá tu caso", href: "https://sinfotomultas.com.ar/" },
      },
      {
        id: "integrity",
        highlight: "30% off",
        tone: "brand-200",
        partner: "Intēgrity Seguros",
        title: "En tu seguro de auto, +3 cuotas fijas",
        body: "Cobertura premium y asistencia.",
        cta: {
          label: "Cotizá con Intēgrity",
          href: "https://cotizadores.integrityseguros.com.ar/auto/?promo=AUTO18&origen=Libre",
        },
      },
    ],
  },

  /** La app: panel oscuro con tres funciones, tiendas y una captura real. */
  app: {
    eyebrow: "La app de AutoLibre",
    title: "Todo lo que necesitás, en una app",
    items: [
      {
        id: "app-vencimientos",
        title: "Vencimientos y papeles",
        body: "VTV, seguro, patente y licencia, avisados a tiempo.",
      },
      {
        id: "app-historial",
        title: "Cada service suma. Que quede probado.",
        body: "Cada trabajo queda registrado con fecha, taller y comprobante.",
      },
      {
        id: "app-diagnostico",
        title: "Entendé qué le pasa antes de llegar al taller.",
        body: "La IA te orienta. El diagnóstico final siempre lo hace un mecánico.",
      },
    ],
    downloadNote: "Gratis, para iPhone y Android.",
    screenshot: {
      src: "/screenshots/IMG_0577.PNG",
      width: 1170,
      height: 2532,
      alt: "Pantalla de inicio de la app AutoLibre",
    },
  },

  /**
   * Capturas reales de la app (`public/screenshots/`). Hoy solo las usa el
   * bloque de descarga de las notas del blog (`ArticleAppCta`).
   */
  appScreens: [
    "IMG_0577", // Inicio: tu garage y talleres
    "IMG_0578", // Garage
    "IMG_0579", // Ficha del auto: alertas y documentos
  ].map((name) => ({
    src: `/screenshots/${name}.PNG`,
    width: 1170,
    height: 2532,
  })),

  /** Últimas notas del blog (3, de Hygraph) + "Más guías" elegidas a mano. */
  guides: {
    title: "Guías para tener tu auto en regla",
    subtitle:
      "Trámites, seguros y papeles del auto, explicados paso a paso por el equipo de AutoLibre.",
    cta: "Ver todas las guías",
    moreTitle: "Más guías",
  },

  /**
   * FAQ del Home: las cinco del lienzo (orientadas al pedido) y, debajo, las
   * de la app (`lib/content/faq.ts`) agrupadas por tema, para no perder ese
   * contenido indexable. Todo va al `FAQPage`.
   */
  faq: {
    title: "Preguntas frecuentes",
    contact: {
      prefix: "¿No encontrás tu respuesta? Escribinos a ",
      middle: " o por ",
      whatsapp: "WhatsApp",
      suffix: ".",
    },
    items: [
      {
        id: "home-faq-costo",
        question: "¿Cuánto cuesta?",
        answer: "Nada. Solo le pagás al proveedor si decidís hacer el trabajo.",
      },
      {
        id: "home-faq-llamadas",
        question: "¿Me van a llamar los proveedores?",
        answer: "No. Hablás con nosotros hasta que elijas un proveedor. Vos le escribís a ellos.",
      },
      {
        id: "home-faq-app",
        question: "¿Tengo que bajar la app?",
        answer: "No. Todo se resuelve acá o por WhatsApp. Pero si querés centralizar todo, es gratis.",
      },
      {
        id: "home-faq-datos",
        question: "¿Qué datos necesitan?",
        answer:
          "Qué le pasa al auto, tu zona y tu WhatsApp. La patente es opcional, pero con ella ya sabemos marca, modelo y año, y te respondemos más rápido.",
      },
      {
        id: "home-faq-zona",
        question: "¿Dónde funciona?",
        answer: "Hoy operamos en AMBA y estamos ampliando a otras zonas del país.",
      },
    ],
    moreTitle: "Sobre la app",
    /** Preguntas de `faq.ts` que repiten una de arriba: no se muestran dos veces. */
    duplicateIds: ["faq-zonas"],
  },

  /**
   * Banda para negocios. La del Home es la tarjeta del lienzo (tres
   * botones); `ProviderBandSection` (directorio y perfiles) usa `register`.
   */
  providerBand: {
    title: "¿Tenés un taller o prestás un servicio?",
    subtitle:
      "Recibí pedidos de servicio de gente que ya sabe qué necesita, con los datos del vehículo incluidos.",
    register: { label: "Sumate a AutoLibre", href: PROVEEDORES_REGISTRO_PATH },
    plans: { label: "Ver planes", href: PROVEEDORES_PLANES_PATH },
    network: { label: "Ver la red", href: PROVEEDORES_PATH },
  },

  /**
   * Cierre de descarga (`ClosingCtaSection`). Ya no va en el Home: lo usan
   * `/blog`, sus categorías y `/sobre-nosotros`.
   */
  closing: {
    title: "Tu auto siempre supo qué tenía. Ahora vos también.",
    downloadNote: "Gratis, para iPhone y Android.",
  },

  contactEmail: siteConfig.contact.email,
} as const;
