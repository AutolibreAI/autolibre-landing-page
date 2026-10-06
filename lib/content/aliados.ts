import { traction } from "@/lib/content/about";

/**
 * Copy de `/aliados`: el directorio de los negocios que forman parte de la
 * red de AutoLibre. Los datos de cada negocio (nombre, zona, rubros, marcas)
 * salen del backend; acá vive solo el texto fijo de la página.
 *
 * Nada de métricas propias: la única cifra es `traction.providers`, la misma
 * que publica `/sobre-nosotros` (ver `PRODUCT.md`).
 */
export const aliadosContent = {
  meta: {
    title: "Aliados",
    description:
      "Directorio de los talleres, aseguradoras, estudios para multas y casas de repuestos que forman parte de AutoLibre en el AMBA y reciben pedidos de presupuesto desde la app.",
  },

  breadcrumb: { home: "Inicio", aliados: "Aliados" },

  hero: {
    eyebrow: "Aliados",
    title: "Los negocios que ya forman parte de AutoLibre",
    lead: "Talleres, aseguradoras, estudios para multas y casas de repuestos que reciben los pedidos de presupuesto de los conductores de AutoLibre en el AMBA.",
    primaryCta: { label: "Ver la red", href: "#red" },
    secondaryCta: { label: "Sumar mi negocio", href: "/proveedores" },
    facts: {
      partners: { label: "Negocios en la red", value: traction.providers },
      /** El valor es cuántas familias del catálogo tienen al menos un negocio. */
      categories: { label: "Rubros", value: (count: number) => String(count) },
      zone: { label: "Zona", value: "AMBA" },
    },
  },

  directory: {
    /** `id` de la sección: destino de "Ver la red" y de los filtros. */
    id: "red",
    title: "Toda la red",
    subtitle: "Cada negocio de esta lista está activo en AutoLibre y recibe pedidos desde la app.",
    /** "24 de 53 negocios" o, paginado, "25–48 de 53 negocios". */
    count: ({ from, to, total }: { from: number; to: number; total: number }) => {
      const noun = total === 1 ? "negocio" : "negocios";
      return from === 1 ? `${to} de ${total} ${noun}` : `${from}–${to} de ${total} ${noun}`;
    },
    filter: {
      label: "Filtrar por rubro",
      all: "Todos",
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
      body: "Igual podés pedir tu presupuesto: lo derivamos a quien pueda ayudarte.",
      primaryCta: { label: "Pedir presupuesto", href: "/pedido" },
      secondaryCta: { label: "Ver todos los rubros", href: "/aliados" },
    },
    error: {
      title: "No pudimos cargar la red en este momento",
      body: "El resto de la página sigue disponible. Probá de nuevo en unos minutos.",
      retry: "Reintentar",
    },
  },
} as const;
