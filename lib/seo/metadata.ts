import type { Metadata } from "next";
import { siteConfig } from "@/lib/seo/config";

type CreateMetadataInput = {
  title: string;
  description: string;
  /** Path absoluto desde la raíz, ej. "/proveedores". Genera el canonical. */
  path: string;
  /** `false` en páginas que no deben indexarse (ej. utilitarias). */
  index?: boolean;
  /** Override de la imagen OG; por defecto usa la del sitio. */
  image?: { url: string; width: number; height: number; alt: string };
};

/**
 * Construye el objeto Metadata de una página aplicando los defaults del
 * sitio. Evita repetir openGraph/twitter/canonical en cada `page.tsx`,
 * que es exactamente donde se cuelan las inconsistencias de SEO.
 */
export function createMetadata({
  title,
  description,
  path,
  index = true,
  image = siteConfig.ogImage,
}: CreateMetadataInput): Metadata {
  const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large" },
    },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      locale: siteConfig.locale,
      url,
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      /**
       * `site` atribuye la tarjeta a la cuenta dueña del sitio y `creator` a
       * quien firma el contenido. Hoy son la misma cuenta; el día que haya
       * posts con autor propio, `creator` es el que cambia.
       */
      site: siteConfig.xHandle,
      creator: siteConfig.xHandle,
      title,
      description,
      images: [image.url],
    },
  };
}
