import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { presupuestoContent } from "@/lib/content/presupuesto";
import { WhatsappLink } from "./whatsapp-link";

const { header, whatsapp } = presupuestoContent.pedidoPage;

/**
 * Header propio de `/pedido`, sin la navegación del sitio: quien llega acá
 * viene de un link directo y tiene una sola cosa para hacer. En mobile, solo
 * el logo. En desktop suma las anclas de la página y el WhatsApp.
 *
 * Misma medida que `SiteHeader` (alto de 4.5rem, logo de 24px, links y CTA
 * con su tipografía), pero NO sticky a propósito: en mobile la barra fija
 * inferior ya lleva los CTAs, y un header pegado arriba le comería alto a la
 * pantalla.
 */
export function PedidoHeader() {
  return (
    <header className="border-b border-line bg-surface">
      <Container size="wide" className="flex h-18 items-center justify-between gap-4">
        <Link
          href="/"
          aria-label={header.homeLabel}
          className="inline-flex min-h-11 shrink-0 items-center"
        >
          {/* No es el LCP (lo es el h1): `eager` porque está arriba de todo,
              sin `preload`. */}
          <Image
            src="/brand/lockup-light.png"
            alt={header.logoAlt}
            width={676}
            height={132}
            loading="eager"
            sizes="123px"
            className="h-6 w-auto"
          />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          <nav aria-label={header.navLabel}>
            <ul className="flex items-center gap-7">
              {header.links.map((link) => (
                <li key={link.href}>
                  {/* Misma tipografía que los links de `SiteHeader`. */}
                  <a
                    href={link.href}
                    className="text-[0.9375rem] font-medium text-ink transition-colors hover:text-brand"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <WhatsappLink placement="header" size="md" label={whatsapp.shortLabel} />
        </div>
      </Container>
    </header>
  );
}
