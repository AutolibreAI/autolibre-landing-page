import Link from "next/link";
import { formatPostDate } from "@/components/blog/format-date";
import { blogHref } from "@/lib/blog/query";
import { postPath, type BlogPostSummary } from "@/lib/hygraph/posts";

type LatestListProps = {
  readonly posts: readonly BlogPostSummary[];
};

/** Columna lateral junto a la nota destacada: lista compacta, sin imagen. */
export function LatestList({ posts }: LatestListProps) {
  if (posts.length === 0) return null;

  return (
    <aside aria-labelledby="ultimas-notas">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-4">
        <h2 id="ultimas-notas" className="font-display text-xl font-bold text-ink lg:text-2xl">
          Últimas notas
        </h2>
        <Link
          href={blogHref({})}
          className="text-sm font-semibold text-brand-hover hover:text-brand"
        >
          Ver todas
        </Link>
      </div>
      <ul>
        {posts.map((post) => {
          const date = formatPostDate(post.date);
          return (
            <li key={post.id} className="border-b border-line last:border-b-0">
              <Link
                href={postPath(post)}
                className="group flex flex-col gap-1.5 py-5"
              >
                <p className="text-[0.8125rem] font-semibold text-brand-hover">
                  {post.category.name}
                </p>
                <h3 className="text-lg leading-snug font-bold text-ink group-hover:text-brand-hover">
                  {post.title}
                </h3>
                {date ? <p className="text-[0.8125rem] text-ink/50">{date}</p> : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
