import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import Script from "next/script";
import { MetaPixelEvents } from "@/components/analytics/meta-pixel-events";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";
import { siteConfig } from "@/lib/seo/config";
import "./globals.css";

/**
 * Fuentes autohospedadas por next/font: cero requests a Google, cero
 * render-blocking y cero CLS. Ambas son variable fonts, así que un solo
 * archivo cubre todos los pesos.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  /** Resuelve a absolutas todas las URLs relativas de canonical y OG. */
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    /** Las páginas internas sólo declaran su nombre; el sufijo lo pone acá. */
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [...siteConfig.keywords],
  authors: [{ name: siteConfig.legalName, url: siteConfig.url }],
  creator: siteConfig.legalName,
  publisher: siteConfig.legalName,
  applicationName: siteConfig.name,
  category: "automotive",
  formatDetection: { telephone: false },
  // Los íconos los aportan `app/favicon.ico`, `app/icon.png` y
  // `app/apple-icon.png` por convención de archivo: Next los hashea y genera
  // los <link> solo. Declararlos acá además los duplicaría.
  manifest: "/manifest.webmanifest",
  /**
   * Token de Google Search Console. Sin la propiedad verificada no hay forma
   * de pedir reindexado ni de ver por qué Google no muestra el favicon, así
   * que el meta va en el layout — tiene que estar en el home, que es la URL
   * que se verifica. Sale de env para no versionar el token.
   */
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  themeColor: "#2a8c3a",
  colorScheme: "light",
};

/**
 * Marca `<html>` con `data-platform` para que el CSS elija el destino del
 * CTA de descarga (ver `DownloadCta` y las `@custom-variant platform-*` de
 * `globals.css`). iPadOS se reporta como "Macintosh": lo delata el touch.
 *
 * Va como `<script>` plano en el `<head>` y NO con `next/script`
 * `beforeInteractive`: en el App Router ese inline se encola en
 * `self.__next_s` y lo corre el loader de Next, o sea después del primer
 * paint, y el CTA parpadearía. Éste bloquea el parseo, pero son unos bytes.
 */
const platformScript = `try{var u=navigator.userAgent,p=/iPhone|iPad|iPod/.test(u)||(/Macintosh/.test(u)&&navigator.maxTouchPoints>1)?"ios":/Android/.test(u)?"android":"web";document.documentElement.dataset.platform=p}catch(e){}`;

/**
 * Entrada al scrollear (`reveal`, `reveal-group` en `globals.css`). Cuando un
 * elemento entra en pantalla, sube 1.5rem y aparece en 0,7s, escalonado por
 * `--reveal-step` (90ms por paso). Se dispara UNA vez, scrollees rápido o
 * lento.
 *
 * - Web Animations API y NO clases/atributos: no toca el DOM que renderizó
 *   React, así que no hay mismatch de hidratación. La animación arranca
 *   pausada en su primer frame (oculto) y se reproduce al entrar; al terminar
 *   se cancela para devolverle el control al CSS (hovers, transforms).
 * - Nunca oculta lo que ya está en pantalla al correr: sin parpadeo, sin
 *   costo de LCP. Tampoco lo que no se renderiza (`display: none`, p. ej.
 *   las pestañas inactivas del FAQ): nunca "entraría" en pantalla y al
 *   mostrarse quedaría invisible.
 * - Sin JS, sin IntersectionObserver o con `prefers-reduced-motion`: no hace
 *   nada y todo se ve normal. El HTML (y el SEO) es el mismo.
 * - `MutationObserver`: toma también lo que React monta al navegar.
 * - `rootMargin` con 100000px ARRIBA: todo lo que ya quedó por encima de la
 *   pantalla cuenta como "entrado". Sin eso, un scroll rápido (o un salto a
 *   `#faq`) pasa de largo sobre elementos que nunca intersectan y quedarían
 *   ocultos al volver a subir.
 *
 * Va como `<script>` inline al final del `<body>` y NO con `next/script`:
 * corre apenas se parsea el contenido, antes de hidratar.
 */
const revealScript = `(function(){try{if(!("IntersectionObserver"in window)||!Element.prototype.animate||matchMedia("(prefers-reduced-motion: reduce)").matches)return;var seen=new WeakSet(),anims=new WeakMap(),frames=[{opacity:0,transform:"translateY(1.5rem)"},{opacity:1,transform:"none"}];var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;io.unobserve(e.target);var a=anims.get(e.target);if(a)a.play()})},{rootMargin:"100000px 0px -10% 0px"});function scan(){document.querySelectorAll(".reveal,.reveal-group>*").forEach(function(el){if(seen.has(el))return;seen.add(el);if(!el.getClientRects().length)return;var r=el.getBoundingClientRect();if(r.top<innerHeight&&r.bottom>0)return;var step=parseFloat(getComputedStyle(el).getPropertyValue("--reveal-step"))||0;var a=el.animate(frames,{duration:700,delay:step*90,easing:"cubic-bezier(0.22,1,0.36,1)",fill:"both"});a.pause();a.onfinish=function(){a.cancel()};anims.set(el,a);io.observe(el)})}scan();var t;new MutationObserver(function(){cancelAnimationFrame(t);t=requestAnimationFrame(scan)}).observe(document.body,{childList:true,subtree:true})}catch(e){}})()`;

/**
 * Meta Pixel en dos tiempos, para que nunca compita con el LCP ni el INP:
 *
 * 1. Stub inline en el `<head>`: el `fbq` oficial de Meta SIN la parte que
 *    inyecta `fbevents.js`. Sólo encola llamadas, así que `init` + `PageView`
 *    (y cualquier evento temprano) quedan registrados por unos bytes.
 * 2. `fbevents.js` (~90KB) con `next/script` `lazyOnload`: baja en idle,
 *    después de todo lo demás, y al cargar vacía la cola del stub.
 *
 * `set autoConfig false` va ANTES de `init`: apagamos la configuración
 * automática (clics en botones y metadatos que Meta trackea por su cuenta)
 * para medir solo PageView, Lead, Contact y QuoteStart, como declara
 * /privacidad, y
 * evitar trabajo extra en cada clic (INP).
 *
 * Sin `<noscript><img>`: sin JS no hay nada que medir que nos importe, y es
 * un request extra. Sin `NEXT_PUBLIC_META_PIXEL_ID` no se renderiza nada.
 * Va como `<script>` plano por lo mismo que `platformScript`: el stub tiene
 * que existir antes de que hidrate cualquier isla que llame a `fbq`.
 */
const metaPixelScript = META_PIXEL_ID
  ? `!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[]}(window);fbq("set","autoConfig",false,${JSON.stringify(META_PIXEL_ID)});fbq("init",${JSON.stringify(META_PIXEL_ID)});fbq("track","PageView");`
  : null;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      className={`${outfit.variable} ${dmSans.variable}`}
      /**
       * `globals.css` declara `scroll-behavior: smooth` en `html`. Desde Next 16
       * el router ya no lo desactiva solo al navegar entre rutas: sin este
       * atributo, cada cambio de página haría un scroll animado hasta arriba.
       */
      data-scroll-behavior="smooth"
      /* El script de plataforma escribe `data-platform` antes de hidratar. */
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: platformScript }} />
        {metaPixelScript && <script dangerouslySetInnerHTML={{ __html: metaPixelScript }} />}
      </head>
      <body className="min-h-dvh bg-surface text-ink">
        {children}
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
        {metaPixelScript && (
          <>
            <Script src="https://connect.facebook.net/en_US/fbevents.js" strategy="lazyOnload" />
            <MetaPixelEvents />
          </>
        )}
      </body>
    </html>
  );
}
