import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";
import type {
  FeatureItem,
  HeroHighlight,
  TimelineEntry,
} from "@/lib/content/types";

/** Copy de la home. Un objeto por sección, en el mismo orden que la página. */
export const homeContent = {
  /**
   * Hero de la home: qué es AutoLibre, en general. Tiene el único `<h1>` de
   * la página y absorbe la descarga (tiendas + ancla `#descargar`). Sin CTA de
   * presupuesto a propósito: el pedido va en el header y en `QuotesSection`.
   */
  hero: {
    titleLines: ["Todo tu auto,", "en un solo lugar."],
    subtitle:
      "Documentación, vencimientos, historial, diagnóstico con IA, talleres y servicios cerca tuyo.",
    /**
     * Las funciones que más conviene mostrar primero, por potencial de
     * ingresos (decisión de producto, 2026-10-07): presupuestos con talleres,
     * diagnóstico (y el adaptador), mantenimiento y multas. Texto en el HTML
     * del servidor. "Financiación" quedó afuera a propósito: no es una
     * función de la app. Si producto no confirma que las multas están
     * disponibles para todos, se saca el último ítem.
     */
    highlights: [
      {
        id: "highlight-presupuestos",
        icon: "receipt",
        text: "Hacé tu pedido y compará soluciones",
      },
      {
        id: "highlight-diagnostico",
        icon: "car",
        text: "Entendé qué le pasa a tu auto",
      },
      {
        id: "highlight-mantenimiento",
        icon: "clock",
        text: "Mantené tu auto al día",
      },
      {
        id: "highlight-multas",
        icon: "alert",
        text: "Enterate si tenés multas",
      },
    ] satisfies readonly HeroHighlight[],
    downloadNote: "Gratis, para iPhone y Android.",
    /**
     * Palabras que suben (con rebote) debajo del eslogan, mismo tamaño y en
     * verde. Son 8 a propósito: el keyframe `hero-word` de `globals.css`
     * asume 8 pasos. La primera queda fija con
     * `prefers-reduced-motion`.
     */
    words: [
      "VTV",
      "Multas",
      "Seguros",
      "Registro",
      "Mantenimientos",
      "Services",
      "Talleres",
      "Documentación",
    ],
    /** Lo que leen los lectores de pantalla en lugar de la animación. */
    wordsSrText:
      "VTV, multas, seguros, registro, mantenimientos, services, talleres y documentación.",
    /**
     * Pantallas del teléfono: capturas reales de `public/screenshots/`, en el
     * orden de sus nombres (IMG_0577 → IMG_0584). Ciclo propio, NO
     * sincronizado con las palabras. Son 8 a propósito: el keyframe
     * `hero-screen` asume 8 pasos. La primera es la imagen LCP.
     */
    screens: [
      "IMG_0577", // Inicio: tu garage y talleres
      "IMG_0578", // Garage
      "IMG_0579", // Ficha del auto: alertas y documentos
      "IMG_0580", // Servicios y talleres aliados
      "IMG_0581", // Pedir cotización
      "IMG_0582", // Pedido enviado
      "IMG_0583", // Servicios con el pedido en curso
      "IMG_0584", // Chat con la IA
    ].map((name) => ({
      src: `/screenshots/${name}.PNG`,
      width: 1170,
      height: 2532,
    })),
    phoneLabel:
      "Pantallas de la app AutoLibre: el inicio con tu garage, la ficha del auto con alertas y documentos, los talleres aliados, el pedido de cotización y su seguimiento, y el chat de diagnóstico con IA.",
  },

  /**
   * "Dos caminos": la misma cuenta de AutoLibre sirve para pedir un servicio
   * o para ofrecerlo. Va justo después del hero (decisión de producto del
   * 12/11/2026, research "AutoLibre marketplace rediseño").
   */
  twoPaths: {
    eyebrow: "Una sola cuenta",
    title: "Pedís servicios para tu auto o los ofrecés.",
    subtitle:
      "Es la misma cuenta de la app de AutoLibre: si tenés un taller, lo sumás sin crear otro usuario.",
    driver: {
      eyebrow: "Para conductores",
      title: "Necesito un servicio para mi auto",
      items: [
        "Contá qué necesita, con los datos de tu auto ya cargados.",
        "Te responden talleres cerca tuyo y elegís.",
        "El trabajo queda en el historial de tu auto.",
      ],
      cta: { label: "Hacé tu pedido", href: "/pedido" },
      secondaryCta: { label: "Ver proveedores", href: PROVEEDORES_PATH },
    },
    provider: {
      eyebrow: "Para talleres y negocios",
      title: "Tengo un taller o presto un servicio",
      items: [
        "Registrarte es gratis y aparecés en el directorio.",
        "Recibí pedidos de gente que ya sabe qué necesita.",
        "Planes con precio fijo mensual, sin comisión por trabajo.",
      ],
      primaryCta: { label: "Sumá tu negocio", href: PROVEEDORES_REGISTRO_PATH },
      secondaryCta: { label: "Ver planes", href: PROVEEDORES_PLANES_PATH },
    },
  },

  problem: {
    title: "Ahora sabés qué necesita tu auto",
    paragraphs: [
      "Qué necesita, cuándo hacerlo y cuánto debería costarte. Toda la información de tu auto, ordenada y disponible en un solo lugar.",
      "El mecánico no es el problema. La diferencia es tener la información para saber qué hacer y tomar mejores decisiones.",
    ],
  },

  features: {
    title: "Todo lo que necesitás, en una app",
    items: [
      {
        id: "feature-documentacion",
        icon: "document",
        title: "Documentación",
        description: "Cédula, título, póliza y licencia siempre a mano.",
      },
      {
        id: "feature-vencimientos",
        icon: "bell",
        title: "Vencimientos",
        description: "VTV, seguro, patente y service, avisados a tiempo.",
      },
      {
        id: "feature-historial",
        icon: "clock",
        title: "Historial",
        description: "Todo lo que le hiciste al auto, registrado.",
      },
      {
        id: "feature-diagnostico",
        icon: "car",
        title: "Diagnóstico",
        description: "Qué le pasa al auto, explicado.",
      },
      {
        id: "feature-talleres",
        icon: "pin",
        title: "Talleres y servicios",
        description: "A quién llamar, cerca tuyo.",
      },
    ] satisfies readonly FeatureItem[],
    highlight: "Todos tus autos en una sola cuenta.",
  },

  marketplace: {
    title: "Un pedido, varias respuestas.",
    subtitle:
      "Contá qué necesitás y te responden talleres cerca tuyo, con los datos de tu auto ya cargados. Sin explicar todo de nuevo por WhatsApp.",
    steps: [
      { id: "step-1", label: "Hacés tu pedido de servicio" },
      { id: "step-2", label: "Recibís respuestas" },
      {
        id: "step-3",
        label: "Elegís y queda registrado en el historial de tu auto",
      },
    ],
    services: [
      "Service",
      "Frenos",
      "Suspensión",
      "Electricidad",
      "Chapa y pintura",
      "Gomería",
      "Baterías",
      "Tren delantero",
      "Detailing",
      "Inspección pre-compra",
    ],
    servicesMore: "+20 servicios más",
    coverage: "Hoy operamos en AMBA y estamos ampliando.",
  },

  /**
   * Carrusel de beneficios de aliados: negocios y servicios con una alianza
   * real con AutoLibre (no son proveedores cualquiera del marketplace), cada
   * uno con su propio banner. `href` sale del link "website" de su perfil en
   * `/proveedores/<slug>` cuando lo tiene ahí; si no, se confirma a mano con
   * producto antes de cargarlo (nunca una URL inventada).
   *
   * Dejamos afuera, a propósito, el banner de La Esquina del Neumático (pedido
   * explícito, 2026-11-17): se suma el día que haya decisión de producto.
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
    ],
  },

  history: {
    title: "Cada service suma. Que quede probado.",
    subtitle:
      "Cada trabajo, cada arreglo y cada control queda registrado con fecha, taller y comprobante. Todo el historial de tu auto en un solo lugar, ordenado y con respaldo.",
    bullets: [
      "Lo que hacés por AutoLibre se registra solo.",
      "Lo que hiciste antes o afuera, lo cargás vos.",
      "Fotos, facturas y documentación, todo junto.",
    ],
    closing: "Un auto con historial se vende mejor y más rápido.",
    sample: {
      vehicle: "Historial · Chevrolet Onix",
      plate: "AB 123 CD",
      entries: [
        {
          id: "history-aceite",
          date: "14 jul 2026",
          title: "Cambio de aceite y filtros",
          detail: "Taller Belgrano · comprobante adjunto",
        },
        {
          id: "history-frenos",
          date: "2 mar 2026",
          title: "Pastillas de freno delanteras",
          detail: "Frenos Sur · comprobante adjunto",
        },
        {
          id: "history-vtv",
          date: "19 nov 2025",
          title: "VTV aprobada",
          detail: "Planta VTV Vicente López",
        },
      ] satisfies readonly TimelineEntry[],
    },
  },

  howItWorks: {
    title: "Empezás en dos minutos.",
    subtitle:
      "Al entrar, ponés la patente y tu auto ya está cargado con todos sus datos.",
    steps: [
      {
        id: "how-01",
        number: "01",
        title: "Ordenás lo tuyo",
        description:
          "Papeles, vencimientos y lo que ya le hiciste, todo ordenado y a mano.",
      },
      {
        id: "how-02",
        number: "02",
        title: "Sumás el diagnóstico",
        description:
          "Contale qué le pasa y la IA te orienta. Si querés leer el motor, podés comprar un escáner de AR$10.000 que se conecta con el auto.",
      },
    ],
  },

  diagnostics: {
    title: "Entendé qué le pasa antes de llegar al taller.",
    subtitle:
      "Contale los síntomas y la IA te orienta sobre qué puede estar pasando, en palabras que entendés. Si conectás un adaptador, además lee el motor y te explica qué encontró.",
    quote:
      "AutoLibre te orienta y traduce. El diagnóstico final siempre lo hace un mecánico.",
    footnote:
      "Desde ahí, pedís presupuesto sin salir de la app: el taller recibe el problema y los datos de tu auto. Y cuando lo resolvés, queda en su historial.",
  },

  providerBand: {
    title: "¿Tenés un taller o prestás un servicio?",
    subtitle:
      "Recibí pedidos de servicio de gente que ya sabe qué necesita, con los datos del vehículo incluidos.",
    cta: { label: "Sumate a AutoLibre", href: "/proveedores/registro" },
  },

  faq: {
    title: "Preguntas frecuentes",
  },

  /** Últimas notas del blog (`LatestGuidesSection`). */
  guides: {
    title: "Guías para tener tu auto en regla",
    subtitle:
      "Trámites, seguros y papeles del auto, explicados paso a paso por el equipo de AutoLibre.",
    cta: "Ver todas las guías",
  },

  closing: {
    title: "Tu auto siempre supo qué tenía. Ahora vos también.",
    downloadNote: "Gratis, para iPhone y Android.",
  },
} as const;
