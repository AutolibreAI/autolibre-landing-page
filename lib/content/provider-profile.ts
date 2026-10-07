import type { FaqTemplates } from "@/lib/provider-profile/faq";

/**
 * Copy del perfil público de proveedor (`/proveedor/<slug>`). Ningún componente trae
 * strings propios (Constitución II). Las URLs de tienda, contacto y redes
 * salen de `siteConfig`, nunca de acá.
 */
export const providerProfileContent = {
  /** Etiquetas de sección. `{name}` se reemplaza por el nombre comercial. */
  sections: {
    about: "Sobre {name}",
    services: "Servicios",
    brands: "Marcas que atiende",
    vehicleTypes: "Tipos de vehículo",
    fuelTypes: "Combustibles",
    equipment: "Equipamiento",
    works: "Trabajos hechos",
    reviews: "Reseñas",
    metrics: "Medido por AutoLibre",
    hours: "Horarios",
    location: "Ubicación",
    serviceArea: "Zona de cobertura",
    contact: "Contacto y redes",
    faq: "Preguntas frecuentes",
    proposal: "¿Necesitás una propuesta?",
  },

  /** Botones del encabezado y de las tarjetas. */
  actions: {
    whatsapp: "WhatsApp",
    call: "Llamar",
    directions: "Cómo llegar",
    share: "Compartir",
    proposal: "Pedir propuesta",
  },

  ally: "Aliado de AutoLibre",

  /** Marcador cuando falta la portada o el logo (nunca una imagen rota). */
  imagePlaceholder: {
    cover: "Sin foto de portada",
    logo: "Sin logo",
  },

  /** `alt` de las imágenes con contenido. `{name}` = nombre comercial. */
  alt: {
    cover: "Portada de {name}",
    logo: "Logo de {name}",
    owner: "{name}, quien atiende",
    work: "{service} — {vehicle}",
    ogImage: "{title}",
  },

  header: {
    /** "A domicilio y online · <zona>" cuando no hay local a la calle. */
    mobileLocation: "A domicilio y online · {area}",
    mobileLocationNoArea: "A domicilio y online",
    ratingLabel: "{average} · {count} {reviews}",
    reviewsOne: "reseña",
    reviewsMany: "reseñas",
    categoriesMore: "+{count} rubros",
  },

  /** Estado en vivo (`getOpenStatus` devuelve estructura; el texto sale de acá). */
  status: {
    open: "Abierto · cierra {time}",
    closedToday: "Cerrado · abre hoy {time}",
    closedTomorrow: "Cerrado · abre mañana {time}",
    closedOn: "Cerrado · abre el {day} {time}",
  },

  /** Lunes a domingo (índice 0 = lunes). */
  weekdays: [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ],
  weekdaysLower: [
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
    "domingo",
  ],

  hours: {
    closedDay: "Cerrado",
    rangeJoiner: " y ",
    holidays: "Feriados: consultar por WhatsApp",
    today: "Hoy",
  },

  about: {
    ownerLabel: "Quién atiende",
    yearsInTrade: "{years} años en el rubro",
    yearsInTradeOne: "1 año en el rubro",
    memberSince: "En AutoLibre desde {monthYear}",
  },

  services: {
    allBrands: "Todas las marcas",
    vehicleLabels: {
      car: "Autos",
      suv: "SUVs",
      pickup: "Pickups",
      motorcycle: "Motos",
    },
    fuelLabels: {
      gasoline: "Nafta",
      diesel: "Diésel",
      cng: "GNC",
      hybrid: "Híbridos",
      electric: "Eléctricos",
    },
  },

  location: {
    directionsHint: "Ver en el mapa",
    mapAlt: "Mapa con la ubicación de {name}",
    serviceAreaNote:
      "No atiende en un local a la calle. Coordiná por WhatsApp dónde y cuándo.",
    alsoServes: "También atiende a domicilio en: {localities}.",
  },

  contact: {
    phone: "Teléfono",
    instagram: "Instagram",
    website: "Sitio web",
    facebook: "Facebook",
    x: "X",
    tiktok: "TikTok",
    mercadoLibre: "Mercado Libre",
    other: "Enlace",
  },

  proposal: {
    body: "Contanos qué necesitás y te respondemos con una propuesta.",
    cta: "Pedir propuesta",
  },

  works: {
    badgeAutolibre: "Registrado en AutoLibre",
    badgeOwn: "Cargado por el taller",
    counter: "{registered} registrados en AutoLibre · {total} en total",
    seeAll: "Ver los {total} trabajos",
    before: "Antes",
    after: "Después",
  },

  reviews: {
    count: "{count} reseñas en AutoLibre",
    countOne: "1 reseña en AutoLibre",
    seeAll: "Ver las {count} reseñas",
    replyLabel: "Respuesta del proveedor",
  },

  metrics: {
    footnote: "Solo se muestran los datos que superan nuestro estándar.",
    responseTime: "Tiempo de respuesta promedio",
    responseTimeValue: "{minutes} min",
    responseRate: "Pedidos respondidos",
    proposalsSent: "Propuestas enviadas",
  },

  breadcrumb: {
    label: "Ruta",
    providers: "Proveedores",
  },

  share: {
    copied: "Enlace copiado",
    shareTitle: "{name} en AutoLibre",
  },

  /** Banda de AutoLibre al pie de la página de perfil. */
  footerBand: {
    title: "Descargá AutoLibre",
    subtitle: "Todo tu auto en un solo lugar. Gratis, para iPhone y Android.",
    downloadCta: "Descargá AutoLibre",
    providerCta: "Sumá tu negocio",
    urlLabel: "Perfil público",
    terms: "Términos",
    privacy: "Privacidad",
  },

  /**
   * Metadata. Degrada si falta la localidad o el rubro (contrato
   * `seo-and-share.md §1`). El template del layout agrega " · AutoLibre".
   */
  meta: {
    title: "{name} — {category} en {locality}",
    titleNoLocality: "{name} — {category}",
    titleNoCategory: "{name} en {locality}",
    titleNameOnly: "{name}",
    /** Cuando el proveedor no cargó descripción. Única por perfil (lleva el nombre). */
    descriptionFallback:
      "{name}, {category} en {locality}. Servicios, horarios y contacto en AutoLibre.",
    descriptionFallbackNoLocality:
      "{name}, {category}. Servicios, horarios y contacto en AutoLibre.",
    descriptionFallbackNoCategory:
      "{name} en {locality}. Servicios, horarios y contacto en AutoLibre.",
    descriptionFallbackNameOnly:
      "{name}. Servicios, horarios y contacto en AutoLibre.",
  },

  /** Página índice `/proveedor`: listado de proveedores. */
  directory: {
    title: "Proveedores en AutoLibre",
    subtitle:
      "Talleres y servicios para tu auto, con sus servicios, horarios y datos de contacto.",
    metaTitle: "Proveedores para tu auto",
    metaDescription:
      "Talleres y servicios para tu auto en AutoLibre: mecánica, gomería, lavado, chapa y pintura, gestoría y más, con sus servicios, horarios y contacto.",
    listLabel: "Lista de proveedores",
    empty: "Todavía no hay proveedores para mostrar.",
    emptyFiltered: "No encontramos proveedores con ese filtro.",
    clearFilter: "Ver todos los proveedores",
    previous: "Anterior",
    next: "Siguiente",
    page: "Página {page} de {total}",
    ratingLabel: "{average} ({count})",
  },

  /** Plantillas de las preguntas frecuentes (la lógica es `buildFaq`). */
  faq: {
    weekdayNames: [
      "lunes",
      "martes",
      "miércoles",
      "jueves",
      "viernes",
      "sábado",
      "domingo",
    ],
    and: "y",
    to: "a",
    from: "de",
    location: {
      question: "¿Dónde están ubicados?",
      answer: "Estamos en {address}.",
    },
    hoursWeekly: {
      question: "¿Cuáles son los horarios de atención?",
      answer: "Atienden {hours}.",
    },
    hoursSaturdayOpen: {
      question: "¿Abren los sábados?",
      answer: "Sí, los sábados atienden {ranges}.",
    },
    hoursSaturdayClosed: {
      question: "¿Abren los sábados?",
      answer: "No, los sábados no atienden.",
    },
    brandsSpecific: {
      question: "¿Atienden autos {brand}?",
      answer:
        "Sí, atienden {brand}. Las marcas con las que trabajan son {brands}.",
    },
    brandsAll: {
      question: "¿Atienden todas las marcas?",
      answer: "Sí, atienden autos de todas las marcas.",
    },
    vehicle: {
      question: "¿Atienden {vehicle}?",
      answer: "Sí, atienden {vehicle}.",
    },
    vehicleLabels: {
      car: "autos",
      suv: "SUVs",
      pickup: "pickups",
      motorcycle: "motos",
    },
    fuelCng: {
      question: "¿Trabajan con autos con GNC?",
      answer: "Sí, trabajan con autos con GNC.",
    },
    diagnosticScanner: {
      question: "¿Hacen diagnóstico con escáner?",
      answer: "Sí, hacen diagnóstico con escáner.",
    },
    mobileService: {
      question: "¿Atienden a domicilio?",
      answer: "Sí, atienden a domicilio en {localities}.",
    },
    /**
     * Slugs que cuentan como "escáner". A CONFIRMAR contra el catálogo y el
     * catálogo de equipamiento reales (tarea T005): hoy son los slugs
     * esperables; si no coinciden, la pregunta no se genera (no se inventa).
     */
    scannerEquipmentSlugs: ["escaner-multimarca"],
    diagnosticServiceSlugs: ["diagnostico-por-escaner", "diagnostico-obd"],
  } satisfies FaqTemplates,
} as const;

/** Reemplaza `{clave}` por su valor; una clave sin valor queda como está. */
export function fillTemplate(
  template: string,
  values: Readonly<Record<string, string | number>>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}
