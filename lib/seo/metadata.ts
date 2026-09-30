import type { Metadata } from "next";
import { BLOG_FEED_PATH } from "@/lib/blog/feed";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { blogContent } from "@/lib/content/blog";
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
  /**
   * Para posts del blog: pasa el `og:type` a `article` con sus fechas.
   * `modifiedTime` va solo si hubo edición o revisión posterior.
   */
  article?: { publishedTime: string; modifiedTime?: string; authors: string[] };
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
  article,
}: CreateMetadataInput): Metadata {
  const url = path === "/" ? siteConfig.url : `${siteConfig.url}${path}`;

  return {
    title,
    description,
    alternates: {
      canonical: path,
      // Autodescubrimiento del feed del blog desde cualquier página del sitio.
      // Va acá y no en el layout: el `alternates` de cada página reemplaza
      // entero al del layout (Next no los mezcla), y se perdería.
      ...(BLOG_PUBLIC
        ? { types: { "application/rss+xml": [{ url: BLOG_FEED_PATH, title: blogContent.feed.title }] } }
        : {}),
    },
    robots: {
      index,
      follow: index,
      googleBot: { index, follow: index, "max-image-preview": "large" },
    },
    openGraph: {
      ...(article
        ? { type: "article" as const, ...article }
        : { type: "website" as const }),
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
      /** Objeto y no string: así la tarjeta también lleva el texto alternativo. */
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}
