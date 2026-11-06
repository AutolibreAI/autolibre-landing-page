/**
 * Copy de los planes pagos para proveedores (`/proveedores/planes`).
 *
 * Precios y topes: decisión de producto del 24/10/2026 (research "Planes Plus
 * de proveedores — precio, tope de pedidos y costo de IA"). No modificar un
 * número sin confirmar el cambio con producto.
 *
 * TODO(precios): los precios de acá están escritos a mano y el checkout cobra
 * el de `GET /billing/plans`. Si producto cambia el precio en el backend, esta
 * página (y su JSON-LD `OfferCatalog`) queda desfasada hasta que alguien la
 * edite. Pendiente: leerlos del backend en el server (ISR), con estos valores
 * como fallback.
 */

import { LANDING_PLAN_ID_TO_CODE } from "@/lib/partner-billing/checkout";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

export const providersPlansContent = {
  meta: {
    title: "Planes para proveedores",
    description:
      "Conocé los planes pagos de AutoLibre para talleres y servicios: cuánto cuestan, cuántos pedidos por WhatsApp incluyen y cómo sumar más volumen.",
  },

  hero: {
    titleLines: ["Elegí el plan que se ajusta", "al volumen de tu negocio"],
    subtitle:
      "Registrarte en AutoLibre es gratis. Los planes Plus suman pedidos compatibles por WhatsApp todos los meses, sin cargo extra por pedido.",
  },

  /** `h2` (solo para lectores de pantalla) de la grilla. */
  gridTitle: "Planes disponibles",

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
        /** `plan` de `plan_checkout_started`. */
        analyticsPlan: LANDING_PLAN_ID_TO_CODE["plan-plus"],
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
        analyticsPlan: LANDING_PLAN_ID_TO_CODE["plan-plus-max"],
      },
      highlighted: false,
    },
  ],

  /**
   * Aclaraciones debajo de las cards (decisión de producto del 02/11/2026).
   *
   * La prueba NO lleva cifra fija (2026-11-05): es una sola vez por taller y
   * la duración la define el backend (`trialDays` de `GET /billing/plans`,
   * `trialEligible` por taller). Una cifra acá podía prometer algo falso a un
   * taller que ya la usó o si producto cambia la duración. El número real se
   * muestra en el resumen de `/proveedores/contratar`, antes de pagar.
   */
  notes: [
    "Precio fijo mensual, no cobramos comisión por trabajo (+IVA).",
    "El plan no influye en la recomendación de la IA: el usuario siempre elige libremente.",
    "Si es la primera vez que tu taller contrata un plan pago, arrancás con un período de prueba sin cargo. Antes de pagar ves cuántos días te corresponden.",
  ],

  sales: {
    title: "¿Necesitás más volumen o algo a medida?",
    description: "Contanos cuántos pedidos por mes necesitás y lo vemos juntos.",
    cta: { label: "Hablar con ventas" },
    whatsappMessage: "Hola! Quiero hablar con ventas sobre los planes de proveedores de AutoLibre.",
  },
} as const;
