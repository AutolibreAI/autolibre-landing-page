import Image from "next/image";
import { EarlyAccessForm } from "@/components/forms/early-access-form";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function ClosingCtaSection() {
  const { title, formNote } = homeContent.closing;

  return (
    <Section id="cierre" tone="brand" aria-labelledby="closing-title">
      <Container size="narrow" className="text-center">
        <Image
          src="/brand/lockup-dark.png"
          alt=""
          width={676}
          height={132}
          sizes="164px"
          className="mx-auto mb-7 h-8 w-auto"
        />

        <h2
          id="closing-title"
          className="mx-auto max-w-[720px] font-display text-[2.125rem] font-bold text-white md:text-[2.625rem]"
        >
          {title}
        </h2>

        <div className="mx-auto mt-10 max-w-[640px] text-left">
          <EarlyAccessForm tone="brand" note={formNote} />
        </div>
      </Container>
    </Section>
  );
}
