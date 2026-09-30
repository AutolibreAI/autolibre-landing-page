import Link from "next/link";
import { PostCard } from "@/components/blog/post-card";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { homeContent } from "@/lib/content/home";
import { getPosts } from "@/lib/hygraph/posts";

/** Notas que muestra la home: una fila de la grilla en desktop. */
const GUIDES_COUNT = 3;

/**
 * Últimas notas del blog en la home. La home es la página con más autoridad
 * del sitio: enlazar desde acá a las notas les pasa parte de esa autoridad
 * y le da a Google un camino corto (un click) hasta el contenido nuevo.
 *
 * Server Component: las cards llegan en el HTML inicial. La lista sale del
 * mismo fetch cacheado del blog (tag `hygraph`), así que la home se regenera
 * sola cuando se publica una nota. Si Hygraph falla, `getPosts` devuelve
 * `[]` y la sección no se renderiza: la home nunca se cae por el blog.
 */
export async function LatestGuidesSection() {
  if (!BLOG_PUBLIC) return null;

  const posts = (await getPosts()).slice(0, GUIDES_COUNT);
  if (posts.length === 0) return null;

  const { title, subtitle, cta } = homeContent.guides;

  return (
    <Section id="guias" tone="subtle" spacing="md" aria-labelledby="guias-title">
      <div className="flex flex-col gap-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex max-w-150 flex-col gap-3">
            <h2 id="guias-title" className="text-3xl leading-tight text-ink md:text-4xl">
              {title}
            </h2>
            <p className="text-lead leading-relaxed text-ink/70 md:text-lead-lg">{subtitle}</p>
          </div>
          <Link
            href="/blog"
            className="inline-flex min-h-11 shrink-0 items-center gap-2 font-semibold text-brand-hover transition-colors hover:text-brand"
          >
            {cta}
            <Icon name="arrow-right" size={18} />
          </Link>
        </div>

        <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <li key={post.id}>
              <PostCard post={post} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
