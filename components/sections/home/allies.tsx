import Image from "next/image";
import { AlliesCarousel } from "@/components/sections/home/allies-carousel";
import { Container } from "@/components/ui/container";
import { Icon } from "@/components/ui/icon";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";
import { siteContent } from "@/lib/content/site";

/**
 * Carrusel de banners de aliados: cada uno es una pieza publicitaria propia
 * (no un simple logo), fiel a la pieza original de cada aliado — color de
 * marca exacto, logo de AutoLibre a la par del logo del aliado. Sin el rótulo
 * "Publicidad" de la pieza original (pedido explícito, 2026-11-17). Esos
 * colores son del partner, no del design system de AutoLibre: van inline, a
 * propósito (regla de los tokens de `@theme` en AGENTS.md, punto 7 — último
 * recurso justificado).
 *
 * Full-bleed a propósito (pedido de producto, 2026-11-17): la `Section` no
 * tiene `Container` propio ni fondo propio, así el ancho y el color de cada
 * banner son los del banner mismo, borde a borde. El `Container` que sí
 * usa cada banner (`size="wide"`, 1440px) es solo para que el contenido no
 * se pierda en pantallas muy anchas; en la pieza original el panel lateral
 * de Asistir24 bleedea hasta el borde, afuera de ese `Container`. Sin título
 * visible tampoco; el `<h2>` sigue existiendo (outline y lectores de
 * pantalla) pero queda `sr-only`.
 *
 * El control (índice, autoplay, botones) es la isla cliente
 * `AlliesCarousel`; cada banner se arma acá, en el server, y viaja como
 * children ya resuelto.
 */
export function AlliesSection() {
  const { title, prevLabel, nextLabel, goToLabel, slides } = homeContent.allies;
  const [asistir24, sinfotomultas, integrity] = slides;

  return (
    <Section
      id="aliados"
      // Sin padding propio: el padding lo pone cada banner (su propio fondo
      // de marca), si no queda una franja blanca entre esta sección y la de
      // arriba (pedido de producto, 2026-11-17).
      spacing="sm"
      className="py-0 md:py-0"
      aria-labelledby="allies-title"
      container={false}
    >
      <h2 id="allies-title" className="sr-only">
        {title}
      </h2>

      <AlliesCarousel
        label={title}
        prevLabel={prevLabel}
        nextLabel={nextLabel}
        goToLabels={slides.map((_, position) => goToLabel(position + 1))}
        slides={[
          <Asistir24Slide key={asistir24.id} slide={asistir24} />,
          <SinFotomultasSlide key={sinfotomultas.id} slide={sinfotomultas} />,
          <IntegritySlide key={integrity.id} slide={integrity} />,
        ]}
      />
    </Section>
  );
}

type Asistir24SlideData = (typeof homeContent.allies.slides)[0];
type SinFotomultasSlideData = (typeof homeContent.allies.slides)[1];
type IntegritySlideData = (typeof homeContent.allies.slides)[2];

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
      // `min-h-150 sm:min-h-120`: la misma en los tres banners (ver nota en
      // `IntegritySlide`), para que el carrusel no salte de alto al pasar de
      // uno a otro (pedido de producto, 2026-11-17).
      className="relative flex w-full min-h-150 flex-col text-white sm:min-h-120 sm:flex-row sm:items-stretch"
    >
      {/* Panel de la izquierda: bleedea hasta el borde (como la pieza
          original), por eso no vive adentro del `Container` de abajo. */}
      <div
        /* #F45C9D / #14102B: rosa y tinta de marca de Asistir24. */
        style={{ background: "#F45C9D", color: "#14102B" }}
        className="flex flex-col items-start justify-center gap-5 px-8 py-10 sm:w-[30%] sm:px-10 sm:py-0 md:px-12"
      >
        <p className="font-display text-8xl leading-none font-extrabold md:text-9xl">{slide.bigNumber}</p>
        <p className="font-display text-2xl leading-tight font-bold md:text-3xl">{slide.bigNumberLabel}</p>
        <a
          href={slide.badgeCta.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ background: "#14102B" }}
          className="mt-1 inline-flex h-12 items-center gap-2.5 rounded-field px-6 font-display text-lg font-bold text-white transition hover:opacity-90 md:h-14 md:px-7 md:text-xl"
        >
          <Icon name="phone" size={20} />
          {slide.badgeCta.label}
          <span className="sr-only"> {externalHint}</span>
        </a>
      </div>

      <Container size="wide" className="flex flex-1 flex-col justify-center gap-5 py-10 sm:py-12 md:py-16">
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
        <h3 id="allies-asistir24-title" className="font-display text-3xl leading-tight font-bold md:text-4xl">
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
      </Container>
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
      className="relative flex w-full min-h-150 flex-col justify-center text-white sm:min-h-120"
    >
      <Container size="wide" className="flex flex-col gap-10 py-14 sm:flex-row sm:items-center sm:py-16 md:py-20">
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

        {/* Tarjeta decorativa (pieza original): solo desde `sm`, no hay
            lugar para girarla en una columna angosta. */}
        <div aria-hidden="true" className="relative hidden w-72 shrink-0 self-center sm:block">
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
      </Container>
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
      className="relative flex w-full min-h-150 flex-col justify-center text-white sm:min-h-120"
    >
      <Container size="wide" className="flex flex-col gap-8 py-14 sm:flex-row sm:items-center sm:py-16 md:py-20">
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

        <div className="flex shrink-0 flex-col items-start gap-4 sm:w-70">
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
      </Container>
    </article>
  );
}
