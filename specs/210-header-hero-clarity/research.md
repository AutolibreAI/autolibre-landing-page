# Research: header y hero de la landing

**Feature**: `210-header-hero-clarity` · **Plan**: [plan.md](./plan.md) · **Fecha**: 2026-10-07

Todo lo de abajo sale de leer el código; no hay `NEEDS CLARIFICATION` pendientes. Lo que no se puede saber desde el repositorio está marcado como **[PRODUCTO]**.

---

## 0. Relevamiento (evidencia)

### 0.1 Puntos de entrada de presupuesto, hoy

| Dónde | Etiqueta | Destino | Archivo |
|---|---|---|---|
| Header (≥ `md`) y menú | "Pedir presupuesto" | `/pedido` (página) | `lib/content/site.ts` (`quoteLink`) |
| Hero de la home | "¡Pedí tu presupuesto!" (precedida de "¿Necesitás algún servicio?") | `#presupuesto` (baja a la sección) | `lib/content/home.ts`, `components/sections/home/hero.tsx` |
| Sección de la home | "Pedí tu presupuesto" (botón) | abre `QuoteRequestModal` (ventana superpuesta con `QuoteFlow`) | `presupuesto.ts` → `quotes.tsx` |
| Misma sección | "Ver cómo funciona el pedido de presupuesto" | `/pedido` | `quotes.tsx` |
| Pie | "Pedir presupuesto" | `/pedido` | `site.ts` |

Hallazgos: (a) son **tres etiquetas** para una misma acción ("Pedir presupuesto", "¡Pedí tu presupuesto!", "Pedí tu presupuesto"); (b) el hero sí cuesta un clic de más (baja y recién ahí abre el modal); (c) `QuoteRequestModal` se importa **solo** desde `quotes.tsx`, y `QuoteFlow` solo desde el modal.

### 0.2 Qué hace `/pedido` al llegar

`PedidoHero` trae en el mismo bloque el botón de WhatsApp y `PedidoForm`: en **escritorio** el formulario es la tarjeta de la derecha (visible al cargar); en **pantallas angostas** hay dos caminos (WhatsApp, o "Quiero que me contacten" que abre el formulario). Además tiene pasos, ejemplo, FAQ y una barra fija en mobile. El header de `/pedido` ya cambia su botón a WhatsApp.

### 0.3 Auditoría del header por página

| Página | Construye con | Anclas | Links de la derecha | Botón |
|---|---|---|---|---|
| `/` | `SiteHeader` directo | Producto · Cómo funciona · **Compatibilidad** · FAQ · Blog | Pedir presupuesto · Soy proveedor | Descargar la app |
| `/sobre-nosotros`, `/support`, `/eliminar-cuenta`, `/terminos`, `/privacidad` | `PageShell` | — | **Blog** · Pedir presupuesto · Soy proveedor | Descargar la app |
| `/blog`, `/blog/[categoría]`, `/blog/[categoría]/[slug]` | `PageShell` + `secondary` | — | Blog · Pedir presupuesto · **Soy dueño de auto** | Descargar la app |
| `/proveedores` | `PageShell` + `secondary` + `cta` | — | Blog · Pedir presupuesto · **Soy dueño de auto** | **Sumar mi negocio** |
| `/pedido` | `PageShell` + `cta` | — | Blog · Pedir presupuesto · Soy proveedor | **WhatsApp** |
| `/descarga` | encabezado propio | — | — (solo el logo) | — |
| `/proveedor/[slug]` *(spec 209)* | `SiteHeader` global (decisión del 2026-10-07) | ver arriba | ver arriba | ver arriba |

Hallazgos: el header **varía en cuatro ejes** (anclas presentes/ausentes, "Blog" en una fila u otra, link secundario "Soy proveedor"/"Soy dueño de auto", botón de la derecha) y en **dos construcciones** (`SiteHeader` directo y `PageShell`). Todos los desvíos entran por los props `showSectionLinks` y `secondary` de `SiteHeader`/`PageShell`.

### 0.4 Referencias a la compatibilidad

| Archivo | Referencia |
|---|---|
| `lib/content/site.ts:19` | link "Compatibilidad" → `/#compatibilidad` |
| `lib/content/home.ts:206-223` | `compatibility` (título, subtítulo, detalle, CTA de WhatsApp, imagen `obd2-connector.webp`) |
| `components/sections/home/compatibility.tsx` | la sección (`id="compatibilidad"`) |
| `app/page.tsx:6,61` | importa y monta la sección |
| `public/llms.txt:22` | "…cómo funciona, compatibilidad OBD2 y preguntas frecuentes" |
| `public/llms.txt:15` | dato de compatibilidad (**se conserva**: es contenido, no la sección) |
| `lib/content/faq.ts:127-131` | "¿Qué autos son compatibles con el adaptador?" (**se conserva y se completa**) |
| `PRODUCT.md:104` | menciona la foto `obd2-connector.webp` como evidencia disponible |

La imagen `public/mockup/obd2-connector.webp` solo la usa la sección eliminada.

### 0.5 Evidencia de funciones del hero (de la app y el backend)

| Función | Evidencia |
|---|---|
| Presupuestos y talleres | `releaseNotesCatalog.ts` (1.2.4-1: "Nueva solapa Servicios… presupuestos de talleres cerca tuyo"); `homeContent.marketplace` |
| Diagnóstico con IA | `homeContent.features`, `faq.ts`, `llms.txt` línea 14; adaptador de AR$10.000 |
| Mantenimiento | historial + vencimientos (`homeContent.features`, `llms.txt` líneas 12-13) |
| Multas | `backend-contracts.md` de la app: `GET /fines`, `POST /fines/sync` (9 jurisdicciones, una consulta por vehículo cada 30 días, `allowsVoluntaryPayment` como **bandera** sin monto); el hero ya tenía la palabra "Multas" |
| Financiación | solo existe como **familia del catálogo** (`slug: "financiacion"`) en pruebas de la app y en `service-family-picker.tsx`; **sin evidencia de función ni de proveedores** → excluida por producto |

---

## D1. El header deja de poder divergir: se eliminan los props

**Decisión**: `SiteHeader` y `PageShell` pierden `showSectionLinks` y `secondary`. Quedan `cta` (botón de la derecha) y `currentPath`. Todos los links salen de `siteContent.nav` (una lista de anclas+Blog y una de páginas).

**Por qué**: la causa raíz de que el header cambie al navegar es que **cada página decide** sus links. Una regla escrita en una spec se vuelve a romper; un prop que ya no existe no se puede usar. Es el único mecanismo que hace que el defecto sea un **error de compilación** y no un hallazgo de revisión.

**Alternativas descartadas**: (a) conservar los props y documentar excepciones → vuelve a divergir; (b) un test que compare headers → se agrega igual como red de seguridad (D13), pero no reemplaza al tipo.

**Excepciones que sobreviven** (FR-018): el **botón de la derecha** (`cta`) en `/proveedores` ("Sumar mi negocio") y `/pedido` (WhatsApp), y el encabezado mínimo de `/descarga` (D10). Nada más.

## D2. Una sola lista, visible igual en todas las páginas según el ancho

**Decisión**:
- Lista de anclas+Blog (visible desde `xl`): **Producto · Cómo funciona · FAQ · Blog**.
- Lista de páginas (visible desde `md`): **Pedí tu presupuesto · Soy proveedor** (hoy "Soy proveedor" aparece desde `lg`; se mantiene).
- Debajo de `xl` todo está en el menú (botón hamburguesa), **igual que hoy en la home**, ahora para todas las páginas.
- Las anclas usan `/#producto`, `/#como-funciona`, `/#faq`: ya son absolutas, así que funcionan desde cualquier página.

**Por qué**: es el comportamiento de la home, que es el que mejor resuelve el ancho. En páginas internas se pierde que "Blog", "Pedir presupuesto" y "Soy proveedor" estaban a la vista entre 1024 y 1279 px; pasan a estar en el menú, como en la home. A cambio, un mismo ancho muestra lo mismo en todas las páginas, que es lo que se pidió.

**Medidas a confirmar (R3)**: la etiqueta pasa de "Pedir presupuesto" (17 caracteres) a "Pedí tu presupuesto" (19) y sale una ancla; la suma es menor que la de hoy (4 anclas + Blog como ancla). Verificar en 1280, 1366 y 1440 px.

**Spike S1 — resultado (2026-10-07)**: desde `/blog`, tocar "FAQ" (`/#faq`) carga la home y baja a la sección: con el header de 73 px, el borde de la sección queda en 80 px y su título en 200 px, o sea **sin que el header lo tape**. **No hace falta `scroll-mt-*`.**

## D3. La etiqueta del CTA es una constante: "Pedí tu presupuesto"

**Decisión**: `quoteLink = { label: "Pedí tu presupuesto", href: "/pedido" }` en `lib/content/site.ts`, y de ahí salen el header, el menú, el pie y la banda de la home. Se elimina `homeContent.hero.quoteLink.label` y `presupuestoContent.section.ctaLabel`.

**Por qué**: voseo ya presente en el modal, la sección y `/pedido`; el infinitivo "Pedir" solo estaba en el header y el pie. Es la forma que ya usaba el 2 de 3 de los puntos de entrada y la de la barra fija de `/pedido`.

**Hero**: el 2026-10-07 producto decidió **sacar el CTA de presupuesto del hero** (seguía viéndose repetido junto al header y a la banda). Se eliminó `hero.quoteLink` completo, incluido el `lead` "¿Necesitás algún servicio?".

## D4. El destino es `/pedido`; la sección de la home se queda como banda con un botón

**Decisión**: todos los puntos de entrada son `<a href="/pedido">`. La sección `QuotesSection` **se conserva** (título, subtítulo y banda oscura) con dos botones: "Pedí tu presupuesto" (→ `/pedido`) y el de WhatsApp. Se **elimina** el link de texto redundante "Ver cómo funciona el pedido de presupuesto" (FR-006b).

**Por qué**: la spec permite "resumen con un botón" o eliminar la sección. Se conserva porque (a) quien baja por la home sigue encontrando el pedido, (b) mantiene el ritmo visual hero → banda oscura, y (c) cuesta menos que rediseñar la secuencia. El hero **ya no baja a esta sección**: va directo a `/pedido`.

**Consecuencia**: `quotes.tsx` deja de importar `QuoteRequestModal`, así que **la home no carga más el chunk del formulario ni su isla de cliente** (mejora INP y TBT; ver Constitución I).

**Alternativa descartada**: eliminar la sección. Se puede decidir después; no hay dependencias.

## D5. El código que queda sin uso se limpia en una fase aparte

**Hallazgo**: tras D4, `QuoteRequestModal` no tiene importadores y `QuoteFlow` solo lo importa el modal. Pero `components/quote-flow/` tiene piezas **compartidas con `/pedido`**: `places-autocomplete.css` (lo importan `pedido-form.tsx` y `provider-form.tsx`) y constantes (`PRESUPUESTO_WHATSAPP_URL` en `use-quote-flow.ts`, que usa `quote-success.tsx`).

**Decisión**: la Fase A **no borra** nada de `quote-modal/` ni de `quote-flow/`. La Fase C lo hace solo si una búsqueda de importadores (`grep -rn "quote-modal\|quote-flow" app components lib`) da cero para cada archivo a borrar, moviendo antes `places-autocomplete.css` a un lugar neutral. El valor `QUOTE_FLOWS.modal` queda en el catálogo hasta entonces: quitarlo cambia el tipo `QuoteFlow` que usa el servidor en `app/api/presupuesto/route.ts`.

**Por qué**: borrar en la misma entrega mezcla un cambio de comportamiento (visible) con una limpieza (invisible) y complica revertir.

## D6. Evento nuevo para medir los puntos de entrada: `quote_cta_clicked`

**Problema**: antes, el modal de la home generaba `quote_started { flow: "modal" }` al abrirse. Después, esas personas llegan a `/pedido` y generan `flow: "page"`, **sin dato de qué botón tocaron**. SC-006 (no bajar los pedidos) no se puede medir sin eso.

**Decisión**: agregar al catálogo un evento clickable `quote_cta_clicked` con `placement` de **lista cerrada** (`header`, `header_menu`, `home_quotes`, `footer`), solo PostHog (`meta: () => null`). El listener delegado lee `data-analytics-quote-placement` y descarta valores fuera de la lista (mismo criterio que `lead_source` y `store`). Detalle en [contracts/quote-entry-points.md](./contracts/quote-entry-points.md).

**Por qué**: es el patrón del repo (catálogo único, listener delegado, listas cerradas); mantiene los links como Server Components y no toca Meta, así que **no cambia** la optimización de campañas.

**Alternativa descartada**: un parámetro `?origen=` en `/pedido`. La página no lee `searchParams` hoy y habría que volverla dinámica o mover la lectura a una isla (ver D12).

## D7. Hero: lista de cuatro funciones, sin imágenes y debajo del subtítulo

**Decisión** (orden por potencial de ingresos, textos aprobados el 2026-10-07):

| # | Texto | Ícono (set existente) |
|---|---|---|
| 1 | Pedí presupuestos y compará talleres | `receipt` |
| 2 | Entendé qué le pasa a tu auto | `car` |
| 3 | Mantené tu auto al día | `clock` |
| 4 | Enterate si tenés multas | `alert` |

- Va como `<ul>` entre el subtítulo y los botones de tienda (`StoreLinks`), con un ícono decorativo (`aria-hidden`) por ítem y texto de 15–16 px en una columna; desde `sm`, dos columnas.
- **Es texto en el HTML del servidor** (indexable). No lleva enlaces (las funciones no tienen página propia), ni animación, ni imágenes: no cambia el LCP.
- El titular, las palabras rotativas y las pantallas del teléfono **no se tocan** (fuera de alcance).
- El subtítulo actual ("Documentación, vencimientos, historial, diagnóstico con IA, talleres y servicios cerca tuyo.") **repite** parte de la lista; se acorta a una frase que no la duplique (decisión de redacción de la Fase B, a aprobar por producto).

**Orden y nota de ingresos**: 1) presupuestos (comisión por pedido a proveedores), 2) diagnóstico (venta del adaptador), 3) mantenimiento, 4) multas. Sale del modelo de negocio de `PRODUCT.md` y `homeContent`, no de números. **[PRODUCTO]** puede reordenar.

**Frase de multas**: "Enterate si tenés multas" no promete reducir ni cubre el país; **no** debe sumarse "en todas las jurisdicciones". Si producto no puede confirmar que la función está disponible para todos (R1), se retira esa línea y la lista queda con tres.

**Riesgo de pliegue (R2)**: en 375×667 el título, las palabras, el subtítulo y los botones ya ocupan casi todo el alto. Criterio de aceptación: los botones de tienda siguen **visibles sin scroll**. Plan B: en mobile la lista va **debajo** de los botones y desde `md` entre subtítulo y botones.

## D8. Compatibilidad: qué se borra y qué se conserva

**Se borra**: `components/sections/home/compatibility.tsx`; el bloque `compatibility` de `home.ts`; la importación y el montaje en `app/page.tsx`; el link de `site.ts`; la mención "compatibilidad OBD2" en `llms.txt` línea 22; `public/mockup/obd2-connector.webp` (solo se usa ahí; confirmar con una búsqueda antes de borrarla).

**Se conserva**: la pregunta "¿Qué autos son compatibles con el adaptador?" de la FAQ y el dato de `llms.txt` línea 15.

**Se completa (FR-014b)**: la respuesta de la FAQ hoy dice "Decinos marca, modelo y año y te confirmamos…" sin decir **cómo**. Pasa a: "…escribinos a {email} o por WhatsApp con la marca, modelo y año y te confirmamos si el tuyo funciona." El correo sale de `siteConfig.contact.email` (la FAQ hoy lo escribe a mano en otra respuesta; se unifica). Las respuestas son texto plano (el `FaqItem` de la home no admite links), por eso se nombra el WhatsApp sin enlace: el enlace está en el pie. Si producto quiere el botón a un clic, la alternativa es R6.

**Enlaces viejos**: `/#compatibilidad` sin elemento destino no es un error: el navegador carga la home arriba. No se agrega redirección.

**`PRODUCT.md`**: la línea 104 menciona la foto como "evidencia disponible"; se ajusta para decir que ya no se usa en el sitio (opcional; es documentación).

## D9. SEO/GEO de la home

- `createMetadata` de `/` **no cambia** (el título y la descripción no mencionan compatibilidad).
- `app/sitemap.ts`: `lastModified` de `/` pasa a `2026-10-07` (cambia el contenido). `/pedido` no cambia de contenido, solo su header.
- `public/llms.txt` línea 22: de "qué es AutoLibre, funciones, cómo funciona, compatibilidad OBD2 y preguntas frecuentes" a "qué es AutoLibre, funciones, cómo funciona y preguntas frecuentes". La línea 15 se queda.
- El `FAQPage` JSON-LD sale de `allFaqItems`: al reescribir la respuesta de la FAQ queda coherente solo.
- Outline de la home tras el cambio: `h1` (hero) → `h2` por sección; sin saltos. Se verifica en el quickstart.

## D10. `/descarga` conserva su encabezado

**Decisión**: es una excepción documentada. La página existe para tapar una fuga (las tiendas abiertas en desktop no instalan nada) y su encabezado es solo el logo sobre fondo oscuro; ponerle el menú completo reintroduce las fugas que la página evita (ver el comentario de `app/descarga/page.tsx`). **Regla de la excepción**: el logo es el mismo y lleva a `/`; no tiene links propios. Está listada en [contracts/header-nav.md](./contracts/header-nav.md).

## D11. `/proveedor/[slug]` (spec 209) ya usa el header global

Aplicado el 2026-10-07 en la 209 (D21 revisada, T030, T039). Desde el punto de vista de la 210 solo falta que **no use props que dejan de existir**: `SiteHeader` sin `secondary` ni `showSectionLinks`. La 209 debe construirse **después** de esta entrega (R7).

## D12. Atribución hacia `/pedido`

**Hallazgo**: `app/pedido/page.tsx` no lee `searchParams`, así que `?origen=perfil&proveedor=<slug>` (propuesto en la 209, D19) hoy **no hace nada**. No se resuelve acá (fuera de alcance), pero se deja anotado: la 209 debe elegir entre volver `/pedido` dinámica o leer el parámetro en una isla de cliente, y la decisión afecta el rendimiento de la página que más se indexa.

## D13. Verificación de consistencia del header

**Decisión**: `scripts/site-nav/check-header.mjs`, sin dependencias: recibe una URL base, pide cada ruta de una lista fija, extrae del `<header>` los `href` y los textos de los links (y del menú móvil) y falla si dos páginas difieren fuera de las excepciones declaradas en el propio script (`/descarga`: solo logo; `/proveedores` y `/pedido`: solo el botón). Se corre contra `npm run build && npm start`, no forma parte de `next build`.

**Por qué**: el tipo evita que se reintroduzca la divergencia en el código, pero no verifica el **resultado renderizado** (p. ej. una página nueva que arma su propio `<header>`). Es una hoja de verificación automatizable, no un test de la app.

## D14. Qué NO se toca

Titular y palabras rotativas del hero · pantallas del teléfono · pasos del formulario de presupuesto · `/pedido` (salvo su header por D1) · `softwareApplicationSchema` (no lista funciones) · nombre y estructura del blog · el pie propio de `/proveedor/[slug]` (209).

---

## Decisiones de producto aún abiertas (no bloquean el plan)

| # | Qué | Quién | Efecto si no llega |
|---|---|---|---|
| P1 | **Multas** disponible para todos los usuarios de la versión publicada | Producto | La lista del hero queda con tres funciones (R1) |
| P2 | Orden final de las cuatro funciones y redacción del subtítulo del hero | Producto | Se publica con el orden de D7 |
| P3 | ¿Se mantiene la banda de presupuesto de la home o se elimina? | Producto | Se mantiene (D4) |
| P4 | ¿Hace falta un botón de consulta por WhatsApp a un clic para el escáner (R6)? | Producto | No se agrega |
