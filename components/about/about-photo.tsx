import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { aboutContent, type AboutPhoto as AboutPhotoData } from "@/lib/content/about";
import { cn } from "@/lib/utils";

type AboutPhotoProps = {
  readonly photo?: AboutPhotoData;
  /** Cuánto ocupa la foto en cada viewport. */
  readonly sizes: string;
  /** Proporción y radio del marco (`aspect-*`, `rounded-*`). */
  readonly className?: string;
};

/**
 * Retrato del equipo dentro de un marco de proporción fija. Sin foto todavía,
 * el marco queda igual con un recuadro "Foto pendiente": mismo espacio, así
 * que el día que llega la foto el layout no se mueve (CLS 0).
 *
 * El recuadro es decorativo (`aria-hidden`): no hay nada que describir.
 *
 * Sin `preload`: ninguna foto de la página es la LCP (lo es el `h1` del hero)
 * y los retratos están lejos del primer viewport.
 */
export function AboutPhoto({ photo, sizes, className }: AboutPhotoProps) {
  return (
    <div className={cn("relative overflow-clip bg-surface-muted", className)}>
      {photo ? (
        <Image
          src={photo.src}
          alt={photo.alt}
          width={photo.width}
          height={photo.height}
          sizes={sizes}
          className="size-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className="flex size-full flex-col items-center justify-center gap-3 text-brand-hover"
        >
          <span className="flex size-16 items-center justify-center rounded-card bg-surface">
            <Icon name="image" size={28} />
          </span>
          <span className="text-label font-semibold">{aboutContent.photoPlaceholder}</span>
        </div>
      )}
    </div>
  );
}
