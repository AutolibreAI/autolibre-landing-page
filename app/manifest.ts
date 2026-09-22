import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

/**
 * Web App Manifest. Además de habilitar "agregar a pantalla de inicio",
 * le da a Google un nombre e íconos canónicos para los resultados en mobile.
 *
 * Los íconos viven en `/public/brand` y no en `app/icon*` porque el manifest
 * necesita URLs estables: Next le agrega un hash a los archivos de convención
 * y ese hash cambia cada vez que se toca el asset.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.title,
    short_name: siteConfig.name,
    description: siteConfig.description,
    id: "/",
    start_url: "/",
    scope: "/",
    /**
     * `browser` y NO `standalone`: la landing no es una PWA. Con `standalone`
     * + íconos de 192/512, Chrome y Edge la marcan instalable y ofrecen
     * "Instalar AutoLibre" en desktop, que confunde con la app nativa.
     */
    display: "browser",
    lang: siteConfig.lang,
    dir: "ltr",
    categories: ["automotive", "productivity", "utilities"],
    background_color: "#ffffff",
    theme_color: "#2a8c3a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
      },
      {
        src: "/brand/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
