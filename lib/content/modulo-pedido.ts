import { QUOTE_CHIPS, QUOTE_TABS, type QuoteChip, type QuoteTab } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * Copy del módulo de pedido (`components/modulo-pedido`): la pieza de
 * conversión que comparten el Home y `/pedido` (rediseño 2026-11, fase 3).
 *
 * Vocabulario: "Pedir propuestas" (DECISIONES 24-11). "Presupuesto" queda
 * solo en el H1 y el title de `/pedido`, por SEO.
 *
 * Nada inventado: Auxilio y Multas llevan a los aliados que ya están en el
 * Home (`homeContent.allies`, con sus mismas URLs). Seguro no tiene endpoint
 * en el backend: en lugar del form del prototipo lleva a WhatsApp.
 */

/** Ícono 3D de la app (WebP en `public/images/pedido/`, al doble del tamaño de uso). */
type ModuloIcon = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

const [asistir24, sinfotomultas] = homeContent.allies.slides;

export const moduloPedidoContent = {
  /** Nombre del `tablist` (no se ve). */
  tablistLabel: "Qué necesitás",

  tabs: [
    {
      id: QUOTE_TABS.taller,
      label: "Taller",
      icon: { src: "/images/pedido/taller.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.auxilio,
      label: "Auxilio",
      icon: { src: "/images/pedido/auxilio.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.multas,
      label: "Multas",
      icon: { src: "/images/pedido/multas.webp", width: 104, height: 104 },
    },
    {
      id: QUOTE_TABS.seguro,
      label: "Seguro",
      icon: { src: "/images/pedido/seguro.webp", width: 104, height: 104 },
    },
  ] as const satisfies readonly {
    readonly id: QuoteTab;
    readonly label: string;
    readonly icon: ModuloIcon;
  }[],

  /** Pestaña Taller: el único pedido que entra al backend (`/api/presupuesto`). */
  taller: {
    problema: {
      label: "¿Qué le pasa?",
      placeholder: "Hace ruido al frenar, toca el service…",
      error: "Contanos qué le pasa al auto.",
    },
    zona: {
      label: "¿Dónde estás?",
      placeholder: "Barrio o localidad",
      error: "Contanos en qué zona estás.",
    },
    next: "Pedir propuestas",

    chips: {
      label: "Lo más pedido",
      /**
       * Completan "¿Qué le pasa?" con su texto. Son categorías de pedido, no
       * un catálogo de servicios garantizados.
       */
      items: [
        {
          id: QUOTE_CHIPS.service,
          label: "Service",
          icon: { src: "/images/pedido/service.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.luzTablero,
          label: "Luz en el tablero",
          icon: { src: "/images/pedido/luz-tablero.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.alineacion,
          label: "Alineación y balanceo",
          icon: { src: "/images/pedido/alineacion.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.frenos,
          label: "Frenos",
          icon: { src: "/images/pedido/frenos.webp", width: 56, height: 56 },
        },
        {
          id: QUOTE_CHIPS.aire,
          label: "Aire acondicionado",
          icon: { src: "/images/pedido/aire.webp", width: 56, height: 56 },
        },
      ] as const satisfies readonly {
        readonly id: QuoteChip;
        readonly label: string;
        readonly icon: ModuloIcon;
      }[],
    },

    whatsapp: {
      prompt: "¿Preferís chatear?",
      label: "Pedilo por WhatsApp",
      text: "¡Hola! Quiero pedir propuestas para mi auto.",
    },

    /** Paso 2: WhatsApp y patente. */
    contact: {
      change: "Cambiar",
      /** Lo que lee un lector de pantalla antes del resumen. */
      summaryLabel: "Tu pedido:",
      title: "¿Qué auto es y a qué WhatsApp te avisamos?",
      whatsapp: {
        label: "Tu WhatsApp",
        prefix: "+54",
        prefixLabel: "Código de país +54.",
        placeholder: "11 2345-6789",
      },
      patente: {
        label: "Patente",
        optional: "(opcional, recomendada)",
        placeholder: "AB 123 CD",
        hint: "Con la patente ya sabemos marca, modelo y año, y los proveedores te responden más rápido.",
        error: "Revisá la patente. Por ejemplo: AB123CD o ABC123.",
        status: {
          validating: "Validando patente…",
          valid: "Patente validada",
          unverified: "No pudimos validarla, podés enviar igual.",
        },
      },
      submit: "Enviar pedido",
      submitting: "Enviando…",
      legal:
        "Tu WhatsApp lo usamos solo para avisarte de este pedido. Al enviarlo aceptás que compartamos tu consulta con proveedores de nuestra red.",
      privacyLink: "Cómo cuidamos tus datos",
      genericError: "No pudimos mandar tu pedido. Probá de nuevo o escribinos por WhatsApp.",
    },

    /** Estado enviado: reemplaza al form en el mismo lugar. */
    sent: {
      title: "¡Listo! Ya tenemos tu pedido",
      body: "Te escribimos por WhatsApp en el día con las propuestas. Para seguirlo desde el celular, la app es gratis.",
      /** `{code}` = código público del pedido (`AL-1042`). */
      code: "Tu pedido es el #{code}.",
      app: "Bajar la app",
      again: "Hacer otro pedido",
    },
  },

  auxilio: {
    title: "¿Te quedaste en el camino?",
    body: "La grúa de Asistir24 te lleva directo a un taller de la red AutoLibre. Atención las 24 horas.",
    cta: { label: asistir24.badgeCta.label, href: asistir24.badgeCta.href },
  },

  multas: {
    title: "¿Tenés multas?",
    body: "Antes de pagar, mirá cuánto se pueden reducir con Sin Fotomultas. Gestión legal en CABA y Provincia de Buenos Aires.",
    cta: { label: sinfotomultas.cta.label, href: sinfotomultas.cta.href },
  },

  /**
   * El prototipo trae un form (patente, WhatsApp y cobertura) que el backend
   * no tiene dónde recibir: hasta que exista ese endpoint, el pedido de
   * cotización va por el WhatsApp de AutoLibre con un mensaje precargado.
   */
  seguro: {
    title: "¿Se te vence la póliza?",
    body: "Escribinos por WhatsApp con la patente y la cobertura que buscás, y te mandamos una cotización para que compares.",
    cta: {
      label: "Cotizá por WhatsApp",
      href: whatsappUrl("¡Hola! Quiero cotizar el seguro de mi auto."),
    },
  },
} as const;

/**
 * Página de prueba del módulo (`/pedido/modulo`, fase 3). No se indexa y no
 * está en el sitemap: existe para revisar el módulo con el build real hasta
 * que la fase 4 lo monte en el Home y en `/pedido`. Se borra en esa fase.
 */
export const moduloPedidoPreviewContent = {
  meta: {
    title: "Módulo de pedido (vista previa)",
    description:
      "Vista previa interna del módulo de pedido de AutoLibre: pedí propuestas de proveedores en tu zona.",
  },
  badge: "Gratis · Proveedores en AMBA",
  title: "Presupuestos para tu auto, de proveedores en tu zona.",
  subtitle: "Contanos qué le pasa a tu auto y te respondemos en el día. Gratis y sin compromiso.",
} as const;
