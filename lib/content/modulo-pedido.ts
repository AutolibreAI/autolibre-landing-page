import { QUOTE_CHIPS, QUOTE_TABS, type QuoteChip, type QuoteTab } from "@/lib/analytics/events";
import { homeContent } from "@/lib/content/home";

/**
 * Copy del módulo de pedido (`components/modulo-pedido`): la pieza de
 * conversión que comparten el Home y `/pedido` (rediseño 2026-11, fase 3).
 *
 * Vocabulario: "Pedir propuestas" (DECISIONES 24-11). "Presupuesto" queda
 * solo en el H1 y el title de `/pedido`, por SEO.
 *
 * Nada inventado: Auxilio y Multas llevan a los aliados que ya están en el
 * Home (`homeContent.allies`, con sus mismas URLs). Sin pestaña Seguro:
 * decisión de producto del 2026-11-24 (no se ofrecen seguros por ahora).
 */

/** Ícono 3D de la app (WebP en `public/images/pedido/`, al doble del tamaño de uso). */
type ModuloIcon = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

const [asistir24, sinfotomultas] = homeContent.allies.items;

/**
 * ¿El pedido hecho en la web ya aparece en la app? HOY NO: los pedidos de la
 * web no quedan asociados a ninguna cuenta (0 de 31 pedidos web con
 * `user_id`, 2026-11-24). Mientras esté en `false`, el estado enviado dice
 * "Así se ve en la app" y NUNCA "Tu pedido ya está en la app" ni "Seguí este
 * pedido desde el celular". Se prende (y se revisa el copy de `linked`)
 * cuando el backend vincule el pedido a la cuenta por el WhatsApp.
 */
export const APP_VINCULADA = false;

/** Ilustración del bloque de la app: captura real (WebP 432x600, el doble del uso). */
type AppScreen = {
  readonly src: string;
  readonly width: number;
  readonly height: number;
};

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
      /**
       * Consentimiento explícito (decisión de producto, 2026-11-24): checkbox
       * visible, desmarcado por defecto y obligatorio para enviar. El texto va
       * partido para meter los dos links (los arma el server).
       */
      consent: {
        prefix:
          "Acepto que AutoLibre comparta mi consulta y mi WhatsApp con proveedores de su red para que me respondan, según los ",
        termsLink: "Términos y Condiciones",
        middle: " y la ",
        privacyLink: "Política de Privacidad",
        suffix: ".",
        error: "Para enviar el pedido tenés que aceptar que compartamos tu consulta con los proveedores.",
      },
      note: "Tu WhatsApp lo usamos solo para avisarte de este pedido.",
      genericError: "No pudimos mandar tu pedido. Probá de nuevo o escribinos por WhatsApp.",
    },

    /**
     * Estado enviado: reemplaza al form en el mismo lugar. Arriba la
     * confirmación; abajo, el bloque de la app (`appPromo`).
     */
    sent: {
      title: "¡Listo! Ya tenemos tu pedido",
      /**
       * Código público que devuelve el envío (`AL-1042`), en negrita entre
       * `before` y `after`. Si el backend no lo devuelve, la oración no va:
       * nunca se inventa un número.
       */
      code: { before: "Tu pedido es el ", prefix: "#", after: ". " },
      body: "Te escribimos por WhatsApp en el día con las propuestas.",
      again: "Hacer otro pedido",
    },

    /**
     * Bloque "Así se ve en la app" del estado enviado (ajuste del
     * 2026-11-24). Copy honesto según `APP_VINCULADA`: con el flag apagado
     * muestra cómo se ve un pedido en la app, sin decir que ESTE pedido ya
     * está ahí.
     */
    appPromo: {
      unlinked: {
        eyebrow: "Así se ve en la app",
        title: "Con la app ves las propuestas apenas llegan",
        body: "Comparás precio, distancia y qué incluye cada una, y elegís el taller en un toque.",
        next: "Tus próximos pedidos los hacés y los seguís desde ahí.",
      },
      /** Solo con `APP_VINCULADA`. Revisar antes de prenderlo. */
      linked: {
        eyebrow: "Tu pedido ya está en la app",
        title: "Seguí este pedido desde el celular",
        body: "Entrá con el mismo WhatsApp y vas a encontrar tu pedido con cada propuesta que llegue.",
        next: "Entrá con el WhatsApp que pusiste en el pedido.",
      },
      /** Nombre de la fila de pasos (no se ve; la fila es navegable con teclado). */
      stepsLabel: "Cómo se ve un pedido en la app",
      steps: [
        {
          title: "Te avisamos con cada respuesta",
          body: "Ves cuántas propuestas llegaron sin esperar el mensaje.",
          screen: { src: "/images/app/app-propuestas.webp", width: 432, height: 600 },
        },
        {
          title: "Las comparás lado a lado",
          body: "Precio, distancia y qué incluye cada una, con la recomendada marcada.",
          screen: { src: "/images/app/app-elegir.webp", width: 432, height: 600 },
        },
        {
          title: "Elegís y coordinás",
          body: "Te abrimos WhatsApp con el mensaje listo para el taller.",
          screen: { src: "/images/app/app-elegiste.webp", width: 432, height: 600 },
        },
      ] as const satisfies readonly {
        readonly title: string;
        readonly body: string;
        readonly screen: AppScreen;
      }[],
      download: {
        title: "Bajá la app gratis",
        /** Solo desde `lg`, junto al QR. */
        scan: "Escaneá el código con la cámara del celular.",
        qrAlt: "Código QR para bajar la app de AutoLibre",
      },
      whatsappFallback: "¿Preferís no bajarla? No pasa nada: te mandamos todo por WhatsApp.",
    },
  },

  auxilio: {
    title: "¿Te quedaste en el camino?",
    body: "La grúa de Asistir24 te lleva directo a un taller de la red AutoLibre. Atención las 24 horas.",
    cta: { label: asistir24.cta.label, href: asistir24.cta.href },
  },

  multas: {
    title: "¿Tenés multas?",
    body: "Antes de pagar, mirá cuánto se pueden reducir con Sin Fotomultas. Gestión legal en CABA y Provincia de Buenos Aires.",
    cta: { label: sinfotomultas.cta.label, href: sinfotomultas.cta.href },
  },

} as const;
