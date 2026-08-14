import Image from "next/image";
import { EarlyAccessForm } from "@/components/forms/early-access-form";
import { Container } from "@/components/ui/container";
import { homeContent } from "@/lib/content/home";

// Maqueta armada con markup — se probó reemplazarla por una imagen.
// Para volver a ella: descomentar estos imports y el bloque de abajo.
// import { PhoneFrame } from "@/components/ui/phone-frame";
// import { GarageScreen } from "@/components/sections/home/app-screens";

export function HeroSection() {
  const { titleLines, subtitle, formNote } = homeContent.hero;

  return (
    <section id="producto" className="bg-surface py-16 md:py-20">
      <Container size="wide">
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-10">
          <div className="max-w-[620px] flex-[1.1]">
            {/* Único h1 de la página. */}
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
              priority
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
      </Container>
    </section>
  );
}
