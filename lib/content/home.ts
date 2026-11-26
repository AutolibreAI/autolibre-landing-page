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
   * Hero. El `<h1>` es el eslogan del sitio, "Todo tu auto, en un solo
   * lugar.", armado con las partes de `title`. El texto indexable y accesible
   * es SIEMPRE el eslogan completo (`lead vehicle` + `comma` + `rest`); a la
   * vista, la palabra del vehículo va cayendo por `rotatingWords`
   * (`HeroRotatingWord`, 2026-11-26). La primera es la del HTML del server.
   */
  hero: {
    title: {
      lead: "Todo tu",
      vehicle: "auto",
      comma: ",",
      rest: "en un solo lugar.",
      /** En minúscula: las mayúsculas son de CSS (`uppercase`), no del copy. */
      rotatingWords: ["auto", "moto"],
    },
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
   * Carrusel de beneficios de aliados: negocios y servicios con una alianza
   * real con AutoLibre (no son proveedores cualquiera del marketplace), cada
   * uno con su propio banner. `href` sale del link "website" de su perfil en
   * `/proveedores/<slug>` cuando lo tiene ahí; si no, se confirma a mano con
   * producto antes de cargarlo (nunca una URL inventada).
   *
   * La Esquina del Neumático (2026-11-25) es distinto: el aliado manda la
   * pieza YA armada como imagen (una de escritorio y otra de celular), cada
   * una con su propio link (mismo beneficio, `utm_content` distinto para
   * comparar formatos). Cupo de 150 beneficios, vigente hasta el 31/01/2027:
   * se baja a mano cuando venza.
   */
  allies: {
    title: "Beneficios de nuestros aliados",
    prevLabel: "Aliado anterior",
    nextLabel: "Aliado siguiente",
    goToLabel: (position: number) => `Ir al banner ${position}`,
    slides: [
      {
        id: "asistir24",
        /* Versión blanca del isologo: el banner tiene fondo de marca (azul), no `surface`. */
        partnerLogo: { src: "/brand/aliados/asistir24-white.png", alt: "Asistir24", width: 520, height: 370 },
        bigNumber: "24",
        bigNumberLabel: "horas de asistencia",
        badgeCta: { label: "Pedí auxilio", href: "https://asistir24.com.ar/" },
        headline: "Del auxilio al taller, sin vueltas.",
        description:
          "Si te quedás en el camino, la grúa te lleva directo a un taller de la red AutoLibre.",
        steps: ["Grúa de Asistir24", "Taller de la red AutoLibre"],
      },
      {
        id: "sinfotomultas",
        /* Versión blanca del isologo: el banner tiene fondo oscuro, no `surface`. */
        partnerLogo: { src: "/brand/aliados/sinfotomultas-white.png", alt: "Sin Fotomultas", width: 742, height: 72 },
        headline: "Reducí tus multas de tránsito.",
        headlineHighlight: "multas de tránsito.",
        description:
          "Antes de pagar, mirá cuánto se pueden reducir. Gestión legal en CABA y Provincia de Buenos Aires.",
        cta: { label: "Consultá tu caso", href: "https://sinfotomultas.com.ar/" },
        note: { label: "libre deuda", value: "7 a 10", unit: "días" },
      },
      {
        id: "integrity",
        partnerLogo: { src: "/brand/aliados/integrity.svg", alt: "Intēgrity Seguros", width: 262, height: 57 },
        eyebrow: "Disfrutá manejar. De protegerte nos ocupamos nosotros.",
        discount: "30%",
        discountUnit: "off",
        planLabel: "En tu seguro de auto",
        installments: "+3 cuotas fijas",
        description: "Cobertura premium y asistencia para que viajes con tranquilidad.",
        cta: {
          label: "Cotizá con Intēgrity",
          href: "https://cotizadores.integrityseguros.com.ar/auto/?promo=AUTO18&origen=Libre",
        },
      },
      {
        id: "esquina-neumatico",
        /** Para el `<h3>` (solo lectores de pantalla): la pieza es una imagen. */
        title: "La Esquina del Neumático: 20% OFF en alineación y balanceo para usuarios de AutoLibre, en todas las sucursales, hasta el 31 de enero.",
        desktop: {
          src: "/brand/aliados/esquina-neumatico-desktop.jpeg",
          width: 1600,
          height: 400,
          href: "https://www.laesquinadelneumatico.com.ar/beneficio-autolibre/?e=5gg68rf3kenb&utm_source=autolibre&utm_medium=banner&utm_campaign=beneficio-autolibre&utm_content=banner_desktop",
        },
        mobile: {
          src: "/brand/aliados/esquina-neumatico-mobile.jpeg",
          width: 780,
          height: 1200,
          href: "https://www.laesquinadelneumatico.com.ar/beneficio-autolibre/?e=5gg68rf3kenb&utm_source=autolibre&utm_medium=banner&utm_campaign=beneficio-autolibre&utm_content=banner_mobile",
        },
        alt: "Activar beneficio: 20% OFF en alineación y balanceo en La Esquina del Neumático, exclusivo para usuarios de AutoLibre.AI. Válido en todas sus sucursales.",
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
      src: "/screenshots/app-inicio.webp",
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
    "app-inicio.webp", // Inicio: qué necesitás y beneficios
    "IMG_0578.PNG", // Garage
    "IMG_0579.PNG", // Ficha del auto: alertas y documentos
  ].map((file) => ({
    src: `/screenshots/${file}`,
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
   * FAQ del Home: las cinco del lienzo (grupo "Tu pedido") y, debajo, tres
   * grupos cortos de la app elegidos por `id` de `lib/content/faq.ts`. El
   * `FAQPage` del Home lleva EXACTAMENTE estas preguntas; todas las demás
   * están en `/preguntas-frecuentes` (link "Ver todas").
   */
  faq: {
    eyebrow: "Preguntas frecuentes",
    title: "Lo que más nos preguntan",
    lead: "Cómo funciona el pedido de propuestas y qué hace la app, en respuestas cortas.",
    allLink: "Ver todas las preguntas",
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
    /** Grupos de la app del Home: máximo tres preguntas cada uno. */
    appGroups: [
      {
        id: "home-faq-la-app",
        name: "La app",
        itemIds: ["faq-como-empiezo", "faq-costo", "faq-varios-autos"],
      },
      {
        id: "home-faq-diagnostico",
        name: "Diagnóstico",
        itemIds: ["faq-diagnostica-sola", "faq-adaptador-obligatorio", "faq-que-adaptador"],
      },
      {
        id: "home-faq-documentacion",
        name: "Documentación y vencimientos",
        itemIds: ["faq-documentos", "faq-tramites", "faq-servicios-previos"],
      },
    ],
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
