import { eyebrowOnDark, sectionTitleLg } from "@/components/marketing/styles";
import { Section } from "@/components/ui/section";
import { StoreLinks } from "@/components/ui/store-links";
import { blogContent } from "@/lib/content/blog";

type BlogAppBandProps = {
  /**
   * `placement` de `app_store_clicked`. Se conservan los que ya medían esas
   * superficies: `closing_cta` (listado y categorías, antes la banda verde de
   * cierre) y `blog_article` (la nota, antes el bloque del final del cuerpo).
   */
  readonly placement: "closing_cta" | "blog_article";
};

/**
 * Cierre del blog (listado, categorías y nota): panel oscuro `action` con la
 * descarga de la app, como en el lienzo. Reemplaza a la banda verde del
 * sistema anterior (`ClosingCtaSection`) y, en la nota, al bloque de descarga
 * dentro del cuerpo. Texto sobre `action`: `on-dark` 11.00:1, eyebrow
 * `brand-200` 9.81:1. Server Component, sin imágenes.
 */
export function BlogAppBand({ placement }: BlogAppBandProps) {
  const { label, title, text } = blogContent.appCta;

  return (
    <Section spacing="md" aria-labelledby="blog-app-titulo" className="bg-card">
      <div className="flex flex-wrap items-center justify-between gap-x-12 gap-y-6 rounded-3xl bg-action p-7 text-white md:p-10 lg:p-14">
        <div className="min-w-0 flex-[1_1_26rem]">
          <p className={`mb-2 ${eyebrowOnDark}`}>{label}</p>
          <h2 id="blog-app-titulo" className={sectionTitleLg}>
            {title}
          </h2>
          <p className="mt-2.5 max-w-130 text-on-dark">{text}</p>
        </div>
        <StoreLinks tone="ink" placement={placement} />
      </div>
    </Section>
  );
}
