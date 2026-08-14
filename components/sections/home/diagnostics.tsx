import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

// Maqueta armada con markup — se reemplazó por la captura sola, sin marco.
// Para volver a ella: descomentar estos imports y el bloque de abajo.
// import { PhoneFrame } from "@/components/ui/phone-frame";
// import { ChatScreen } from "@/components/sections/home/app-screens";

export function DiagnosticsSection() {
  const { title, subtitle, quote, footnote } = homeContent.diagnostics;

  return (
    <Section tone="ink" aria-labelledby="diagnostics-title">
      <Container>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-135 flex-1">
            <h2
              id="diagnostics-title"
              className="font-display text-[2rem] font-bold text-white md:text-[2.375rem]"
            >
              {title}
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-white/72">
              {subtitle}
            </p>

            <blockquote className="my-8 border-l-2 border-brand-soft py-1 pl-6 text-[1.0625rem] leading-relaxed text-white">
              {quote}
            </blockquote>

            <p className="text-base leading-relaxed text-white/72">
              {footnote}
            </p>
          </div>
          <div className="flex flex-1 justify-center">
            <Image
              src="/mockup/mockup-chatai.webp"
              alt="Chat de diagnóstico de AutoLibre: el usuario describe un ruido al frenar y la IA responde que probablemente sean las pastillas de freno, con una recomendación para revisarlas."
              width={786}
              height={1682}
              sizes="(max-width: 1024px) 280px, 340px"
              className="w-70 max-w-full lg:w-85"
            />

            {/* Maqueta anterior hecha con markup. Para volver: descomentar
                esto y el import de ChatScreen de arriba, y quitar el <Image>.
            <PhoneFrame label="Chat de diagnóstico de AutoLibre: el usuario describe un ruido al frenar y la IA sugiere revisar las pastillas de freno.">
              <ChatScreen />
            </PhoneFrame>
            */}
          </div>
        </div>
      </Container>
    </Section>
  );
}
