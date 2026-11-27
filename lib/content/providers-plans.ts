/**
 * Copy de los precios para proveedores (`/proveedores/planes`).
 *
 * Modelo vigente desde el 2026-11-26 (decisión del dueño, ver `PRODUCT.md`):
 * AutoLibre ya no vende planes de suscripción; cobra un precio fijo por
 * trabajo confirmado (el usuario eligió al negocio y llevó el auto). La URL
 * conserva `/planes` y este archivo su nombre, pero acá no hay planes: las
 * tres tarjetas (`plans`) son el primer trabajo gratis, el trabajo suelto y el
 * pack de 3 trabajos.
 *
 * Lo único publicable es lo que está escrito acá: el precio por trabajo solo
 * para mecánica (en rubros de ticket más bajo es menor y se informa al
 * registrarse, sin monto público) y el pack, que se compra por WhatsApp. Nada
 * de IVA, facturación, medios de pago, períodos de prueba ni topes de pedidos;
 * tampoco el vencimiento del pack ni reglas sobre revisiones (dependen del
 * taller).
 *
 * Los precios se actualizan cada tres meses: al cambiarlos, tocar `price` Y
 * `priceArs` (alimenta el JSON-LD `OfferCatalog`), `public/llms.txt` y la
 * fecha de `app/sitemap.ts`.
 *
 * Los planes de suscripción viejos (Gratis / Plus / Plus Max) viven en
 * `partner-legacy-plans.ts`, solo para `/cuenta` y la contratación. Ninguna
 * tarjeta de acá enlaza a la contratación ni dispara `plan_checkout_started`.
 */

import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

export const providersPlansContent = {
  meta: {
    title: "Precios para proveedores",
    description:
      "Precios de AutoLibre para talleres y servicios del auto: el primer trabajo es gratis y, a partir del segundo, ARS 20.000 por trabajo nuevo en mecánica. Con el pack de 3 trabajos por ARS 50.000, cada uno sale más barato.",
  },

  breadcrumb: { label: "Migas de pan", current: "Precios" },

  hero: {
    eyebrow: "Precios para proveedores",
    titleLines: ["Pagás un precio fijo", "por trabajo confirmado"],
    subtitle:
      "Registrarte en AutoLibre es gratis y el primer trabajo que te acercamos también. A partir del segundo, pagás un precio fijo por cada trabajo nuevo confirmado: el usuario eligió tu negocio y llevó el auto.",
  },

  /** `h2` (solo para lectores de pantalla) de la grilla. */
  gridTitle: "Precios por trabajo",

  /**
   * Las tres tarjetas. `priceArs` es el precio como número (para el JSON-LD;
   * `null` = sin `Offer`), `jobs`, cuántos trabajos cubre ese precio, y
   * `offerDescription`, la descripción de esa `Offer`.
   * `cta.kind`: `register` va al registro (`partner_register_started`) y
   * `whatsapp` abre el chat con AutoLibre (`whatsapp_clicked`); `placement` es
   * el de `analytics.md`.
   */
  plans: [
    {
      id: "primer-trabajo",
      name: "Primer trabajo",
      price: "Gratis",
      priceArs: null,
      jobs: 1,
      priceNote: null,
      description: "El primer trabajo que te acercamos no se cobra.",
      offerDescription: null,
      includesLabel: "Qué tenés desde que te registrás",
      features: [
        "Registrarte es gratis",
        "Aparecés en las recomendaciones de la IA",
        "Perfil en el directorio de AutoLibre",
        "Recibís pedidos y respondés por WhatsApp",
      ],
      cta: {
        kind: "register",
        label: "Registrate gratis",
        href: PROVEEDORES_REGISTRO_PATH,
        placement: "planes_gratis",
      },
      highlighted: false,
    },
    {
      id: "trabajo-suelto",
      name: "Trabajo suelto",
      price: "ARS 20.000",
      priceArs: 20000,
      jobs: 1,
      priceNote: "por trabajo confirmado en mecánica",
      description: "A partir del segundo trabajo, pagás por cada trabajo nuevo confirmado.",
      offerDescription:
        "Precio fijo por cada trabajo nuevo confirmado en mecánica, a partir del segundo que AutoLibre le acerca al negocio (el primero es gratis). Se paga después del trabajo, en una liquidación mensual.",
      includesLabel: "Cómo funciona",
      features: [
        "Se paga después del trabajo, en una liquidación mensual",
        "En rubros de ticket más bajo, como lavaderos y gomerías, el precio es menor y te lo informamos al registrarte",
        "Es un precio fijo por trabajo, no un porcentaje de lo que cobrás",
      ],
      cta: {
        kind: "register",
        label: "Sumá tu negocio",
        href: PROVEEDORES_REGISTRO_PATH,
        placement: "planes_trabajo_suelto",
      },
      highlighted: true,
    },
    {
      id: "pack-3-trabajos",
      name: "Pack de 3 trabajos",
      price: "ARS 50.000",
      priceArs: 50000,
      jobs: 3,
      priceNote: "pago por adelantado",
      description: "Cada trabajo te sale unos ARS 16.700, menos que los ARS 20.000 del trabajo suelto.",
      offerDescription:
        "Pack prepago de tres trabajos confirmados: cada uno sale unos ARS 16.700, menos que los ARS 20.000 del trabajo suelto. Cada trabajo confirmado descuenta uno del pack. Se compra por WhatsApp.",
      includesLabel: "Cómo funciona",
      features: [
        "Tres trabajos confirmados pagados por adelantado",
        "Cada trabajo confirmado descuenta uno del pack",
        "Lo comprás por WhatsApp, desde el primer día",
      ],
      cta: {
        kind: "whatsapp",
        label: "Comprar el pack",
        whatsappMessage: "Hola, quiero comprar un pack",
        placement: "proveedores_planes_pack",
      },
      highlighted: false,
    },
  ],

  sales: {
    title: "¿Tu rubro no es mecánica o tenés dudas?",
    description:
      "En rubros de ticket más bajo, como lavaderos y gomerías, el precio por trabajo es menor. Escribinos por WhatsApp y lo vemos juntos.",
    cta: { label: "Hablar con ventas" },
    whatsappMessage: "Hola! Quiero consultar los precios para proveedores de AutoLibre.",
  },

  /** Las tres reglas que valen para todos los negocios. */
  rules: {
    title: "Lo mismo para todos los negocios",
    items: [
      {
        title: "Precio fijo, no un porcentaje",
        body: "Pagás un precio fijo por trabajo confirmado, no un porcentaje de lo que cobrás. El pago del trabajo lo arreglás con el usuario, sin pasar por AutoLibre, y a él no se le suma ese costo arriba del precio.",
      },
      {
        title: "Pagar no cambia la recomendación",
        body: "Lo que pagás no influye en la recomendación de la IA: el usuario siempre elige libremente.",
      },
      {
        title: "El cliente es tuyo",
        body: "Cobramos por trabajo que te acercamos, no por cliente. Si después vuelve directo a tu negocio, no pagás nada; si vuelve a pedir por AutoLibre, es un trabajo nuevo.",
      },
    ],
  },

  /**
   * Tabla comparativa (desde `md`; en celular las tarjetas ya lo dicen todo).
   * `true` = incluido, `false` = no incluido, string = el valor. `plans` son
   * las columnas, en el orden de las tarjetas.
   */
  compare: {
    title: "Compará las opciones",
    caption: "Precio, forma de pago y qué incluye cada opción",
    rowHeader: "Qué comparamos",
    included: "Incluido",
    notIncluded: "No incluido",
    plans: ["Primer trabajo", "Trabajo suelto", "Pack de 3 trabajos"],
    /** Columna resaltada (Trabajo suelto), como la tarjeta. */
    highlighted: 1,
    rows: [
      { label: "Precio", values: ["Gratis", "ARS 20.000 por trabajo, en mecánica", "ARS 50.000 por 3 trabajos"] },
      { label: "Precio por trabajo", values: ["Gratis", "ARS 20.000", "Unos ARS 16.700"] },
      { label: "Cuándo se paga", values: ["No se paga", "Desde el segundo trabajo, después de cada uno, en la liquidación mensual", "Por adelantado"] },
      { label: "Cómo se compra", values: ["Con registrarte alcanza", "Con registrarte alcanza", "Por WhatsApp"] },
      { label: "Aparecer en las recomendaciones de la IA", values: [true, true, true] },
      { label: "Perfil en el directorio de AutoLibre", values: [true, true, true] },
      { label: "Recibir pedidos y responder por WhatsApp", values: [true, true, true] },
    ],
  },

  faq: {
    title: "Preguntas sobre los precios",
    items: [
      {
        question: "¿Qué es un trabajo confirmado?",
        answer:
          "Es un trabajo en el que el usuario eligió tu negocio y llevó el auto. Para confirmarlo, te consultamos a vos y al usuario por WhatsApp.",
      },
      {
        question: "¿Cuándo pago?",
        answer:
          "El primer trabajo que te acercamos es gratis. A partir del segundo, cada trabajo nuevo se paga después de que el auto fue a tu negocio, en una liquidación mensual. El pack de 3 trabajos se paga por adelantado.",
      },
      {
        question: "¿Qué pasa si el cliente vuelve directo a mi taller?",
        answer:
          "No pagás nada: ese cliente es tuyo. Cobramos por trabajo que te acercamos, no por cliente. Si vuelve a pedir por AutoLibre, cuenta como un trabajo nuevo.",
      },
      {
        question: "¿El precio es igual para todos los rubros?",
        answer:
          "No. ARS 20.000 es el precio por trabajo confirmado en mecánica. En rubros de ticket más bajo, como lavaderos y gomerías, el precio es menor y te lo informamos al registrarte.",
      },
      {
        question: "¿Para qué sirve el pack y cómo lo compro?",
        answer:
          "Sirve para que cada trabajo te salga más barato. El pack de 3 trabajos cuesta ARS 50.000, unos ARS 16.700 cada uno, contra los ARS 20.000 del trabajo suelto. Lo comprás escribiéndonos por WhatsApp.",
      },
      {
        question: "¿Los precios cambian?",
        answer: "Sí. Los precios se actualizan cada tres meses.",
      },
      {
        question: "¿Tengo que registrar mi negocio antes?",
        answer:
          "Sí. Primero registrás tu negocio, que es gratis. Todo negocio registrado puede recibir pedidos y responder por WhatsApp.",
        link: { text: "registrás tu negocio", href: PROVEEDORES_REGISTRO_PATH },
      },
    ],
  },

  /** Banda oscura de cierre. */
  closing: {
    title: "¿Todavía no registraste tu negocio?",
    body: "El registro es gratis y lo hacés con tu cuenta de AutoLibre.",
    cta: { label: "Sumá tu negocio", href: PROVEEDORES_REGISTRO_PATH },
  },
} as const;
