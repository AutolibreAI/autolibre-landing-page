import Image from "next/image";
import Link from "next/link";
import { siteContent } from "@/lib/content/site";

/** Es un link externo si sale del sitio (redes, mail, WhatsApp). */
function isExternal(href: string) {
  return !href.startsWith("/");
}

export function SiteFooter() {
  const { groups, copyright } = siteContent.footer;

  return (
    <footer className="bg-ink text-white">
      <div className="w-full px-[6%] py-14">
        <div className="mx-auto w-full max-w-[1440px]">
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

          <div className="flex flex-wrap gap-x-14 gap-y-8">
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
        </div>
      </div>
    </footer>
  );
}
