import {
  PARTS_SUPPLY,
  QUOTE_TIMINGS,
  type PartsSupply,
  type QuoteDetailsError,
  type QuoteTiming,
} from "@/lib/quote-details";

/**
 * Copy del paso final del pedido en el Home (`RequestFlowOverlay`): la
 * pantalla limpia que se abre al tocar "Pedir propuestas". Las opciones y sus
 * textos son los mismos que el pedido de la app (autolibre-mobile,
 * `PedidoScreen.helpers.ts` y `pedido-taller-form.tsx`): no se cambian acá
 * sin cambiarlos allá.
 *
 * Lo comparten la isla (llega por props desde el server, ver `ModuloPedido`)
 * y `app/api/presupuesto/route.ts` (los errores).
 */
export const requestFlowContent = {
  close: "Cerrar y volver al inicio",
  /** Lo que lee un lector de pantalla antes del resumen de la barra. */
  summaryLabel: "Tu pedido:",
  /** Botón de la barra resumen: cierra y vuelve a "¿Qué le pasa?". */
  change: "Cambiar",
  title: "Contanos un poco más",
  subtitle: "Unos datos más y listo. Solo el WhatsApp es obligatorio.",

  timing: {
    legend: "¿Para cuándo?",
    options: [
      { id: QUOTE_TIMINGS.asap, label: "Lo antes posible" },
      { id: QUOTE_TIMINGS.thisWeek, label: "Esta semana" },
      { id: QUOTE_TIMINGS.date, label: "Tengo una fecha" },
    ] as const satisfies readonly { readonly id: QuoteTiming; readonly label: string }[],
    date: {
      label: "¿Qué día?",
      missing: "Elegí qué día lo necesitás.",
      past: "Elegí hoy o un día que todavía no pasó.",
    },
  },

  parts: {
    legend: "¿Y los repuestos?",
    subtitle: "Por si hace falta cambiar alguna pieza.",
    options: [
      {
        id: PARTS_SUPPLY.workshop,
        label: "Que los ponga el taller",
        detail: "Te cotizan repuestos y mano de obra juntos",
      },
      {
        id: PARTS_SUPPLY.customer,
        label: "Ya los tengo",
        detail: "Te cotizan sólo la mano de obra",
      },
    ] as const satisfies readonly {
      readonly id: PartsSupply;
      readonly label: string;
      readonly detail: string;
    }[],
  },

  mileage: {
    label: "Kilometraje",
    optional: "(opcional)",
    suffix: "km",
    placeholder: "85.000",
  },

  /**
   * Confirmación adentro de la pantalla limpia. El código del pedido y qué
   * pasa después salen de `moduloPedidoContent.taller.sent` (mismo texto que
   * el enviado de `/pedido`).
   */
  success: {
    title: "¡Listo! Ya mandamos tu pedido",
    /** Cierra la pantalla limpia y deja el módulo vacío para otro pedido. */
    back: "Volver al inicio",
  },

  phone: {
    label: "¿A qué WhatsApp te contactamos?",
    hint: "Con código de área, sin el 0 ni el 15. Ej.: 11 2345-6789.",
  },

  /**
   * Errores de los detalles que devuelve `/api/presupuesto` (400). En el
   * form no deberían verse: la isla valida lo mismo antes de mandar.
   */
  serverErrors: {
    timing: "Elegí para cuándo lo necesitás.",
    preferred_date_missing: "Elegí qué día lo necesitás.",
    preferred_date_invalid: "Revisá la fecha.",
    preferred_date_past: "Elegí hoy o un día que todavía no pasó.",
    preferred_date_forbidden: "La fecha solo va si elegiste \"Tengo una fecha\".",
    parts_supply: "Elegí quién pone los repuestos.",
    mileage: "Revisá el kilometraje: tiene que ser un número entre 0 y 2.000.000.",
  } satisfies Record<QuoteDetailsError, string>,
} as const;

export type RequestFlowContent = typeof requestFlowContent;
