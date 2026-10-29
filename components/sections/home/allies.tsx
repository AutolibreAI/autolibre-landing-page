import Image from "next/image";
import { Section } from "@/components/ui/section";
import { homeContent } from "@/lib/content/home";

/**
 * Logos de aliados, fijos (son solo tres por ahora: un slider no tiene nada
 * que rotar). Cada uno vive en una celda del mismo ancho y alto
 * (`object-contain` adentro): así un isotipo cuadrado (Asistir24) y un
 * isologo apaisado (Autech) ocupan el mismo lugar en la fila en vez de
 * competir por tamaño. Si la lista crece lo bastante como para no entrar en
 * una fila, ahí vuelve a tener sentido un slider.
 *
 * Banda `ink` (la misma paleta oscura de `QuotesSection`, "Resolvemos todo
 * para tu auto."): la sección de arriba (`MarketplaceSection`) ya es
 * `muted`, y dos bandas `muted` seguidas se leen como una sola franja sin
 * corte.
 */
export function AlliesSection() {
  const { title, logos } = homeContent.allies;

  return (
    <Section id="aliados" tone="ink" spacing="sm" aria-labelledby="allies-title" container="content">
      <h2
        id="allies-title"
        className="text-center font-display text-[2rem] font-bold text-white md:text-[2.375rem]"
      >
        {title}
      </h2>

      <ul className="mt-8 flex flex-wrap items-center justify-center gap-4">
        {logos.map((logo) => (
          <li
            key={logo.id}
            className="flex h-28 w-52 shrink-0 items-center justify-center rounded-card bg-surface"
          >
            <Image
              src={logo.src}
              alt={logo.name}
              width={logo.width}
              height={logo.height}
              sizes="140px"
              className="h-auto max-h-14 w-auto max-w-35 object-contain"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
