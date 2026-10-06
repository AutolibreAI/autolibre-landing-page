import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { siteConfig } from "@/lib/seo/config";
import { providersContent } from "@/lib/content/providers";
import type { NavEntry, StoreLink } from "@/lib/content/types";

/** Link a `/pedido`: el mismo en el header, el menú mobile y el footer. */
const quoteLink = { label: "Pedir presupuesto", href: "/pedido" } as const;
/** Link a `/blog`: el mismo en el header, el menú mobile y el footer. */
const blogLink = { label: "Blog", href: "/blog" } as const;
/** Link a `/aliados`: el mismo en el header y el menú mobile. */
const aliadosLink = { label: "Aliados", href: "/aliados" } as const;
/** Link a `/sobre-nosotros`: el mismo en el header y en el footer. */
const aboutLink = { label: "Sobre nosotros", href: "/sobre-nosotros" } as const;

/**
 * Destino de cada vertical en el nav. TEMPORAL: las páginas `/talleres`,
 * `/seguros`, `/multas` y `/repuestos` todavía no existen, así que cada
 * servicio lleva a `/pedido` con `?servicio=`. Hoy `/pedido` IGNORA ese
 * parámetro (no lee `searchParams`): la landing carga igual, el param queda
 * listo para cuando el form sepa preseleccionar la vertical. Cuando exista la
 * página de una vertical, su línea pasa a `"/<vertical>"` y listo.
 */
const serviceHrefs = {
  talleres: "/pedido?servicio=talleres",
  seguros: "/pedido?servicio=seguros",
  multas: "/pedido?servicio=multas",
  repuestos: "/pedido?servicio=repuestos",
} as const;

/**
 * Las cuatro verticales operativas como links: las comparten el desplegable
 * "Servicios" del header y el grupo "Servicios" del footer, así label y
 * destino cambian juntos. Financiamiento NO está acá: no es operativa (en el
 * header va como "Próximamente", en el footer no va).
 */
const serviceLinks = {
  talleres: { label: "Talleres", href: serviceHrefs.talleres },
  seguros: { label: "Seguros", href: serviceHrefs.seguros },
  multas: { label: "Multas", href: serviceHrefs.multas },
  repuestos: { label: "Repuestos", href: serviceHrefs.repuestos },
} as const;

/** Link a `/support`: el mismo en el header (grupo Empresa) y en el footer. */
const supportLink = { label: "Soporte", href: "/support" } as const;

/**
 * Nav principal. Es el MISMO en todas las páginas y se muestra en este orden:
 * links sueltos y, cuando una intención junta más de una página, un grupo
 * (desplegable en desktop, lista con etiqueta en el menú mobile).
 *
 * Sin "Inicio": el logo ya lleva a la home, y la entrada ocupaba lugar que
 * ahora usan los servicios.
 *
 * Un grupo de un solo item no se arma: va como link suelto. Pendientes, cada
 * uno es un cambio de una línea acá:
 * - Escáner OBD (`/escaner-obd`): entra como item de "Servicios" o como link
 *   suelto, según cómo se venda.
 *
 * Aliados (`/aliados`, el directorio de los negocios de la red) va como link
 * suelto propio, al lado de "Para negocios" y NO adentro de un grupo con él:
 * le habla al conductor que busca a quién pedirle ("¿con quién trabajan?"),
 * mientras "Para negocios" le habla al negocio que se quiere sumar.
 *
 * Las `description` de los items de grupo son una línea factual sacada del
 * copy existente: nada de métricas ni claims nuevos.
 */
const navEntries: readonly NavEntry[] = [
  {
    kind: "group",
    id: "servicios",
    label: "Servicios",
    items: [
      {
        ...serviceLinks.talleres,
        icon: "wrench",
        description: "Presupuestos de talleres cerca tuyo.",
      },
      {
        ...serviceLinks.seguros,
        icon: "shield",
        description: "Pedí cotización del seguro de tu auto.",
      },
      {
        ...serviceLinks.multas,
        icon: "file-text",
        // Lo que hace AutoLibre con una multa: pagarla con descuento o
        // presentar el descargo. Sin porcentajes: no hay uno fijo publicable.
        description: "Pagalas con descuento o presentá tu descargo.",
      },
      {
        ...serviceLinks.repuestos,
        icon: "cog",
        description: "Pedí precio de los repuestos que necesitás.",
      },
      // No operativo todavía: sin link ni página (ver `NavComingSoonItem`).
      { label: "Financiamiento", icon: "credit-card", comingSoon: true },
    ],
    footerLink: {
      lead: "¿No sabés qué necesitás?",
      label: "Pedí presupuesto",
      href: quoteLink.href,
    },
  },
  { kind: "link", label: "Para negocios", href: "/proveedores" },
  { kind: "link", ...aliadosLink },
  ...(BLOG_PUBLIC ? [{ kind: "link", ...blogLink } as const] : []),
  {
    kind: "group",
    id: "empresa",
    label: "Empresa",
    items: [
      aboutLink,
      {
        ...supportLink,
        // Lo que es `/support`: el formulario para quien tiene un problema
        // con la app (ver `public/llms.txt`).
        description: "Ayuda con la app.",
      },
      // Sin "Contacto": el chat de WhatsApp vive en el botón flotante
      // (`WhatsappFab`), presente en todas las páginas, y en el footer.
    ],
  },
];

/** Contenido del header y del footer, compartido por todas las páginas. */
export const siteContent = {
  nav: {
    /** Los grupos sin items se omiten. */
    entries: navEntries.filter(
      (entry) => entry.kind === "link" || entry.items.length > 0,
    ),
    /** Etiqueta del `<nav>` principal (desktop y menú mobile). */
    label: "Principal",
    /**
     * Aviso para lectores de pantalla en los items que abren otra pestaña
     * (va en un `sr-only` después del label).
     */
    externalHint: "(se abre en otra pestaña)",
    /** Marca visible (y leída) de los items no operativos de un grupo. */
    comingSoonLabel: "Próximamente",
    /**
     * Botón principal del header ("Pedir presupuesto") en TODAS las páginas
     * salvo `/proveedores`: el pedido es la conversión principal de la web.
     * También saca a la landing de pedido de ser una página huérfana.
     */
    quoteLink,
    /**
     * Texto visible del botón principal debajo de `sm`. A 360px no entran
     * logo (123) + "Pedir presupuesto" (156) + botón de menú (44) + gaps:
     * suman ~347px y el contenido mide 317. El nombre accesible sigue siendo
     * `quoteLink.label`, que contiene este texto (WCAG 2.5.3).
     */
    quoteShortLabel: "Presupuesto",
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

  /**
   * Botón flotante de WhatsApp (abajo a la derecha, en todas las páginas).
   * Solo ícono: `label` es su nombre accesible y va en un `sr-only`, seguido
   * de `nav.externalHint` porque abre otra pestaña. Abre el chat sin mensaje
   * precargado (`whatsappChat`): la persona escribe lo que necesita.
   */
  whatsappFab: {
    label: "Escribinos por WhatsApp",
    href: siteConfig.contact.whatsappChat,
  },

  footer: {
    groups: [
      /**
       * Primero: las verticales operativas (mismos links que el desplegable
       * del header, ver `serviceLinks`) y el pedido de presupuesto, la
       * conversión principal. Sin Financiamiento: no es operativa.
       */
      {
        id: "servicios",
        title: "Servicios",
        links: [
          serviceLinks.talleres,
          serviceLinks.seguros,
          serviceLinks.multas,
          serviceLinks.repuestos,
          quoteLink,
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
      // Igual que el grupo "Empresa" del header, más la puerta para
      // negocios (en el header es un link suelto) y el blog, que entra recién
      // cuando es público. Así el footer no suma columnas de un solo link.
      {
        id: "empresa",
        title: "Empresa",
        links: [
          aboutLink,
          // Mismo texto que el título del form de `/proveedores`.
          { label: providersContent.form.title, href: "/proveedores" },
          ...(BLOG_PUBLIC ? [blogLink] : []),
          supportLink,
        ],
      },
      {
        id: "legal",
        title: "Legal",
        links: [
          { label: "Términos", href: "/terminos" },
          { label: "Privacidad", href: "/privacidad" },
          { label: "Eliminar cuenta", href: "/eliminar-cuenta" },
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
