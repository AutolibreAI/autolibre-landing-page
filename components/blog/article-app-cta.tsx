import Image from "next/image";
import { StoreLinks } from "@/components/ui/store-links";
import { blogContent } from "@/lib/content/blog";
import { homeContent } from "@/lib/content/home";

/**
 * Bloque de descarga al final del cuerpo de la nota: el momento en que el
 * lector ya obtuvo su respuesta. Va sobre `ink` y no sobre verde: lleva texto
 * chico, y el blanco sobre `brand` no llega a 4.5:1 (DESIGN.md, "White-Ground
 * Green Rule").
 *
 * La captura es una pantalla real de la app (la ficha del auto, la misma del
 * hero de la home) y carga lazy: está debajo del pliegue.
 */
export function ArticleAppCta() {
  const screen = homeContent.hero.screens[2]!;
  const { appCta } = blogContent;

  return (
    <aside
      aria-label={appCta.label}
      className="mt-14 grid overflow-clip rounded-panel bg-ink text-white sm:grid-cols-[1fr_auto]"
    >
      <div className="flex flex-col gap-4 p-8 md:p-10">
        <p className="font-display text-2xl leading-tight font-bold md:text-3xl">{appCta.title}</p>
        <p className="text-base leading-relaxed text-white/75">{appCta.text}</p>
        <StoreLinks tone="ink" placement="blog_article" className="pt-2" />
      </div>
      {/* Fuera del flujo: el alto del bloque lo marca el texto y el teléfono
          queda recortado abajo, asomando desde el borde. */}
      <div aria-hidden="true" className="relative hidden w-52 sm:block">
        {/* El bisel es fondo + padding y no un `border`: así la pantalla lleva
            su propio radio (externo − padding) y las esquinas quedan parejas. */}
        <div className="absolute inset-x-0 top-10 bottom-0 mr-10 rounded-t-4xl bg-white/15 px-2 pt-2">
          <div className="h-full overflow-clip rounded-t-3xl">
            <Image
              src={screen.src}
              alt=""
              width={screen.width}
              height={screen.height}
              sizes="208px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </aside>
  );
}
