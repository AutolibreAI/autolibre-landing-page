import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/seo/config";

/**
 * Rutas públicas del sitio. Al sumar una página nueva, agregarla acá.
 *
 * `lastModified` es una fecha fija por ruta y no `new Date()`: con la fecha
 * del build, cada deploy le avisa a Google que las seis páginas cambiaron
 * aunque no se haya tocado ninguna, y el crawler termina ignorando el campo.
 * Al editar el contenido de una página, actualizar su fecha acá.
 */
const routes = [
  {
    path: "/",
    lastModified: "2026-08-21",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/proveedores",
    lastModified: "2026-08-14",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/support",
    lastModified: "2026-08-14",
    changeFrequency: "monthly",
    priority: 0.5,
  },
  {
    path: "/eliminar-cuenta",
    lastModified: "2026-08-14",
    changeFrequency: "yearly",
    priority: 0.3,
  },
  {
    path: "/privacidad",
    lastModified: "2026-06-01",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/terminos",
    lastModified: "2026-06-01",
    changeFrequency: "yearly",
    priority: 0.2,
  },
] as const satisfies readonly {
  path: string;
  lastModified: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: route.path === "/" ? siteConfig.url : `${siteConfig.url}${route.path}`,
    lastModified: route.lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
