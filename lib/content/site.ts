import { ACCOUNT_PATH, ACCOUNT_SIGN_OUT_PATH } from "@/lib/account/paths";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";
import { siteConfig } from "@/lib/seo/config";
import { providersContent } from "@/lib/content/providers";
import type { AccountMenuEntry, NavLink, StoreLink } from "@/lib/content/types";

/**
 * Link a `/pedido`: ES la etiqueta única de todos los puntos de entrada de
 * presupuesto (header, menú mobile, barra fija, hero, banda de la home y
 * footer). Nadie escribe su propio texto: así no vuelven a divergir.
 */
const quoteLink = { label: "Hacé tu pedido", href: "/pedido" } as const;
/** Link a `/blog`: el mismo en el header, el menú mobile y el footer. */
const blogLink = { label: "Blog", href: "/blog" } as const;
/** Link a `/sobre-nosotros`: en el header, el menú mobile y el footer. */
const aboutLink = { label: "Sobre nosotros", href: "/sobre-nosotros" } as const;
/** Directorio de los negocios de la red: le habla al dueño de auto. */
const directoryLink = { label: "Proveedores", href: PROVEEDORES_PATH } as const;

/** Alta de negocios: la misma etiqueta en el header, el menú de cuenta y el footer. */
const joinBusinessLink = { label: "Sumá tu negocio", href: PROVEEDORES_REGISTRO_PATH } as const;
/** Planes para proveedores: menú de cuenta y footer. */
const plansLink = { label: "Planes para proveedores", href: PROVEEDORES_PLANES_PATH } as const;
/** Ayuda: menú de cuenta. Hoy es la página de soporte. */
const helpLink = { label: "Ayuda", href: "/support" } as const;
/**
 * "Cerrar sesión" del menú de cuenta. El header público no carga Clerk, así
 * que no puede cerrar la sesión él mismo: lleva a `/cuenta?salir=1` y esa
 * pantalla (que sí tiene Clerk) la cierra y vuelve al inicio.
 */
const signOutLink = { label: "Cerrar sesión", href: ACCOUNT_SIGN_OUT_PATH } as const;
const rule = { kind: "rule" } as const;

/**
 * Contenido del header y del footer, compartido por todas las páginas.
 *
 * El header sale SIEMPRE de acá y es el mismo en todas las páginas: ninguna
 * página elige sus links (`SiteHeader` no acepta props para eso). Lo único
 * que una página puede cambiar es sacar la acción principal "Hacé tu pedido"
 * (`cta={false}`).
 */
export const siteContent = {
  nav: {
    /** Links de página del header (desde `lg`; debajo, en el menú). */
    links: [
      directoryLink,
      ...(BLOG_PUBLIC ? [blogLink] : []),
      aboutLink,
    ] satisfies readonly NavLink[],
    /** "Hacé tu pedido": la acción principal del header y del menú mobile. */
    quoteLink,
    /**
     * Enlace discreto para la otra punta del mercado (patrón Airbnb): "Sumá
     * tu negocio" sin sesión o con sesión de cliente, "Ir a mi negocio" si
     * la pista de rol dice que es dueño de un negocio.
     */
    businessLink: {
      join: joinBusinessLink,
      manage: { label: "Ir a mi negocio", href: ACCOUNT_PATH },
    },
    /** Botón de cuenta y su menú (`HeaderAccountMenu`). */
    accountMenu: {
      /** Nombre accesible del botón: en celular abre también la navegación. */
      buttonLabel: { mobile: "Menú y cuenta", desktop: "Cuenta" },
      /** Nombre del landmark de los links de página dentro del menú mobile. */
      sectionsLabel: "Secciones",
      /** Nombre del landmark de las opciones de cuenta. */
      accountLabel: "Tu cuenta",
      /**
       * Opciones por estado. "Mis pedidos" y "Mis autos" del diseño no están:
       * la cuenta del usuario final todavía no existe en la web (pendiente del
       * rediseño), y un link a `/cuenta` con ese nombre mentiría.
       */
      items: {
        anon: [
          {
            kind: "link",
            label: "Ingresar o crear cuenta",
            sub: "Es la misma cuenta de la app",
            href: ACCOUNT_PATH,
            strong: true,
          },
          rule,
          { kind: "link", ...joinBusinessLink, sub: "Recibí pedidos de gente de tu zona" },
          { kind: "link", ...plansLink },
          rule,
          { kind: "link", ...helpLink },
        ],
        cliente: [
          { kind: "link", label: "Mi cuenta", href: ACCOUNT_PATH, strong: true },
          rule,
          {
            kind: "link",
            ...joinBusinessLink,
            sub: "Con esta misma cuenta, sin crear otro usuario",
          },
          rule,
          { kind: "link", ...helpLink },
          { kind: "link", ...signOutLink },
        ],
        proveedor: [
          { kind: "group", label: "Tu negocio" },
          {
            kind: "link",
            label: "Mi negocio",
            sub: "El resumen de tu negocio",
            href: ACCOUNT_PATH,
            strong: true,
          },
          // Secciones de "Mi negocio" (fase 6). "Pedidos recibidos" vuelve
          // cuando el backend tenga la lectura de pedidos del negocio
          // (`ACCOUNT_FEATURES.orders`).
          { kind: "link", label: "Perfil del negocio", href: `${ACCOUNT_PATH}?seccion=perfil` },
          { kind: "link", label: "Plan", href: `${ACCOUNT_PATH}?seccion=plan` },
          { kind: "link", ...plansLink },
          rule,
          { kind: "link", ...helpLink },
          { kind: "link", ...signOutLink },
        ],
      } satisfies Record<"anon" | "cliente" | "proveedor", readonly AccountMenuEntry[]>,
    },
    /**
     * Aviso para lectores de pantalla en los links que abren otra pestaña
     * (va en un `sr-only` después del label).
     */
    externalHint: "(se abre en otra pestaña)",
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
   * Barra fija inferior en celular (home y directorio): "Hacé tu pedido" y,
   * como segunda opción, el WhatsApp de AutoLibre con un mensaje precargado.
   */
  mobileActionBar: {
    label: "Hacé tu pedido",
    whatsapp: {
      label: "WhatsApp",
      text: "¡Hola! Quiero pedir propuestas para mi auto.",
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
  /**
   * Botón flotante de WhatsApp (abajo a la derecha). En celular no se ve en
   * las páginas con barra fija inferior (ver `WhatsappFab`).
   * Solo ícono: `label` es su nombre accesible y va en un `sr-only`, seguido
   * de `nav.externalHint` porque abre otra pestaña. Abre el chat sin mensaje
   * precargado (`whatsappChat`): la persona escribe lo que necesita.
   */
  whatsappFab: {
    label: "Escribinos por WhatsApp",
    href: siteConfig.contact.whatsappChat,
  },

  footer: {
    /** Bajada del logo. Es el eslogan de la marca (`siteConfig.title`). */
    tagline: "Todo tu auto, en un solo lugar.",
    groups: [
      {
        id: "servicios",
        title: "Servicios",
        links: [
          quoteLink,
          { label: "Proveedores de la red", href: PROVEEDORES_PATH },
          { label: providersContent.form.title, href: PROVEEDORES_REGISTRO_PATH },
          plansLink,
        ],
      },
      {
        id: "app",
        title: "La app",
        links: [
          { label: "Descargar la app", href: "/descarga" },
          { label: "App Store", href: siteConfig.stores.appStore },
          { label: "Google Play", href: siteConfig.stores.playStore },
        ],
      },
      // El blog entra recién cuando es público.
      {
        id: "empresa",
        title: "Empresa",
        links: [
          aboutLink,
          ...(BLOG_PUBLIC ? [blogLink] : []),
          { label: "Términos", href: "/terminos" },
          { label: "Privacidad", href: "/privacidad" },
        ],
      },
      {
        id: "ayuda",
        title: "Ayuda",
        links: [
          // El chat sin mensaje precargado: la persona escribe lo que necesita.
          { label: "WhatsApp", href: siteConfig.contact.whatsappChat },
          {
            label: siteConfig.contact.email,
            href: `mailto:${siteConfig.contact.email}`,
          },
          { label: "Soporte", href: "/support" },
          { label: "Eliminar cuenta", href: "/eliminar-cuenta" },
        ],
      },
    ] satisfies readonly { id: string; title: string; links: readonly NavLink[] }[],
    /** Redes, en la fila del copyright. */
    socialLabel: "Redes de AutoLibre",
    social: [
      { label: "Instagram", href: siteConfig.social[1] },
      { label: "TikTok", href: siteConfig.social[0] },
      { label: "X", href: siteConfig.social[2] },
      { label: "LinkedIn", href: siteConfig.social[3] },
    ] satisfies readonly NavLink[],
    copyright: `© ${new Date().getFullYear()} ${siteConfig.legalName}`,
  },
} as const;
