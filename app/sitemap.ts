import type { MetadataRoute } from "next";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { categoryPath } from "@/lib/blog/query";
import { collectCategories, getPosts, postPath } from "@/lib/hygraph/posts";
import { listAllProviderSummaries } from "@/lib/provider-profile/api";
import { PROVIDER_PROFILES_PUBLIC } from "@/lib/provider-profile/visibility";
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
    lastModified: "2026-10-07",
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
    path: "/sobre-nosotros",
    lastModified: "2026-09-29",
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

  // Perfiles de proveedores: solo con el interruptor encendido, y solo los
  // INDEXABLES (un perfil pobre lleva `noindex` y no entra al mapa). El listado
  // lo cambia cada vez que se aprueba o edita un proveedor, así que el
  // `lastModified` de `/p` es el del perfil más reciente. Si el backend no
  // responde el listado viene vacío y se omite la sección, sin romper el build.
  const providers = PROVIDER_PROFILES_PUBLIC
    ? (await listAllProviderSummaries()).filter((summary) => summary.indexable)
    : [];
  const latestProviderDate = providers.reduce(
    (latest, summary) => (summary.updatedAt > latest ? summary.updatedAt : latest),
    "",
  );
  const providerIndex =
    providers.length > 0
      ? [
          {
            url: `${siteConfig.url}/p`,
            lastModified: latestProviderDate || undefined,
            changeFrequency: "daily" as const,
            priority: 0.7,
          },
        ]
      : [];
  const providerPages = providers.map((summary) => ({
    url: `${siteConfig.url}/p/${summary.slug}`,
    lastModified: summary.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...pages, ...categories, ...posts, ...providerIndex, ...providerPages];
}
