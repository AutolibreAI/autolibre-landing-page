import { EarlyAccessForm } from "@/components/forms/early-access-form";
import { Container } from "@/components/ui/container";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { GarageScreen } from "@/components/sections/home/app-screens";
import { homeContent } from "@/lib/content/home";

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
            <PhoneFrame label="Pantalla de la app AutoLibre mostrando el garage con un Honda Civic con dos alertas y un Toyota Etios sin novedades.">
              <GarageScreen />
            </PhoneFrame>
          </div>
        </div>
      </Container>
    </section>
  );
}
