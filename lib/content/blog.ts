/**
 * Copy del blog: listado, páginas de categoría y nota. Los componentes de
 * `components/blog/*` no traen strings propios: todo sale de acá.
 */
export const blogContent = {
  index: {
    title: "Blog",
    /** Eyebrow: un `<p>`, no un heading. */
    eyebrow: "Blog de AutoLibre",
    heading: "Guías claras para tener tu auto en regla.",
    description:
      "Vencimientos, papeles, mantenimiento y diagnóstico, explicados sin vueltas por el equipo de AutoLibre.",
  },

  category: {
    /** "Guías de Mantenimiento". */
    heading: (name: string) => `Guías de ${name}`,
    /** Meta description y bajada de la página de una categoría. */
    description: (name: string) =>
      `Todas las guías de ${name.toLowerCase()} del blog de AutoLibre, explicadas sin vueltas y con respuestas concretas.`,
  },

  search: {
    label: "Buscar en el blog",
    placeholder: "Ej.: VTV, cambio de aceite, cédula",
  },

  chips: {
    label: "Temas del blog",
    all: "Todas",
  },

  featured: {
    /** Heading solo para lectores de pantalla: la sección necesita uno. */
    srHeading: "Nota destacada",
    badge: "Guía esencial",
  },

  latest: {
    heading: "Últimas notas",
    seeAll: "Ver todas",
  },

  grid: {
    heading: "Guías por tema",
    /** Heading de la grilla dentro de una categoría (el `h1` ya nombra el tema). */
    headingInCategory: "Todas las guías",
    subtitle: "Cada guía responde una pregunta concreta sobre tu auto.",
    results: (q: string) => (q ? `Resultados para "${q}"` : "Resultados"),
    emptyFiltered: "No encontramos notas con ese filtro.",
    emptyAll: "Todavía no publicamos notas. Volvé pronto.",
    clearFilters: "Ver todas las notas",
  },

  pagination: {
    label: "Paginación",
    previous: "Anterior",
    next: "Siguiente",
  },

  breadcrumb: {
    label: "Migas de pan",
    home: "Inicio",
    blog: "Blog",
  },

  article: {
    byline: (author: string) => `Por ${author}`,
    published: (date: string) => `Publicado el ${date}`,
    updated: (date: string) => `Actualizado el ${date}`,
    readingTime: (minutes: number) => `${minutes} min de lectura`,
    tocTitle: "En esta nota",
    tocCount: (count: number) => `${count} ${count === 1 ? "sección" : "secciones"}`,
    sameTopic: "Del mismo tema",
    related: "Seguí leyendo",
  },

  /** Bloque de descarga al final de cada nota. */
  appCta: {
    label: "Descargá AutoLibre",
    title: "Tus papeles y vencimientos, en el teléfono.",
    text: "AutoLibre te avisa antes de que venzan la VTV, el seguro y el service. Gratis, para iPhone y Android.",
    screenshotAlt:
      "Ficha de un auto en AutoLibre con sus alertas activas y los documentos vigentes.",
  },

  mobileBar: {
    cta: "Descargar la app gratis",
  },
} as const;
