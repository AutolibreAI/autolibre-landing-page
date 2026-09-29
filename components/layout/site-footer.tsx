import Image from "next/image";
import Link from "next/link";
import { LAYOUT_IDS } from "@/components/layout/ids";
import { Container } from "@/components/ui/container";
import { siteContent } from "@/lib/content/site";

/** Es un link externo si sale del sitio (redes, mail, WhatsApp). */
function isExternal(href: string) {
  return !href.startsWith("/");
}

export function SiteFooter() {
  const { groups, copyright } = siteContent.footer;

  return (
    <footer id={LAYOUT_IDS.footer} className="bg-ink py-14 text-white">
      <Container size="wide">
        <div className="mb-10 flex flex-wrap justify-between gap-10">
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

          {/* Cinco grupos: en grilla hasta `lg` (2 y 3 columnas parejas en vez
              de un `flex-wrap` que deja filas desparejas) y en una sola fila
              desde `lg`, al lado del logo. */}
          <div className="grid grid-cols-2 gap-x-10 gap-y-8 sm:grid-cols-3 lg:flex lg:gap-x-14">
            {groups.map((group) => (
              <nav key={group.id} aria-label={group.title}>
                <p className="mb-3 text-[0.8125rem] tracking-[0.05em] text-white/50 uppercase">
                  {group.title}
                </p>
                <ul className="flex flex-col gap-2.5">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        {...(isExternal(link.href)
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        className="text-sm text-white/80 transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <p className="border-t border-white/15 pt-6 text-[0.8125rem] text-white/50">
          {copyright}
        </p>
      </Container>
    </footer>
  );
}
