import type { MetadataRoute } from "next";
import { fetchAllPartners } from "@/lib/autolibre-api";
import {
  PROVEEDORES_PATH,
  PROVEEDORES_PLANES_PATH,
  PROVEEDORES_REGISTRO_PATH,
  RESERVED_PROFILE_SLUGS,
  partnerPath,
} from "@/lib/proveedores/query";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { FAQ_PATH } from "@/lib/content/faq";
import { categoryPath } from "@/lib/blog/query";
import { collectCategories, getPosts, postPath } from "@/lib/hygraph/posts";
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
    lastModified: "2026-11-26",
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
    lastModified: "2026-11-24",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: FAQ_PATH,
    lastModified: "2026-11-26",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/blog",
    lastModified: "2026-11-24",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: PROVEEDORES_REGISTRO_PATH,
    lastModified: "2026-11-27",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: PROVEEDORES_PLANES_PATH,
    lastModified: "2026-11-27",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: PROVEEDORES_PATH,
    lastModified: "2026-11-26",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/sobre-nosotros",
    lastModified: "2026-11-26",
    changeFrequency: "monthly",
    priority: 0.6,
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
    lastModified: "2026-11-26",
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

/** `lastModified` de un perfil cuando el backend no manda `updatedAt`: el rediseño (fase 4b). */
const PARTNER_PROFILES_FALLBACK_DATE = "2026-11-24";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Mientras el blog no es público (`lib/blog/visibility.ts`), ni el listado
  // ni los posts van al sitemap: sus páginas llevan `noindex`.
  const pages: MetadataRoute.Sitemap = routes
    .filter((route) => BLOG_PUBLIC || route.path !== "/blog")
    .map((route) => ({
      url: route.path === "/" ? siteConfig.url : `${siteConfig.url}${route.path}`,
      lastModified: route.lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }));

  // Los posts salen de Hygraph, no de la lista fija de arriba. Su fecha de
  // publicación hace de `lastModified`: es estable entre deploys.
  const allPosts = BLOG_PUBLIC ? await getPosts() : [];

  // `/blog` cambia cada vez que se publica o edita una nota: su fecha es la
  // de la más reciente y no una fija que queda vieja con cada publicación.
  const latestPostDate = allPosts.reduce(
    (latest, post) => {
      const date = post.updatedAt || post.date;
      return date > latest ? date : latest;
    },
    "",
  );
  const blogEntry = pages.find((page) => page.url === `${siteConfig.url}/blog`);
  if (blogEntry && latestPostDate) blogEntry.lastModified = latestPostDate;

  // Una página por categoría con posts. Su `lastModified` es el del post más
  // nuevo que contiene (la lista viene ordenada por fecha, más nuevo primero).
  const categories = collectCategories(allPosts).map((category) => ({
    url: `${siteConfig.url}${categoryPath(category.slug)}`,
    lastModified:
      allPosts.find((post) => post.category.slug === category.slug)?.date || undefined,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  const posts = allPosts.map((post) => ({
    url: `${siteConfig.url}${postPath(post)}`,
    lastModified: post.updatedAt || post.date || undefined,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Perfiles de los negocios de la red (`/proveedores/[slug]`): TODOS los del
  // directorio (decisión de producto del 2026-11-24: todos los perfiles se
  // indexan, sin depender de `indexable` del backend). Salen del directorio
  // completo (cacheado 1 h, el mismo que usa `/proveedores`). `lastModified`:
  // la última edición del negocio que manda el backend (`updatedAt`), estable
  // entre deploys; si no viene, la fecha fija del rediseño (nunca la del
  // build: le diría a Google que todos cambiaron en cada deploy). Si el
  // backend falla, el sitemap sale igual sin ellos. Los slugs reservados (ej.
  // `registro`) no son perfiles: esa URL es otra página.
  const partners = await fetchAllPartners().catch((error: unknown) => {
    console.error("[sitemap] no se pudieron leer los proveedores:", error);
    return [];
  });
  const partnerPages = partners
    .filter((partner) => !RESERVED_PROFILE_SLUGS.includes(partner.slug))
    .map((partner) => ({
      url: `${siteConfig.url}${partnerPath(partner.slug)}`,
      lastModified: partner.updatedAt ?? PARTNER_PROFILES_FALLBACK_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    }));

  return [...pages, ...categories, ...posts, ...partnerPages];
}
