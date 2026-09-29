import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { blogContent } from "@/lib/content/blog";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type LatestListProps = {
  readonly posts: readonly BlogPostSummary[];
  /** Destino de "Ver todas": la grilla completa, más abajo en la misma página. */
  readonly seeAllHref: string;
};

/** Columna lateral junto a la nota destacada: lista compacta, sin imagen. */
export function LatestList({ posts, seeAllHref }: LatestListProps) {
  if (posts.length === 0) return null;

  return (
    <aside aria-labelledby="ultimas-notas">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
        <h2 id="ultimas-notas" className="text-2xl text-ink">
          {blogContent.latest.heading}
        </h2>
        <Link
          href={seeAllHref}
          className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-hover hover:text-brand"
        >
          {blogContent.latest.seeAll}
        </Link>
      </div>
      <ul>
        {posts.map((post) => {
          const date = formatPostDate(post.date);
          return (
            <li key={post.id} className="border-b border-line last:border-b-0">
              <article>
                <Link href={postPath(post)} className="group flex flex-col gap-1.5 py-5">
                  <p className="text-label font-semibold text-brand-hover">{post.category.name}</p>
                  <h3 className="text-xl leading-snug text-ink transition-colors group-hover:text-brand-hover">
                    {post.title}
                  </h3>
                  {date ? (
                    <p className="text-label text-ink/60">
                      <time dateTime={post.date}>{date}</time>
                    </p>
                  ) : null}
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
