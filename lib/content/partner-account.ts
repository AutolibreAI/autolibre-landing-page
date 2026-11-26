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
      /** Captura real de la app (sin marco: el bisel lo pone el componente). Solo desde `xl`. */
      appShot: {
        src: "/screenshots/app-inicio.webp",
        width: 1170,
        height: 2532,
        alt: "La app de AutoLibre: inicio con los servicios para tu auto y los beneficios de la red.",
      },
    },
    joinPrefix: "¿Tenés un taller o un servicio?",
    join: "Sumá tu negocio",
  },

  /**
   * "Ingresar" / "Crear cuenta" del panel de `/cuenta` (registro: cliente o
   * taller, decisión del 2026-11-24). Solo en `/cuenta`: los flujos de
   * proveedor (alta, reclamo, contratar) no preguntan, la cuenta es de
   * proveedor.
   */
  entry: {
    label: "¿Ya tenés cuenta?",
    signIn: "Ingresar",
    signUp: "Crear cuenta",
  },

  /**
   * Elección antes del `<SignUp>` de Clerk (y, en una cuenta recién creada
   * desde "Ingresar", después). La elección define el tipo de cuenta
   * (`publicMetadata.signupIntent` → `users.role` en el backend) y no se
   * cambia después: el texto tiene que pedir que se elija bien, nunca decir
   * que da lo mismo.
   */
  intentChoice: {
    legend: "¿Cómo vas a usar AutoLibre?",
    hint: "Elegí la opción que te corresponde: así armamos tu cuenta como cliente o como negocio.",
    options: {
      customer: {
        title: "Soy cliente",
        body: "Quiero pedir propuestas para mi auto.",
      },
      partner: {
        title: "Tengo un taller o negocio",
        body: "Quiero recibir pedidos de clientes.",
      },
    },
    required: "Elegí una de las dos opciones para seguir.",
    continue: "Continuar",
    /** Arriba del `<SignUp>`: qué eligió y cómo cambiarlo. */
    chosen: {
      customer: "Creando tu cuenta de cliente",
      partner: "Creando tu cuenta para tu negocio",
    },
    change: "Cambiar",
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
