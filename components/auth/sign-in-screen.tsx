import Image from "next/image";
import Link from "next/link";
import { SignInExitLink } from "@/components/auth/sign-in-exit-link";
import { HeroRotatingWord } from "@/components/sections/home/hero-rotating-word";
import { Icon } from "@/components/ui/icon";
import { PhoneFrame } from "@/components/ui/phone-frame";
import { homeContent } from "@/lib/content/home";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { signInContent } from "@/lib/content/sign-in";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

const { ingresar } = partnerAccountContent;
const { brand } = ingresar;
const { title } = homeContent.hero;

/** Link de texto subrayado sobre `card`. */
const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

type SignInScreenProps = {
  /** Bajada del `<h1>`: cambia según adónde vuelve la persona. `null`: sin bajada. */
  readonly intro: string | null;
  /** "¿Tenés un taller o un servicio? Sumá tu negocio" (solo si vuelve a `/cuenta`). */
  readonly showJoin: boolean;
  /** Adónde lleva la cruz: una página pública del sitio (`signInExitPath`). */
  readonly exitHref: string;
  /** La isla con el widget de Clerk (`SignInWidget`). */
  readonly children: React.ReactNode;
};

/**
 * Pantalla completa de `/ingresar` (2026-11-26; panel de marca rediseñado el
 * 2026-11-27). Server Component: el panel de marca, el `<h1>` y la línea
 * legal salen en el HTML del server; el widget de Clerk (`children`) hidrata
 * con el alto reservado para que nada salte cuando monta (CLS).
 *
 * Sin el header ni el pie del sitio. Pantalla partida recta (sin diagonal):
 * - Desde `lg`: el panel de marca a la izquierda (5 de 12 columnas), a
 *   sangre, y el formulario centrado a la derecha. La pantalla mide
 *   exactamente `100dvh` y la página no scrollea: el escenario del teléfono
 *   absorbe el alto que sobra y, si el formulario no entra, scrollea por
 *   dentro solo su columna.
 * - En celular: el panel de marca NO se muestra (2026-11-27, pedido de
 *   producto): queda solo el formulario, centrado en la pantalla, con la
 *   cruz arriba a la derecha. El panel sigue en el HTML (`hidden lg:flex`).
 *
 * El panel es liso, en el verde de marca AA (`brand-hover`, blanco encima
 * 5.74:1). Arriba, el logo y el titular grande: el eslogan del sitio con la
 * palabra que rota (AUTO → MOTO, `HeroRotatingWord`), igual que el `<h1>` del
 * Home y armado con las mismas partes de contenido. Desde `lg` se suman la
 * bajada y, abajo, la nota de las tiendas y la captura real de la app en un
 * teléfono inclinado que asoma a la derecha, anclado arriba de su escenario
 * flexible y recortado por el borde del panel (se ve más o menos teléfono
 * según el alto disponible; recorte deliberado). La LCP es texto (el titular o el `<h1>`): ninguna imagen lleva
 * `preload`.
 *
 * Islas: el widget de Clerk, la palabra que rota (hoja, `aria-hidden`) y la
 * cruz (`SignInExitLink`, un `<a href>` real).
 *
 * La cruz (2026-11-27): la pantalla no tiene el menú del sitio, así que
 * arriba a la derecha hay una salida. Es el primer elemento del `<main>`,
 * posicionada contra la pantalla entera (el `relative` de la raíz): cae
 * siempre sobre `card` (`fg-muted`), en celular arriba del formulario y
 * desde `lg` sobre su columna. Su borde derecho
 * visible (el ícono de 22px dentro del área de 44px) se alinea con el gutter
 * del contenido: 16 / 32 / 48px.
 *
 * Outline: el panel es el `<header>` (logo y titular en `<p>`, sin
 * headings); el único `<h1>` es el del formulario, en el `<main>`.
 *
 * `data-flow-shell`: el botón flotante de WhatsApp se esconde, igual que en
 * las pantallas de foco de los flujos (tapaba el "Continuar" en celular).
 */
export function SignInScreen({ intro, showJoin, exitHref, children }: SignInScreenProps) {
  return (
    // En celular el panel de marca no se muestra: la grilla tiene una sola
    // fila (el formulario), que ocupa todo `min-h-dvh`, y la página crece con
    // su contenido; desde `lg`, `lg:h-dvh` la fija en `100dvh` y no scrollea
    // (las dos columnas llevan `lg:min-h-0`).
    <div
      data-flow-shell=""
      className="relative grid min-h-dvh bg-card lg:h-dvh lg:grid-cols-12"
    >
      {/* Solo desde `lg` (`hidden lg:flex`). El anillo de foco global es
          `brand`, que no se distingue sobre el verde de marca del panel: acá
          va en blanco. */}
      <header className="relative hidden flex-col overflow-clip bg-brand-hover text-white lg:col-span-5 lg:flex lg:min-h-0 [&_a:focus-visible]:outline-white">
        <div className="flex flex-col gap-6 px-4 pt-6 pb-7 sm:px-8 lg:gap-14 lg:px-10 lg:pt-12 xl:px-12">
          <Link href="/" aria-label={brand.home} className="flex w-fit">
            {/* No es la LCP (mide 26px de alto): `eager` sin `preload`, como
                el logo del header del sitio. */}
            <Image
              src="/brand/lockup-white.png"
              alt={brand.logoAlt}
              width={676}
              height={132}
              loading="eager"
              sizes="133px"
              className="h-6.5 w-auto"
            />
          </Link>

          <div>
            {/* El eslogan del sitio, armado con las mismas partes que el
                `<h1>` del Home (`homeContent.hero.title`) para que las dos
                pantallas no se desincronicen. Acá es un `<p>`: el único
                `<h1>` es el del formulario. El texto del DOM es el eslogan
                exacto (el `sr-only` da "auto"); la palabra que cae es
                `aria-hidden`. Rota en loop sin control de pausa: es la misma
                excepción de WCAG 2.2.2 aprobada para el Home (AGENTS.md §3).
                Con `prefers-reduced-motion` no hay isla: se ve el eslogan
                quieto. `text-brand-200` sobre `brand-hover` alcanza el 3:1
                de texto grande. */}
            <p className="font-display text-3xl leading-none font-bold tracking-tight sm:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl">
              <span className="block whitespace-nowrap">
                {title.lead}{" "}
                <span className="sr-only motion-reduce:not-sr-only motion-reduce:text-brand-200 motion-reduce:uppercase">
                  {title.vehicle}
                </span>
                <HeroRotatingWord
                  words={title.rotatingWords}
                  className="text-brand-200 uppercase motion-reduce:hidden"
                />
                {title.comma}
              </span>{" "}
              <span className="block text-balance">{title.rest}</span>
            </p>
            <p className="mt-6 max-w-100 text-lead text-white max-lg:hidden">{brand.body}</p>
          </div>
        </div>

        {/* Escenario del teléfono: solo desde `lg`. Es flexible (`flex-1
            min-h-0`): ocupa el alto que sobra debajo del texto y nunca empuja
            el alto del panel. El teléfono va inclinado, en `absolute` y
            anclado ARRIBA del escenario, corrido a la derecha: el
            `overflow-clip` del panel le corta el canto y el pie, así que se
            ve más o menos teléfono según el alto disponible. El recorte es
            deliberado. La nota de las tiendas va anclada abajo a la
            izquierda. No es la LCP (lo es el titular): sin `preload`, lazy
            por defecto. */}
        <div className="relative hidden min-h-0 flex-1 lg:block">
          <p className="absolute bottom-10 left-10 max-w-36 text-label font-semibold text-white xl:bottom-12 xl:left-12">
            {brand.note}
          </p>
          <PhoneFrame
            label={brand.appShot.alt}
            className="absolute top-8 -right-6 w-64 rotate-6 xl:w-72"
          >
            <Image
              src={brand.appShot.src}
              alt=""
              fill
              sizes="288px"
              className="object-cover object-top"
            />
          </PhoneFrame>
        </div>
      </header>

      {/* Desde `lg` la columna scrollea por dentro solo si el formulario no
          entra (errores de Clerk, alta con más campos, ventana muy baja): la
          página nunca scrollea. El `m-auto` del hijo lo centra cuando entra
          y, a diferencia de `items-center`, no le recorta la parte de arriba
          cuando desborda. En celular, `pt-16` deja libre la fila de la cruz
          (44px desde `top-4`) para que nunca pise el `<h1>`. */}
      <main className="flex px-4 pt-16 pb-12 sm:px-8 lg:col-span-7 lg:min-h-0 lg:overflow-y-auto lg:px-12 lg:py-8">
        {/* `absolute` contra la raíz (el `<main>` no está posicionado): no
            scrollea con la columna ni la recorta su `overflow`. Siempre
            está sobre `card`, en celular y desde `lg`. */}
        <SignInExitLink
          href={exitHref}
          label={signInContent.close}
          className="absolute top-4 right-1.5 z-10 flex size-11 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-card-muted hover:text-fg motion-reduce:transition-none sm:right-5 lg:top-5 lg:right-9"
        >
          <Icon name="x" size={22} strokeWidth={2} />
        </SignInExitLink>
        <div className="m-auto flex w-full max-w-105 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-fg lg:text-4xl"
            >
              {ingresar.title}
            </h1>
            {intro ? <p className="text-base text-fg-muted lg:text-lead">{intro}</p> : null}
          </div>

          {children}

          {showJoin ? (
            <p className="text-base text-fg-muted">
              {ingresar.joinPrefix}{" "}
              <Link href={PROVEEDORES_REGISTRO_PATH} className={textLink}>
                {ingresar.join}
              </Link>
            </p>
          ) : null}

          <p className="text-label text-fg-muted">
            {ingresar.legalPrefix}{" "}
            <Link href={ingresar.terms.href} className="underline underline-offset-4 hover:text-fg">
              {ingresar.terms.label}
            </Link>{" "}
            {ingresar.legalJoin}{" "}
            <Link href={ingresar.privacy.href} className="underline underline-offset-4 hover:text-fg">
              {ingresar.privacy.label}
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}
