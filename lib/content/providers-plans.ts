/**
 * Copy de los planes pagos para proveedores (`/proveedores/planes`) y del
 * banner que los promociona en `/proveedores/registro`.
 *
 * Precios y topes: decisión de producto del 24/10/2026 (research "Planes Plus
 * de proveedores — precio, tope de pedidos y costo de IA"). No modificar un
 * número sin confirmar el cambio con producto.
 */

import { LANDING_PLAN_ID_TO_CODE } from "@/lib/partner-billing/checkout";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

export const providersPlansContent = {
  meta: {
    title: "Planes para proveedores",
    description:
      "Conocé los planes pagos de AutoLibre para talleres y servicios: cuánto cuestan, cuántos pedidos por WhatsApp incluyen y cómo sumar más volumen.",
  },

  banner: {
    title: "¿Querés recibir más pedidos por WhatsApp?",
    subtitle: "Conocé los planes pagos para proveedores y elegí el que mejor se ajusta a tu negocio.",
    cta: { label: "Ver planes", href: PROVEEDORES_PLANES_PATH },
  },

  hero: {
    titleLines: ["Elegí el plan que se ajusta", "al volumen de tu negocio"],
    subtitle:
      "Registrarte en AutoLibre es gratis. Los planes Plus suman pedidos compatibles por WhatsApp todos los meses, sin cargo extra por pedido.",
  },

  plans: [
    {
      id: "plan-gratis",
      name: "Gratis",
      price: "Gratis",
      priceNote: null,
      description: "Para sumar tu negocio a la red de AutoLibre.",
      features: [
        "Aparecés en las recomendaciones de la IA",
        "Perfil en el directorio de AutoLibre",
        "1 propuesta por WhatsApp por mes",
        "Métricas de clics en tu perfil",
      ],
      cta: { label: "Registrate gratis", href: PROVEEDORES_REGISTRO_PATH },
      highlighted: false,
    },
    {
      id: "plan-plus",
      name: "Plus",
      price: "ARS 20.000",
      priceNote: "por mes + IVA",
      description: "Hasta 10 pedidos por WhatsApp por mes, sin usar la app.",
      features: [
        "Todo lo del plan Gratis",
        "Recibís pedidos y respondés propuestas por WhatsApp, sin usar la app",
        "Hasta 10 pedidos por WhatsApp por mes",
        "Página web propia dentro de autolibre.ai: aparece en Google y en las IAs, la podés usar como tu web",
      ],
      cta: {
        label: "Quiero el plan Plus",
        // Contratación online (spec 212): la página es privada y carga Clerk.
        href: checkoutHref(PROVEEDORES_CONTRATAR_PATH, LANDING_PLAN_ID_TO_CODE["plan-plus"]),
      },
      highlighted: true,
    },
    {
      id: "plan-plus-max",
      name: "Plus Max",
      price: "ARS 30.000",
      priceNote: "por mes + IVA",
      description: "Hasta 15 pedidos por WhatsApp por mes.",
      features: [
        "Todo lo del plan Plus",
        "Hasta 15 pedidos por WhatsApp por mes",
      ],
      cta: {
        label: "Quiero el plan Plus Max",
        href: checkoutHref(PROVEEDORES_CONTRATAR_PATH, LANDING_PLAN_ID_TO_CODE["plan-plus-max"]),
      },
      highlighted: false,
    },
  ],

  /**
   * Aclaraciones debajo de las cards (decisión de producto del 02/11/2026).
   * El período de prueba se probó con 1 mes; ajustar acá si producto cambia
   * la duración.
   */
  notes: [
    "Precio fijo mensual, no cobramos comisión por trabajo (+IVA).",
    "El plan no influye en la recomendación de la IA: el usuario siempre elige libremente.",
    "Los talleres que se suman tienen un período de prueba de 1 mes sin cargo.",
  ],

  sales: {
    title: "¿Necesitás más volumen o algo a medida?",
    description: "Contanos cuántos pedidos por mes necesitás y lo vemos juntos.",
    cta: { label: "Hablar con ventas" },
    whatsappMessage: "Hola! Quiero hablar con ventas sobre los planes de proveedores de AutoLibre.",
  },
} as const;
