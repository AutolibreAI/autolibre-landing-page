import Image from "next/image";
import { sectionTitle } from "@/components/marketing/styles";
import { AlliesCarousel } from "@/components/sections/home/allies-carousel";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";
import { siteContent } from "@/lib/content/site";

/**
 * Carrusel de banners de aliados ("Beneficios"): cada uno es una pieza
 * publicitaria propia (no un simple logo), fiel a la pieza original de cada
 * aliado — color de marca exacto, logo de AutoLibre a la par del logo del
 * aliado. Esos colores son del partner, no del design system de AutoLibre:
 * van inline, a propósito (regla de los tokens de `@theme` en AGENTS.md,
 * punto 7 — último recurso justificado).
 *
 * Layout (referencia de producto, 2026-11-26; reemplaza el full-bleed del
 * 2026-11-17): sección `canvas` con el `Container` wide de siempre. Arriba,
 * el `<h2>` visible a la izquierda y las flechas a la derecha; el banner es
 * una tarjeta redondeada de ese ancho, con el rótulo "Publicidad" (vuelve:
 * la referencia lo muestra); abajo, los puntos.
 *
 * El control (índice, autoplay, flechas, puntos) es la isla cliente
 * `AlliesCarousel`; el heading y cada banner se arman acá, en el server, y
 * viajan como props ya resueltos.
 */
export function AlliesSection() {
  const { title, carouselLabel, adLabel, prevLabel, nextLabel, goToLabel, slides } = homeContent.allies;
  const [asistir24, sinfotomultas, integrity, esquina] = slides;

  return (
    // `canvas` como el panel de la app de abajo, que arranca con `pt-0`:
    // el `pb` de esta sección es el aire entre los dos.
    <Section id="aliados" tone="canvas" spacing="md" aria-labelledby="allies-title">
      <AlliesCarousel
        heading={
          <h2 key="allies-title" id="allies-title" className={sectionTitle}>
            {title}
          </h2>
        }
        label={carouselLabel}
        adLabel={adLabel}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        goToLabels={slides.map((_, position) => goToLabel(position + 1))}
        slides={[
          // Primero: es la promo con fecha de vencimiento (pedido 2026-11-25).
          <EsquinaNeumaticoSlide key={esquina.id} slide={esquina} />,
          <Asistir24Slide key={asistir24.id} slide={asistir24} />,
          <SinFotomultasSlide key={sinfotomultas.id} slide={sinfotomultas} />,
          <IntegritySlide key={integrity.id} slide={integrity} />,
        ]}
      />
    </Section>
  );
}

/**
 * Alto del carrusel desde 1440px (pedido 2026-11-25): el de la pieza de La
 * Esquina del Neumático (4:1), así esa imagen ocupa el banner entero sin
 * franjas. Ahora el banner es una tarjeta del ancho del `Container` wide
 * (88vw con tope de 1440px), no de la ventana: 4:1 de eso es
 * `min(22vw, 360px)`. Si un banner armado con código necesita más alto, la
 * tarjeta crece y la pieza recorta unos px arriba y abajo (`object-cover`).
 * Valor arbitrario a propósito: la escala de Tailwind no tiene un `min()`.
 * Abajo de 1440px sigue `min-h-150 sm:min-h-120`.
 */
const DESKTOP_HEIGHT = "banner:min-h-[min(22vw,360px)]";

/** Padding de los banners armados con código (antes lo daba un `Container`). */
const SLIDE_PADDING = "px-6 sm:px-10 md:px-12 lg:px-16";

type Asistir24SlideData = (typeof homeContent.allies.slides)[0];
type SinFotomultasSlideData = (typeof homeContent.allies.slides)[1];
type IntegritySlideData = (typeof homeContent.allies.slides)[2];
type EsquinaNeumaticoSlideData = (typeof homeContent.allies.slides)[3];

/** Logo de AutoLibre: ícono verde + "AutoLibre" blanco + ".AI" verde (la pieza original lo usa así, nunca el isologo todo blanco). */
function AutoLibreMark({ className }: { readonly className?: string }) {
  return (
    <Image
      src="/brand/lockup-dark.png"
      alt="AutoLibre.AI"
      width={140}
      height={32}
      sizes="140px"
      className={className ?? "h-6 w-auto"}
    />
  );
}

function Asistir24Slide({ slide }: { readonly slide: Asistir24SlideData }) {
  const { externalHint } = siteContent.nav;

  return (
    <article
      aria-labelledby="allies-asistir24-title"
      /* #005EBA: azul de marca de Asistir24. */
      style={{ background: "#005EBA" }}
      // `min-h-150 sm:min-h-120`: la misma en todos los banners, para que el
      // carrusel no salte de alto al pasar de uno a otro (pedido de producto,
      // 2026-11-17).
      className={`relative flex w-full min-h-150 flex-col text-white sm:min-h-120 sm:flex-row sm:items-stretch ${DESKTOP_HEIGHT}`}
    >
      {/* Panel de la izquierda: ~2/7 del ancho desde `lg`, como la pieza
          original. Entre `sm` y `lg` la tarjeta es angosta y 2/7 no alcanza
          para el "24" y el botón: ahí va 2/5. */}
      <div
        /* #F45C9D / #14102B: rosa y tinta de marca de Asistir24. */
        style={{ background: "#F45C9D", color: "#14102B" }}
        className="flex flex-col items-start justify-center gap-4 px-6 py-7 sm:w-2/5 sm:shrink-0 sm:gap-5 sm:py-6 md:px-8 lg:w-2/7 lg:gap-6 lg:px-10"
      >
        <p className="font-display text-6xl leading-none font-extrabold sm:text-7xl md:text-8xl lg:text-9xl">{slide.bigNumber}</p>
        <p className="font-display text-xl leading-tight font-bold sm:text-2xl lg:text-3xl">{slide.bigNumberLabel}</p>
        <a
          href={slide.badgeCta.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#14102B" }}
          className="mt-1 inline-flex h-11 items-center gap-2.5 rounded-field px-5 font-display text-base font-bold whitespace-nowrap text-white transition hover:opacity-90 xl:h-12 xl:px-6 xl:text-lg"
        >
          <Icon name="phone" size={20} />
          {slide.badgeCta.label}
          <span className="sr-only"> {externalHint}</span>
        </a>
      </div>

      <div className={`flex flex-1 flex-col justify-center ${SLIDE_PADDING}`}>
        <div className="flex w-full flex-col justify-center gap-4 py-8 sm:gap-5 sm:py-12 md:py-14 banner:py-6">
          <div className="flex items-center gap-3">
            <AutoLibreMark />
            <span aria-hidden="true" className="font-display text-lg font-semibold text-white/50">
              ×
            </span>
            <Image
              src={slide.partnerLogo.src}
              alt={slide.partnerLogo.alt}
              width={slide.partnerLogo.width}
              height={slide.partnerLogo.height}
              sizes="80px"
              className="h-10 w-auto object-contain"
            />
          </div>
          <h3 id="allies-asistir24-title" className="font-display text-3xl leading-tight font-bold md:text-4xl lg:text-5xl">
            {slide.headline}
          </h3>
          <p className="max-w-150 text-base text-white/90 md:text-lg">{slide.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-11 items-center rounded-full border-2 border-white px-5 font-display text-sm font-semibold whitespace-nowrap">
              {slide.steps[0]}
            </span>
            {/* #F45C9D: rosa de marca de Asistir24. */}
            <span className="shrink-0" style={{ color: "#F45C9D" }}>
              <Icon name="arrow-right" size={20} />
            </span>
            {/* #005EBA: azul de marca de Asistir24. */}
            <span
              style={{ color: "#005EBA" }}
              className="flex h-11 items-center rounded-full bg-white px-5 font-display text-sm font-bold whitespace-nowrap"
            >
              {slide.steps[1]}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function SinFotomultasSlide({ slide }: { readonly slide: SinFotomultasSlideData }) {
  const { externalHint } = siteContent.nav;
  const highlightIndex = slide.headlineHighlight ? slide.headline.indexOf(slide.headlineHighlight) : -1;
  const before = highlightIndex >= 0 ? slide.headline.slice(0, highlightIndex) : slide.headline;
  const highlight = highlightIndex >= 0 ? slide.headline.slice(highlightIndex) : "";

  return (
    <article
      aria-labelledby="allies-sinfotomultas-title"
      /* #14171F: fondo de marca de Sin Fotomultas. */
      style={{ background: "#14171F" }}
      className={`relative flex w-full min-h-150 flex-col justify-center text-white sm:min-h-120 ${DESKTOP_HEIGHT}`}
    >
      <div className={`flex w-full flex-col gap-10 py-14 lg:flex-row lg:items-center sm:py-16 md:py-20 banner:py-6 ${SLIDE_PADDING}`}>
        <div className="flex flex-1 flex-col gap-5">
          <div className="flex items-center gap-3">
            <Image
              src={slide.partnerLogo.src}
              alt={slide.partnerLogo.alt}
              width={slide.partnerLogo.width}
              height={slide.partnerLogo.height}
              sizes="140px"
              className="h-6 w-auto object-contain"
            />
            <span aria-hidden="true" className="font-display text-lg font-semibold text-white/40">
              ×
            </span>
            <AutoLibreMark />
          </div>

          <h3 className="max-w-150 font-display text-3xl leading-tight font-bold md:text-5xl" id="allies-sinfotomultas-title">
            {before}
            {/* #EFC91F: amarillo de marca de Sin Fotomultas. */}
            <span style={{ color: "#EFC91F" }}>{highlight}</span>
          </h3>
          <p className="max-w-125 text-base leading-relaxed text-white/75 md:text-lg">{slide.description}</p>

          <div className="mt-1 flex flex-wrap items-center gap-4">
            <a
              href={slide.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: "#EFC91F", color: "#14171F" }}
              className="inline-flex h-11 items-center gap-2.5 rounded-field px-5 font-display text-base font-semibold transition hover:opacity-90"
            >
              {slide.cta.label}
              <Icon name="arrow-right" size={18} />
              <span className="sr-only"> {externalHint}</span>
            </a>
            <span className="inline-flex items-center gap-2 text-sm text-white/60">
              {/* #EFC91F: amarillo de marca de Sin Fotomultas. */}
              <span style={{ color: "#EFC91F" }}>
                <Icon name="shield-check" size={18} />
              </span>
              {slide.note.label}: {slide.note.value} {slide.note.unit}
            </span>
          </div>
        </div>

        {/* Tarjeta decorativa (pieza original): solo desde `lg`. Ahora el
            banner es una tarjeta del ancho del contenido, y más angosto el
            texto quedaba en una columna de ~150px. */}
        <div aria-hidden="true" className="relative hidden w-72 shrink-0 self-center lg:block">
          <div className="-rotate-3 rounded-card bg-white p-6 text-[#14171F] shadow-xl">
            <p className="font-display text-xs font-bold tracking-widest uppercase">Acta de infracción</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <span className="block h-2.5 w-[90%] rounded-field bg-ink/10" />
              <span className="block h-2.5 w-[70%] rounded-field bg-ink/10" />
              <span className="block h-2.5 w-[80%] rounded-field bg-ink/10" />
              <span className="block h-2.5 w-[55%] rounded-field bg-ink/10" />
            </div>
          </div>
          <div
            style={{ background: "#EFC91F", color: "#14171F" }}
            className="absolute -right-6 -bottom-6 flex size-28 rotate-6 flex-col items-center justify-center rounded-full text-center"
          >
            <span className="font-display text-sm leading-tight font-semibold">{slide.note.label}</span>
            <span className="font-display text-2xl leading-tight font-extrabold whitespace-nowrap">{slide.note.value}</span>
            <span className="font-display text-sm leading-tight font-semibold">{slide.note.unit}</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function IntegritySlide({ slide }: { readonly slide: IntegritySlideData }) {
  return (
    <article
      aria-labelledby="allies-integrity-title"
      /* Degradé de marca de Intēgrity (azules). */
      style={{
        background: "radial-gradient(ellipse 70% 90% at 55% 35%, #3F8EF2 0%, #1C60D2 45%, #0A3A96 100%)",
      }}
      // `min-h-150 sm:min-h-120`: la misma en los tres banners (pedido de
      // producto, 2026-11-17), para que el carrusel no salte de alto al pasar
      // de uno a otro.
      className={`relative flex w-full min-h-150 flex-col justify-center text-white sm:min-h-120 ${DESKTOP_HEIGHT}`}
    >
      <div className={`flex w-full flex-col gap-8 py-14 md:flex-row md:items-center sm:py-16 md:py-20 banner:py-6 ${SLIDE_PADDING}`}>
        <div className="flex flex-1 flex-col gap-5">
          <p className="inline-flex w-fit items-center rounded-full border-2 border-white/60 px-4 py-2 font-display text-xs font-semibold tracking-wide uppercase sm:text-sm">
            {slide.eyebrow}
          </p>

          <div className="flex flex-wrap items-end gap-6">
            <p className="font-display text-7xl leading-none font-extrabold tracking-tight md:text-8xl">
              {slide.discount}
              <span className="ml-1.5 text-4xl md:text-5xl">{slide.discountUnit}</span>
            </p>
            <div className="flex flex-col items-start gap-2">
              <span className="font-display text-base font-semibold tracking-wide uppercase">{slide.planLabel}</span>
              {/* #0A3A96 / #6FE3F5: azul y celeste de marca de Intēgrity. */}
              <span
                style={{ background: "#0A3A96", color: "#6FE3F5" }}
                className="inline-flex items-center rounded-field px-4 py-2 font-display text-xl font-extrabold tracking-wide whitespace-nowrap"
              >
                {slide.installments}
              </span>
            </div>
          </div>

          <h3 id="allies-integrity-title" className="sr-only">
            {slide.partnerLogo.alt}: {slide.installments} {slide.planLabel}
          </h3>
          <p className="max-w-125 text-base text-white/85 md:text-lg">{slide.description}</p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 md:w-60">
          <Image
            src={slide.partnerLogo.src}
            alt={slide.partnerLogo.alt}
            width={slide.partnerLogo.width}
            height={slide.partnerLogo.height}
            sizes="160px"
            className="h-8 w-auto object-contain"
          />
          {/* #0A3A96: azul de marca de Intēgrity. */}
          {slide.cta.href ? (
            <a
              href={slide.cta.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0A3A96" }}
              className="inline-flex h-11 items-center gap-2.5 rounded-field bg-white px-5 font-display text-base font-bold transition hover:opacity-90"
            >
              {slide.cta.label}
              <Icon name="arrow-right" size={18} />
            </a>
          ) : (
            // Sin URL confirmada todavía (ver comentario en lib/content/home.ts):
            // `<button>` realmente deshabilitado (no un `<span>` con estilos de
            // botón), para que un lector de pantalla lo anuncie como lo que es.
            <button
              type="button"
              disabled
              style={{ color: "#0A3A96" }}
              className="inline-flex h-11 cursor-not-allowed items-center gap-2.5 rounded-field bg-white px-5 font-display text-base font-bold"
            >
              {slide.cta.label}
              <Icon name="arrow-right" size={18} />
            </button>
          )}
          <span className="inline-flex items-center gap-2 text-sm text-white/70">
            Aliado de
            <AutoLibreMark className="h-5 w-auto" />
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * La Esquina del Neumático: la pieza la manda el aliado ya armada como imagen
 * (texto incluido), una para escritorio y otra para celular, cada una con su
 * propio link (`utm_content` distinto). Por eso son DOS links y no un
 * `<picture>`: con un solo `<a>` no se puede cambiar el `href` por pantalla.
 * El que no corresponde queda `hidden` (fuera del árbol de accesibilidad y,
 * con `loading="lazy"`, su imagen no se descarga).
 *
 * La de celular va hasta 1440px: más angosto, el alto de la de escritorio
 * (4:1) no alcanza para el contenido de los otros banners.
 *
 * Desde 1440px todo el carrusel toma el alto 4:1 de esta pieza (`DESKTOP_HEIGHT`).
 * Abajo, la de celular va centrada sobre negro. Todo el banner es el link.
 */
function EsquinaNeumaticoSlide({ slide }: { readonly slide: EsquinaNeumaticoSlideData }) {
  const { externalHint } = siteContent.nav;
  const pieces = [
    {
      key: "mobile",
      piece: slide.mobile,
      link: "banner:hidden",
      image: "h-auto w-full sm:h-120 sm:w-auto",
    },
    {
      key: "desktop",
      piece: slide.desktop,
      link: "hidden banner:flex",
      // Llena el banner: el alto es el de la pieza (ver `DESKTOP_HEIGHT`); solo
      // más de 1920px (techo de 480px) recorta unos px arriba y abajo.
      image: "absolute inset-0 size-full object-cover",
    },
  ] as const;

  return (
    <article
      aria-labelledby="allies-esquina-title"
      className={`relative flex h-full w-full min-h-150 flex-col bg-black sm:min-h-120 ${DESKTOP_HEIGHT}`}
    >
      <h3 id="allies-esquina-title" className="sr-only">
        {slide.title}
      </h3>
      {pieces.map(({ key, piece, link, image }) => (
        <a
          key={key}
          href={piece.href}
          target="_blank"
          rel="sponsored noopener noreferrer"
          className={`relative flex w-full flex-1 items-center justify-center overflow-hidden transition hover:opacity-95 ${link}`}
        >
          <Image
            src={piece.src}
            width={piece.width}
            height={piece.height}
            alt={`${slide.alt} ${externalHint}`}
            // Original, sin recomprimir: la pieza ya viene comprimida y a 75 de
            // calidad (el default de Next) el texto perdía nitidez.
            unoptimized
            className={image}
          />
        </a>
      ))}
    </article>
  );
}
