/**
 * Copy y opciones de la página de proveedores.
 *
 * IMPORTANTE: las listas de abajo son los valores exactos que se envían a
 * `/api/provider` y quedan guardados en `partner_applications`. Cambiar un
 * string acá cambia el dato persistido — no tocar sin mirar qué hay cargado.
 *
 * Los servicios son la excepción y ya no viven acá: los define el catálogo del
 * backend. Ver el comentario más abajo, donde estaban.
 */
export const providersContent = {
  meta: {
    title: "Sumá tu taller a AutoLibre",
    description:
      "Recibí consultas con la información del vehículo y el servicio solicitado. Registrá tu taller o servicio en AutoLibre y armá tu perfil en la app.",
  },
  /**
   * `/proveedores/registro` sin el flujo abierto: la landing "Sumá tu negocio"
   * (rediseño 2026-11, lienzo `Sumate`). Pública e indexable, Server
   * Component y SIN Clerk: el flujo (cuenta → datos del negocio) se monta
   * recién con `?alta=1`. Página pública: el código de reclamo no se explica
   * acá; solo se enlaza la pantalla del canje.
   */
  sumate: {
    breadcrumb: "Sumá tu negocio",
    breadcrumbLabel: "Migas de pan",
    hero: {
      eyebrow: "Para talleres y servicios del auto",
      title: "Sumá tu taller o servicio a AutoLibre",
      lead: "Recibí consultas con la información del vehículo y el servicio que te piden. El registro es gratis.",
      checks: [
        "Aparecés en el directorio y en las recomendaciones de la IA",
        "No cobramos comisión por trabajo",
        "Usás la misma cuenta de la app de AutoLibre",
      ],
      primary: "Registrar mi negocio",
      secondary: "Ver los planes",
      /**
       * Vista previa con MARCADORES, no un negocio inventado: así se ve tu
       * perfil y así llega un pedido.
       */
      preview: {
        monogram: "TN",
        name: "[Tu negocio]",
        meta: "[Zona] · [Cómo atendés]",
        category: "[Rubro]",
        requestLabel: "Nuevo pedido",
        requestTitle: "[Servicio que piden]",
        requestMeta: "[Marca, modelo y año] · [Zona]",
        requestCta: "Responder con una propuesta",
        caption: "Ejemplo ilustrativo de tu perfil y de un pedido.",
      },
    },
    /** "¿Ya aparecés?": buscar en el directorio antes de registrarse dos veces. */
    listed: {
      title: "¿Tu negocio ya aparece en AutoLibre?",
      body: "Ya hay más de 150 negocios en la red. Si el tuyo está, no lo registres de nuevo: buscalo y pedí administrarlo.",
      searchLabel: "Nombre de tu negocio",
      searchPlaceholder: "Nombre de tu negocio",
      searchSubmit: "Buscar",
      whatsappCta: "Escribinos para administrarlo",
      whatsappMessage: "Hola! Mi negocio ya aparece en AutoLibre y quiero administrarlo.",
      claimPrefix: "¿Ya te mandamos un código?",
      claimCta: "Canjealo acá",
    },
    benefits: {
      title: "Qué tenés al sumarte",
      items: [
        {
          icon: "chat" as const,
          title: "Pedidos con contexto",
          body: "Cada consulta llega con la información del vehículo y el servicio solicitado.",
        },
        {
          icon: "document" as const,
          title: "Tu perfil en la red",
          body: "Un perfil propio en el directorio, con tus servicios, zona, horarios y contacto.",
        },
        {
          icon: "shield-check" as const,
          title: "Sin comisión",
          body: "Registrarte es gratis y no cobramos comisión por los trabajos que hacés.",
        },
        {
          icon: "chart" as const,
          title: "Métricas de tu perfil",
          body: "Ves cuántos clics recibe tu perfil desde AutoLibre.",
        },
      ],
    },
    steps: {
      title: "Cómo es el registro",
      items: [
        { title: "Entrá o creá tu cuenta", body: "La misma de la app de AutoLibre." },
        { title: "Completá los datos de tu negocio", body: "Servicios, marcas que atendés, dirección y horarios." },
        { title: "Lo revisamos y lo publicamos", body: "Te contactamos por WhatsApp para activar tu perfil." },
      ],
      cta: "Registrar mi negocio",
      timelineTitle: "Después de enviar, seguís el estado desde tu cuenta",
    },
    plans: {
      title: "Empezás gratis. Si querés más pedidos, hay planes.",
      lead: "Precio fijo mensual. El plan no influye en la recomendación de la IA.",
      cta: "Comparar los planes",
    },
    faq: {
      title: "Antes de registrarte",
      helpPrefix: "¿Otra duda?",
      helpCta: "Escribinos por WhatsApp",
      whatsappMessage: "Hola! Quiero sumar mi negocio a AutoLibre y tengo una consulta.",
      items: [
        {
          question: "¿Cuánto cuesta registrarme?",
          answer:
            "Nada. El registro de talleres y servicios en AutoLibre es gratis. Los planes pagos son opcionales y suman pedidos por WhatsApp.",
        },
        {
          question: "¿Necesito crear otra cuenta si ya uso la app?",
          answer:
            "No. El registro se hace con tu cuenta de AutoLibre, la misma de la app. Con esa cuenta seguís haciendo pedidos para tu auto y además administrás tu negocio.",
        },
        {
          question: "¿Qué datos me van a pedir?",
          answer:
            "El nombre del negocio, los servicios que ofrecés, las marcas que atendés, la dirección, los horarios y un WhatsApp de contacto. El logo, la descripción y las redes son opcionales.",
        },
        {
          question: "¿Cuándo queda publicado?",
          answer:
            "Cuando aprobamos la solicitud. El equipo revisa los datos y te contacta por WhatsApp para activar tu perfil.",
        },
        {
          question: "¿Pagar un plan me hace aparecer primero?",
          answer: "No. El plan no influye en la recomendación de la IA: el usuario siempre elige libremente.",
        },
      ],
    },
    /** Barra fija inferior en celular. */
    mobileBar: { label: "Registrar mi negocio", primary: "Registrar mi negocio", secondary: "Planes" },
  },

  /**
   * El flujo del alta (`/proveedores/registro?alta=1`, lienzos
   * `IngresarNegocio` y `Alta`). Privado de hecho: lo que se ve depende de la
   * sesión y nunca está en el HTML del server.
   */
  flow: {
    /** Indicador de tres pasos arriba del login. */
    signInSteps: {
      label: "Pasos del registro",
      items: [
        { id: "cuenta", label: "Tu cuenta" },
        { id: "negocio", label: "Tu negocio" },
        { id: "revision", label: "Revisión" },
      ],
    },
    signInIntro: "Para registrar tu negocio necesitás una cuenta de AutoLibre. Es la misma de la app.",
    loading: "Cargando el registro…",
    /** Columna de pasos del formulario (cuenta ya hecha). */
    sidebar: {
      title: "Registrá tu negocio",
      label: "Pasos del registro",
      items: [
        { id: "cuenta", label: "Tu cuenta", description: "La misma de la app" },
        { id: "negocio", label: "Datos de tu negocio", description: "Nombre, servicios y marcas" },
        { id: "atencion", label: "Atención", description: "Modalidad, dirección y horarios" },
        { id: "contacto", label: "Contacto", description: "WhatsApp, logo y redes" },
        { id: "revision", label: "Revisión", description: "Te contactamos por WhatsApp" },
      ],
    },
    progressLabel: (step: number, total: number) => `Paso ${step} de ${total}`,
    /** Título y bajada de cada paso del formulario (en orden). */
    stepHeads: [
      {
        title: "Datos de tu negocio",
        intro: "Así va a aparecer tu negocio en la red. Después lo podés editar desde tu cuenta.",
      },
      { title: "Cómo y dónde atendés", intro: "Con esto te recomendamos a la gente de tu zona." },
      { title: "Contacto", intro: "Lo último. Después revisamos la solicitud y te avisamos." },
    ],
    sections: {
      name: "¿Cómo se llama tu negocio?",
      services: "¿Qué servicios ofrecés?",
      servicesHint: "Abrí las categorías que te tocan y marcá los rubros que hacés. Si hacés todo lo de una, tildá la categoría entera.",
      vehicles: "¿Qué vehículos atienden?",
      modality: "¿Cómo atendés?",
      address: "¿Dónde estás?",
      hours: "¿En qué horarios atendés?",
      contact: "¿Cómo te contactamos?",
      contactHint: "Te escribimos a este WhatsApp para activar tu perfil.",
      extras: "Sumá tu logo y tus redes",
      extrasHint: "Es opcional. Podés registrarte sin cargarlos y completarlos después.",
      howFound: "¿Cómo se enteraron de AutoLibre?",
    },
    back: "Atrás",
    next: "Continuar",
    nameLabel: "Nombre del negocio",
    namePlaceholder: "Ej: Taller San Martín",
    nameRequired: "Escribí el nombre de tu negocio.",
    descriptionLabel: "Descripción del negocio",
    optional: "(opcional)",
    howFoundLabel: "Elegí cómo se enteraron",
    emailLabel: "Email del negocio",
    help: {
      label: "¿Dudas? Escribinos",
      whatsappMessage: "Hola! Estoy registrando mi negocio en AutoLibre y tengo una consulta.",
    },
    session: {
      signedInAs: "Entraste como",
      switchAccount: "Usar otra cuenta",
      signingOut: "Cerrando sesión…",
    },
  },

  form: {
    title: "Sumate como proveedor",
    subtitle: "Te contactamos para activar tu perfil.",
    submitLabel: "Quiero registrar mi taller",
    submitLoadingLabel: "Enviando...",
    note: "Te contactamos para activar tu perfil.",
    /**
     * Pantalla de estado después de enviar (y del 409 "ya te teníamos
     * anotado", que es lo mismo: una solicitud en revisión, no un error).
     * Sin plazos: no hay uno comprometido por producto.
     */
    success: {
      title: "Recibimos tu solicitud",
      alreadyRegisteredTitle: "Tu solicitud ya está en revisión",
      description: "Ya está en manos del equipo. Por ahora no tenés que hacer nada más.",
      timeline: {
        label: "Estado de tu solicitud",
        currentBadge: "Ahora",
        steps: [
          {
            id: "enviada",
            label: "Solicitud enviada",
            description: "Recibimos los datos de tu taller.",
          },
          {
            id: "revision",
            label: "En revisión",
            description: "El equipo revisa los datos y te contacta por WhatsApp para activar tu perfil.",
          },
          {
            id: "publicada",
            label: "Taller publicado",
            description:
              "Tu taller aparece en la red y lo administrás con tu cuenta de AutoLibre. Desde ahí también contratás un plan.",
          },
        ],
      },
      nextTitle: "Mientras tanto",
      plans: {
        body: "Con el plan Gratis tu taller ya aparece en la red. Si querés recibir más pedidos por WhatsApp, mirá los planes pagos.",
        cta: "Conocé los planes",
      },
      /** Vino de contratar un plan (`?next`): se lo recuerda y se ofrece volver. */
      checkout: {
        body: (planName: string) =>
          `Elegiste el plan ${planName}. Cuando aprobemos tu taller, volvé a la contratación con esta misma cuenta y la terminás en un par de pasos.`,
        cta: (planName: string) => `Ir a la contratación del plan ${planName}`,
      },
      help: {
        label: "¿Dudas? Escribinos por WhatsApp",
        whatsappMessage: "Hola! Registré mi taller en AutoLibre y tengo una consulta sobre mi solicitud.",
      },
    },
    /**
     * El backend rechazó el token también después de renovarlo (spec 212,
     * US3). Lo escrito NO se borra: la persona entra de nuevo en otra pestaña
     * (Clerk comparte la sesión entre pestañas) y vuelve a enviar.
     */
    session: {
      expired:
        "Tu sesión venció. Lo que completaste sigue acá: volvé a entrar con tu cuenta y después tocá de nuevo «Quiero registrar mi taller».",
      reauthLink: "Volver a entrar (se abre en otra pestaña)",
    },
    addressHelper:
      "Empezá a escribir y elegí tu dirección de la lista para que te ubiquemos bien en el mapa.",
    /** Se escribió la dirección a mano (o se editó después de elegirla). */
    addressNotPickedError: "Elegí tu dirección de la lista de sugerencias.",
    /** Se eligió una sugerencia, pero Google no devolvió localidad o provincia. */
    addressImpreciseError:
      "Esa dirección no es lo bastante precisa. Probá con calle y número y elegila de la lista.",
    /**
     * WhatsApp del negocio. El campo ya saca solo el `+54`, el `0` y el `15`
     * (ver `formatArWhatsappInput` en `lib/phone.ts`); la ayuda igual lo dice,
     * porque es la forma en que la gente aprende a escribirlo bien la próxima.
     * Los errores son los de `/pedido` (`whatsappErrorMessage`).
     */
    whatsapp: {
      label: "WhatsApp de contacto",
      prefix: "+54",
      /** Lo que lee un lector de pantalla en lugar de "+54". */
      prefixLabel: "Código de país +54.",
      placeholder: "11 2345-6789",
      hint: "Con código de área, sin el 0 ni el 15. Ej: 381 456-7890",
    },
    /** La regla está en `isValidProviderEmail` (lib/proveedores/registration.ts). */
    email: {
      invalid:
        "Revisá el email: tiene que ser como nombre@negocio.com, sin espacios ni tildes.",
    },
    /**
     * Un mensaje por campo de texto, con el máximo de
     * `PROVIDER_TEXT_MAX_LENGTH` (lib/proveedores/registration.ts). Si cambia
     * el número allá, cambia acá.
     */
    textTooLong: {
      taller: "El nombre del taller no puede superar los 120 caracteres.",
      direccion: "La dirección no puede superar los 250 caracteres.",
      hours: "Los horarios no pueden superar los 500 caracteres.",
      service_other: "El otro servicio no puede superar los 500 caracteres.",
      how_found: "Elegí una opción de la lista en \"¿Cómo se enteraron?\".",
      how_found_other:
        "Cómo te enteraste no puede superar los 500 caracteres.",
    },
    hoursLabel: "Horarios de atención",
    hoursPlaceholder: "Ej: Lun a Vie 9 a 18hs, Sáb 9 a 13hs",
    modalityTitle: "¿Cómo atendés?",
    description: {
      label: "Descripción del negocio (opcional)",
      placeholder: "Contá brevemente qué ofrece tu negocio",
      hint: "Hasta 90 caracteres para presentar tu negocio.",
      count: (length: number) => `${length}/90 caracteres`,
      invalid: "La descripción no puede superar los 90 caracteres.",
    },
    social: {
      title: "Redes sociales (opcional)",
      /**
       * Se acepta el usuario o el link (ver `normalizeProviderSocialLink` en
       * lib/proveedores/registration.ts): la gente sabe su usuario, no el link
       * de su perfil. Al salir del campo se muestra el link que vamos a
       * guardar.
       */
      hint: "Escribí tu usuario (ej: @tutaller) o pegá el link de tu perfil. En LinkedIn, pegá el link. Completá solo las redes que uses.",
      /** Lo usa `/api/provider`, que no sabe qué campo marcar. */
      invalid: "Revisá tus redes sociales: escribí tu usuario (ej: @tutaller) o pegá el link de tu perfil.",
      networks: [
        {
          key: "instagram",
          label: "Instagram",
          placeholder: "@tutaller",
          invalid: "Escribí tu usuario de Instagram (ej: @tutaller) o pegá el link de tu perfil de instagram.com.",
        },
        {
          key: "facebook",
          label: "Facebook",
          placeholder: "@tutaller o link de tu página",
          invalid: "Escribí tu usuario de Facebook o pegá el link de tu página de facebook.com.",
        },
        {
          key: "tiktok",
          label: "TikTok",
          placeholder: "@tutaller",
          invalid: "Escribí tu usuario de TikTok (ej: @tutaller) o pegá el link de tu perfil de tiktok.com.",
        },
        {
          key: "linkedin",
          label: "LinkedIn",
          placeholder: "https://linkedin.com/company/…",
          invalid: "Pegá el link de tu perfil de LinkedIn, por ejemplo linkedin.com/company/tutaller.",
        },
        {
          key: "youtube",
          label: "YouTube",
          placeholder: "@tucanal",
          invalid: "Escribí tu canal de YouTube (ej: @tucanal) o pegá el link de youtube.com.",
        },
      ],
    },
    logo: {
      label: "Logo del negocio (opcional)",
      hint: "PNG, JPG o WebP, hasta 512 KB. Podés registrarte sin cargar un logo.",
      invalid: "Elegí una imagen PNG, JPG o WebP de hasta 512 KB.",
      remove: "Quitar logo",
      readError: "No pudimos leer el logo. Volvé a elegirlo o quitalo para continuar.",
    },
    brands: {
      title: "¿Qué marcas atienden?",
      all: "Todas las marcas",
      specific: "Solo algunas marcas",
      picker: "Agregar una marca que atienden",
      placeholder: "Seleccioná una marca",
      missing: "Agregá al menos una marca que atiendan.",
      specialtiesTitle: "Marcas de especialidad (opcional)",
      specialtiesHint: "Podés especializarte en algunas marcas aunque trabajes con todas. Elegí las que conocen en profundidad o dejá este campo vacío.",
      specialtiesSpecificHint: "Elegí sus especialidades. Si agregás una marca nueva, también se incluirá entre las marcas que atienden.",
      specialtiesPicker: "Agregar una marca de especialidad",
      otherLabel: "¿La marca no está en la lista?",
      otherPlaceholder: "Escribí el nombre de la marca",
      add: "Agregar marca",
      maximum: "Podés agregar hasta 50 marcas de especialidad.",
      remove: (brand: string) => `Quitar ${brand}`,
      invalid: "Elegí las marcas que atienden y revisá que las especialidades estén entre ellas.",
    },
  },
} as const;

export const PROVIDER_BRANDS = [
  "Audi",
  "BAIC",
  "BMW",
  "Chery",
  "Chevrolet",
  "Citroën",
  "Coradir",
  "DFSK",
  "DS Automobiles",
  "Fiat",
  "Ford",
  "Foton",
  "Great Wall",
  "Haval",
  "Honda",
  "Hyundai",
  "Iveco",
  "JAC",
  "Jeep",
  "Kia",
  "Mercedes-Benz",
  "Nissan",
  "Peugeot",
  "Renault",
  "Scania",
  "Sero Electric",
  "Toyota",
  "Volvo",
  "Volkswagen",
  "Volt Motors",
] as const;

/**
 * Los servicios NO se listan acá.
 *
 * Vivian en dos constantes hardcodeadas (`PROVIDER_SERVICES` y la anterior
 * `PROVIDER_SERVICES_DEP`) que no coincidian ni entre si ni con el catalogo del
 * backend: tres vocabularios distintos para la misma cosa. Hoy las opciones
 * salen de `GET /api/v1/service-catalog` (ver `fetchServiceCatalog` en
 * `lib/autolibre-api.ts`), que es la fuente de verdad, y lo que se envia es el
 * slug de cada rubro.
 *
 * Si aparece la tentacion de volver a poner una lista de servicios acá: el
 * rubro se da de alta en el catalogo del backend, no en este archivo.
 */

export const PROVIDER_VEHICLE_TYPES = [
  "Autos",
  "SUVs",
  "Pickups",
  "Motos",
] as const;

export const PROVIDER_FUEL_TYPES = [
  "Nafta",
  "Diesel",
  "GNC",
  "Híbridos",
  "Eléctricos",
] as const;

export const PROVIDER_HOW_FOUND = [
  "Google",
  "WhatsApp",
  "Un cliente nos contactó",
  "Redes sociales",
  "Amigo / conocido",
  "Otro",
] as const;

/** Opción que dispara el campo de texto libre en servicios y en "cómo nos conociste". */
export const OTHER_OPTION = "Otro";

/**
 * Modalidad de atención. `value` es lo que viaja a `/api/provider` (y de ahí
 * al backend); `label` es lo que se muestra. `"ambas"` no estaba en el
 * ticket original (que hablaba de una modalidad binaria) — se agregó porque
 * un taller real puede combinar las dos, ver `specs/004-partner-approval-data`.
 */
export const PROVIDER_MODALITY_OPTIONS = [
  { value: "en_local", label: "Solo en el local" },
  { value: "a_domicilio", label: "Solo a domicilio" },
  { value: "ambas", label: "En el local y a domicilio" },
] as const;
