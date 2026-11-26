import { PostCard } from "@/components/blog/post-card";
import { GuideLinks } from "@/components/marketing/guide-links";
import { eyebrow, sectionLead, sectionTitle } from "@/components/marketing/styles";
import { ButtonLink } from "@/components/ui/button";
import { Section } from "@/components/ui/section";
import { getGuidePicks } from "@/lib/blog/picks";
import { BLOG_PUBLIC } from "@/lib/blog/visibility";
import { homeContent } from "@/lib/content/home";
import { presupuestoContent } from "@/lib/content/presupuesto";

/** Notas con portada: una fila de la grilla en desktop. */
const LATEST_COUNT = 3;

/**
 * Guías del blog en el Home: las 3 más nuevas con portada (de Hygraph, en el
 * server) y debajo "Más guías", las que el lienzo elige a mano (las mismas
 * que recomienda `/pedido`). Cada una enlaza a su nota: el Home es la página
 * con más autoridad y les da a las notas un camino de un click.
 *
 * Outline: h2 → h3 por nota (`PostCard`) → h3 "Más guías".
 */
export async function GuidesSection() {
  if (!BLOG_PUBLIC) return null;

  const { latest, picked } = await getGuidePicks({
    latest: LATEST_COUNT,
    slugs: presupuestoContent.pedidoPage.guides.slugs,
  });
  if (latest.length === 0) return null;

  const { title, subtitle, cta, moreTitle } = homeContent.guides;

  return (
    <Section id="guias" tone="card" spacing="md" aria-labelledby="guias-title">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="max-w-150">
          <h2 id="guias-title" className={sectionTitle}>
            {title}
          </h2>
          <p className={`mt-1.5 ${sectionLead}`}>{subtitle}</p>
        </div>
        <ButtonLink href="/blog" variant="outline" size="44">
          {cta}
        </ButtonLink>
      </div>

      <ul className="mt-6 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {latest.map((post) => (
          <li key={post.id}>
            <PostCard post={post} />
          </li>
        ))}
      </ul>

      {picked.length > 0 ? (
        <div className="mt-8 border-t border-card-line pt-5">
          <h3 className={`mb-1 ${eyebrow}`}>{moreTitle}</h3>
          <GuideLinks posts={picked} />
        </div>
      ) : null}
    </Section>
  );
}
