import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";
import { blogContent } from "@/lib/content/blog";
import { siteConfig } from "@/lib/seo/config";

/** Path del feed. Lo usan la route handler y el `<link rel="alternate">`. */
export const BLOG_FEED_PATH = "/blog/rss.xml";

/** Escapa los cinco caracteres reservados de XML. */
function xml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * `YYYY-MM-DD` → fecha RFC 822 (`Tue, 29 Sep 2026 00:00:00 GMT`), el formato
 * que exige RSS 2.0. Hygraph guarda el día sin hora: se toma medianoche UTC.
 */
function rfc822(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toUTCString();
}

/**
 * Feed RSS 2.0 del blog: todas las notas publicadas, de la más nueva a la más
 * vieja. Es la vía rápida para que buscadores, lectores de feeds y crawlers
 * de LLMs se enteren de una nota nueva sin esperar a recorrer el sitemap.
 *
 * `pubDate` es la fecha de publicación y no la de edición: un lector de
 * feeds que la vea cambiar mostraría la nota como nueva otra vez.
 */
export function buildBlogFeed(posts: readonly BlogPostSummary[]): string {
  const { title, description } = blogContent.feed;
  const blogUrl = `${siteConfig.url}/blog`;
  const lastBuild = posts.reduce((latest, post) => {
    const date = post.updatedAt || post.date;
    return date > latest ? date : latest;
  }, "");

  const items = posts
    .map((post) => {
      const url = `${siteConfig.url}${postPath(post)}`;
      const pubDate = rfc822(post.date);
      return [
        "    <item>",
        `      <title>${xml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        post.excerpt ? `      <description>${xml(post.excerpt)}</description>` : "",
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : "",
        `      <category>${xml(post.category.name)}</category>`,
        `      <dc:creator>${xml(post.authorName)}</dc:creator>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xml(title)}</title>`,
    `    <link>${blogUrl}</link>`,
    `    <description>${xml(description)}</description>`,
    `    <language>${siteConfig.lang.toLowerCase()}</language>`,
    lastBuild ? `    <lastBuildDate>${rfc822(lastBuild)}</lastBuildDate>` : "",
    `    <atom:link href="${siteConfig.url}${BLOG_FEED_PATH}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ]
    .filter(Boolean)
    .join("\n");
}
