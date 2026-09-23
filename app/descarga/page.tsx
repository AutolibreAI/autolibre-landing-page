import type { Metadata, Viewport } from "next";
import Image from "next/image";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { QrCode } from "@/components/ui/qr-code";
import { StoreLinks } from "@/components/ui/store-links";
import { descargaContent } from "@/lib/content/descarga";
import { createMetadata } from "@/lib/seo/metadata";
import {
  breadcrumbSchema,
  graph,
  organizationSchema,
  softwareApplicationSchema,
  webPageSchema,
} from "@/lib/seo/schema";

const { meta } = descargaContent;
const TITLE = meta.title;
const DESCRIPTION = meta.description;
const PATH = "/descarga";

/**
 * Se indexa: "descargar app autolibre" es una búsqueda plausible y esta es la
 * página que tiene que responderla. El `title` no repite la marca, de eso se
 * encarga el template del layout raíz.
 */
export const metadata: Metadata = createMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

/**
 * El layout raíz declara `themeColor: "#2a8c3a"` y `colorScheme: "light"`,
 * que es lo correcto para un sitio que es blanco de punta a punta. Esta es la
 * única página `ink` completa: sin este override, el navegador mobile pinta
 * una banda verde de marca justo arriba de una página `#1c2b1c`.
 *
 * Los campos declarados acá pisan a los del layout raíz; los que no se
 * declaran se heredan.
 */
export const viewport: Viewport = {
  themeColor: "#1c2b1c",
  colorScheme: "dark",
};

/**
 * `softwareApplicationSchema` es justamente el nodo que describe una app
 * descargable: categoría, sistemas operativos, las dos URLs de tienda y que es
 * gratis. Estaba sólo en el home; acá es donde más corresponde.
 */
const schema = graph(
  organizationSchema(),
  webPageSchema({ name: TITLE, description: DESCRIPTION, path: PATH }),
  softwareApplicationSchema(),
  breadcrumbSchema([
    { name: "Inicio", path: "/" },
    { name: "Descargar la app", path: PATH },
  ]),
);

/**
 * Una sola pantalla, una sola acción.
 *
 * No usa `PageShell` ni `Section`: no hay secciones que ritmar. El header del
 * sitio además trae el CTA "Descargar la app" apuntando a `/#descargar`, que
 * en una página de descarga es circular y encima manda al home — justo la fuga
 * que esta página vino a tapar.
 *
 * Va sobre `ink` y no sobre el verde de marca por contraste: blanco sobre
 * `#2a8c3a` da 4.28:1, abajo del 4.5:1 que necesita el texto chico. Sobre
 * `#1c2b1c` da 14:1. Y de paso los botones blancos quedan siendo lo más
 * brillante de la pantalla, que es exactamente donde tiene que ir el ojo.
 */
export default function DescargaPage() {
  const {
    titleLines,
    subtitle,
    downloadNote,
    qr,
    logoAlt,
    homeLinkLabel,
    legalLinks,
  } = descargaContent;

  return (
    // El anillo de foco global es `--color-brand`, que sobre `ink` da 3.47:1:
    // pasa el piso de 3:1 pero es el foco más flojo del sitio. Sobre esta
    // página se usa `brand-soft`, que da 5:1 y sigue siendo un token del
    // sistema. Se acota acá y no se toca `globals.css`, donde el verde de
    // marca sí contrasta bien porque el resto del sitio es blanco.
    <div className="flex min-h-dvh flex-col bg-ink text-white selection:bg-brand selection:text-white [&_a:focus-visible]:outline-brand-soft">
      <header className="px-[6%] pt-7">
        {/* El lockup mide 24px de alto: el padding lo lleva a 44px de área
            táctil, y el margen negativo lo devuelve a su posición visual. */}
        <Link
          href="/"
          aria-label={homeLinkLabel}
          className="-m-2.5 inline-flex rounded-field p-2.5"
        >
          {/* Sobre `ink` va el lockup de tinta blanca. Ver public/brand/README.md */}
          <Image
            src="/brand/lockup-dark.png"
            alt={logoAlt}
            width={676}
            height={132}
            /* No es el LCP (lo es el h1): `eager` y no `priority`, que en
               Next 16 está deprecado. */
            loading="eager"
            sizes="123px"
            className="h-6 w-auto"
          />
        </Link>
      </header>

      <main className="flex flex-1 items-center px-[6%] py-14">
        <div className="mx-auto w-full max-w-176 text-center">
          <h1 className="font-display text-[2.75rem] leading-[1.05] font-bold text-white sm:text-[3.5rem] lg:text-[4rem]">
            {titleLines[0]}
            <br />
            {titleLines[1]}
          </h1>

          <p className="mx-auto mt-7 max-w-140 text-[1.0625rem] leading-relaxed text-balance text-white/72 md:text-[1.1875rem]">
            {subtitle}
          </p>

          {/* En mobile los dos botones no entran en una línea: apilados y con
              su ancho natural quedan desparejos, así que van a ancho completo
              y con el contenido centrado. Desde `sm` vuelven a su ancho propio,
              uno al lado del otro. Se ajusta desde acá y no tocando
              `StoreLinks`, que lo comparten el hero y el cierre del home. */}
          <div className="mt-11 flex flex-col items-center">
            <StoreLinks
              tone="brand"
              note={downloadNote}
              className="w-full max-w-68 text-center sm:max-w-none [&>div]:justify-center [&>div>a]:w-full [&>div>a]:justify-center sm:[&>div>a]:w-auto"
            />
          </div>

          {/* El QR vive detrás de una regla propia: no es una alternativa a los
              botones, es el camino del que llegó desde el escritorio. */}
          <div className="mt-14 hidden border-t border-white/12 pt-12 lg:block">
            <div className="flex items-center justify-center gap-5">
              {/* 144px para 37 módulos son ~3.9px por módulo. A 112px daban 3,
                  que escanea pero le cuesta a cámaras malas y webcams. */}
              <div className="rounded-card bg-white p-3">
                <QrCode title={qr.alt} className="size-36 text-ink" />
              </div>
              <div className="max-w-60 text-left">
                <p className="font-display text-base font-semibold text-white">
                  {qr.title}
                </p>
                <p className="mt-1.5 text-[0.875rem] leading-relaxed text-white/72">
                  {qr.body}
                </p>
                {/* Salida si la cámara no coopera. */}
                <p className="mt-2.5 font-display text-[0.875rem] font-semibold text-white">
                  {qr.url}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Los links van a 44px de alto como el menú mobile, no a la altura de su
          línea de texto: 17px queda abajo del mínimo táctil. El margen negativo
          absorbe el alto extra para que la línea no se despegue del borde.
          El `env(safe-area-inset-bottom)` es imprescindible acá y no decorativo:
          sin él, en un iPhone con notch la mitad inferior de esos botones de
          44px cae bajo la franja del indicador de home y deja de ser tocable —
          el arreglo del área táctil se anularía solo. Misma convención que
          `components/layout/mobile-nav.tsx`. */}
      <footer className="px-[6%] pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <nav aria-label="Legal">
          <ul className="-my-3 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {legalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-field px-3 text-[0.8125rem] text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </footer>

      <JsonLd schema={schema} />
    </div>
  );
}
