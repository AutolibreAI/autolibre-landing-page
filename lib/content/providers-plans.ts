/**
 * Copy de los planes pagos para proveedores (`/proveedores/planes`) y del
 * banner que los promociona en `/proveedores/registro`.
 *
 * Precios y topes: decisión de producto del 24/10/2026 (research "Planes Plus
 * de proveedores — precio, tope de pedidos y costo de IA"). No modificar un
 * número sin confirmar el cambio con producto.
 */

import { PROVEEDORES_PLANES_PATH, PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

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
      id: "plan-estandar",
      name: "Estándar",
      price: "Gratis",
      priceNote: null,
      description: "Para sumar tu negocio a la red de AutoLibre.",
      features: [
        "Tu perfil en la app, con logo, horarios y especialidades",
        "Consultas con marca, modelo, año y servicio solicitado, de tu zona y tu rubro",
        "Hasta 1 pedido por WhatsApp por mes",
      ],
      cta: { label: "Registrate gratis", href: PROVEEDORES_REGISTRO_PATH },
      highlighted: false,
    },
    {
      id: "plan-plus",
      name: "Plus",
      price: "ARS 20.000",
      priceNote: "por mes",
      description: "Hasta 10 pedidos compatibles por WhatsApp incluidos por mes.",
      features: [
        "Todo lo del plan Estándar",
        "Hasta 10 pedidos por WhatsApp incluidos por mes",
        "Sin cargo extra por pedido",
      ],
      cta: {
        label: "Quiero el plan Plus",
        whatsappMessage: "Hola! Estoy interesado en el plan Plus de proveedores de AutoLibre.",
      },
      highlighted: true,
    },
    {
      id: "plan-plus-max",
      name: "Plus Max",
      price: "ARS 30.000",
      priceNote: "por mes",
      description: "Hasta 15 pedidos compatibles por WhatsApp incluidos por mes.",
      features: [
        "Todo lo del plan Plus",
        "Hasta 15 pedidos por WhatsApp incluidos por mes",
        "Sin cargo extra por pedido",
      ],
      cta: {
        label: "Quiero el plan Plus Max",
        whatsappMessage: "Hola! Estoy interesado en el plan Plus Max de proveedores de AutoLibre.",
      },
      highlighted: false,
    },
  ],

  sales: {
    title: "¿Necesitás más volumen o algo a medida?",
    description: "Contanos cuántos pedidos por mes necesitás y lo vemos juntos.",
    cta: { label: "Hablar con ventas" },
    whatsappMessage: "Hola! Quiero hablar con ventas sobre los planes de proveedores de AutoLibre.",
  },
} as const;
