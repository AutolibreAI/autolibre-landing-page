/**
 * LEGACY: copy de los planes de suscripción para proveedores (Gratis / Plus /
 * Plus Max), tal como estaba en `providers-plans.ts` hasta el 2026-11-26.
 *
 * Por qué existe: ese día producto dejó de vender planes y pasó a cobrar por
 * trabajo confirmado (ver `PRODUCT.md` y `providers-plans.ts`). La página
 * pública `/proveedores/planes` ya no muestra estos planes, pero hay talleres
 * con una suscripción vigente que la ven y la cancelan en `/cuenta`, y la
 * contratación (`/proveedores/contratar`, spec 212) sigue funcionando aunque
 * ninguna página pública la enlace. Esas dos superficies leen su copy de acá
 * para renderizar EXACTAMENTE lo mismo que antes del cambio.
 *
 * No se usa en páginas públicas ni en JSON-LD. No editar el copy: se borra
 * entero cuando el backend soporte packs y `/cuenta` y la contratación migren
 * al modelo nuevo.
 *
 * Precios y topes: alineados el 2026-11-12 con la tabla `subscription_plans`
 * de producción. El checkout cobra el precio de `GET /billing/plans`, no el
 * de acá.
 */

import { LANDING_PLAN_ID_TO_CODE } from "@/lib/partner-billing/checkout";
import { checkoutHref } from "@/lib/partner-billing/return-path";
import {
  PROVEEDORES_CONTRATAR_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

export const partnerLegacyPlansContent = {
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
      /** Lo que SUMA sobre el plan Gratis. */
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

  /** Mensaje de "Hablar con ventas" cuando la contratación está apagada. */
  sales: {
    whatsappMessage: "Hola! Quiero hablar con ventas sobre los planes de proveedores de AutoLibre.",
  },
} as const;
