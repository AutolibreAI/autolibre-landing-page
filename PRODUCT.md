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
y decidir, en cuestión de segundos, si pide un presupuesto o instala la app.

Trabajo que está haciendo: mantener el auto en regla y en funcionamiento sin
llevar la cuenta a mano de papeles, vencimientos y arreglos.

## Product Purpose

AutoLibre es una app gratuita (iOS y Android) que junta en un solo lugar todo lo
que hoy vive disperso sobre un auto: documentación, vencimientos, historial de
mantenimiento, diagnóstico y contacto con talleres.

Frase de marca vigente en el sitio: *"Todo para tu auto, en un solo lugar."*
Cierre del home: *"Tu auto siempre supo qué tenía. Ahora vos también."*

Además resuelve servicios por vertical (estado al 2026-10-03):

- Operativas: Talleres, Seguros, Multas (pago con descuento + presentación del
  descargo), Repuestos, consulta de deuda de patente y turnos de VTV (estas dos
  últimas confirmadas por producto el 2026-10-03; todavía sin ruta propia en la
  web ni opción en `/pedido`).
- Financiamiento: "próximamente". Se muestra como badge en el nav y con la
  marca "Próximamente" en la franja de verticales de la home
  (`VerticalsBandSection`, solo informativa): sin página, no se puede elegir
  en `/pedido` y sin schema `Service`.

Éxito para el sitio (dos objetivos, al 2026-10-02):

1. Pedidos de presupuesto, por la web y por la app. Es la conversión principal
   de la web.
2. Descargas de la app.

El embudo: pedido en la web (`/pedido`) → seguimiento de las respuestas en la
app.

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
- Pedidos de presupuesto por vertical: Talleres, Seguros, Multas y Repuestos
  (Financiamiento todavía no; ver Product Purpose).
- Consulta de deuda de patente y turnos de VTV (operativas desde 2026-10-03).
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
- Capturas reales de la app: `/screenshots/app-inicio.webp` (1170×2532, inicio
  de la versión actual, **sin marco**: el bisel lo pone el componente) y
  `/mockup/mockup-chatai.webp` (1408×3014).
- Foto real del conector OBD2: ya no se usa en el sitio (se eliminó la sección de compatibilidad el 2026-10-07).
- Copy de producto ya escrito y en producción en `lib/content/`.
- WhatsApp y email de contacto reales en `siteConfig.contact`.

Cifras de tracción publicadas (a nov 2026): 1.100+ vehículos (dato de
producción del 2026-11-26: 1.164 vehículos activos, 1.101 autos y 63 motos;
antes, 700+ a oct 2026) y +150
proveedores en el marketplace (fuente: la constante `traction` de
`lib/content/about.ts`, que alimenta la ficha del hero y el hito "Tracción" de
`/sobre-nosotros`). Son las únicas cifras publicables: no se redondean para
arriba ni se reformulan, y se actualizan en los dos lugares (esa constante y
este archivo) cuando cambien.

Rediseño 2026-11 (decisiones del 2026-11-24): en textos de marketing la cifra
de proveedores es "+150" (`MARKETING_PROVIDERS_COUNT`, en `lib/content/about.ts`
junto a `traction` y re-exportada desde `home.ts`; reemplaza al "100+" en el
hero y el hito "Tracción" de `/sobre-nosotros`, con corte Nov 2026 desde el 2026-11-26);
el directorio muestra el conteo real. Seguros no se ofrecen por ahora como
pedido desde la web (el módulo de pedido no tiene pestaña Seguro); el beneficio
del aliado Intēgrity sigue en el Home.

Ajustes de copy del 2026-11-26 (pedido del dueño del producto): "Seguros" se
suma a las listas de lo que se puede pedir (`homeContent.services.also` y
`public/llms.txt`); el módulo de pedido de la web sigue sin pestaña Seguro
(esto último cambió el 2026-11-27, ver abajo). En
`/proveedores/registro` el mensaje "sin comisión" se reemplaza por "el primer
trabajo que te acercamos es gratis" y "todo por WhatsApp".

Pestañas Seguros y Financiación del módulo de pedido (2026-11-27, pedido del
dueño del producto; estado final del día): el módulo vuelve a tener Seguros
y suma Financiación, las dos como **consultas por formulario**. El form pide
los datos de la consulta, WhatsApp, email y consentimiento, y la registra en
el backend (`/api/consulta` → `POST /api/v1/inquiries/insurance` y
`/financing`); la confirmación muestra el número de consulta (`SG-…` /
`FN-…`) y dice que AutoLibre contacta a la persona por los datos que dejó.
WhatsApp queda únicamente como salida si el envío falla. No hay flag: si la
landing se despliega antes que el backend, las dos pestañas muestran ese
error con la salida por WhatsApp; el orden de despliegue es la protección.
El copy no puede prometer cotización automática, aprobación de crédito,
tasas, plazos ni aseguradoras o financieras con nombre hasta que producto
las confirme. Financiamiento sigue sin ser un producto que AutoLibre otorgue
(sin página propia ni schema `Service`); lo de "no se puede elegir en
`/pedido`" de más arriba ya no vale: se puede dejar una consulta.
"Seguros" pasa a ser una tarjeta más de "Todo lo que podés pedir" del Home.
Pendiente: la política de privacidad todavía no menciona CUIT, sexo, edad,
código postal, monto a financiar ni email de estas consultas (decisión legal).

Modelo de precios para proveedores (decisión del dueño, 2026-11-26): AutoLibre
deja de vender planes de suscripción (Gratis / Plus / Plus Max, con topes de
pedidos y prueba gratis) y cobra por **trabajo confirmado**: el usuario eligió
al negocio y llevó el auto. Esto resuelve la contradicción que quedaba
pendiente entre `/proveedores/registro` y `/proveedores/planes`. Lo único
publicable es esto:

- El primer trabajo que AutoLibre le acerca al negocio es gratis.
- Trabajo suelto: a partir del segundo trabajo, ARS 20.000 por trabajo nuevo
  confirmado en mecánica. Se paga
  después de que el auto fue, en una liquidación mensual. En rubros de ticket
  más bajo (lavaderos, gomerías) el precio es menor y se informa al
  registrarse: no se publica ese monto.
- Pack de 3 trabajos: ARS 50.000 (unos ARS 16.700 cada uno), prepago; cada
  trabajo confirmado descuenta uno. Existe para que salga más barato: se puede
  afirmar que con el pack cada trabajo sale menos que los ARS 20.000 del
  trabajo suelto (solo esa comparación). Lo puede comprar cualquier negocio
  desde el primer día y se compra por WhatsApp (mensaje por defecto: "Hola,
  quiero comprar un pack"); el backend no soporta packs por ahora.
- Es un precio fijo por trabajo, no un porcentaje. El pago del trabajo lo
  arreglan usuario y taller, sin pasar por AutoLibre, y el costo no se le suma
  al usuario arriba del precio.
- Se cobra por trabajo acercado, no por cliente: si el cliente vuelve directo
  al taller, no se paga nada; si vuelve a pedir por AutoLibre, es un trabajo
  nuevo.
- Los precios se actualizan cada tres meses. No hay topes de pedidos ni de
  propuestas por mes: todo negocio registrado recibe pedidos y responde.
- Pagar no influye en la recomendación de la IA.

No se publica nada más: ni IVA o facturación, ni cómo se paga el pack (medio
de pago, transferencia, comprobante), ni el vencimiento del pack (decisión del
dueño, 2026-11-26: no se habla de vigencia, tampoco para decir que no vence),
ni reglas sobre revisiones (muchas veces no se cobran: depende del taller), ni
períodos de prueba, ni
métricas de conversión o de clics, ni reseñas o "verificado" (no existen), ni
cómo se confirma el trabajo más allá de "te consultamos a vos y al usuario por
WhatsApp". Vocabulario: "trabajo", "trabajo confirmado", "pack de 3 trabajos",
"precios"; se evitan "plan", "suscripción", "fee" y "comisión" (salvo para
decir que no es un porcentaje).

Decisiones de esa misma fecha:

1. Precios publicados: solo el de mecánica y el del pack.
2. El pack es visible y comprable para todos los negocios.
3. Los CTA públicos van al registro o a WhatsApp. La contratación online
   (`/proveedores/contratar`) queda sin enlazar desde páginas públicas, pero
   no se borra.
4. La URL `/proveedores/planes` se mantiene (ahora es "Precios para
   proveedores"); el copy vive en `lib/content/providers-plans.ts`.

Estado de `/cuenta` y de la contratación (segunda vuelta, 2026-11-26): la
cuenta ya no vende suscripciones nuevas. Un negocio sin suscripción ve el
precio por trabajo y la oferta del pack con botón a WhatsApp (los montos salen
de `providers-plans.ts`); ya no ve "Contratar el plan Plus". Un negocio con una
suscripción vigente (en prueba, activa, con baja pedida o con pago pendiente)
sigue viendo su plan, su pago y la baja como antes; su copy de planes vive en
`lib/content/partner-legacy-plans.ts` y no se usa en páginas públicas. La
contratación online (`/proveedores/contratar`) queda huérfana a propósito
hasta nuevo aviso: no se borra ni se cambia su lógica, pero ningún enlace
lleva a ella salvo los `?next=` de flujos ya iniciados.

Actualización de producto para `/proveedores` (2026-10-27): la ficha publica
100+ negocios en la red y cobertura en todo el país. Estos datos viven en
`lib/content/providers-directory.ts`; las cifras de septiembre de
`/sobre-nosotros` conservan su fecha de corte histórica.

Registro de proveedores (decisión de producto, 2026-10-27): se permite adjuntar
un logo opcional. Las marcas atendidas (todas o una selección) se separan de las
marcas de especialidad, que son opcionales incluso al atender todas. Esto
reemplaza la postergación del logo indicada en la spec 004, FR-010.
El registro también permite una descripción opcional de hasta 90 caracteres y
links opcionales de Instagram, Facebook, TikTok, LinkedIn y YouTube.
Las especialidades se eligen con un desplegable y admiten marcas en texto libre.
El logo adjunto se muestra al revisar la solicitud en el admin y puede aparecer
en la red pública cuando el proveedor está aprobado y activo.

Ausencias que no se completan con invención: no hay testimonios, no hay rating
de tiendas, no hay premios ni prensa. Ninguna de esas cosas se escribe en esta
superficie.

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
