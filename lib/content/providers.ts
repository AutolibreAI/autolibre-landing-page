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
  hero: {
    titleLines: [
      "Las consultas llegan con la información",
      "del vehículo.",
    ],
    subtitle:
      "Recibís la consulta con la información del vehículo (marca, modelo y año) y el servicio que necesita la persona. Reducimos el ida y vuelta por WhatsApp.",
  },

  reasons: [
    {
      id: "reason-consultas",
      title: "Consultas acotadas",
      description:
        "Marca, modelo, año y el servicio solicitado, para que puedas evaluar la consulta.",
    },
    {
      id: "reason-zona",
      title: "De tu zona y de tu especialidad",
      description:
        "Recibís lo que corresponde a tu rubro y tu área. Contestás los que te sirven.",
    },
    {
      id: "reason-perfil",
      title: "Tu perfil en la app",
      description:
        "Los usuarios te ven con tu logo, tus horarios, tus especialidades y cómo contactarte.",
    },
  ],

  form: {
    title: "Sumate como proveedor",
    subtitle: "Te contactamos para activar tu perfil.",
    submitLabel: "Quiero registrar mi taller",
    submitLoadingLabel: "Enviando...",
    note: "Te contactamos para activar tu perfil.",
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
      hint: "Pegá los links completos, empezando por https://. Completá solo las redes que uses.",
      placeholder: "https://…",
      invalid: "Revisá el link de la red social: usá una dirección completa que empiece con https:// o http://.",
      networks: [
        { key: "instagram", label: "Instagram" },
        { key: "facebook", label: "Facebook" },
        { key: "tiktok", label: "TikTok" },
        { key: "linkedin", label: "LinkedIn" },
        { key: "youtube", label: "YouTube" },
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
