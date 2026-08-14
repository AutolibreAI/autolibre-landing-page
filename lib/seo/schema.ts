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

export function organizationSchema() {
  return {
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/isotype.png`,
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
  };
}

export function websiteSchema() {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: siteConfig.url,
    name: siteConfig.name,
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
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "ARS",
      availability: "https://schema.org/PreOrder",
    },
  };
}

export function faqPageSchema() {
  return {
    "@type": "FAQPage",
    mainEntity: allFaqItems.map((item) => ({
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
}: {
  name: string;
  description: string;
  path: string;
}) {
  return {
    "@type": "WebPage",
    "@id": `${siteConfig.url}${path === "/" ? "" : path}#webpage`,
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    name,
    description,
    inLanguage: siteConfig.lang,
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** Envuelve varios nodos en un único `@graph`, que es lo que Google prefiere. */
export function graph(...nodes: object[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
