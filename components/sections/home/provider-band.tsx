import { ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { homeContent } from "@/lib/content/home";

export function ProviderBandSection() {
  const { title, subtitle, cta } = homeContent.providerBand;

  return (
    <section id="proveedor" className="bg-ink py-11">
      <Container size="wide">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="font-display text-xl font-bold text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-white/65">{subtitle}</p>
          </div>
          <ButtonLink href={cta.href} variant="soft" size="lg">
            {cta.label}
          </ButtonLink>
        </div>
      </Container>
    </section>
  );
}
