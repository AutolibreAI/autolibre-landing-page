import { buildBlogFeed } from "@/lib/blog/feed";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { getPosts } from "@/lib/hygraph/posts";

/**
 * `/blog/rss.xml`. Un `GET` de route handler es dinámico por defecto desde
 * Next 15: con `revalidate` queda estático y se regenera con la misma
 * ventana que el fetch a Hygraph. El webhook (`/api/revalidate`) invalida el
 * tag `hygraph`, así que una nota publicada aparece acá en segundos.
 *
 * El segmento estático `rss.xml` le gana a `[category]`: no choca con las
 * páginas de categoría.
 */
export const revalidate = 300;

export async function GET() {
  if (!BLOG_PUBLIC) return new Response("Not found", { status: 404 });

  const posts = await getPosts();

  return new Response(buildBlogFeed(posts), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
