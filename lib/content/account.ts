import { ACCOUNT_PATH } from "@/lib/account/paths";
import {
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_RECLAMAR_PATH,
  PROVEEDORES_REGISTRO_OTRO_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

/**
 * Copy de la cuenta de talleres: la fila "Sesión iniciada como…" de las
 * pantallas privadas (`AccountBar`) y la página `/cuenta` ("Mi cuenta").
 * Pantallas privadas (`noindex`): no hay contenido citable.
 */
export const accountContent = {
  /** Fila de sesión de las pantallas privadas y de `/cuenta`. */
  bar: {
    label: "Tu sesión",
    signedInAs: "Sesión iniciada como",
    /** Sin email ni nombre en la cuenta (raro, pero posible). */
    fallbackName: "tu cuenta de AutoLibre",
    switchAccount: "Usar otra cuenta",
    signOut: "Cerrar sesión",
    signingOut: "Cerrando sesión…",
  },

  /**
   * `/cuenta?salir=1` con sesión (el "Cerrar sesión" del menú del header):
   * se confirma con un botón, nunca se cierra solo por abrir el link.
   */
  signOutConfirm: {
    title: "¿Cerrar sesión?",
    body: "Vas a salir de tu cuenta de AutoLibre en este navegador.",
    confirm: "Sí, cerrar sesión",
    leaving: "Cerrando sesión…",
    cancel: "No, seguir en mi cuenta",
  },

  /**
   * "Mi negocio" con sesión (fase 6 del rediseño): barra del negocio,
   * secciones y estados. Lo que no tiene endpoint está diseñado pero apagado
   * (`lib/account/features.ts`); su copy vive igual acá.
   */
  business: {
    loadingTitle: "Mi negocio",
    loading: "Buscando tu negocio…",
    /** Lo que lee el lector de pantalla mientras se cargan el perfil o el plan (los esqueletos son decorativos). */
    loadingProfile: "Cargando el perfil de tu negocio…",
    loadingPlan: "Consultando el plan…",
    visibility: {
      published: "Publicado",
      hidden: "No visible en la red",
      review: "En revisión",
    },
    switcher: {
      trigger: "Cambiar de negocio",
      /** Rótulo visible en celular (el nombre accesible sigue siendo `trigger`). */
      triggerShort: "Cambiar",
      /** Nombre del landmark de la lista de negocios. */
      label: "Tus negocios",
      current: "Estás viendo este",
    },
    publicPage: "Ver mi página web",
    nav: {
      label: "Secciones de tu negocio",
      items: { resumen: "Resumen", pedidos: "Pedidos", perfil: "Perfil", plan: "Plan" },
      /** Lo que lee el lector de pantalla junto al contador de la pestaña Pedidos. */
      badge: (count: number) => (count === 1 ? "1 por responder" : `${count} por responder`),
    },
    sessionTitle: "Tu sesión",
    /** Aviso `sr-only` de los links que abren otra pestaña (WhatsApp). */
    externalHint: "(se abre en otra pestaña)",

    summary: {
      /** `h2` solo para lectores de pantalla: el Resumen no tiene título visible. */
      title: (partnerName: string) => `Resumen de ${partnerName}`,
      stagesLabel: "Tus pedidos de un vistazo",
      stages: {
        toAnswer: { label: "Por responder", sub: (dueToday: number) => (dueToday > 0 ? `${dueToday} vence hoy` : "Al día") },
        proposals: { label: "Propuestas enviadas", sub: "Esperando al cliente" },
        chosen: { label: "Te eligieron", sub: "En los últimos 30 días" },
        planOrders: { label: "Pedidos de tu plan", of: (limit: number) => `de ${limit}`, sub: "Este mes" },
      },
      latest: { title: "Últimos pedidos", all: "Ver todos" },
      help: {
        title: "¿Necesitás una mano?",
        cta: "Escribinos por WhatsApp",
        message: (partnerName: string) => `¡Hola! Tengo una consulta sobre mi negocio ${partnerName} en AutoLibre.`,
      },
      profileError: "No pudimos leer el perfil de tu negocio. Probá de nuevo en un rato.",
    },

    /** "Completá tu perfil": sale de los campos vacíos de `GET /partners/{id}`. */
    checklist: {
      title: "Completá tu perfil",
      progress: (done: number, total: number) => `${done} de ${total}`,
      progressLabel: (done: number, total: number) => `Perfil completo: ${done} de ${total} datos`,
      body: "Un perfil completo le da más información a quien te está por elegir.",
      preview: "Ver cómo te ven en la app",
      complete: "Tu perfil tiene todos los datos. Si querés cambiar algo, escribinos.",
      /**
       * No hay edición desde la web: cada dato que falta se manda por WhatsApp
       * al equipo, que lo carga. El botón lo dice ("por WhatsApp").
       */
      items: {
        logo: { title: "Subí el logo de tu negocio", hint: "PNG, JPG o WebP. Mandalo por WhatsApp y lo cargamos." },
        hours: { title: "Cargá tus horarios de atención", hint: "Ej: Lun a Vie 9 a 18 h, Sáb 9 a 13 h" },
        description: { title: "Escribí una descripción", hint: "Unas líneas para presentar tu negocio." },
        services: { title: "Contanos qué servicios hacés", hint: "Así te llegan los pedidos que te sirven." },
        address: { title: "Cargá la dirección", hint: "Calle, número y localidad." },
        whatsapp: { title: "Sumá un WhatsApp de contacto", hint: "Para que los clientes te escriban." },
        links: { title: "Sumá tus redes o tu web", hint: "Instagram, Facebook, tu sitio…" },
        name: { title: "Cargá el nombre del negocio", hint: "Como te conocen tus clientes." },
      },
      cta: "Mandar por WhatsApp",
      /** Rótulo visible en celular (el nombre accesible es `ctaLabel`). */
      ctaShort: "Mandar",
      ctaLabel: (item: string) => `${item}: mandar por WhatsApp`,
      message: (partnerName: string, item: string) =>
        `¡Hola! Quiero completar el perfil de ${partnerName} en AutoLibre: ${item.toLocaleLowerCase("es-AR")}.`,
    },

    empty: {
      title: "Todavía no te llegó ningún pedido",
      body: "Cuando alguien de tu zona pida un servicio que hacés, te escribimos por WhatsApp con los datos del auto y lo que necesita. Acá vas a ver el historial.",
      steps: [
        { title: "1. Te llega el pedido", body: "Por WhatsApp, con el servicio y el auto." },
        { title: "2. Mandás tu propuesta", body: "Con precio y tiempos." },
        { title: "3. El cliente elige", body: "Y te escribe para coordinar." },
      ],
      cta: "Completá tu perfil",
    },

    referral: {
      title: "Tu código para clientes",
      body: "Pasáselo a tus clientes para que te guarden como su taller en la app.",
      copy: "Copiar",
      copied: "Copiado",
      saved: (count: number) => (count === 1 ? "1 cliente ya te guardó." : `${count} clientes ya te guardaron.`),
    },

    orders: {
      title: "Pedidos recibidos",
      body: "Te avisamos cada pedido por WhatsApp. Acá queda el historial: qué te pidieron, qué propusiste y cómo terminó.",
      usage: (used: number, limit: number) => `Este mes usaste ${used} de ${limit} pedidos de tu plan`,
      filtersLabel: "Filtrar pedidos por estado",
      filters: {
        todos: "Todos",
        responder: "Por responder",
        propuesta: "Con propuesta",
        elegido: "Te eligieron",
        cerrado: "Cerrados",
      },
      filterCount: (label: string, count: number) => `${label} (${count})`,
      noneInFilter: "No hay pedidos en este estado.",
      number: (value: number) => `Pedido #${value}`,
      status: {
        responder: { label: "Por responder", action: "Responder por WhatsApp" },
        detalle: { label: "Esperando tu propuesta", action: "Enviar propuesta" },
        propuesta: { label: "Propuesta enviada", action: "Ver propuesta" },
        elegido: { label: "Te eligieron", action: "Escribirle al cliente" },
        cerrado: { label: "Cerrado", action: "Ver detalle" },
      },
    },

    profile: {
      title: "Perfil del negocio",
      body: "Lo que ve la gente en el directorio y en la app.",
      missing: "Falta",
      allBrands: "Todas las marcas",
      notVisible:
        "Tu negocio no está visible en la red ahora mismo, así que no podemos mostrarte sus datos. Escribinos por WhatsApp y lo revisamos.",
      /** Sin edición desde la web: cada fila pide el cambio por WhatsApp. */
      edit: "Pedir cambio",
      add: "Agregar",
      editLabel: (field: string) => `Pedir un cambio en ${field.toLocaleLowerCase("es-AR")} por WhatsApp`,
      addLabel: (field: string) => `Agregar ${field.toLocaleLowerCase("es-AR")} por WhatsApp`,
      changeMessage: (partnerName: string, field: string) =>
        `¡Hola! Quiero actualizar ${field.toLocaleLowerCase("es-AR")} de ${partnerName} en AutoLibre.`,
      fields: {
        name: "Nombre",
        logo: "Logo",
        description: "Descripción",
        services: "Servicios",
        brands: "Marcas",
        modality: "Cómo atendés",
        address: "Dirección",
        hours: "Horarios",
        whatsapp: "WhatsApp",
        links: "Redes",
      },
      logoLoaded: "Cargado",
      note: "La descripción y las redes se ven en tu página web de AutoLibre, no en la app. Los cambios los carga el equipo: escribinos por WhatsApp con lo que querés cambiar.",
      linkKinds: {
        instagram: "Instagram",
        website: "Sitio web",
        facebook: "Facebook",
        mercado_libre: "Mercado Libre",
        x: "X",
        tiktok: "TikTok",
        linkedin: "LinkedIn",
        youtube: "YouTube",
        other: "Otro link",
      } as Record<string, string>,
    },

    /** Vista previa "Así te ven en la app": réplica de la ficha de la app de hoy. */
    preview: {
      title: "Así te ven en la app",
      show: "Ver cómo te ven en la app",
      hide: "Ocultar la vista previa",
      /** Lo que la app dice HOY (`taller-action-bar.tsx`). Debería pasar a "Pedir propuestas". */
      requestQuote: "Pedir presupuesto",
      chat: (partnerName: string) => `Escribirle a ${partnerName} por WhatsApp`,
      whatTheyDo: "Qué hacen",
      reviews: "Lo que dicen otros conductores",
      noReviews: "Todavía no tiene reseñas",
      where: "Dónde está",
      ratingLabel: (count: number) => (count === 1 ? "1 opinión" : `${count} opiniones`),
      servicesCount: (count: number) => (count === 1 ? "1 servicio" : `${count} servicios`),
      note: (hasLogo: boolean) =>
        hasLogo
          ? "Es la ficha de tu negocio en la app, con tus datos de hoy. La distancia aparece según dónde esté cada persona."
          : "Sin logo, la app muestra tus iniciales. La distancia aparece según dónde esté cada persona.",
      /** Nombre accesible del marco: el contenido es una imagen de la ficha, no una página navegable. */
      frameLabel: (partnerName: string) => `Vista previa de la ficha de ${partnerName} en la app`,
    },

    plan: {
      title: "Plan",
      /**
       * Negocio SIN suscripción (2026-11-26): ya no se venden planes desde la
       * cuenta. Se muestra el precio por trabajo y el pack, que se compra por
       * WhatsApp. Los montos llegan de `providers-plans.ts` por parámetro.
       */
      jobs: {
        title: "Precio por trabajo",
        firstFree: "El primer trabajo que te acercamos es gratis",
        fromSecond: (price: string) => `Desde el segundo, ${price} por trabajo nuevo en mecánica`,
        summary: (price: string) =>
          `El primer trabajo que te acercamos es gratis. Desde el segundo, ${price} por trabajo nuevo en mecánica.`,
      },
      pack: {
        title: "Con el pack, cada trabajo te sale más barato",
        summary: (packPrice: string, jobPrice: string) =>
          `Con el pack de 3 trabajos por ${packPrice}, cada trabajo te sale más barato que los ${jobPrice} del trabajo suelto.`,
        note: "Pagar no cambia la recomendación de la IA.",
      },
      seePrices: "Ver los precios",
      named: (planName: string) => `Plan ${planName}`,
      unnamed: "Plan pago",
      perMonth: (vat: boolean) => (vat ? "por mes, IVA incluido" : "por mes + IVA"),
      status: {
        trial: (date: string | null) => (date ? `En prueba hasta el ${date}` : "En período de prueba"),
        active: "Activo",
        canceling: (date: string | null) => (date ? `Baja pedida: activo hasta el ${date}` : "Baja pedida"),
        pending: (planName: string) => `${planName}: pago pendiente de confirmación`,
        other: "Sin confirmar",
      },
      limit: (limit: number) => `Hasta ${limit} pedidos por WhatsApp por mes.`,
      seePlan: "Ver mi plan",
      usage: {
        title: "Uso de este mes",
        paidLabel: "Pedidos por WhatsApp este mes",
        freeLabel: "Propuestas por WhatsApp este mes",
        of: (used: number, limit: number) => `${used} de ${limit}`,
        aria: (used: number, limit: number) => `${used} de ${limit} usados`,
      },
      payment: {
        title: "Pago",
        method: "Medio",
        methodValue: "Mercado Pago",
        firstCharge: "Primer cobro",
        periodEnd: "Período actual hasta",
        accessUntil: "Activo hasta",
      },
      cancel: {
        title: "Cancelar suscripción",
        body: (planLabel: string) =>
          `Tu taller mantiene el ${planLabel} hasta el final del período en curso. Después pasa al plan Gratis y no se te vuelve a cobrar.`,
      },
      pendingBanner: {
        title: (planName: string) => `Estamos esperando que Mercado Pago confirme el pago del plan ${planName}`,
        body: "Si ya pagaste, no vuelvas a pagar: la confirmación puede demorar unos minutos. Mientras tanto tu taller sigue con el plan Gratis.",
        cta: "Ver el estado del pago",
      },
    },

    review: {
      title: "Estamos revisando tu negocio",
      body: "El equipo revisa los datos y te contacta por WhatsApp para activar tu perfil. Por ahora no tenés que hacer nada más.",
      now: "Ahora",
      steps: {
        sent: { title: "Solicitud enviada", body: (date: string) => `Recibimos los datos de tu taller el ${date}.` },
        review: { title: "En revisión", body: "El equipo revisa los datos y te contacta por WhatsApp para activar tu perfil." },
        published: {
          title: "Taller publicado",
          body: "Tu taller aparece en la red y lo administrás desde acá.",
        },
      },
      dataTitle: "Los datos que nos mandaste",
      fix: "¿Algo está mal?",
      fixCta: "Avisanos por WhatsApp",
      fixTail: "y lo corregimos antes de publicarlo.",
      fixMessage: "¡Hola! Mandé el alta de mi negocio a AutoLibre y quiero corregir un dato.",
      meanwhile: {
        title: "Mientras tanto",
        body: "Registrarte es gratis y el primer trabajo que te acercamos también. A partir del segundo, pagás un precio fijo por cada trabajo nuevo confirmado.",
        cta: "Ver los precios",
      },
    },
  },

  /** Link secundario desde los éxitos y avisos de los flujos. */
  link: { label: "Ir a mi cuenta", href: ACCOUNT_PATH },

  page: {
    meta: {
      title: "Mi cuenta",
      description: "Tu cuenta de AutoLibre: pedí propuestas para tu auto o administrá tu negocio, su perfil y el estado de tu plan.",
    },
    eyebrow: "Talleres",
    title: "Mi cuenta",
    intro: "Tus talleres en AutoLibre y el estado de sus planes.",
    signInIntro: "Entrá para pedir propuestas para tu auto o administrar tu negocio.",

    partners: {
      title: "Tus talleres",
      loading: "Buscando tus talleres…",
      error: "No pudimos cargar tus talleres. Probá de nuevo en un rato.",
      unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para ver tus talleres.",
      retry: "Reintentar",
    },

    /** Estado del plan de cada taller (de `GET /partners/{id}/subscription`). */
    plan: {
      loading: "Consultando el plan…",
      error: "No pudimos consultar el plan de este taller.",
      free: "Plan Gratis",
      named: (planName: string) => `Plan ${planName}`,
      unnamed: "Plan pago",
      status: {
        active: "Activo",
        trialing: (date: string | null) => (date ? `En prueba hasta el ${date}` : "En período de prueba"),
        pending: "Pago pendiente de confirmación",
        canceled: (date: string | null) => (date ? `Baja pedida: activo hasta el ${date}` : "Baja pedida"),
        other: "Sin confirmar",
      },
    },

    actions: {
      allPlans: { label: "Ver los precios", href: PROVEEDORES_PLANES_PATH },
      /** `pending`: la pantalla de resultado consulta el estado y ofrece reintentar. */
      pending: "Ver el estado del pago",
      /**
       * Plan activo: contacto genérico con ventas. Hasta el 2026-11-26 era
       * "Cambiar de plan con ventas"; ya no se venden planes a los que cambiar.
       */
      changePlan: "Hablar con ventas",
      changePlanWhatsapp: (partnerName: string, planName: string | null) =>
        planName
          ? `Hola! Mi taller ${partnerName} tiene el plan ${planName} de AutoLibre y tengo una consulta.`
          : `Hola! Mi taller ${partnerName} tiene un plan de AutoLibre y tengo una consulta.`,
    },

    /**
     * Baja de un plan pago (`POST /partners/{id}/subscription/cancellation`).
     * Se confirma en la misma fila, sin `window.confirm`.
     */
    cancel: {
      trigger: "Cancelar suscripción",
      title: (partnerName: string) => `¿Cancelar la suscripción de ${partnerName}?`,
      /** `date`: fin de la prueba si está en prueba; si no, fin del período pago. */
      keepsPlan: (planLabel: string, date: string | null) =>
        date
          ? `Tu taller mantiene el ${planLabel} hasta el ${date}. Después pasa al plan Gratis y no se te vuelve a cobrar.`
          : `Tu taller mantiene el ${planLabel} hasta el final del período en curso. Después pasa al plan Gratis y no se te vuelve a cobrar.`,
      trialUsed: "Si cancelás durante la prueba, la prueba cuenta como usada: si más adelante volvés a contratar, el plan se cobra desde el primer mes.",
      mercadoPagoWarning:
        "Cancelá desde acá y no desde tu cuenta de Mercado Pago: si la cancelás allá, tu taller pierde el plan en el momento, aunque ya hayas pagado el mes.",
      confirm: "Sí, cancelar la suscripción",
      confirming: "Cancelando…",
      keep: "No, mantener el plan",
      success: (date: string | null) =>
        date
          ? `Listo, cancelamos la suscripción. Tu taller mantiene el plan hasta el ${date} y después pasa a Gratis.`
          : "Listo, cancelamos la suscripción. Tu taller mantiene el plan hasta el final del período y después pasa a Gratis.",
      /** `accessUntil: null`: solo había un pago sin confirmar, y se canceló. */
      successPending: "Listo, la contratación pendiente quedó cancelada. Tu taller sigue en el plan Gratis.",
      errors: {
        retryable: "No pudimos cancelar la suscripción y no se cambió nada. Probá de nuevo en un momento.",
        notFound:
          "No pudimos cancelar la suscripción de este taller. Actualizá la página para ver el estado actual de su plan.",
        unauthenticated: "Tu sesión venció. Iniciá sesión de nuevo para cancelar la suscripción.",
      },
      retry: "Reintentar",
      /** Con la sesión vencida: cierra la sesión y vuelve al login de `/cuenta`. */
      reauth: "Volver a iniciar sesión",
    },
  },

  /**
   * Cuenta de cliente en `/cuenta` (sin taller y con intent `customer`, o
   * cuenta vieja sin intent). Opción conservadora, sin diseño propio: los
   * pedidos web NO quedan asociados a la cuenta, así que no se promete
   * verlos ni en la web ni en la app.
   */
  customer: {
    greeting: (firstName: string | null) => (firstName ? `Hola, ${firstName}` : "Hola"),
    intro: "Desde acá pedís propuestas de talleres y servicios para tu auto.",
    order: {
      title: "¿Qué necesita tu auto?",
      body: "Contanos qué le pasa y te llegan propuestas de talleres de la red.",
      cta: "Hacé tu pedido",
      href: "/pedido",
    },
    app: {
      title: "Tus pedidos los seguís en la app",
      body: "Bajate la app de AutoLibre e ingresá con esta misma cuenta.",
    },
    help: {
      title: "¿Necesitás una mano?",
      cta: "Escribinos por WhatsApp",
      message: "Hola! Tengo una cuenta en AutoLibre y necesito ayuda.",
    },
    join: {
      prefix: "¿Tenés un taller?",
      label: "Sumá tu negocio",
      href: PROVEEDORES_REGISTRO_PATH,
    },
  },

  /**
   * `/cuenta` de una cuenta registrada como proveedor (`signupIntent =
   * "partner"`) que todavía no administra ningún negocio.
   */
  onboarding: {
    title: "Sumá tu negocio a AutoLibre",
    intro: "Tu cuenta ya está lista. Falta el último paso: cargar tu negocio, o reclamarlo si ya aparece en la red.",
  },

  /**
   * Cuenta recién creada desde "Ingresar" (Google o un email nuevo), sin
   * elección: se pregunta una vez, en los primeros 30 minutos.
   */
  newAccount: {
    title: "Te damos la bienvenida a AutoLibre",
    intro: "Antes de seguir, contanos cómo vas a usar tu cuenta.",
    save: "Guardar",
  },

  /**
   * Sumar otro taller a la cuenta. `/cuenta` y `/proveedores/reclamar` son las
   * únicas pantallas que pueden nombrar el código de reclamo (ambas
   * `noindex`): este copy no se reutiliza en páginas públicas.
   */
  more: {
    title: "¿Tenés otro taller?",
    body: "Sumalo a tu cuenta para manejarlo desde acá.",
    register: {
      label: "Cargar otro taller",
      description: "Si todavía no aparece en AutoLibre.",
      // Directo al formulario (`?alta=1&otro=1`), no a la landing ni a la
      // vista "Tu negocio ya está en AutoLibre".
      href: PROVEEDORES_REGISTRO_OTRO_PATH,
    },
    claim: {
      label: "Reclamar un taller",
      description: "Si ya aparece en AutoLibre y te dimos un código de reclamo.",
      href: PROVEEDORES_RECLAMAR_PATH,
    },
  },
} as const;
