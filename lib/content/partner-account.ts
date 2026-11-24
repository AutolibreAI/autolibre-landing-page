/**
 * Copy compartida por las pantallas privadas de talleres que piden la cuenta
 * de AutoLibre: reclamo (`/proveedores/reclamar`), alta
 * (`/proveedores/registro`), contratación
 * (`/proveedores/contratar` y su `/resultado`) y `/cuenta`.
 *
 * El login es UNO solo en todas: mismo encabezado corto en la tarjeta (el de
 * Clerk va oculto) y el contexto de cada flujo en la columna de al lado.
 */
export const partnerAccountContent = {
  signIn: {
    title: "Entrá o creá tu cuenta",
    body: "Es la misma cuenta de la app de AutoLibre.",
    loading: "Cargando el inicio de sesión…",
  },

  /**
   * Panel único "Ingresá o creá tu cuenta" (rediseño 2026-11, lienzo
   * `Ingresar`): el estado sin sesión de `/cuenta` y de los flujos privados.
   * No hay cuenta "de proveedor" aparte: la misma sirve para pedir y para
   * administrar un negocio.
   */
  ingresar: {
    title: "Ingresá o creá tu cuenta",
    body: "Es la misma cuenta de la app de AutoLibre.",
    legalPrefix: "Al continuar aceptás los",
    terms: { label: "Términos", href: "/terminos" },
    legalJoin: "y la",
    privacy: { label: "Política de privacidad", href: "/privacidad" },
    oneAccount: {
      title: "Con una sola cuenta",
      items: [
        { strong: "Seguís tus pedidos", rest: " y las propuestas que te llegan para tu auto." },
        { strong: "Administrás tu negocio", rest: ", si tenés un taller o servicio en la red." },
      ],
    },
    joinPrefix: "¿Tenés un taller o un servicio?",
    join: "Sumá tu negocio",
  },

  /** Encabezado de foco de los flujos privados (contratar, resultado, reclamar). */
  flowHeader: {
    home: "AutoLibre, ir al inicio",
    help: "¿Dudas? Escribinos",
    /** En celular no entra el texto largo. */
    helpShort: "Ayuda",
    signOut: "Salir",
    signingOut: "Saliendo…",
  },

  /** Próximos pasos: lleva a "Mi negocio" (`/cuenta`), supuesto de DECISIONES. */
  myBusiness: "Ir a mi negocio",
  nextSteps: "Próximos pasos",

  /** Volver a entrar después de un 401. */
  reauth: "Iniciar sesión de nuevo",

  /**
   * Lo que lee un lector de pantalla junto a cada paso de un indicador de
   * progreso (`FlowSteps`): el estado no puede depender solo del color.
   */
  stepStatus: {
    done: "completado",
    current: "paso actual",
    upcoming: "pendiente",
  },
} as const;
