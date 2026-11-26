import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
} from "@/lib/proveedores/query";

/**
 * Copy de `/proveedores`: el directorio de los negocios que forman parte de la
 * red de AutoLibre. Los datos de cada negocio (nombre, zona, rubros, marcas)
 * salen del backend; acá vive solo el texto fijo de la página.
 *
 * Cifra y cobertura actualizadas por producto el 2026-10-27 (ver `PRODUCT.md`).
 */
export const providersDirectoryContent = {
  meta: {
    title: "Proveedores",
    description:
      "Directorio de los talleres, aseguradoras, estudios para multas y casas de repuestos que forman parte de AutoLibre en todo el país. Buscá por nombre, zona o rubro y pedí propuestas gratis.",
  },

  breadcrumb: { label: "Migas de pan", home: "Inicio", proveedores: "Proveedores" },

  hero: {
    title: "Los negocios que ya forman parte de AutoLibre",
    lead: "Talleres, aseguradoras, estudios para multas y casas de repuestos que reciben los pedidos de los conductores de AutoLibre en todo el país.",
    /**
     * "161 negocios · 14 rubros · En todo el país". Las dos cifras salen del
     * backend (el conteo real del directorio y las familias con al menos un
     * negocio); sin el dato, ese tramo no se muestra. La cifra de marketing
     * "+150" NO va acá: el directorio muestra el conteo real (DECISIONES.md).
     */
    facts: {
      partners: (count: number) => (count === 1 ? "negocio" : "negocios"),
      categories: (count: number) => (count === 1 ? "rubro" : "rubros"),
      zonePrefix: "En",
      zone: "todo el país",
    },
  },

  /** Banda "¿No sabés a quién elegir?": el pedido adentro del directorio. */
  quoteBand: {
    title: "¿No sabés a quién elegir?",
    body: "Contanos qué le pasa al auto y te llegan propuestas de proveedores de tu zona.",
    inputLabel: "¿Qué le pasa a tu auto?",
    placeholder: "Ej.: hace ruido al frenar",
    submit: "Pedir propuestas",
  },

  /** Tarjeta para negocios al pie del directorio. */
  partnerCard: {
    title: "¿Tenés un taller o prestás un servicio?",
    body: "Registrarte es gratis y aparecés en este directorio. Recibí pedidos de gente que ya sabe qué necesita.",
    register: { label: "Sumar mi negocio", href: PROVEEDORES_REGISTRO_PATH },
    plans: { label: "Ver planes", href: PROVEEDORES_PLANES_PATH },
  },

  /** Mapa de los negocios de la página. */
  map: {
    label: "Mapa de la red",
    badge: "Mapa de referencia",
    /** Botón de cada marcador: dice a quién muestra (el monograma no se lee). */
    marker: (name: string) => `Ver ${name} en el mapa`,
    viewProfile: "Ver perfil",
    viewProfileOf: (name: string) => `Ver el perfil de ${name}`,
    /** Cuántos de la página tienen ubicación cargada (los demás no se dibujan). */
    note: (shown: number, total: number) =>
      shown === total
        ? "Ubicación de los negocios de esta página."
        : `Ubicación de ${shown} de los ${total} negocios de esta página (el resto no tiene dirección cargada).`,
  },

  directory: {
    /** `id` de la sección: destino de "Ver la red" y de los filtros. */
    id: "red",
    title: "Toda la red",
    /** "24 de 53 negocios" o, paginado, "25–48 de 53 negocios". */
    count: ({ from, to, total }: { from: number; to: number; total: number }) => {
      const noun = total === 1 ? "negocio" : "negocios";
      return from === 1 ? `${to} de ${total} ${noun}` : `${from}–${to} de ${total} ${noun}`;
    },
    /** Rubro: un desplegable del formulario de búsqueda (`?rubro=`). */
    filter: {
      label: "Rubro",
      all: "Todos",
    },
    /** Búsqueda por nombre: un formulario GET, el texto viaja en `?q=`. */
    search: {
      formLabel: "Buscar en la red",
      label: "Buscar por nombre",
      placeholder: "Nombre del negocio",
      submit: "Buscar",
      /** Botón que muestra zona y rubro en celular. */
      filters: "Filtros",
    },
    /** Recorte por zona: `?zona=<slug>`, con las zonas que devuelve el backend. */
    zone: {
      label: "Zona",
      all: "Todas las zonas",
    },
    /** Filtros puestos, cada uno con su link para quitarlo. */
    activeFilters: {
      label: "Filtros aplicados",
      removeAll: "Quitar todos los filtros",
      category: (name: string) => `Rubro: ${name}`,
      zone: (name: string) => `Zona: ${name}`,
      query: (text: string) => `Nombre: “${text}”`,
      remove: (filter: string) => `Quitar filtro ${filter}`,
    },
    card: {
      categoriesLabel: "Rubros",
      zoneLabel: "Zona de cobertura:",
      viewProfile: "Ver perfil",
      /** Resumen de marcas: vacío = todas; 1–2 se listan; más, "A, B y N más". */
      brands: (brands: readonly string[]) => {
        if (brands.length === 0) return "Todas las marcas";
        if (brands.length <= 2) return brands.join(", ");
        return `${brands.slice(0, 2).join(", ")} y ${brands.length - 2} más`;
      },
    },
    pagination: {
      label: "Paginación",
      previous: "Anterior",
      next: "Siguiente",
      page: (n: number) => `Página ${n}`,
    },
    empty: {
      title: (category: string) => `Todavía no hay negocios de ${category} en la red`,
      /** Sin resultados con cualquier combinación de filtros: nombra lo buscado. */
      titleFor: ({ q, category, zone }: { q: string; category: string; zone: string }) =>
        [
          "No encontramos negocios",
          q ? `con “${q}” en el nombre` : "",
          category ? `de ${category}` : "",
          zone ? `en ${zone}` : "",
        ]
          .filter(Boolean)
          .join(" "),
      body: "Igual podés hacer tu pedido: lo derivamos a quien pueda ayudarte.",
      primaryCta: { label: "Pedir propuestas", href: "/pedido" },
      secondaryCta: { label: "Ver todos los rubros", href: PROVEEDORES_PATH },
      clearFilters: { label: "Quitar filtros", href: PROVEEDORES_PATH },
    },
    error: {
      title: "No pudimos cargar la red en este momento",
      body: "El resto de la página sigue disponible. Probá de nuevo en unos minutos.",
      retry: "Reintentar",
    },
  },
} as const;
