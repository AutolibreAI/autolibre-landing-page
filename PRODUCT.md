# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Dueños de auto particulares en Argentina, hoy con operación real en AMBA
(`homeContent.marketplace.coverage`: "Hoy operamos en AMBA y estamos ampliando").

La escena que importa para esta superficie: la persona **no** está navegando el
sitio. Recibe un link suelto — por WhatsApp, por redes, por la bio de un perfil —
y lo abre sin haber leído nada previo sobre AutoLibre. Llega en frío, con el
teléfono en la mano o sentada frente a la compu, y tiene que entender qué es esto
y decidir si lo instala en cuestión de segundos.

Trabajo que está haciendo: mantener el auto en regla y en funcionamiento sin
llevar la cuenta a mano de papeles, vencimientos y arreglos.

## Product Purpose

AutoLibre es una app gratuita (iOS y Android) que junta en un solo lugar todo lo
que hoy vive disperso sobre un auto: documentación, vencimientos, historial de
mantenimiento, diagnóstico y contacto con talleres.

Frase de marca vigente en el sitio: *"Todo tu auto, en un solo lugar."*
Cierre del home: *"Tu auto siempre supo qué tenía. Ahora vos también."*

Éxito para esta superficie: que una persona que llega desde un link compartido
instale la app.

## Positioning

La combinación es lo propio: no es sólo un recordatorio de vencimientos ni sólo
un marketplace de talleres. Es el registro completo del auto — documentos,
vencimientos, historial — más diagnóstico asistido por IA sobre datos reales del
vehículo vía OBD2, más la red de talleres de la zona para resolver lo que el
diagnóstico encuentra. Todos los autos de una persona en una sola cuenta.

## Operating Context

- El link a esta página se comparte fuera del sitio; el visitante no pasó por el home.
- Tráfico mobile mayoritario, con una porción real en desktop (de ahí el puente QR).
- iOS primero en el orden de los botones: documentado en `lib/content/site.ts`
  como la fuente principal de tráfico mobile en AMBA.
- La instalación ocurre en el teléfono. Un botón de tienda abierto en desktop no
  instala nada: es el punto de fuga que esta superficie tiene que cubrir.

## Capabilities and Constraints

Capacidades confirmadas (`homeContent.features`, `lib/content/faq.ts`):

- Documentación — cédula, título, póliza y licencia siempre a mano.
- Vencimientos — VTV, seguro, patente y service, avisados a tiempo.
- Historial — todo lo que se le hizo al auto, registrado.
- Diagnóstico — qué le pasa al auto, explicado (IA sobre lectura OBD2).
- Talleres y servicios — a quién llamar, cerca tuyo.
- Varios autos en una sola cuenta.
- Gratis. Disponible hoy en App Store y Google Play.

Restricciones técnicas:

- Next.js 16.2.4 (App Router), React 19.2.4, Tailwind v4 con `@theme` CSS-first.
- Sin librería de animación, sin librería de íconos, sin dark mode
  (`colorScheme: "light"` fijo en `app/layout.tsx`). Los íconos se agregan como
  path en `components/ui/icon.tsx`.
- Server components por defecto; la frontera de cliente se empuja lo más profundo posible.
- `position: sticky` y las animaciones por scroll funcionan desde 2026-09-22:
  `body` pasó a `overflow-x: clip` (`html` mantiene `hidden`). Para recortar
  un contenedor que envuelva un sticky o un `reveal`, usar `overflow-clip`,
  nunca `overflow-hidden`.
- Las URLs de tienda salen siempre de `siteConfig.stores`, nunca hardcodeadas.

Decisiones explícitamente NO tomadas (2026-09-17), a no inventar:

- Qué pasa con el ancla `/#descargar` y los CTAs que apuntan ahí: el usuario pidió
  no tocar nada de eso por ahora. `/descarga` convive con el ancla existente.
- Parámetros de campaña en los links de tienda: sin UTMs por ahora. El código queda
  preparado para agregarlos en un solo lugar, sin nombres de campaña inventados.

## Brand Commitments

- Nombre AutoLibre; razón social AutoLibre.AI; `autolibre.ai`.
- Idioma es-AR, voseo, tono directo y sin vueltas. Nada de hype.
- Verde de marca `#2a8c3a`; tinta verde-negra `#1c2b1c`; superficies `#ffffff`,
  `#eaf3ec`, `#f7faf8`. Tokens en `app/globals.css` — única fuente de verdad.
- Tipografía: Outfit (display) + DM Sans (texto).
- Lockups en `public/brand/`, con una regla dura documentada en su README: sobre
  el verde de marca va `lockup-white.png`; `lockup-dark.png` trae el isotipo en
  verde y desaparece (contraste 1.24).

## Evidence on Hand

Material real disponible, nada que inventar:

- URLs de tienda reales en `lib/seo/config.ts` — App Store id `6777068403`,
  Play `com.autolibreai`.
- Capturas reales de la app: `/mockup/mockup-garage.webp` (1472×2886, **ya trae
  el marco del teléfono**, no envolver en `PhoneFrame`) y
  `/mockup/mockup-chatai.webp` (1408×3014).
- Foto real del conector OBD2: `/mockup/obd2-connector.webp`.
- Copy de producto ya escrito y en producción en `lib/content/`.
- WhatsApp y email de contacto reales en `siteConfig.contact`.

Ausencias que no se completan con invención: no hay testimonios, no hay cantidad
de usuarios, no hay rating de tiendas, no hay premios ni prensa. Ninguna de esas
cosas se escribe en esta superficie.

## Product Principles

1. La app es gratis y está disponible hoy. Eso se dice sin rodeos, no se insinúa.
2. Mostrar el producto trabajando antes que describirlo. Hay capturas reales; se usan.
3. La instalación pasa en el teléfono. Toda superficie de descarga tiene que
   funcionar para alguien que llegó desde la compu.
4. Nunca inventar prueba social, métricas ni claims comerciales.
5. El contenido vive en `lib/content/`, los tokens en `globals.css`. Un componente
   nuevo no trae su propia paleta ni su propio copy.

## Accessibility & Inclusion

Sin requisito formal declarado por el usuario. El código incumbente ya sostiene un
piso que esta superficie preserva: `:focus-visible` con outline de marca,
`prefers-reduced-motion` respetado globalmente, `aria-labelledby` en cada sección,
SVG decorativos con `aria-hidden`, inputs a 16px en mobile para evitar el zoom de
iOS, y objetivos táctiles de 44px en la navegación mobile.
