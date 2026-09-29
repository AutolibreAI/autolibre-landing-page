import Image from "next/image";
import { categoryIcon } from "@/components/blog/category-icon";
import { Icon } from "@/components/ui/icon";
import type { BlogPostSummary } from "@/lib/hygraph/posts";
import { cn } from "@/lib/utils";

type PostCoverProps = {
  readonly post: Pick<BlogPostSummary, "coverImage" | "category">;
  /** `sizes` de la imagen: cuánto ocupa la portada en cada viewport. */
  readonly sizes: string;
  /**
   * `true` SOLO en la portada que es la imagen LCP de la página (la nota
   * destacada del listado). Nunca en las cards de la grilla.
   */
  readonly preload?: boolean;
  /** Tamaño del ícono de la portada sin imagen. */
  readonly iconSize?: "md" | "lg";
  readonly className?: string;
};

/**
 * Portada de una nota. Con imagen, la muestra recortada al marco; sin imagen,
 * una ficha con el ícono de la categoría sobre verde pálido, en vez de un
 * bloque vacío o una foto de stock: sigue el sistema (un solo verde, plano)
 * y no le suma peso a la página.
 *
 * El `alt` es vacío a propósito: la portada acompaña al título, que ya está
 * al lado como texto del link. Describirla repetiría lo mismo.
 */
export function PostCover({
  post,
  sizes,
  preload = false,
  iconSize = "md",
  className,
}: PostCoverProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-clip rounded-card bg-surface-muted",
        className,
      )}
    >
      {post.coverImage ? (
        <Image
          src={post.coverImage.url}
          alt=""
          fill
          sizes={sizes}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className={cn(
            "flex items-center justify-center rounded-card bg-surface text-brand-hover",
            iconSize === "lg" ? "size-24" : "size-18",
          )}
        >
          <Icon name={categoryIcon(post.category.slug)} size={iconSize === "lg" ? 40 : 30} />
        </span>
      )}
    </div>
  );
}
