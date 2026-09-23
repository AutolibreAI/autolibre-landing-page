import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { PEDIDO_IDS } from "./shared";

const { header, footer } = presupuestoContent.pedidoPage;

/** Footer mínimo de `/pedido`: marca y cómo se tratan los datos. */
export function PedidoFooter() {
  return (
    <footer id={PEDIDO_IDS.footer} className="border-t border-line bg-surface">
      <Container
        size="wide"
        className="flex flex-col items-start gap-1 py-6 lg:flex-row lg:items-center lg:justify-between"
      >
        <Link
          href="/"
          aria-label={header.homeLabel}
          className="inline-flex min-h-11 items-center"
        >
          <Image
            src="/brand/lockup-light.png"
            alt={header.logoAlt}
            width={676}
            height={132}
            sizes="103px"
            className="h-5 w-auto"
          />
        </Link>
        {/* Tipografía de las notas de la home (`text-label`, tinta al 65%). */}
        <Link
          href="/privacidad"
          className="inline-flex min-h-11 items-center text-label text-ink/65 underline underline-offset-4 transition-colors hover:text-ink"
        >
          {footer.privacyLink}
        </Link>
      </Container>
    </footer>
  );
}
