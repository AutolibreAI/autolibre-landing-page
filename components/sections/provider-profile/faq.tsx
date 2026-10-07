import { Icon } from "@/components/ui/icon";
import { ProfileCard } from "@/components/ui/profile-card";
import { providerProfileContent as copy } from "@/lib/content/provider-profile";
import type { FaqItem } from "@/lib/provider-profile/faq";

/**
 * Preguntas frecuentes como acordeón de `<details>/<summary>`. Las preguntas
 * son `<summary>` (no encabezados: no se salta de `h2` a un `h3` decorativo) y
 * el texto de las respuestas está en el HTML aunque estén cerradas. Recibe la
 * MISMA lista que el `FAQPage` de JSON-LD. Sin ítems, no se renderiza.
 */
export function ProfileFaqSection({ items }: { readonly items: readonly FaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <ProfileCard id="perfil-faq" title={copy.sections.faq} className="mt-5">
      <div className="mt-3 divide-y divide-card-line">
        {items.map((item) => (
          <details key={item.id} className="group py-1">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 py-2 text-base font-semibold text-ink [&::-webkit-details-marker]:hidden">
              {item.question}
              <Icon
                name="chevron-down"
                size={20}
                className="shrink-0 text-ink/55 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="pb-3 text-[0.9375rem] leading-relaxed text-ink/75">{item.answer}</p>
          </details>
        ))}
      </div>
    </ProfileCard>
  );
}
