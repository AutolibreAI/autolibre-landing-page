import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { PROVIDER_INDEX_PATH } from "@/lib/provider-profile/routes";
import { PROVIDER_PROFILES_PUBLIC } from "@/lib/provider-profile/visibility";
import { siteConfig } from "@/lib/seo/config";
import { providersContent } from "@/lib/content/providers";
import type { NavLink, StoreLink } from "@/lib/content/types";

/**
 * Link a `/pedido`: ES la etiqueta única de todos los puntos de entrada de
 * presupuesto (header, menú mobile, hero, banda de la home y footer). Nadie
 * escribe su propio texto: así no vuelven a divergir.
 */
const quoteLink = { label: "Pedí tu presupuesto", href: "/pedido" } as const;
/** Link a `/blog`: el mismo en el header, el menú mobile y el footer. */
const blogLink = { label: "Blog", href: "/blog" } as const;
/** Link a `/sobre-nosotros`: solo en el footer (el header ya está completo). */
const aboutLink = { label: "Sobre nosotros", href: "/sobre-nosotros" } as const;

/**
 * Contenido del header y del footer, compartido por todas las páginas.
 *
 * El header sale SIEMPRE de acá y es el mismo en todas las páginas: ninguna
 * página elige sus links (`SiteHeader` no acepta props para eso). Lo único
 * que una página puede cambiar es el botón de la derecha (`cta`).
 */
export const siteContent = {
  nav: {
    /** Anclas de la home + Blog. Visibles desde `xl`; debajo, en el menú. */
    links: [
      { label: "Producto", href: "/#producto" },
      { label: "Cómo funciona", href: "/#como-funciona" },
      { label: "FAQ", href: "/#faq" },
      ...(BLOG_PUBLIC ? [blogLink] : []),
    ] satisfies readonly NavLink[],
    /** Presupuesto: visible desde `md`, y en el menú debajo de `xl`. */
    quoteLink,
    providerLink: { label: "Soy proveedor", href: "/proveedores" },
    cta: { label: "Descargar la app", href: "/#descargar" },
    /**
     * Destino del CTA de descarga según la plataforma (ver `DownloadCta`).
     * El texto visible es el mismo `cta.label`; el `ariaLabel` lo arranca
     * igual (WCAG 2.5.3) y suma la tienda, porque el link sale del sitio.
     */
    downloadTargets: {
      ios: {
        href: siteConfig.stores.appStore,
        ariaLabel: "Descargar la app en el App Store",
      },
      android: {
        href: siteConfig.stores.playStore,
        ariaLabel: "Descargar la app en Google Play",
      },
    },
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
      /**
       * Primero: son las dos puertas de entrada del sitio (dueño de auto y
       * proveedor) y los únicos links internos a páginas de conversión.
       */
      {
        id: "servicios",
        title: "Servicios",
        links: [
          quoteLink,
          // Mismo texto que el título del form de `/proveedores`.
          { label: providersContent.form.title, href: "/proveedores" },
          // El índice de perfiles entra al footer recién cuando es público
          // (`lib/provider-profile/visibility.ts`).
          ...(PROVIDER_PROFILES_PUBLIC
            ? [{ label: "Proveedores", href: PROVIDER_INDEX_PATH }]
            : []),
        ],
      },
      {
        id: "descargar",
        title: "Descargar",
        links: [
          { label: "App Store", href: siteConfig.stores.appStore },
          { label: "Google Play", href: siteConfig.stores.playStore },
        ],
      },
      // "Sobre nosotros" y el blog comparten grupo: así el footer no suma
      // una columna de un solo link. El blog entra recién cuando es público.
      {
        id: "empresa",
        title: "Empresa",
        links: [aboutLink, ...(BLOG_PUBLIC ? [blogLink] : [])],
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
