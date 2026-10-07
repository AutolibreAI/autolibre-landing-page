import Image from "next/image";
import Link from "next/link";
import { ButtonLink, buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import { cn } from "@/lib/utils";

/**
 * Banda de AutoLibre al pie de la página de perfil (propia, no `SiteFooter`):
 * "Descargá AutoLibre", "Sumá tu negocio", la URL pública del perfil y los
 * enlaces legales (la página es pública y recolecta clicks de contacto). El
 * logo de AutoLibre va siempre como imagen.
 */
export function FooterBand({ publicUrl }: { readonly publicUrl: string }) {
  const { footerBand } = copy;
  return (
    <footer className="bg-ink py-12 text-white">
      <Container size="wide">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <Link href="/" aria-label="AutoLibre — inicio">
              <Image
                src="/brand/lockup-dark.png"
                alt="AutoLibre.AI"
                width={676}
                height={132}
                sizes="123px"
                className="h-6 w-auto"
              />
            </Link>
            <p className="mt-5 font-display text-xl font-bold">{footerBand.title}</p>
            <p className="mt-1.5 max-w-120 text-sm text-white/75">{footerBand.subtitle}</p>
            <p className="mt-4 text-sm text-white/65">
              {footerBand.urlLabel}:{" "}
              <span className="font-medium text-white">{publicUrl.replace(/^https?:\/\//, "")}</span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/descarga" variant="inverse" size="md" className="min-h-11">
              {footerBand.downloadCta}
            </ButtonLink>
            <Link
              href="/proveedores"
              className={cn(
                buttonVariants({ variant: "outlineInverse", size: "md" }),
                "min-h-11",
              )}
            >
              {footerBand.providerCta}
            </Link>
          </div>
        </div>

        <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-1 border-t border-white/15 pt-5 text-sm text-white/70">
          <li>
            <Link href="/terminos" className="inline-flex min-h-8 items-center hover:text-white">
              {footerBand.terms}
            </Link>
          </li>
          <li>
            <Link href="/privacidad" className="inline-flex min-h-8 items-center hover:text-white">
              {footerBand.privacy}
            </Link>
          </li>
        </ul>
      </Container>
    </footer>
  );
}
