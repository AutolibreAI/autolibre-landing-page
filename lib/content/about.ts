/**
 * Copy de `/sobre-nosotros`. Los componentes de `components/about/*` no traen
 * strings propios: todo sale de acá.
 *
 * Es texto real y citable: un LLM repite lo que escribimos acá (ver
 * `AGENTS.md` y `PRODUCT.md`). No inventar métricas, fechas, testimonios ni
 * claims. Las cifras de tracción viven en `traction` (las usan el hero y el
 * hito "Tracción") y se actualizan cuando cambien, junto con `PRODUCT.md`.
 *
 * Fotos: el hero y la historia son tipográficos, sin foto. Solo el equipo
 * lleva retratos: van en `public/images/about/equipo-<id>.webp` (4:5) y se
 * cargan en el `photo` de cada persona como
 * `{ src: "/images/about/equipo-<id>.webp", alt: "...", width, height }` (las
 * dimensiones reales del archivo: `next/image` las usa para reservar el
 * espacio y que no haya salto de layout). Mientras una foto sea `undefined`,
 * la ficha muestra un recuadro "Foto pendiente" del mismo tamaño.
 */

import type { IconName } from "@/lib/content/types";

/** Retrato de una persona del equipo. `width`/`height` son los del archivo real. */
export type AboutPhoto = {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
};

/**
 * `done`: hito cumplido · `current`: dónde estamos hoy · `next`: lo que viene.
 * Cambia el marcador de la línea de tiempo. `next` es opcional: solo se usa
 * si hay un próximo paso confirmado.
 */
export type MilestoneStatus = "done" | "current" | "next";

export type AboutMilestone = {
  readonly id: string;
  /**
   * Fecha ISO para `<time dateTime>` ("2026-03" o "2026-03-15"). Opcional:
   * un hito futuro sin fecha confirmada se muestra sin `<time>`.
   */
  readonly date?: string;
  /** Cómo se lee la fecha en pantalla ("3 feb 2026", "Feb 2026"). */
  readonly dateLabel: string;
  readonly title: string;
  readonly description: string;
  readonly status: MilestoneStatus;
};

export type AboutMember = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  /** Una línea. Opcional: sin ella la ficha muestra solo nombre y rol. */
  readonly bio?: string;
  /** URL completa del perfil de LinkedIn. Sin ella no se muestra el link. */
  readonly linkedin?: string;
  /** `true` en los fundadores: el JSON-LD los declara como `founder`. */
  readonly founder?: boolean;
  readonly photo?: AboutPhoto;
};

/**
 * Un dato del hero (`<dt>` + `<dd>`). `dateTime` convierte el valor en un
 * `<time>` legible por máquina. `icon` es el ícono de línea que acompaña al
 * rótulo: decorativo, el dato ya lo dice el texto.
 */
export type AboutFact = {
  readonly id: string;
  readonly icon: IconName;
  readonly label: string;
  readonly value: string;
  readonly dateTime?: string;
};

/** Fecha de fundación (ISO): la usan el hero y el `Organization` del JSON-LD. */
const FOUNDING_DATE = "2026-02";

/**
 * Cifras de tracción: la ÚNICA fuente para el hero y el hito "Tracción" (y
 * para la ficha de `/aliados`, que la importa).
 * Actualizarlas acá y en `PRODUCT.md` cuando cambien (`asOf` es la fecha de
 * corte que se lee en pantalla).
 */
export const traction = {
  vehicles: "200+",
  providers: "50+",
  asOf: "Sep 2026",
} as const;

/**
 * Las personas viven fuera de `aboutContent` para que el hero cuente a los
 * cofundadores (`founder: true`) en lugar de escribir el número a mano.
 *
 * Fotos pendientes: `public/images/about/equipo-<id>.webp`, retrato 4:5, en
 * el `photo` de cada persona.
 */
const members = [
  {
    id: "nicolas-leunda",
    name: "Nicolás Leunda",
    role: "Cofundador y CEO",
    founder: true,
    photo: {
      src: "/images/about/equipo-nicolas-leunda.webp",
      alt: "Nicolás Leunda, cofundador y CEO de AutoLibre, sonríe con una remera negra de AutoLibre.AI.",
      width: 800,
      height: 1000,
    },
  },
  {
    id: "matias-garcia-guevara",
    name: "Matías García Guevara",
    role: "Cofundador y CFO: finanzas, estrategia, seguros y financiación",
    founder: true,
  },
  {
    id: "ramiro-sarasola",
    name: "Ramiro Sarasola",
    role: "Cofundador · Líder de desarrollo",
    founder: true,
    photo: {
      src: "/images/about/equipo-ramiro-sarasola.webp",
      alt: "Ramiro Sarasola, cofundador y líder de desarrollo de AutoLibre, sonríe con una remera negra de AutoLibre.AI.",
      width: 800,
      height: 1000,
    },
  },
  {
    id: "mateo-ghidini",
    name: "Mateo Ghidini",
    role: "Cofundador · Desarrollo",
    founder: true,
  },
  {
    id: "matias-vidal",
    name: "Matías Vidal",
    role: "Cofundador · Legal e inversores",
    founder: true,
  },
] satisfies readonly AboutMember[] as readonly AboutMember[];

const founderCount = members.filter((m) => m.founder).length;

/** "2026-02" → "Feb 2026", con el mismo formato que las fechas del timeline. */
function monthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split("-");
  const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  return `${months[Number(month) - 1]} ${year}`;
}

/**
 * `true` porque nombres y roles son reales: el JSON-LD declara las personas
 * (`Person`, `founder`, `employee`). Si alguna vez vuelve a haber copy de
 * relleno, pasalo a `false`: publicar gente inventada en structured data es
 * exactamente lo que un buscador o un LLM repetiría como hecho.
 */
export const ABOUT_COPY_READY = true;

export const aboutContent = {
  metadata: {
    /** Sin la marca: el template del layout la agrega. */
    title: "Sobre nosotros",
    description:
      "AutoLibre nació en Buenos Aires en febrero de 2026. Conocé la misión, la historia y a los cinco cofundadores de la app de gestión de autos y motos.",
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
    /** El `h1` de la página. */
    title: "Todo tu auto en un solo lugar",
    /** Definición canónica de 25 palabras: va textual, no se reescribe. */
    lead: "AutoLibre es una app argentina de gestión de autos y motos: papeles, vencimientos, diagnóstico con IA, historial clínico y un marketplace de servicios automotores.",
    /**
     * Ficha de datos bajo la bajada (`<dl>`). Fecha, cofundadores y cifras
     * se derivan de sus fuentes: no se escriben dos veces.
     */
    facts: [
      {
        id: "fundada",
        icon: "calendar",
        label: "Fundada",
        value: monthLabel(FOUNDING_DATE),
        dateTime: FOUNDING_DATE,
      },
      { id: "desde", icon: "pin", label: "Desde", value: "Buenos Aires" },
      { id: "cofundadores", icon: "users", label: "Cofundadores", value: String(founderCount) },
      {
        id: "disponible-en",
        icon: "smartphone",
        label: "Disponible en",
        value: "App Store, Google Play y web",
      },
      { id: "vehiculos", icon: "car", label: "Vehículos", value: traction.vehicles },
      { id: "proveedores", icon: "wrench", label: "Proveedores", value: traction.providers },
    ] satisfies readonly AboutFact[] as readonly AboutFact[],
  },

  purpose: {
    /** `h2` de la sección (se ve chico, como un rótulo). */
    title: "Misión y visión",
    mission: {
      label: "Misión",
      statement:
        "Que cualquier persona pueda cuidar su auto o su moto sabiendo en qué estado está, qué le toca y a quién recurrir. Queremos achicar la distancia entre lo que sabe el taller y lo que entiende el dueño del vehículo, a la vez que reducimos el tiempo y las ineficiencias.",
    },
    vision: {
      label: "Visión",
      statement:
        "Ser la referencia de los servicios automotrices en Latinoamérica. Queremos digitalizar todo lo que rodea a un vehículo, de los papeles al mantenimiento y de cada diagnóstico a cada servicio, para que dueños y proveedores trabajen con la misma información en un solo lugar.",
    },
  },

  story: {
    title: "Nuestra historia",
    /**
     * La primera oración tiene que poder citarse sola (GEO): quién, qué y
     * dónde, sin depender del resto del párrafo.
     */
    paragraphs: [
      "AutoLibre nació en febrero de 2026 como una idea entre dos amigos de Buenos Aires, Nicolás y Ramiro, que querían llevar el mantenimiento de sus autos en un lugar cómodo. Probaron las apps que había y ninguna los convenció.",
      "La primera pregunta difícil la hizo Ramiro: lo complicado no es guardar datos, es lograr que la gente los cargue. Con eso en mente empezamos a probar. Primero usamos visión artificial para detectar daños de chapa y pintura. Después conectamos un escáner OBD2 barato con inteligencia artificial: en su primera prueba, en el auto de Nicolás, marcó lo mismo que su mecánico ya le había dicho.",
      "Con research y muchas charlas vimos que el diagnóstico con escáner le interesaba a pocos. El dolor real estaba en comparar talleres, recibir propuestas y no perder tiempo ni plata con los papeles y los vencimientos. Así llegamos a la app que hoy está en App Store, Google Play y web. El escáner quedó como opcional, y el centro pasó a ser la gestión completa del vehículo y el marketplace de servicios.",
    ],
    /**
     * Lo que dejó esa primera prueba, destacado junto al `h2`. Es nuestra
     * propia frase (no una cita de terceros): va en un `<p>`, no en un
     * heading ni en un `<blockquote>`.
     */
    principle: {
      label: "Lo que aprendimos",
      statement:
        "La tecnología no reemplaza al mecánico: le da al dueño el contexto para entenderlo.",
    },
  },

  timeline: {
    title: "Cómo llegamos hasta acá",
    intro:
      "Del primer chat, en febrero de 2026, a la app en App Store y Google Play.",
    /** Estado del hito para lectores de pantalla (el marcador es visual). */
    statusLabel: {
      done: "Hito cumplido",
      current: "Hoy",
      next: "Lo que viene",
    } satisfies Record<MilestoneStatus, string>,
    milestones: [
      {
        id: "primera-idea",
        date: "2026-02-03",
        dateLabel: "3 feb 2026",
        title: "La primera idea",
        description:
          "Un chat entre Nicolás y Ramiro: registrar el mantenimiento, que el taller lo valide y que el historial acompañe al auto cuando se vende.",
        status: "done",
      },
      {
        id: "matias-garcia-guevara",
        date: "2026-02-05",
        dateLabel: "5 feb 2026",
        title: "Se suma Matías García Guevara",
        description:
          "Lo que empezó como una charla de mentoreo se convierte en la pregunta de cómo sumarle IA.",
        status: "done",
      },
      {
        id: "primera-iteracion-ia",
        date: "2026-02",
        dateLabel: "Feb 2026",
        title: "Primera iteración con IA",
        description:
          "Visión artificial para detectar daños de chapa y pintura, y la idea de conectar cada necesidad con quien la resuelve.",
        status: "done",
      },
      {
        id: "primer-diagnostico",
        date: "2026-02-27",
        dateLabel: "27 feb 2026",
        title: "El primer diagnóstico real",
        description:
          "Un escáner OBD2 y una IA leen el auto de Nicolás y coinciden con su mecánico.",
        status: "done",
      },
      {
        id: "all-in",
        date: "2026-03-01",
        dateLabel: "1 mar 2026",
        title: "All-in",
        description: "Nicolás deja el trabajo freelance para dedicarse a AutoLibre.",
        status: "done",
      },
      {
        id: "equipo-fundador",
        date: "2026-06",
        dateLabel: "Jun 2026",
        title: "El equipo fundador completo",
        description:
          "Se suman Mateo Ghidini, en mayo, y Matías Vidal, en junio.",
        status: "done",
      },
      {
        id: "el-giro",
        date: "2026-06",
        dateLabel: "Jun 2026",
        title: "El giro",
        description:
          "El escáner pasa a ser opcional; el foco, a papeles, mantenimiento y marketplace.",
        status: "done",
      },
      {
        id: "lanzamiento",
        date: "2026-08-08",
        dateLabel: "8 ago 2026",
        title: "Lanzamiento",
        description: "La app sale en App Store y Google Play.",
        status: "done",
      },
      {
        id: "pedidos-web",
        date: "2026-09",
        dateLabel: "Sep 2026",
        title: "Pedidos desde la web",
        description:
          "Cualquiera puede pedir propuestas a proveedores sin descargar la app.",
        status: "done",
      },
      {
        id: "traccion",
        date: "2026-09",
        dateLabel: traction.asOf,
        title: "Tracción",
        // Cifras de `traction`: actualizarlas ahí y en `PRODUCT.md` cuando cambien.
        description: `${traction.vehicles} vehículos únicos y ${traction.providers} proveedores en el marketplace.`,
        status: "current",
      },
    ] satisfies readonly AboutMilestone[] as readonly AboutMilestone[],
  },

  team: {
    title: "Equipo",
    intro: "Somos cinco cofundadores.",
    /** Nombre accesible del link a LinkedIn de cada persona. */
    linkedinLabel: (name: string) => `LinkedIn de ${name}`,
    /** Definidas arriba (`members`): ahí van también sus retratos. */
    members,
  },

  /** Fecha de fundación para el `Organization` del JSON-LD (ISO). */
  foundingDate: FOUNDING_DATE as string | undefined,
} as const;
