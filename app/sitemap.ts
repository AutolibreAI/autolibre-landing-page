import type { MetadataRoute } from "next";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { getPosts, postPath } from "@/lib/hygraph/posts";
import { siteConfig } from "@/lib/seo/config";

/**
 * Rutas públicas del sitio. Al sumar una página nueva, agregarla acá.
 *
 * `lastModified` es una fecha fija por ruta y no `new Date()`: con la fecha
 * del build, cada deploy le avisa a Google que todas las páginas cambiaron
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
    path: "/descarga",
    lastModified: "2026-09-17",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/pedido",
    lastModified: "2026-09-23",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/blog",
    lastModified: "2026-09-23",
    changeFrequency: "weekly",
    priority: 0.7,
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
    lastModified: "2026-09-28",
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Mientras el blog no es público (`lib/blog/visibility.ts`), ni el listado
  // ni los posts van al sitemap: sus páginas llevan `noindex`.
  const pages = routes
    .filter((route) => BLOG_PUBLIC || route.path !== "/blog")
    .map((route) => ({
      url: route.path === "/" ? siteConfig.url : `${siteConfig.url}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  // Los posts salen de Hygraph, no de la lista fija de arriba. Su fecha de
  // publicación hace de `lastModified`: es estable entre deploys.
  const posts = (BLOG_PUBLIC ? await getPosts() : []).map((post) => ({
    url: `${siteConfig.url}${postPath(post)}`,
    lastModified: post.date || undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
