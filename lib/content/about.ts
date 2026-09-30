/**
 * Copy de `/sobre-nosotros`. Los componentes de `components/about/*` no traen
 * strings propios: todo sale de acá.
 *
 * TODO: copy real. TODO lo que empieza con "[Placeholder]" es un texto de
 * relleno para armar el layout: se reemplaza por el texto real del equipo
 * antes de publicar. No inventar métricas, fechas, testimonios ni claims:
 * un LLM cita lo que escribimos acá (ver `AGENTS.md` y `PRODUCT.md`).
 *
 * Fotos: van en `public/images/about/` y se cargan como
 * `{ src: "/images/about/equipo.webp", alt: "...", width, height }` (las
 * dimensiones reales del archivo: `next/image` las usa para reservar el
 * espacio y que no haya salto de layout). Mientras una foto sea `undefined`,
 * la página muestra un recuadro "Foto pendiente" del mismo tamaño.
 */

/** Foto de la página. `width`/`height` son los del archivo real. */
export type AboutPhoto = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

/**
 * `done`: hito cumplido · `current`: dónde estamos hoy · `next`: lo que viene.
 * Cambia el marcador de la línea de tiempo.
 */
export type MilestoneStatus = "done" | "current" | "next";

export type AboutMilestone = {
  readonly id: string;
  /**
   * Fecha ISO para `<time dateTime>` ("2024-03" o "2024-03-15"). Opcional:
   * un hito futuro sin fecha confirmada se muestra sin `<time>`.
   */
  readonly date?: string;
  /** Cómo se lee la fecha en pantalla ("Marzo 2024", "Próximamente"). */
  readonly dateLabel: string;
  readonly title: string;
  readonly description: string;
  readonly status: MilestoneStatus;
};

export type AboutMember = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  /** Una línea. */
  readonly bio: string;
  /** URL completa del perfil de LinkedIn. Sin ella no se muestra el link. */
  readonly linkedin?: string;
  /** `true` en los fundadores: el JSON-LD los declara como `founder`. */
  readonly founder?: boolean;
  readonly photo?: AboutPhoto;
};

/**
 * `false` mientras la página tenga copy de relleno. Con `false` el JSON-LD NO
 * declara personas (`Person`, `founder`, `employee`): publicar gente
 * inventada en structured data es exactamente lo que un buscador o un LLM
 * repetiría como hecho. Pasalo a `true` cuando nombres y roles sean reales.
 */
export const ABOUT_COPY_READY = false;

export const aboutContent = {
  metadata: {
    /** Sin la marca: el template del layout la agrega. */
    title: "Sobre nosotros",
    description:
      "[Placeholder] Quiénes somos en AutoLibre.AI: la misión, la historia y el equipo detrás de la app que ordena toda la información de tu auto en un solo lugar.",
  },

  breadcrumb: {
    home: "Inicio",
    about: "Sobre nosotros",
  },

  /** Recuadro que ocupa el lugar de una foto que todavía no está. */
  photoPlaceholder: "Foto pendiente",

  hero: {
    /** Eyebrow: un `<p>`, no un heading. */
    eyebrow: "Sobre nosotros",
    /** El `h1` de la página: la misión dicha en una frase. */
    title: "[Placeholder] Que cada dueño de auto sepa qué tiene y qué hacer.",
    lead: "[Placeholder] Somos el equipo de AutoLibre.AI. Hacemos una app para que la información de tu auto deje de estar desparramada en papeles, chats y la memoria de alguien.",
    /** Foto grupal del equipo. Es la imagen LCP: la única con `preload`. */
    groupPhoto: undefined as AboutPhoto | undefined,
  },

  purpose: {
    /** `h2` de la sección (se ve chico, como un rótulo). */
    title: "Misión y visión",
    mission: {
      label: "Misión",
      statement:
        "[Placeholder] Ordenar toda la información de un auto en un solo lugar para que su dueño decida con datos, no a ciegas.",
    },
    vision: {
      label: "Visión",
      statement:
        "[Placeholder] Que mantener un auto en regla sea tan simple como mirar el teléfono.",
    },
  },

  story: {
    title: "Nuestra historia",
    /**
     * La primera oración tiene que poder citarse sola (GEO): quién, qué y
     * dónde, sin depender del resto del párrafo.
     */
    paragraphs: [
      "[Placeholder] AutoLibre nació como una idea entre dos amigos de Argentina que estaban cansados de llevar la cuenta de su auto a mano.",
      "[Placeholder] Segundo párrafo: el problema concreto que los empujó a empezar y qué probaron primero.",
      "[Placeholder] Tercer párrafo: cómo la idea se convirtió en la app que hoy está en las tiendas.",
    ],
    /** Foto de los dos fundadores. */
    photo: undefined as AboutPhoto | undefined,
  },

  timeline: {
    title: "Cómo llegamos hasta acá",
    intro:
      "[Placeholder] Los hitos que nos trajeron desde una idea hasta una app en las tiendas.",
    /** Estado del hito para lectores de pantalla (el marcador es visual). */
    statusLabel: {
      done: "Hito cumplido",
      current: "Hoy",
      next: "Lo que viene",
    } satisfies Record<MilestoneStatus, string>,
    // TODO: copy real. Fechas ISO de relleno: reemplazar por las reales.
    milestones: [
      {
        id: "idea",
        date: "2024-01",
        dateLabel: "[Placeholder] Fecha",
        title: "[Placeholder] La idea, entre dos amigos",
        description: "[Placeholder] Qué problema vieron y por qué decidieron resolverlo.",
        status: "done",
      },
      {
        id: "prototipo",
        date: "2024-06",
        dateLabel: "[Placeholder] Fecha",
        title: "[Placeholder] El primer prototipo",
        description: "[Placeholder] Qué hacía la primera versión y quién la probó.",
        status: "done",
      },
      {
        id: "equipo",
        date: "2025-01",
        dateLabel: "[Placeholder] Fecha",
        title: "[Placeholder] El equipo pasa a ser de cuatro",
        description: "[Placeholder] Quiénes se sumaron y qué trajo cada uno.",
        status: "done",
      },
      {
        id: "tiendas",
        date: "2025-09",
        dateLabel: "[Placeholder] Fecha",
        title: "[Placeholder] La app, hoy en las tiendas",
        description:
          "[Placeholder] AutoLibre está disponible gratis en App Store y Google Play.",
        status: "current",
      },
      {
        id: "lo-que-viene",
        dateLabel: "Próximamente",
        title: "[Placeholder] Lo que viene",
        description: "[Placeholder] El próximo paso del producto, sin prometer fechas.",
        status: "next",
      },
    ] satisfies readonly AboutMilestone[] as readonly AboutMilestone[],
  },

  team: {
    title: "Equipo",
    intro: "[Placeholder] Las personas que hacen AutoLibre todos los días.",
    /** Nombre accesible del link a LinkedIn de cada persona. */
    linkedinLabel: (name: string) => `LinkedIn de ${name}`,
    // TODO: copy real. Nombres, roles, bios, LinkedIn y fotos
    // (`public/images/about/equipo-<id>.webp`, retrato 4:5).
    members: [
      {
        id: "persona-1",
        name: "[Placeholder] Nombre Apellido",
        role: "[Placeholder] Cofundador · Rol",
        bio: "[Placeholder] Una línea sobre qué hace en AutoLibre.",
        founder: true,
      },
      {
        id: "persona-2",
        name: "[Placeholder] Nombre Apellido",
        role: "[Placeholder] Cofundador · Rol",
        bio: "[Placeholder] Una línea sobre qué hace en AutoLibre.",
        founder: true,
      },
      {
        id: "persona-3",
        name: "[Placeholder] Nombre Apellido",
        role: "[Placeholder] Rol",
        bio: "[Placeholder] Una línea sobre qué hace en AutoLibre.",
      },
      {
        id: "persona-4",
        name: "[Placeholder] Nombre Apellido",
        role: "[Placeholder] Rol",
        bio: "[Placeholder] Una línea sobre qué hace en AutoLibre.",
      },
    ] satisfies readonly AboutMember[] as readonly AboutMember[],
  },

  /**
   * Fecha de fundación para el `Organization` del JSON-LD (ISO). Queda
   * `undefined` hasta tener la real: no se inventa.
   */
  foundingDate: undefined as string | undefined,
} as const;
