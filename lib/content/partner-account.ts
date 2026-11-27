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
    loading: "Cargando el inicio de sesión…",
  },

  /**
   * `/ingresar` (2026-11-26): el login dedicado, a pantalla completa, al que
   * mandan `/cuenta` y los flujos privados sin sesión. No hay cuenta "de
   * proveedor" aparte: la misma sirve para pedir y para administrar un
   * negocio. La bajada cambia según adónde vuelve (`lib/content/sign-in.ts`).
   */
  ingresar: {
    meta: {
      title: "Ingresá a tu cuenta",
      description:
        "Ingresá o creá tu cuenta de AutoLibre para seguir los pedidos de tu auto o administrar tu negocio en la red.",
    },
    /**
     * Panel de marca, al costado del formulario (arriba en celular).
     *
     * El titular NO vive acá: es el eslogan del sitio ("Todo tu auto, en un
     * solo lugar.") y `SignInScreen` lo arma con las partes de
     * `homeContent.hero.title` (`lib/content/home.ts`), las mismas del `<h1>`
     * del Home, para que las dos pantallas no se desincronicen.
     */
    brand: {
      home: "AutoLibre, ir al inicio",
      logoAlt: "AutoLibre.AI",
      body: "AutoLibre junta la documentación, los vencimientos y el historial de tu auto, y te conecta con talleres y servicios de tu zona.",
      /** Al lado del teléfono, solo desde `lg`. */
      note: "Gratis en App Store y Google Play.",
      /** Captura real de la app, sin marco: el bisel lo pone `PhoneFrame`. */
      appShot: {
        src: "/screenshots/app-inicio.webp",
        width: 1170,
        height: 2532,
        alt: "La app de AutoLibre: inicio con los servicios para tu auto y los beneficios de la red.",
      },
    },
    title: "Ingresá o creá tu cuenta",
    legalPrefix: "Al continuar aceptás los",
    terms: { label: "Términos", href: "/terminos" },
    legalJoin: "y la",
    privacy: { label: "Política de privacidad", href: "/privacidad" },
    joinPrefix: "¿Tenés un taller o un servicio?",
    join: "Sumá tu negocio",
    /** La sesión venció con una pantalla privada abierta: se va a `/ingresar`. */
    redirecting: "Llevándote al inicio de sesión…",
  },

  /** Pantallas privadas mientras Clerk confirma la sesión (el proxy ya dejó pasar). */
  sessionLoading: "Cargando tu cuenta…",

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
