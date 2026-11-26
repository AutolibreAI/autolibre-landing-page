/**
 * Copy de los planes pagos para proveedores (`/proveedores/planes`).
 *
 * Precios y topes: alineados el 2026-11-12 con la tabla `subscription_plans`
 * de producción. La base es la fuente de verdad: no modificar un número sin
 * verificarlo contra esa tabla.
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

  breadcrumb: { label: "Migas de pan", current: "Planes" },

  hero: {
    eyebrow: "Planes para proveedores",
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
      /** Rótulo de la lista: el Gratis lista todo; los pagos, lo que suman. */
      includesLabel: "Qué incluye",
      features: [
        "Aparecés en las recomendaciones de la IA",
        "Perfil en el directorio de AutoLibre",
        "1 propuesta por WhatsApp por mes",
        "Métricas de clics en tu perfil",
      ],
      cta: { label: "Registrate gratis", href: PROVEEDORES_REGISTRO_PATH },
      summaryFeatures: [],
      highlighted: false,
    },
    {
      id: "plan-plus",
      name: "Plus",
      price: "ARS 10.000",
      priceNote: "por mes + IVA",
      description: "Hasta 5 pedidos por WhatsApp por mes, sin usar la app.",
      includesLabel: "Todo lo del plan Gratis, y además",
      /** Lo que SUMA sobre el plan Gratis (la tarjeta lo dice con `includesLabel`). */
      features: [
        "Recibís pedidos y respondés propuestas por WhatsApp, sin usar la app",
        "Hasta 5 pedidos por WhatsApp por mes",
        "Página web propia dentro de autolibre.ai: aparece en Google y en las IAs, la podés usar como tu web",
      ],
      cta: {
        label: "Quiero el plan Plus",
        // Contratación online (spec 212): la página es privada y carga Clerk.
        href: checkoutHref(PROVEEDORES_CONTRATAR_PATH, LANDING_PLAN_ID_TO_CODE["plan-plus"]),
        /** `plan` de `plan_checkout_started`. */
        analyticsPlan: LANDING_PLAN_ID_TO_CODE["plan-plus"],
      },
      /** Lo que lista la tarjeta "Revisá el plan" de la contratación. */
      summaryFeatures: [
        "Recibís pedidos y respondés propuestas por WhatsApp, sin usar la app",
        "Hasta 5 pedidos por WhatsApp por mes",
        "Página web propia dentro de autolibre.ai",
      ],
      highlighted: true,
    },
    {
      id: "plan-plus-max",
      name: "Plus Max",
      price: "ARS 20.000",
      priceNote: "por mes + IVA",
      description: "Hasta 12 pedidos por WhatsApp por mes.",
      includesLabel: "Todo lo del plan Plus, y además",
      features: ["Hasta 12 pedidos por WhatsApp por mes"],
      cta: {
        label: "Quiero el plan Plus Max",
        href: checkoutHref(PROVEEDORES_CONTRATAR_PATH, LANDING_PLAN_ID_TO_CODE["plan-plus-max"]),
        analyticsPlan: LANDING_PLAN_ID_TO_CODE["plan-plus-max"],
      },
      summaryFeatures: ["Todo lo del plan Plus", "Hasta 12 pedidos por WhatsApp por mes"],
      highlighted: false,
    },
  ],

  sales: {
    title: "¿Necesitás más volumen o algo a medida?",
    description: "Contanos cuántos pedidos por mes necesitás y lo vemos juntos.",
    cta: { label: "Hablar con ventas" },
    whatsappMessage: "Hola! Quiero hablar con ventas sobre los planes de proveedores de AutoLibre.",
  },

  /** Las tres reglas que valen para todos los planes (antes, `notes` en letra chica). */
  rules: {
    title: "Lo mismo en todos los planes",
    items: [
      {
        title: "Precio fijo, sin comisión",
        body: "Pagás un monto fijo por mes (+ IVA). No cobramos comisión por trabajo.",
      },
      {
        title: "El plan no cambia la recomendación",
        body: "El plan no influye en la recomendación de la IA: el usuario siempre elige libremente.",
      },
      {
        title: "Probás antes de pagar",
        body: "Si es la primera vez que tu negocio contrata un plan pago, arrancás con un período de prueba sin cargo. Antes de pagar ves cuántos días te corresponden.",
      },
    ],
  },

  /**
   * Tabla comparativa (desde `md`; en celular las tarjetas ya lo dicen todo).
   * `true` = incluido, `false` = no incluido, string = el valor.
   */
  compare: {
    title: "Compará los planes",
    caption: "Qué incluye cada plan",
    rowHeader: "Qué incluye",
    included: "Incluido",
    notIncluded: "No incluido",
    plans: ["Gratis", "Plus", "Plus Max"],
    /** Columna resaltada (Plus), como la tarjeta. */
    highlighted: 1,
    rows: [
      { label: "Precio por mes", values: ["Gratis", "ARS 10.000 + IVA", "ARS 20.000 + IVA"] },
      { label: "Pedidos por WhatsApp por mes", values: ["1 propuesta", "Hasta 5", "Hasta 12"] },
      { label: "Recibir pedidos y responder por WhatsApp, sin usar la app", values: [false, true, true] },
      { label: "Página web propia dentro de autolibre.ai", values: [false, true, true] },
      { label: "Aparecer en las recomendaciones de la IA", values: [true, true, true] },
      { label: "Perfil en el directorio de AutoLibre", values: [true, true, true] },
      { label: "Métricas de clics en tu perfil", values: [true, true, true] },
    ],
  },

  faq: {
    title: "Preguntas sobre los planes",
    items: [
      {
        question: "¿Tengo que registrar mi negocio antes de contratar?",
        answer:
          "Sí. Primero registrás tu negocio, que es gratis. Cuando aprobamos la solicitud, contratás el plan con esa misma cuenta en un par de pasos.",
        link: { text: "registrás tu negocio", href: PROVEEDORES_REGISTRO_PATH },
      },
      {
        question: "¿Dónde veo y cancelo mi plan?",
        answer:
          "En tu cuenta de AutoLibre. Ahí ves tus negocios, el estado de cada plan y la opción de cancelar la suscripción.",
      },
      {
        question: "¿Y si necesito más de 12 pedidos por mes?",
        answer: "Escribinos por WhatsApp, contanos cuántos pedidos por mes necesitás y lo vemos juntos.",
      },
    ],
  },

  /** Banda oscura de cierre. */
  closing: {
    title: "¿Todavía no registraste tu negocio?",
    body: "El registro es gratis y lo hacés con tu cuenta de AutoLibre, la misma de la app.",
    cta: { label: "Sumá tu negocio", href: PROVEEDORES_REGISTRO_PATH },
  },
} as const;
