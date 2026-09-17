/**
 * Contenido de `/descarga`, la página que se manda por link.
 *
 * Es una sola pantalla y una sola acción: bajar la app. No hay secciones, no
 * hay scroll, no hay nada que compita con los dos botones. Quien llega acá ya
 * decidió mirar; lo único que falta es que pueda instalarla sin buscar.
 *
 * Los links a las tiendas NO viven acá: salen de `siteConfig.stores` a través
 * de `siteContent.stores`, que es la única fuente de verdad. Ver el comentario
 * en `lib/seo/config.ts`.
 */

export const descargaContent = {
  meta: {
    title: "Descargá la app",
    description:
      "Documentación, vencimientos, historial, diagnóstico con IA y talleres cerca tuyo, en una sola app. Gratis para iPhone y Android.",
  },

  /** Se parte en dos líneas a propósito, igual que el h1 del home. */
  titleLines: ["Todo tu auto,", "en un solo lugar."],
  subtitle:
    "Documentación, vencimientos, historial, diagnóstico con IA y talleres cerca tuyo. Todo en una sola app.",
  downloadNote: "Gratis, para iPhone y Android.",

  /**
   * El puente de la compu al bolsillo, y la razón de que esta página exista
   * como página y no como un ancla: el link se comparte por WhatsApp y una
   * parte se abre en el escritorio, donde un botón de App Store no instala
   * nada.
   *
   * El QR apunta a esta misma página, no a una tienda: un solo código no puede
   * servir a iOS y a Android a la vez. Se muestra sólo desde `lg`, que es
   * donde tiene sentido — en un teléfono los botones ya resuelven. No hay
   * detección de sistema operativo: no hace falta y no falla.
   *
   * La dirección va escrita debajo del código a propósito: si la cámara no
   * coopera, la persona todavía tiene cómo llegar.
   */
  qr: {
    title: "¿Estás en la compu?",
    body: "Escaneá con la cámara del teléfono y bajala desde ahí.",
    url: "autolibre.ai/descarga",
    alt: "Código QR que abre autolibre.ai/descarga en el teléfono",
  },

  logoAlt: "AutoLibre",
  homeLinkLabel: "AutoLibre — volver al inicio",

  /**
   * Lo mínimo legal, en una línea. No es el footer del sitio: acá cualquier
   * salida que no sea una tienda es una fuga, pero alguien que está por
   * instalarse una app tiene derecho a encontrar los términos y la privacidad.
   */
  legalLinks: [
    { label: "Términos", href: "/terminos" },
    { label: "Privacidad", href: "/privacidad" },
    { label: "Soporte", href: "/support" },
  ],
} as const;
