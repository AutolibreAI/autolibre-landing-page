import { StoreLinks } from "@/components/ui/store-links";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

export function ClosingCtaSection() {
  const { title, downloadNote } = homeContent.closing;

  return (
    <Section id="cierre" tone="brand" aria-labelledby="closing-title">
      <Container size="narrow" className="text-center">
        {/* Knockout blanco, NO `lockup-dark.png`: ese trae el isotipo en
            verde #20A020, que sobre el verde de marca queda en un contraste
            de 1.24 y desaparece. Ver public/brand/README.md */}
        {/* <Image
          src="/brand/lockup-black.png"
          alt=""
          width={676}
          height={132}
          sizes="164px"
          className="mx-auto mb-7 h-8 w-auto"
        /> */}

        <h2
          id="closing-title"
          className="mx-auto max-w-180 font-display text-[2.125rem] font-bold text-white md:text-[2.625rem]"
        >
          {title}
        </h2>

        <div className="mt-10 flex flex-col items-center">
          <StoreLinks tone="brand" note={downloadNote} className="text-center" />
        </div>
      </Container>
    </Section>
  );
}
