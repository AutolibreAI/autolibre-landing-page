import { Container } from "@/components/ui/container";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { Section } from "@/components/ui/section";
import { ChatScreen } from "@/components/sections/home/app-screens";
import { homeContent } from "@/lib/content/home";

export function DiagnosticsSection() {
  const { title, subtitle, quote, footnote } = homeContent.diagnostics;

  return (
    <Section tone="ink" aria-labelledby="diagnostics-title">
      <Container>
        <div className="flex flex-col items-center gap-12 lg:flex-row lg:gap-16">
          <div className="max-w-[540px] flex-1">
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

            <p className="text-base leading-relaxed text-white/72">{footnote}</p>
          </div>

          <div className="flex flex-1 justify-center">
            <PhoneFrame label="Chat de diagnóstico de AutoLibre: el usuario describe un ruido al frenar y la IA sugiere revisar las pastillas de freno.">
              <ChatScreen />
            </PhoneFrame>
          </div>
        </div>
      </Container>
    </Section>
  );
}
