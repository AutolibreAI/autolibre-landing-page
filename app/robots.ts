import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Los endpoints no aportan nada al índice. `/ingest/` es el proxy de
      // PostHog (ver `next.config.ts`): que ningún crawler lo pida.
      disallow: ["/api/", "/ingest/"],
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
