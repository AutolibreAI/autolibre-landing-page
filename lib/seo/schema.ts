import { siteConfig } from "@/lib/seo/config";
import { allFaqItems } from "@/lib/content/faq";
import { businessTypeFor } from "@/lib/provider-profile/business-type";
import { providerPath } from "@/lib/provider-profile/routes";
import {
  absoluteUrl,
  safeExternalUrl,
  trimDescription,
  VISIBLE_REVIEWS,
} from "@/lib/provider-profile/present";
import type { PartnerProfile, ProfileImage } from "@/lib/provider-profile/types";

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

const SCHEMA_DAY_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

/**
 * Negocio local de un perfil de proveedor (`/proveedor/<slug>`). SOLO se emite para
 * perfiles indexables: no se declara un negocio que la página no muestra
 * bien (FR-036). Cada dato sale del mismo objeto que lo pinta la página:
 * `geo` solo con coordenadas, `address` solo con local, `areaServed` para
 * `mobile`/`both`, `aggregateRating` y `review` solo con reseñas visibles, y
 * nunca `priceRange` ni `email`.
 */
export function localBusinessSchema(profile: PartnerProfile) {
  const url = `${siteConfig.url}${providerPath(profile.slug)}`;
  const image = (value: ProfileImage) => ({
    "@type": "ImageObject",
    url: absoluteUrl(value.url, siteConfig.url),
    width: value.width,
    height: value.height,
  });

  const hasAddress = profile.locationMode !== "mobile" && profile.address !== null;
  const hasCoordinates =
    hasAddress &&
    profile.address?.latitude !== null &&
    profile.address?.longitude !== null;
  const localities = (profile.serviceArea?.localities ?? []).map((l) => l.name);
  const hasArea =
    (profile.locationMode === "mobile" || profile.locationMode === "both") &&
    localities.length > 0;

  const opening = (profile.businessHours ?? []).flatMap((day) =>
    day.ranges.map((range) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: SCHEMA_DAY_OF_WEEK[day.weekday - 1],
      opens: range.opensAt,
      closes: range.closesAt,
    })),
  );

  const reviews = profile.reviews;
  const showReviews = reviews !== null && reviews.count > 0;
  const sameAs = profile.links.map((link) => safeExternalUrl(link.url)).filter(Boolean);
  const images = [profile.cover, profile.logo].filter(
    (value): value is ProfileImage => value !== null,
  );

  return {
    "@type": businessTypeFor(profile.primaryCategory?.slug),
    "@id": `${url}#business`,
    name: profile.name,
    url,
    ...(profile.description ? { description: trimDescription(profile.description, 500) } : {}),
    ...(profile.logo ? { logo: image(profile.logo) } : {}),
    ...(images.length > 0 ? { image: images.map(image) } : {}),
    ...(profile.contact.phoneE164 ? { telephone: profile.contact.phoneE164 } : {}),
    ...(hasAddress && profile.address
      ? {
          address: {
            "@type": "PostalAddress",
            streetAddress: profile.address.full,
            ...(profile.locality ? { addressLocality: profile.locality } : {}),
            ...(profile.province ? { addressRegion: profile.province } : {}),
            addressCountry: "AR",
          },
        }
      : {}),
    ...(hasCoordinates && profile.address
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: profile.address.latitude,
            longitude: profile.address.longitude,
          },
        }
      : {}),
    ...(hasArea
      ? {
          areaServed: localities.map((name) => ({
            "@type": "AdministrativeArea",
            name,
          })),
        }
      : {}),
    ...(opening.length > 0 ? { openingHoursSpecification: opening } : {}),
    ...(showReviews && reviews
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviews.average.toFixed(1),
            reviewCount: reviews.count,
            bestRating: 5,
            worstRating: 1,
          },
          review: reviews.items.slice(0, VISIBLE_REVIEWS).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.displayName },
            datePublished: review.date,
            reviewBody: review.text,
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.stars,
              bestRating: 5,
              worstRating: 1,
            },
          })),
        }
      : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    mainEntityOfPage: { "@id": `${url}#webpage` },
  };
}
