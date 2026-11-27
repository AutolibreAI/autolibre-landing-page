import Image from "next/image";
import Link from "next/link";
import { SignInExitLink } from "@/components/auth/sign-in-exit-link";
import { Icon } from "@/components/ui/icon";
import { partnerAccountContent } from "@/lib/content/partner-account";
import { signInContent } from "@/lib/content/sign-in";
import { PROVEEDORES_REGISTRO_PATH } from "@/lib/proveedores/query";

const { ingresar } = partnerAccountContent;
const { brand, oneAccount } = ingresar;

/** Link de texto subrayado sobre `card`. */
const textLink =
  "font-semibold text-fg underline underline-offset-4 transition-colors hover:text-brand-hover motion-reduce:transition-none";

type SignInScreenProps = {
  /** Bajada del `<h1>`: cambia según adónde vuelve la persona. */
  readonly intro: string;
  /** "¿Tenés un taller o un servicio? Sumá tu negocio" (solo si vuelve a `/cuenta`). */
  readonly showJoin: boolean;
  /** Adónde lleva la cruz: una página pública del sitio (`signInExitPath`). */
  readonly exitHref: string;
  /** La isla con el widget de Clerk (`SignInWidget`). */
  readonly children: React.ReactNode;
};

/**
 * Pantalla completa de `/ingresar` (2026-11-26). Server Component: el panel
 * de marca, el `<h1>` y la línea legal salen en el HTML del server; lo único
 * que hidrata es el widget de Clerk (`children`), con el alto reservado para
 * que nada salte cuando monta (CLS).
 *
 * Sin el header ni el pie del sitio. Pantalla dividida:
 * - Desde `lg`: el panel de marca a la izquierda (5 de 12 columnas, verde de
 *   marca) con el borde derecho en diagonal, y el formulario centrado a la
 *   derecha.
 * - En celular: el panel es una banda corta arriba (logo y frase de marca)
 *   con el borde de abajo en diagonal, y el formulario debajo.
 *
 * Outline: el panel es el `<header>` (logo y frase de marca en `<p>`, sin
 * headings); el único `<h1>` es el del formulario, en el `<main>`.
 *
 * `data-flow-shell`: el botón flotante de WhatsApp se esconde, igual que en
 * las pantallas de foco de los flujos (tapaba el "Continuar" en celular).
 */
export function SignInScreen({ intro, showJoin, exitHref, children }: SignInScreenProps) {
  return (
    <div data-flow-shell="" className="relative grid min-h-dvh bg-card lg:grid-cols-12">
      <header className="bg-brand-panel text-white max-lg:clip-diagonal-b lg:col-span-5 lg:clip-diagonal-r">
        <div className="flex h-full flex-col gap-5 px-4 pt-6 pb-14 sm:px-8 lg:gap-10 lg:py-12 lg:pr-32 lg:pl-12 xl:pb-0 xl:pl-16">
          <Link href="/" aria-label={brand.home} className="flex w-fit">
            {/* Arriba de todo, pero no es la LCP (mide 26px de alto): `eager`
                sin `preload`, como el logo del header del sitio. */}
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

          <div className="flex flex-col gap-4 lg:my-auto lg:gap-8">
            <p className="max-w-120 font-display text-2xl leading-tight font-bold tracking-tight text-balance lg:text-5xl">
              {brand.headline}
            </p>
            <p className="max-w-120 text-lead max-lg:hidden">{brand.body}</p>

            <div className="flex flex-col gap-3 max-lg:hidden lg:gap-4">
              <p className="font-display text-xl font-bold">{oneAccount.title}</p>
              <ul className="flex max-w-120 flex-col gap-3">
                {oneAccount.items.map((item) => (
                  <li key={item.strong} className="flex items-start gap-3 text-lead">
                    <span
                      aria-hidden="true"
                      className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-panel"
                    >
                      <Icon name="check" size={14} strokeWidth={2.6} />
                    </span>
                    <span>
                      <strong className="font-semibold">{item.strong}</strong>
                      {item.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* La captura real de la app en el bisel de la home, apoyada en el
              borde de abajo del panel y recortada a su parte de arriba. Solo
              desde `xl` y fuera del camino crítico: no es la LCP (el `<h1>`
              lo es). */}
          <div className="hidden h-64 w-48 shrink-0 overflow-clip rounded-t-4xl border-8 border-b-0 border-ink bg-card xl:block">
            <Image
              src={oneAccount.appShot.src}
              width={oneAccount.appShot.width}
              height={oneAccount.appShot.height}
              alt={oneAccount.appShot.alt}
              sizes="176px"
              className="h-auto w-full"
            />
          </div>
        </div>
      </header>

      <main className="flex items-center justify-center px-4 pt-6 pb-12 sm:px-8 lg:col-span-7 lg:px-12 lg:py-16">
        {/* `absolute` contra la raíz (el `<main>` no está posicionado): no
            scrollea con la columna ni la recorta su `overflow`. En celular
            está sobre el verde del panel: ícono y anillo de foco en blanco. */}
        <SignInExitLink
          href={exitHref}
          label={signInContent.close}
          className="absolute top-4 right-1.5 z-10 flex size-11 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 motion-reduce:transition-none max-lg:focus-visible:outline-white sm:right-5 lg:top-5 lg:right-9 lg:text-fg-muted lg:hover:bg-card-muted lg:hover:text-fg"
        >
          <Icon name="x" size={22} strokeWidth={2} />
        </SignInExitLink>
        <div className="flex w-full max-w-105 flex-col gap-5">
          <div className="flex flex-col gap-2">
            <h1 className="font-display text-3xl font-bold tracking-tight text-balance text-fg lg:text-4xl"
            >
              {ingresar.title}
            </h1>
            <p className="text-base text-fg-muted lg:text-lead">{intro}</p>
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
