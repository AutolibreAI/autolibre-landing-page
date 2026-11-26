import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Los endpoints no aportan nada al índice. `/ingest/` es el proxy de
      // PostHog (ver `next.config.ts`): que ningún crawler lo pida.
      // `/proveedores-filtros` es la ruta interna del directorio con filtros:
      // se sirve SIEMPRE como `/proveedores?…` (rewrite), nunca por su nombre.
      disallow: ["/api/", "/ingest/", "/proveedores-filtros"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
