import Image from "next/image";
import { eyebrowOnDark, sectionTitleLg } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { StoreLinks } from "@/components/ui/store-links";
import { homeContent } from "@/lib/content/home";

/**
 * La app: panel oscuro (`action`) con tres funciones, las tiendas y una
 * captura real del inicio de la app. `id="descargar"` vive en las tiendas:
 * es el ancla `/#descargar` que no se toca (PRODUCT.md).
 *
 * La captura está debajo del pliegue: `next/image` lazy, con su tamaño real
 * y `sizes` del ancho en que se muestra. No es LCP.
 */
export function AppPanelSection() {
  const { eyebrow: label, title, items, downloadNote, screenshot } = homeContent.app;

  return (
    <Section id="producto" tone="canvas" spacing="md" aria-labelledby="producto-title" className="pt-0 md:pt-0">
      <div className="flex flex-wrap overflow-clip rounded-3xl bg-action text-white">
        <div className="flex min-w-0 flex-[1.3_1_26rem] flex-col gap-4.5 p-7 md:p-10 lg:p-14">
          <p className={eyebrowOnDark}>{label}</p>
          <h2 id="producto-title" className={sectionTitleLg}>
            {title}
          </h2>
          <ul className="mt-1 flex flex-col gap-2">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl bg-action-hover px-4.5 py-3.5">
                <h3 className="font-display text-lg font-semibold">{item.title}</h3>
                <p className="mt-0.5 text-control text-on-dark">{item.body}</p>
              </li>
            ))}
          </ul>
          <StoreLinks id="descargar" tone="ink" placement="home_app" note={downloadNote} className="mt-2" />
        </div>
        <div className="flex min-w-0 flex-[1_1_18rem] items-end justify-center px-6 pt-6 md:pt-12">
          <div className="h-110 w-67.5 overflow-clip rounded-t-4xl border-8 border-b-0 border-ink bg-card">
            <Image
              src={screenshot.src}
              alt={screenshot.alt}
              width={screenshot.width}
              height={screenshot.height}
              sizes="254px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </div>
    </Section>
  );
}
