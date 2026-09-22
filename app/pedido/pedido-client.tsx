"use client";

import Image from "next/image";
import Link from "next/link";
import { QuoteFlow } from "@/components/quote-flow";
import { Icon } from "@/components/ui/icon";
import { presupuestoContent } from "@/lib/content/presupuesto";

const { page } = presupuestoContent;

/**
 * Layout de `/pedido`.
 *
 * Hay UN solo `<h1>` en el documento y dos lugares donde tiene que aparecer:
 * arriba del rail oscuro en desktop, y arriba del formulario en mobile.
 * En vez de renderizarlo dos veces con `hidden`/`lg:block` — que deja dos
 * encabezados en el DOM y rompe el outline de la página — el rail entero es
 * `display: contents` por debajo de `lg`: sus hijos se sueltan y pasan a ser
 * items del flex column de la página, que los reordena con `order` alrededor
 * del formulario. De `lg` para arriba el rail vuelve a ser una caja (`lg:flex`)
 * y se convierte en la columna izquierda fija.
 *
 * El orden en mobile es deliberado: intro → formulario → prueba social. Si el
 * bloque de prueba subiera arriba del formulario, el campo de patente se iría
 * abajo del fold, y sin patente visible no hay pedido.
 *
 * De `lg` para arriba el scroll es del `<main>`, no de la página: el wrapper
 * mide `h-dvh` y no scrollea, así que el rail queda quieto por construcción y
 * sólo la columna derecha corre. `sticky` acá no servía: `app/globals.css`
 * pone `overflow-x: hidden` en `body` — y como `html` ya está `hidden`, el
 * valor de `body` no propaga al viewport — lo que vuelve al `body` un
 * scrollport propio de altura automática que nunca scrollea, dejando inerte a
 * cualquier sticky adentro. Debajo de `lg` no se toca nada: scrollea la
 * página, que es de lo que depende la banda fija del CTA en mobile.
 * (2026-09-22: `body` pasó a `overflow-x: clip`, así que `sticky` ya
 * funciona. Este layout sigue siendo válido; no hace falta migrarlo.)
 */
export function PedidoClient() {
  return (
    <div className="flex min-h-dvh flex-col lg:h-dvh lg:min-h-0 lg:flex-row lg:overflow-hidden lg:bg-ink">
      {/* Barra mobile: sólo el logo. Sin nav y sin menú a propósito. */}
      <header className="order-1 sticky top-0 z-40 border-b border-line bg-surface/92 px-5 py-3 backdrop-blur-md lg:hidden">
        <Link href="/" aria-label={page.backHome} className="inline-block">
          <Image
            src="/brand/lockup-light.png"
            alt="AutoLibre.AI"
            width={676}
            height={132}
            priority
            /* Ver site-header: sin `sizes` el browser se baja la variante de
               1920px para 24px de alto. */
            sizes="115px"
            className="h-[1.375rem] w-auto"
          />
        </Link>
      </header>

      {/*
       * `lg:[@media(max-height:840px)]` = el escalón de notebook. El rail se
       * calibró para un monitor alto; en 1280x720 el contenido pedía 754px y
       * el usuario terminaba scrolleando adentro de la columna. En vez de
       * achicar el espaciado en todas las pantallas, se achica sólo cuando la
       * ventana es baja (720 / 768 / 800), y de 900px para arriba queda el
       * respiro original. `lg:overflow-y-auto` se mantiene como red para
       * ventanas muy bajas (600px), pero ya no se activa de 720 para arriba.
       */}
      <div className="contents lg:flex lg:h-dvh lg:w-[38%] lg:max-w-[520px] lg:shrink-0 lg:flex-col lg:justify-between lg:self-start lg:overflow-y-auto lg:overscroll-contain lg:bg-ink lg:px-12 lg:py-14 lg:text-white lg:[@media(max-height:840px)]:py-8">
        {/* Grupo superior del rail. En mobile es la intro sobre el formulario. */}
        <div className="order-2 px-5 pt-8 lg:order-none lg:p-0">
          <Link
            href="/"
            aria-label={page.backHome}
            className="mb-12 hidden lg:inline-block lg:[@media(max-height:840px)]:mb-8"
          >
            <Image
              src="/brand/lockup-dark.png"
              alt="AutoLibre.AI"
              width={676}
              height={132}
              sizes="132px"
              className="h-7 w-auto"
            />
          </Link>

          <h1 className="font-display text-[1.75rem] leading-[1.1] font-bold text-ink lg:text-[2.5rem] lg:leading-[1.05] lg:text-white xl:text-[3rem]">
            {page.title}
          </h1>

          <p className="mt-3 max-w-[34ch] text-[0.9375rem] leading-relaxed text-ink/65 lg:mt-5 lg:text-[1.0625rem] lg:text-white/70 lg:[@media(max-height:840px)]:mt-4">
            {page.subtitle}
          </p>
        </div>

        {/* Grupo inferior del rail. En mobile cae debajo del formulario. */}
        <div className="order-4 bg-surface-subtle px-5 py-10 lg:order-none lg:bg-transparent lg:p-0">
          {/* En mobile el cambio de fondo ya separa: la línea es sólo del rail. */}
          <ul className="flex flex-col gap-6 lg:border-t lg:border-white/10 lg:pt-8 lg:[@media(max-height:840px)]:gap-5 lg:[@media(max-height:840px)]:pt-6">
            {page.proof.map((row) => (
              <li key={row.icon} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand lg:bg-white/8 lg:text-brand-soft">
                  <Icon name={row.icon} size={20} />
                </span>
                <div>
                  <p className="text-[0.9375rem] font-semibold text-ink lg:text-white">
                    {row.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/65 lg:text-white/60">
                    {row.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <p className="mt-8 text-sm leading-relaxed text-ink/65 lg:mt-10 lg:text-white/55">
            {page.reassurance}{" "}
            <Link
              href="/privacidad"
              className="underline decoration-ink/30 underline-offset-4 transition-colors hover:decoration-brand lg:decoration-white/30 lg:hover:decoration-brand-soft"
            >
              {page.privacyLink}
            </Link>
          </p>
        </div>
      </div>

      <main className="order-3 flex-1 bg-surface lg:order-none lg:h-dvh lg:overflow-y-auto lg:overscroll-contain">
        {/*
         * La atribución (utm_source, utm_medium, utm_campaign, utm_content,
         * utm_term) se lee dentro de `useQuoteFlow({ attribution })`, no acá:
         * hoy está frenada en el DTO del backend, que con
         * `forbidNonWhitelisted` devuelve 400 ante cualquier campo que no
         * conozca. Hasta que el DTO los acepte, no van en ningún payload.
         */}
        <div className="mx-auto w-full max-w-[560px] px-5 pt-8 pb-14 sm:px-6 lg:px-12 lg:pt-[14vh] lg:pb-16">
          <QuoteFlow layout="page" />
        </div>
      </main>
    </div>
  );
}
