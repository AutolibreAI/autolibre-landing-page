import { siteConfig } from "@/lib/seo/config";
import { allFaqItems } from "@/lib/content/faq";

/**
 * Builders de structured data. Devuelven objetos planos; el renderizado
 * (y el escapeo) lo hace `<JsonLd />`.
 *
 * Los nodos que se repiten en varias páginas usan `@id` para que Google
 * los una en un solo grafo en vez de leerlos como entidades distintas.
 */

const ORGANIZATION_ID = `${siteConfig.url}/#organization`;
const WEBSITE_ID = `${siteConfig.url}/#website`;

/**
 * `@id` estable de una persona del equipo. Vive en `/sobre-nosotros`, que es
 * la página que la presenta: así `founder`/`employee` del `Organization` y el
 * nodo `Person` se unen en una sola entidad.
 */
export function personId(id: string) {
  return `${siteConfig.url}/sobre-nosotros#${id}`;
}

type OrganizationExtras = {
  /** `@id` (ver `personId`) de los fundadores. */
  founderIds?: readonly string[];
  /** `@id` del resto del equipo. */
  employeeIds?: readonly string[];
  /** Fecha ISO de fundación. Solo si es real: sin dato, no se emite. */
  foundingDate?: string;
};

/**
 * Sin argumentos es la organización de siempre (todas las páginas). La página
 * "Sobre nosotros" le suma fundadores, equipo y fecha de fundación: cada campo
 * sale solo si tiene valor.
 */
export function organizationSchema({
  founderIds = [],
  employeeIds = [],
  foundingDate,
}: OrganizationExtras = {}) {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.legalName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    /**
     * Google pide el logo como `ImageObject` con dimensiones declaradas: sin
     * width/height tiene que descargar la imagen para saber si cumple el
     * mínimo de 112x112, y mientras tanto no lo muestra. Apunta al asset
     * cuadrado — el isotipo original es 450x407 y el recorte lo deformaba.
     */
    logo: {
      "@type": "ImageObject",
      "@id": `${siteConfig.url}/#logo`,
      url: `${siteConfig.url}${siteConfig.logo.url}`,
      contentUrl: `${siteConfig.url}${siteConfig.logo.url}`,
      width: siteConfig.logo.width,
      height: siteConfig.logo.height,
      caption: siteConfig.legalName,
    },
    image: { "@id": `${siteConfig.url}/#logo` },
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phoneE164,
    sameAs: [...siteConfig.social],
    areaServed: { "@type": "Country", name: "Argentina" },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      telephone: siteConfig.contact.phoneE164,
      email: siteConfig.contact.email,
      availableLanguage: "Spanish",
      areaServed: "AR",
    },
    ...(foundingDate ? { foundingDate } : {}),
    ...(founderIds.length > 0
      ? { founder: founderIds.map((id) => ({ "@id": id })) }
      : {}),
    ...(employeeIds.length > 0
      ? { employee: employeeIds.map((id) => ({ "@id": id })) }
      : {}),
  };
}

/**
 * Una persona del equipo. `sameAs` son sus perfiles públicos (LinkedIn): le
 * confirman a buscadores y LLMs que es la misma persona.
 */
export function personSchema({
  id,
  name,
  jobTitle,
  sameAs = [],
}: {
  /** `@id` completo (ver `personId`). */
  id: string;
  name: string;
  jobTitle: string;
  sameAs?: readonly string[];
}) {
  return {
    "@type": "Person",
    "@id": id,
    name,
    jobTitle,
    worksFor: { "@id": ORGANIZATION_ID },
    ...(sameAs.length > 0 ? { sameAs: [...sameAs] } : {}),
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    /**
     * De acá sale el "site name" que Google muestra arriba del resultado, en
     * lugar del dominio pelado. Va el nombre corto: `legalName` queda como
     * `alternateName` para que el algoritmo tenga las dos variantes.
     */
    name: siteConfig.name,
    alternateName: siteConfig.legalName,
    description: siteConfig.description,
    inLanguage: siteConfig.lang,
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function softwareApplicationSchema() {
  return {
    "@type": "SoftwareApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    applicationCategory: "AutomotiveApplication",
    operatingSystem: "iOS, Android",
    url: siteConfig.url,
    inLanguage: siteConfig.lang,
    publisher: { "@id": ORGANIZATION_ID },
    /**
     * Las fichas de tienda van como `downloadUrl` y también en `sameAs`: lo
     * primero le dice a Google dónde se instala, lo segundo le confirma que
     * esas dos fichas y este sitio son la misma entidad.
     */
    downloadUrl: [siteConfig.stores.appStore, siteConfig.stores.playStore],
    installUrl: [siteConfig.stores.appStore, siteConfig.stores.playStore],
    sameAs: [siteConfig.stores.appStore, siteConfig.stores.playStore],
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
      availability: "https://schema.org/InStock",
    },
  };
}

/**
 * `FAQPage` a partir de preguntas VISIBLES en la página que lo declara: Google
 * exige que el structured data coincida con lo que ve el usuario. Sin
 * argumento usa la FAQ de la home; `/pedido` le pasa la suya.
 */
export function faqPageSchema(
  items: readonly { question: string; answer: string }[] = allFaqItems,
) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export function breadcrumbSchema(
  trail: readonly { name: string; path: string }[],
) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${siteConfig.url}${crumb.path === "/" ? "" : crumb.path}`,
    })),
  };
}

export function webPageSchema({
  name,
  description,
  path,
  type = "WebPage",
  lastReviewed,
}: {
  name: string;
  description: string;
  path: string;
  /**
   * ISO `YYYY-MM-DD` de la última revisión del contenido contra sus fuentes
   * (las notas del blog con `reviewedAt`). Sin dato, no se emite.
   */
  lastReviewed?: string;
  /**
   * `CollectionPage` para los listados (blog y categorías). `AboutPage` para
   * "Sobre nosotros": además la ata a la organización con `about`.
   */
  type?: "WebPage" | "CollectionPage" | "AboutPage";
}) {
  return {
    "@type": type,
    "@id": `${siteConfig.url}${path === "/" ? "" : path}#webpage`,
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    name,
    description,
    inLanguage: siteConfig.lang,
    isPartOf: { "@id": WEBSITE_ID },
    ...(type === "AboutPage" ? { about: { "@id": ORGANIZATION_ID } } : {}),
    ...(lastReviewed ? { lastReviewed } : {}),
  };
}

export function blogPostingSchema({
  title,
  description,
  path,
  datePublished,
  dateModified,
  authorName,
  imageUrl,
  keywords = [],
}: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  /**
   * Última edición o revisión (ver `postModifiedDate`); sin ella se usa
   * `datePublished`, que es lo que pide Google.
   */
  dateModified?: string;
  /**
   * Firma de la nota. Si es la marca (`siteConfig.name`, el default de los
   * posts sin autor), el autor es la organización del grafo; si no, `Person`.
   */
  authorName: string;
  /** URL absoluta de la portada; se omite si el post no tiene. */
  imageUrl?: string;
  /** Tags del post; van como `keywords` separados por coma, si hay. */
  keywords?: readonly string[];
}) {
  const url = `${siteConfig.url}${path}`;

  return {
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: title,
    description,
    url,
    mainEntityOfPage: { "@id": `${url}#webpage` },
    datePublished,
    dateModified: dateModified || datePublished,
    inLanguage: siteConfig.lang,
    ...(imageUrl ? { image: imageUrl } : {}),
    ...(keywords.length > 0 ? { keywords: keywords.join(", ") } : {}),
    // Referencia por `@id` y no un nodo nuevo: así el autor ES el
    // `Organization` del grafo (con logo, redes y contacto) y no una persona
    // llamada "AutoLibre".
    author:
      authorName === siteConfig.name
        ? { "@id": ORGANIZATION_ID }
        : { "@type": "Person", name: authorName },
    publisher: { "@id": ORGANIZATION_ID },
  };
}

/** Envuelve varios nodos en un único `@graph`, que es lo que Google prefiere. */
export function graph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
