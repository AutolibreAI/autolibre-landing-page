import { siteConfig } from "@/lib/seo/config";
import type { NavLink } from "@/lib/content/types";

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
    cta: { label: "Quiero acceso", href: "/#early-access" },
  },
  footer: {
    groups: [
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
