import type { Metadata, Viewport } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsEvents } from "@/components/analytics/analytics-events";
import { WhatsappFab } from "@/components/layout/whatsapp-fab";
import { REGISTRO_FLOW_SCRIPT } from "@/components/proveedores/registro/registro-flow-loading";
import { GTM_SCRIPTS } from "@/lib/analytics/gtm";
import { META_PIXEL_ID } from "@/lib/analytics/meta-pixel";
import { siteConfig } from "@/lib/seo/config";
import "./globals.css";

/**
 * Fuentes autohospedadas por next/font: cero requests a Google, cero
 * render-blocking y CLS acotado por el fallback métrico (`adjustFontFallback`:
 * una Arial con `size-adjust` y métricas ajustadas a la fuente real).
 *
 * Ambas son variable fonts y se cargan SIN `weight`: un solo woff2 por familia
 * (subset latin) cubre todos los pesos. Se midió (2026-11-24, fase 1 del
 * rediseño) que pedir pesos sueltos o un rango no achica nada: Google sirve
 * el MISMO archivo variable (Outfit 32,3 KB, DM Sans 36,9 KB) para
 * `wght@600;700`, `wght@600..700` o el rango completo. Acotar el rango solo
 * agregaría riesgo: un peso fuera del rango se clamparía en silencio.
 * Pesos en uso: Outfit 500/600/700/800 (headings y `font-display`), DM Sans
 * 400/500/600/700.
 */
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  adjustFontFallback: true,
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  adjustFontFallback: true,
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
 * 2. `fbevents.js` (~90KB, más su config de ~170KB) lo inyecta
 *    `deferredScriptsLoader` recién con la primera interacción (toque, tecla o
 *    scroll) o, si no la hay, unos segundos después del `load` y en idle.
 *    Al cargar vacía la cola del stub: no se pierde ningún evento de los que
 *    se encolaron antes. Antes iba con `next/script` `lazyOnload` (idle
 *    apenas después del `load`) y igual sumaba 520-590 ms de bloqueo del
 *    hilo principal en celular (Lighthouse, fase 0 del rediseño). El costo:
 *    quien se va antes de interactuar y antes de ese plazo no registra su
 *    `PageView` (rebote de pocos segundos sin tocar nada).
 *
 * `set autoConfig false` va ANTES de `init`: apagamos la configuración
 * automática (clics en botones y metadatos que Meta trackea por su cuenta)
 * para medir solo PageView, Lead, Contact, QuoteStart y PedidoPaso (un
 * evento por paso visto del pedido), como declara /privacidad, y evitar
 * trabajo extra en cada clic (INP).
 *
 * Sin `<noscript><img>`: sin JS no hay nada que medir que nos importe, y es
 * un request extra. Sin `NEXT_PUBLIC_META_PIXEL_ID` no se renderiza nada.
 * Va como `<script>` plano por lo mismo que `platformScript`: el stub tiene
 * que existir antes de que hidrate cualquier isla que llame a `fbq`.
 */
const metaPixelScript = META_PIXEL_ID
  ? `!function(f){if(f.fbq)return;var n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version="2.0";n.queue=[]}(window);fbq("set","autoConfig",false,${JSON.stringify(META_PIXEL_ID)});fbq("init",${JSON.stringify(META_PIXEL_ID)});fbq("track","PageView");`
  : null;

/**
 * Google Tag Manager, con el mismo criterio que el Pixel (ver
 * `lib/analytics/gtm.ts`): el stub del `<head>` sólo crea el `dataLayer` para
 * que los eventos tempranos queden en cola, y `gtm.js` baja con el loader
 * diferido de abajo. Sin `@next/third-parties` ni `next/script`: cargan el
 * contenedor apenas hidrata, que es justo el bloqueo del hilo principal que
 * se sacó con el Pixel. Sin `NEXT_PUBLIC_GTM_ID` no se renderiza nada.
 */
const gtmStubScript = GTM_SCRIPTS?.stub ?? null;

/** Segundos después del `load` en que los scripts de medición bajan igual si nadie interactuó. */
const DEFERRED_SCRIPTS_DELAY_MS = 3500;

/**
 * Scripts de terceros que esperan a la primera interacción o al idle
 * posterior al `load`. `before` es JS que corre justo antes de inyectar el
 * `src` (el arranque de GTM).
 */
const deferredScripts: { before?: string; src: string }[] = [];
if (META_PIXEL_ID) {
  deferredScripts.push({ src: "https://connect.facebook.net/en_US/fbevents.js" });
}
if (GTM_SCRIPTS) {
  deferredScripts.push({ before: GTM_SCRIPTS.start, src: GTM_SCRIPTS.src });
}

/**
 * UN solo disparador para todos los scripts diferidos: un único juego de
 * listeners y un único timer, en lugar de uno por herramienta. Cada script va
 * en su `try` para que si uno falla el otro igual se cargue.
 */
const deferredScriptsLoader =
  deferredScripts.length > 0
    ? `(function(){var done=false,evs=["pointerdown","keydown","scroll","touchstart"];function inject(u){var s=document.createElement("script");s.async=true;s.src=u;document.head.appendChild(s)}function load(){if(done)return;done=true;${deferredScripts
        .map(
          ({ before = "", src }) =>
            `try{${before}inject(${JSON.stringify(src)})}catch(e){}`,
        )
        .join(
          "",
        )}}evs.forEach(function(e){addEventListener(e,load,{once:true,passive:true})});function later(){setTimeout(function(){"requestIdleCallback"in window?requestIdleCallback(load,{timeout:2000}):load()},${DEFERRED_SCRIPTS_DELAY_MS})}document.readyState==="complete"?later():addEventListener("load",later,{once:true})})()`
    : null;

/**
 * PostHog no tiene nada en el `<head>`: lo inicializa
 * `instrumentation-client.ts` con un `import()` diferido (ver
 * `lib/analytics/posthog.ts`). Acá sólo decide si hace falta la isla de
 * medición: sin token, Pixel ni GTM no hay nada que escuchar.
 */
const POSTHOG_ENABLED = Boolean(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN);

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
        {/* Marca del flujo del alta en `/proveedores/registro` (ver el script). */}
        <script dangerouslySetInnerHTML={{ __html: REGISTRO_FLOW_SCRIPT }} />
        {metaPixelScript && <script dangerouslySetInnerHTML={{ __html: metaPixelScript }} />}
        {gtmStubScript && <script dangerouslySetInnerHTML={{ __html: gtmStubScript }} />}
      </head>
      {/* Fondo `canvas` (sistema "AutoLibre AI"): el header va sobre `card` y
          cada `Section` pinta su propio fondo, así que el lienzo solo asoma
          donde una página no lo cubre. */}
      <body className="min-h-dvh bg-canvas text-ink">
        {children}
        {/* Una sola vez acá: queda en todas las páginas (home incluida). */}
        <WhatsappFab />
        <script dangerouslySetInnerHTML={{ __html: revealScript }} />
        {deferredScriptsLoader && (
          <script dangerouslySetInnerHTML={{ __html: deferredScriptsLoader }} />
        )}
        {(metaPixelScript || gtmStubScript || POSTHOG_ENABLED) && <AnalyticsEvents />}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
