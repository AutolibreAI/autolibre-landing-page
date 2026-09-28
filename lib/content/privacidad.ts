/**
 * Copy de `/privacidad` sobre la analítica con PostHog. Tiene que describir
 * EXACTAMENTE lo que hace el código y la config del proyecto de PostHog:
 * si cambia `lib/analytics/posthog.ts`, el catálogo de
 * `lib/analytics/events.ts` o lo que el proyecto tiene prendido de forma
 * remota (grabación de sesiones, heatmaps, dead clicks, logs de consola, web
 * vitals, errores), se actualiza esto también. Nada de claims que no podamos
 * sostener.
 */
export const privacidadContent = {
  /** Entrada de PostHog en la lista de terceros (punto 6). */
  thirdParty: {
    name: "PostHog.",
    body: "Mide cómo se usa este sitio (analítica de producto). Recibe datos técnicos de tu visita, las acciones que registramos y grabaciones de tu navegación con lo que escribís en los formularios enmascarado, según se detalla en el punto 8.",
  },
  posthog: {
    title: "8. Analítica del sitio con PostHog",
    paragraphs: [
      "Este sitio usa PostHog (PostHog, Inc.) para analítica de producto: entender cómo se usa el sitio para mejorarlo. Los datos se guardan en servidores de PostHog en Estados Unidos.",
      "Registramos las páginas que visitás y cuándo salís de ellas, la página desde la que llegaste y los parámetros de campaña del enlace (por ejemplo, de un anuncio), el clic en los botones de WhatsApp y de descarga de la app, el inicio de un pedido de presupuesto, los pasos del formulario que ves, si el envío falla y el envío del pedido.",
      "También grabamos cómo navegás el sitio (grabación de sesión): la página que ves, los movimientos del mouse, los clics, los toques y el scroll. En esas grabaciones lo que escribís en los campos de los formularios queda enmascarado y no se guarda, y ocultamos las sugerencias de direcciones y el resumen del pedido que repiten esos datos. Además registramos dónde se hace clic y hasta dónde se scrollea en cada página (mapas de calor), los clics que no producen ninguna respuesta, los tiempos de carga de la página, los mensajes de la consola del navegador y los errores técnicos.",
      "Para eso se usan datos técnicos: tu dirección IP (de la que se deduce una ubicación aproximada), el tipo de navegador, dispositivo y sistema operativo, y un identificador al azar que se guarda en una cookie y en el almacenamiento local de tu navegador. Ese identificador no incluye tu nombre ni tus datos de contacto.",
      "Cuando enviás un pedido de presupuesto registramos que se envió, si incluía patente y, si validaste tu auto, su marca, modelo y año. Tu WhatsApp, tu correo electrónico, tu zona, tu patente y la descripción que cargás no se envían a PostHog.",
      "No vendemos estos datos. Si no querés que se haga esta medición, podés bloquear o borrar las cookies y el almacenamiento local de este sitio desde la configuración de tu navegador.",
    ],
    policy: {
      lead: "PostHog trata estos datos según su propia ",
      label: "Política de privacidad",
      href: "https://posthog.com/privacy",
      tail: ", lo que implica una transferencia internacional de datos.",
    },
  },
} as const;
