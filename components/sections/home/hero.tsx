"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { EarlyAccessForm } from "@/components/forms/early-access-form";
import { QuoteRequestModal } from "@/components/quote-modal/quote-request-modal";
import { Container } from "@/components/ui/container";
import { homeContent } from "@/lib/content/home";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { cn } from "@/lib/utils";

// Maqueta armada con markup — se probó reemplazarla por una imagen.
// Para volver a ella: descomentar estos imports y el bloque de abajo.
// import { PhoneFrame } from "@/components/ui/phone-frame";
// import { GarageScreen } from "@/components/sections/home/app-screens";

const SLIDE_COUNT = 2;
const AUTOPLAY_MS = 5000;

export function HeroSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setActive((current) => (current + 1) % SLIDE_COUNT);
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <section
      id="producto"
      className="bg-surface py-16 md:py-20"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Container size="wide">
        <div className={cn(active === 0 ? "block" : "hidden")}>
          <PresupuestoSlide />
        </div>
        <div className={cn(active === 1 ? "block" : "hidden")}>
          <ClassicSlide />
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {Array.from({ length: SLIDE_COUNT }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Mostrar sección ${index + 1} de ${SLIDE_COUNT}`}
              aria-current={active === index ? "true" : undefined}
              onClick={() => setActive(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                active === index ? "w-6 bg-brand" : "w-2 bg-line hover:bg-ink/25",
              )}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

function PresupuestoSlide() {
  const { eyebrow, titleLines, subtitle, ctaLabel, note, image } =
    presupuestoContent.hero;

  return (
    <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-10">
      <div className="max-w-[620px] flex-[1.1]">
        <p className="mb-3 font-display text-sm font-semibold text-brand">
          {eyebrow}
        </p>
        <h1 className="font-display text-[2.75rem] leading-[1.05] font-bold text-ink sm:text-[3.5rem] lg:text-[4rem]">
          {titleLines[0]}
          <br />
          {titleLines[1]}
        </h1>

        <p className="mt-7 max-w-[480px] text-[1.0625rem] leading-relaxed text-ink/70 md:text-[1.1875rem]">
          {subtitle}
        </p>

        <div className="mt-10">
          <QuoteRequestModal size="lg">{ctaLabel}</QuoteRequestModal>
          <p className="mt-3 text-[0.8125rem] text-ink/55">{note}</p>
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          priority
          sizes="(max-width: 1024px) 280px, 340px"
          className="w-[280px] max-w-full lg:w-[340px]"
        />
      </div>
    </div>
  );
}

function ClassicSlide() {
  const { titleLines, subtitle, formNote } = homeContent.hero;

  return (
    <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-10">
      <div className="max-w-[620px] flex-[1.1]">
        <h1 className="font-display text-[2.75rem] leading-[1.05] font-bold text-ink sm:text-[3.5rem] lg:text-[4rem]">
          {titleLines[0]}
          <br />
          {titleLines[1]}
        </h1>

        <p className="mt-7 max-w-[480px] text-[1.0625rem] leading-relaxed text-ink/70 md:text-[1.1875rem]">
          {subtitle}
        </p>

        <div id="early-access" className="mt-10 scroll-mt-28">
          <EarlyAccessForm note={formNote} />
        </div>
      </div>

      <div className="flex flex-1 justify-center">
        {/* La imagen ya trae el marco del teléfono, así que NO va dentro
            de <PhoneFrame>: quedarían dos biseles encimados. */}
        <Image
          src="/mockup/mockup-garage.webp"
          alt="Pantalla de inicio de AutoLibre: alertas de VTV vencida y fallos del motor, y el garage con un Volkswagen Vento en buen estado."
          width={1472}
          height={2886}
          sizes="(max-width: 1024px) 280px, 340px"
          className="w-[280px] max-w-full lg:w-[340px]"
        />

        {/* Maqueta anterior hecha con markup. Para volver: descomentar
            esto y los imports de PhoneFrame/GarageScreen de arriba.
        <PhoneFrame label="Pantalla de la app AutoLibre mostrando el garage con un Honda Civic con dos alertas y un Toyota Etios sin novedades.">
          <GarageScreen />
        </PhoneFrame>
        */}
      </div>
    </div>
  );
}
