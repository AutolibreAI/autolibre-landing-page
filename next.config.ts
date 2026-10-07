import type { NextConfig } from "next";

/**
 * Host de ingesta de PostHog (región US). Sólo server: lo usan estos rewrites
 * y `posthog-node` (`lib/analytics/posthog-server.ts`). El navegador nunca lo
 * ve: habla con `/ingest`, en el mismo origen.
 */
const POSTHOG_HOST = (process.env.POSTHOG_HOST?.trim() || "https://us.i.posthog.com").replace(
  /\/+$/,
  "",
);
/** Los assets (`array.js`, extensiones) salen de otro host que la ingesta. */
const POSTHOG_ASSETS_HOST = "https://us-assets.i.posthog.com";

/**
 * Host donde el backend aloja las imágenes de los perfiles de proveedor
 * (portada, logo, trabajos). Solo se declara si la variable existe: sin ella
 * esas imágenes se renderizan `unoptimized` en vez de romper la página
 * (ver `isUnoptimizedImage` en `lib/provider-profile/present.ts`).
 */
const PROVIDER_IMAGE_HOST = process.env.PROVIDER_IMAGE_HOST?.trim();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com",
      },
      // Assets de Hygraph (portadas e imágenes del blog): media.graphassets.com
      // y los hosts por región, ej. us-west-2.graphassets.com.
      {
        protocol: "https",
        hostname: "**.graphassets.com",
      },
      ...(PROVIDER_IMAGE_HOST
        ? [{ protocol: "https" as const, hostname: PROVIDER_IMAGE_HOST }]
        : []),
    ],
  },
  /**
   * Reverse proxy de PostHog: `/ingest/*` del mismo origen en lugar de
   * `*.posthog.com`, que muchos bloqueadores filtran. Orden importa: los de
   * assets van antes que el comodín de ingesta. `/ingest` no es una página:
   * no está en el sitemap y `robots.ts` la excluye.
   */
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: "/ingest/array/:path*",
        destination: `${POSTHOG_ASSETS_HOST}/array/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
  // PostHog llama a endpoints con barra final (`/e/`, `/flags/`): sin esto,
  // Next los redirige (308) y se pierden los eventos.
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
