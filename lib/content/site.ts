import { siteConfig } from "@/lib/seo/config";
import type { NavLink, StoreLink } from "@/lib/content/types";

/** Contenido del header y del footer, compartido por todas las páginas. */
export const siteContent = {
  nav: {
    links: [
      { label: "Producto", href: "/#producto" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "Compatibilidad", href: "/#compatibilidad" },
      { label: "FAQ", href: "/#faq" },
    ] satisfies readonly NavLink[],
    providerLink: { label: "Soy proveedor", href: "/proveedores" },
    cta: { label: "Descargar la app", href: "/#descargar" },
  },

  /**
   * Los dos botones de descarga, en el orden en que se muestran. iOS primero
   * porque es de donde viene la mayor parte del tráfico mobile en AMBA.
   */
  stores: [
    {
      id: "appStore",
      label: "Descargala en el",
      name: "App Store",
      href: siteConfig.stores.appStore,
    },
    {
      id: "playStore",
      label: "Disponible en",
      name: "Google Play",
      href: siteConfig.stores.playStore,
    },
  ] satisfies readonly StoreLink[],
  footer: {
    groups: [
      {
        id: "descargar",
        title: "Descargar",
        links: [
          { label: "App Store", href: siteConfig.stores.appStore },
          { label: "Google Play", href: siteConfig.stores.playStore },
        ],
      },
      {
        id: "legal",
        title: "Legal",
        links: [
          { label: "Términos", href: "/terminos" },
          { label: "Privacidad", href: "/privacidad" },
          { label: "Eliminar cuenta", href: "/eliminar-cuenta" },
          { label: "Soporte", href: "/support" },
        ],
      },
      {
        id: "redes",
        title: "Redes",
        links: [
          { label: "TikTok", href: siteConfig.social[0] },
          { label: "Instagram", href: siteConfig.social[1] },
          { label: "X", href: siteConfig.social[2] },
          { label: "LinkedIn", href: siteConfig.social[3] },
        ],
      },
      {
        id: "contacto",
        title: "Contacto",
        links: [
          {
            label: siteConfig.contact.email,
            href: `mailto:${siteConfig.contact.email}`,
          },
          { label: "WhatsApp", href: siteConfig.contact.whatsapp },
        ],
      },
    ],
    copyright: `© ${new Date().getFullYear()} ${siteConfig.legalName}`,
  },
} as const;
