import type { FuelType, PartnerLinkKind } from "@/lib/autolibre-api";

/**
 * Copy del perfil público de un negocio (`/aliados/[slug]`). Los datos del
 * negocio salen del backend; acá vive el texto fijo y las plantillas que lo
 * envuelven. Todo lo que se dice de un negocio sale de un campo real: nada de
 * ratings, reseñas, métricas ni "abierto ahora" (ver `PRODUCT.md`).
 */

/** Combustibles en castellano (enum `FuelType` del backend). */
const fuelLabels: Record<FuelType, string> = {
  gasoline: "Nafta",
  diesel: "Diésel",
  cng: "GNC",
  electric: "Eléctrico",
  hybrid: "Híbrido",
};

/**
 * Modalidad de atención. El backend la guarda como texto libre: el alta de
 * partners manda `en_local` / `a_domicilio` / `ambas`, y la base tiene filas
 * cargadas a mano como "en local" / "a domicilio". Lo que no se reconoce se
 * muestra tal cual, con la primera letra en mayúscula.
 */
const modalityLabels: Record<string, string> = {
  en_local: "En el local",
  "en local": "En el local",
  a_domicilio: "A domicilio",
  "a domicilio": "A domicilio",
  ambas: "En el local y a domicilio",
};

/** Nombre visible de cada red o plataforma (enum `PartnerLinkKind`). */
const linkLabels: Record<PartnerLinkKind, string> = {
  instagram: "Instagram",
  website: "Sitio web",
  facebook: "Facebook",
  mercado_libre: "Mercado Libre",
  x: "X",
  tiktok: "TikTok",
  other: "Otro enlace",
};

function joinList(items: readonly string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} y ${items[items.length - 1]}`;
}

export const aliadoPerfilContent = {
  breadcrumb: { home: "Inicio", aliados: "Aliados" },

  /** Meta description: solo con campos reales, distinta en cada negocio. */
  metaDescription: ({
    name,
    families,
    coverageZone,
  }: {
    name: string;
    families: readonly string[];
    coverageZone: string;
  }) => {
    const what = families.length > 0 ? `: ${joinList(families)}` : "";
    const where = coverageZone ? ` en ${coverageZone}` : "";
    return `${name}${what}${where}. Pedí presupuesto por AutoLibre.`;
  },

  head: {
    familiesLabel: "Rubros",
    zoneLabel: "Zona de cobertura:",
    primaryCta: { label: "Pedir presupuesto", href: "/pedido" },
    whatsapp: "WhatsApp",
    externalHint: "(se abre en otra pestaña)",
    share: {
      label: "Compartir perfil",
      copied: "Link copiado",
      failed: "No se pudo copiar el link",
    },
  },

  about: { title: (name: string) => `Sobre ${name}` },

  services: {
    title: "Servicios",
    facts: {
      brands: "Marcas",
      allBrands: "Todas las marcas",
      fuel: "Combustible",
      allFuels: "Todos",
      modality: "Modalidad",
    },
  },

  faq: {
    title: "Preguntas frecuentes",
    brands: {
      question: (name: string, brand: string) => `¿${name} atiende autos ${brand}?`,
      answer: (name: string, brands: readonly string[]) =>
        brands.length === 1
          ? `Sí. ${name} se especializa en autos ${brands[0]}.`
          : `Sí. ${name} se especializa en estas marcas: ${joinList(brands)}.`,
    },
    hours: {
      question: "¿Qué horarios tiene?",
    },
    gnc: {
      question: "¿Trabaja con autos a GNC?",
      answer: (name: string) => `Sí. ${name} atiende autos a GNC.`,
    },
    quote: {
      question: (name: string) => `¿Cómo le pido un presupuesto a ${name}?`,
      answer: (name: string) =>
        `Por AutoLibre: contás qué le pasa a tu auto desde la app, por WhatsApp o en autolibre.ai/pedido, y te llegan propuestas de los negocios de la red que pueden ayudarte, ${name} incluido. Es gratis y sin compromiso.`,
    },
  },

  aside: {
    label: "Datos de contacto",
    hours: "Horarios",
    location: "Ubicación",
    directions: "Cómo llegar",
    contact: "Contacto y redes",
    email: "Email",
    quoteCard: {
      title: "¿Necesitás un presupuesto?",
      body: "Contá qué le pasa a tu auto y te llegan propuestas de negocios de la red, este incluido.",
      cta: { label: "Pedir presupuesto", href: "/pedido" },
    },
  },

  related: {
    title: (family: string) => `Más aliados de ${family}`,
    seeAll: "Ver toda la red",
  },

  stickyBar: { label: "Acciones del perfil" },

  notFound: {
    eyebrow: "Aliados",
    title: "Este negocio ya no está en la red",
    body: "Puede que el link sea viejo o que el negocio haya dejado AutoLibre. En la red hay otros que pueden ayudarte.",
    primaryCta: { label: "Ver todos los aliados", href: "/aliados" },
    secondaryCta: { label: "Pedir presupuesto", href: "/pedido" },
    meta: { title: "Negocio no encontrado" },
  },

  fuelLabel: (fuel: FuelType) => fuelLabels[fuel],
  linkLabel: (kind: PartnerLinkKind) => linkLabels[kind],
  modalityLabel: (modality: string) => {
    const known = modalityLabels[modality.trim().toLowerCase()];
    if (known) return known;
    const trimmed = modality.trim();
    return trimmed.charAt(0).toLocaleUpperCase("es-AR") + trimmed.slice(1);
  },
  joinList,
} as const;
