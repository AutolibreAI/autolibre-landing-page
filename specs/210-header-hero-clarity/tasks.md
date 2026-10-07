---

description: "Lista de tareas de la feature 210 — Claridad y conversión del header y el hero"
---

# Tasks: Claridad y conversión del header y el hero de la landing

**Input**: documentos de diseño en `/specs/210-header-hero-clarity/`
**Prerequisites**: [plan.md](./plan.md) · [spec.md](./spec.md) · [research.md](./research.md) · [data-model.md](./data-model.md) · [contracts/](./contracts/) · [quickstart.md](./quickstart.md)

**Tests**: la spec no los pide y no hay lógica pura nueva que justifique `node --test`. La verificación es (a) **por tipos**: los props eliminados rompen la compilación si alguien los usa, (b) el script `scripts/site-nav/check-header.mjs` contra un servidor en marcha y (c) la lista del [quickstart](./quickstart.md). No se escriben tests de render.

**Organization**: agrupadas por historia de usuario. Las tres historias P1 (US4, US3, US1) comparten archivos, así que se implementan **en el orden de las fases** y se cierran juntas como "Fase A" del plan; US2 (P2) es la "Fase B", con puerta de producto.

## Formato: `[ID] [P?] [Story] Descripción con ruta`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencia de una tarea incompleta).
- **[Story]**: US1 presupuesto en un paso · US2 hero con funciones · US3 menú sin links confusos · US4 header idéntico.
- **🔧** = tarea manual u operativa sin código en este repo.

## Convenciones que aplican a todas las tareas

- **Copy en `lib/content/*`**, nunca en componentes (Constitución II). Contacto y tiendas desde `siteConfig`.
- **Server Components por defecto**: `MobileNav` es la única isla del header; no se agregan `"use client"`.
- **Clases canónicas de Tailwind v4** y tokens de `@theme`; sin hex ni valores arbitrarios.
- **Íconos solo del set existente** (`receipt`, `car`, `clock`, `alert`): no se agregan íconos nuevos.
- **Compilación**: `npx tsc --noEmit` debe pasar al cerrar cada fase; entre tareas de una misma fase puede haber errores transitorios.
- **Commits**: prefijo propio (`feat(landing)`/`refactor(landing)`), separado de los de la #209 (misma rama).
- **Archivos compartidos entre historias**: `lib/content/site.ts`, `lib/content/home.ts`, `lib/content/presupuesto.ts`, `components/sections/home/hero.tsx` y `app/page.tsx` los tocan varias historias; esas tareas **no son `[P]`** y van en el orden en que aparecen.

---

## Phase 1: Setup (línea de base y herramienta de verificación)

**Propósito**: medir el "antes" y tener la herramienta que va a demostrar el "después".

- [X] T001 Spike S1: leer en `node_modules/next/dist/docs/` lo que corresponda a `next/link` con ancla (`/#faq`) y comprobar a mano, con `npm run dev`, que desde `/blog` tocar un link a `/#faq` carga la home **y baja** a la sección sin que el header `sticky` (`h-18`) tape el título. Registrar el resultado en `specs/210-header-hero-clarity/research.md` D2. **Si el header tapa el título**, esta misma tarea agrega `scroll-mt-18` (la altura del header) a las secciones destino de las anclas: `id="producto"` en `components/sections/home/hero.tsx`, `id="como-funciona"` en `components/sections/home/how-it-works.tsx` e `id="faq"` en `components/sections/home/faq.tsx`
- [ ] T002 [P] 🔧 Medir la línea de base de rendimiento: Lighthouse **mobile** sobre `npm run build && npm start` para `/` (LCP, CLS, TBT, peso de JS) y anotarla en `specs/210-header-hero-clarity/baseline.md` (archivo nuevo). Es la referencia de SC-005
- [ ] T003 [P] 🔧 Extraer de PostHog la línea de base de SC-006: cantidad de `quote_started` con `flow = modal` **más** `flow = page` en los últimos 14 días, y de `quote_submitted`, y anotarla en `specs/210-header-hero-clarity/baseline.md`. Si no hay acceso, dejar la tarea abierta y anotar quién la hace; **no bloquea la implementación pero sí la publicación** (puerta 3 del quickstart)
- [X] T004 [P] Crear `scripts/site-nav/check-header.mjs` (Node 22, sin dependencias): recibe una URL base, pide con `fetch` las rutas `/`, `/pedido`, `/proveedores`, `/sobre-nosotros`, `/support`, `/eliminar-cuenta`, `/terminos`, `/privacidad`, `/blog`, una categoría y un post del blog (descubiertos desde `/blog`; si no hay posts, se omiten con aviso), extrae del primer `<header>` los `href` y textos de sus links, y falla si dos páginas difieren **fuera** de la tabla de excepciones de `contracts/header-nav.md` (`/proveedores` y `/pedido`: solo el botón; `/descarga` se omite porque su encabezado es mínimo). Imprime una tabla página × diferencias
- [ ] T005 Correr `node scripts/site-nav/check-header.mjs http://localhost:3000` **antes de cambiar nada** y guardar la salida (debe fallar, mostrando las divergencias actuales) en `specs/210-header-hero-clarity/baseline.md` (depende de T002 y T004)

---

## Phase 2: Foundational (contenido y analítica que consumen todas las historias)

**Propósito**: la lista maestra del menú, la etiqueta única y el evento de analítica.

**⚠️ CRÍTICO**: ninguna historia puede empezar hasta terminar esta fase.

- [X] T006 Reescribir `siteContent.nav` en `lib/content/site.ts` según `data-model.md §2`: `quoteLink = { label: "Pedí tu presupuesto", href: "/pedido" }`; `links` = Producto · Cómo funciona · FAQ · (Blog si `BLOG_PUBLIC`), **sin** "Compatibilidad"; **eliminar** `nav.blogLink` (el Blog pasa a ser parte de `links` en todas las páginas); `providerLink` y `cta` sin cambios. El pie sigue usando `quoteLink` y `blogLink` desde la misma constante. Actualizar los comentarios que mencionan "páginas internas" y "la home"
- [X] T007 [P] Agregar el evento a `lib/analytics/events.ts` según `contracts/quote-entry-points.md §4`: `ANALYTICS_EVENTS.quoteCtaClicked = "quote_cta_clicked"`, `QUOTE_CTA_PLACEMENTS` (`header`, `header_menu`, `hero`, `home_quotes`, `footer`), tipo `QuoteCtaPlacement`, props `quote_cta_clicked: { placement: QuoteCtaPlacement }` y entrada de catálogo `{ posthog: "client", meta: () => null, clickable: true }`. Corregir el comentario de `quoteStarted` ("modal o `/pedido`")
- [X] T008 Modificar `components/analytics/analytics-events.tsx`: leer `data-analytics-quote-placement`, validarlo contra `Object.values(QUOTE_CTA_PLACEMENTS)` (mismo patrón que `LEAD_SOURCE_VALUES`/`STORE_VALUES`) y mandarlo como `placement`; si no es válido, no se agrega el prop pero el evento sale. Documentar el atributo en el comentario del componente (depende de T007)

**Checkpoint**: `npx tsc --noEmit` va a fallar en `site-header.tsx` y en el pie por `nav.blogLink`; se resuelve en la fase siguiente.

---

## Phase 3: User Story 4 — El header es el mismo en todas las páginas (Priority: P1) 🎯

**Goal**: mismo conjunto de links, orden y textos en todas las páginas según el ancho; solo el botón de la derecha puede cambiar.

**Independent Test**: `node scripts/site-nav/check-header.mjs` termina con 0 diferencias fuera de las excepciones, y a mano el mismo ancho muestra lo mismo en `/` y en `/blog` (spec US4, escenarios 1–5).

- [X] T009 [US4] Reescribir `components/layout/site-header.tsx` según `contracts/header-nav.md`: **eliminar** los props `showSectionLinks` y `secondary`; quedan `cta` y `currentPath`. Un solo `links` (anclas + Blog) en la navegación "Secciones" (visible desde `xl`), `quoteLink` (desde `md`) y `providerLink` (desde `lg`) en la navegación "Páginas"; `aria-current` en **todos** los links por coincidencia exacta con `currentPath`; el link de presupuesto lleva `data-analytics-event="quote_cta_clicked"` y `data-analytics-quote-placement="header"`. Pasar a `MobileNav` la lista completa y el `href` del presupuesto (depende de T006, T008)
- [X] T010 [US4] Modificar `components/layout/mobile-nav.tsx`: **eliminar** el prop `hideFrom` (el menú se oculta siempre desde `xl`; `hideClass` queda con `xl:hidden`); recibir `links` (anclas + Blog) y `pageLinks` (presupuesto + proveedor) y un prop `quoteHref` para marcar el link de presupuesto con `data-analytics-event="quote_cta_clicked"` y `data-analytics-quote-placement="header_menu"`. **No** importar `siteContent` en este archivo (es una isla de cliente: arrastraría todo el contenido al bundle). Orden del menú: anclas, Blog, presupuesto, proveedor, y el `cta` al pie (depende de T009)
- [X] T011 [US4] Modificar `components/layout/page-shell.tsx`: **eliminar** `showSectionLinks` y `secondary` de las props y de la llamada a `SiteHeader`; quedan `children`, `cta` y `currentPath` (depende de T009)
- [X] T012 [P] [US4] Quitar `secondary={{ label: "Soy dueño de auto", href: "/" }}` de `PageShell` en `app/blog/page.tsx` (conservar `currentPath`)
- [X] T013 [P] [US4] Ídem en `app/blog/[category]/page.tsx`
- [X] T014 [P] [US4] Ídem en `app/blog/[category]/[slug]/page.tsx`
- [X] T015 [P] [US4] Quitar `secondary` de `PageShell` en `app/proveedores/page.tsx` (conservar `cta={{ label: "Sumar mi negocio", href: "#form" }}`)
- [X] T016 [US4] Pasar `npx tsc --noEmit`: no debe quedar ningún uso de `showSectionLinks`, `secondary` ni `nav.blogLink` (`grep -rn "showSectionLinks\|secondary=\|nav\.blogLink" app components lib`) (depende de T009–T015)
- [X] T017 [US4] Verificar US4: levantar `npm run dev`, correr `node scripts/site-nav/check-header.mjs http://localhost:3000` (0 diferencias), revisar a 390 / 1024 / 1280 / 1440 px que `/` y `/blog` muestran lo mismo y que a 1280 nada se parte (R3); recorrer el menú con teclado; confirmar el resultado del spike T001 (anclas desde `/blog`) (depende de T016)

**Checkpoint**: US4 funciona sola.

---

## Phase 4: User Story 3 — Menú sin links confusos (Priority: P1)

**Goal**: "Compatibilidad" desaparece del menú y del sitio; la información sigue en la FAQ.

**Independent Test**: `grep -rniE "compatibilidad|#compatibilidad|CompatibilitySection|obd2-connector" app components lib public` solo devuelve lo permitido, y `/#compatibilidad` carga la home (spec US3, escenarios 1–5).

- [X] T018 [US3] Quitar `CompatibilitySection` de `app/page.tsx` (el `import` de la línea 6 y el montaje de la línea 61)
- [X] T019 [US3] Eliminar el bloque `compatibility` de `lib/content/home.ts` (líneas ~206–223; título, subtítulo, detalle, CTA de WhatsApp e imagen) (depende de T018)
- [X] T020 [P] [US3] Eliminar `components/sections/home/compatibility.tsx` (depende de T018)
- [X] T021 [P] [US3] Reescribir la respuesta de `faq-autos-compatibles` en `lib/content/faq.ts` (~línea 127): conserva "La mayoría de los autos con conector de diagnóstico bajo el volante." y termina con la vía de contacto armada con `siteConfig.contact.email` ("Escribinos a {email} o por WhatsApp con marca, modelo y año y te confirmamos si el tuyo funciona."). Importar `siteConfig` si el archivo no lo hace; **no** dejar el correo escrito a mano en esta respuesta (FR-014b, Constitución II)
- [X] T022 [P] [US3] Modificar `public/llms.txt` línea 22: de "qué es AutoLibre, funciones, cómo funciona, compatibilidad OBD2 y preguntas frecuentes." a "qué es AutoLibre, funciones, cómo funciona y preguntas frecuentes." **Dejar intacta la línea 15** (dato de compatibilidad OBD-II)
- [X] T023 [US3] Buscar usos de `public/mockup/obd2-connector.webp` (`grep -rn "obd2-connector" app components lib public PRODUCT.md`); si solo queda `PRODUCT.md`, **borrar el archivo** y ajustar la línea 104 de `PRODUCT.md` para decir que la foto ya no se usa en el sitio (depende de T019)
- [X] T024 [US3] Verificar US3 con la búsqueda de `quickstart.md` ("US3 · Sin Compatibilidad"): sin referencias en `app/`, `components/` ni `site.ts`; `/#compatibilidad` carga la home sin error; outline de la home sin saltos (`h1` → `h2`); el `FAQPage` JSON-LD refleja la respuesta nueva (depende de T018–T023)

**Checkpoint**: US3 y US4 funcionan juntas.

---

## Phase 5: User Story 1 — Un solo camino para pedir presupuesto (Priority: P1)

**Goal**: header, hero, banda de la home y pie llevan directo a `/pedido` con la misma etiqueta.

**Independent Test**: desde la home, tocar los cuatro puntos de entrada: cada uno llega a `/pedido` con un clic y dice "Pedí tu presupuesto" (spec US1, escenarios 1–7).

- [X] T025 [US1] *(revisada: `hero.quoteLink` se eliminó por completo)* Original: en `hero.quoteLink` dejar solo `lead: "¿Necesitás algún servicio?"` (quitar `label` y `href`); actualizar el comentario ("hacia `QuotesSection`" ya no es verdad) (depende de T019 por ser el mismo archivo)
- [X] T026 [US1] *(revisada el 2026-10-07: el hero NO lleva CTA de presupuesto; se eliminó el link y su `lead`, y `QUOTE_CTA_PLACEMENTS.hero` ya no existe)* Original: el link de presupuesto pasaba a ser `<a href={quoteLink.href}>` con el texto de `siteContent.nav.quoteLink.label` (importar `siteContent`), más `data-analytics-event="quote_cta_clicked"` y `data-analytics-quote-placement="hero"`; mantener el `lead` y las clases de foco/área táctil (`min-h-11`). Actualizar el comentario de cabecera (depende de T025)
- [X] T027 [US1] Modificar `lib/content/presupuesto.ts` (`section`): eliminar `ctaLabel` y `pageLink`; el resto (`titleLines`, `subtitle`, `whatsapp`) queda igual. Ajustar el comentario "sección de presupuesto de la home" si queda desactualizado
- [X] T028 [US1] Modificar `components/sections/home/quotes.tsx`: quitar el `import` de `QuoteRequestModal` y el link de texto de `pageLink`; el CTA pasa a ser `ButtonLink` a `siteContent.nav.quoteLink.href` con su etiqueta (`size="lg"`) y `data-analytics-event="quote_cta_clicked"` + `data-analytics-quote-placement="home_quotes"`; conservar el botón de WhatsApp y quitar el `import` de `next/link` si queda sin uso. La sección sigue siendo Server Component y ya no tiene isla de cliente (depende de T027)
- [X] T029 [P] [US1] Modificar `components/layout/site-footer.tsx`: el link cuyo `href` coincide con `siteContent.nav.quoteLink.href` lleva `data-analytics-event="quote_cta_clicked"` y `data-analytics-quote-placement="footer"`; el resto de los links no cambia (depende de T006, T008)
- [X] T030 [US1] Comprobar que ningún punto de entrada abre un formulario en una ventana superpuesta: `grep -rn "QuoteRequestModal" app components` solo debe mostrar la definición en `components/quote-modal/`
- [X] T031 [US1] Verificar US1 con `quickstart.md` ("US1"): los cuatro puntos de entrada a `/pedido` en un clic con la misma etiqueta; el del menú móvil a 390 px cierra el menú; en `/pedido` el formulario se ve al cargar (escritorio) y los dos caminos (390 px); la home **no** pide el chunk de `quote-flow` (pestaña *Network*); cada punto genera **un** `quote_cta_clicked` con su `placement` (depende de T026, T028, T029)

**Checkpoint**: las tres historias P1 completas = **Fase A**. Se puede publicar sin la Fase B.

---

## Phase 6: User Story 2 — El hero muestra las funciones que más conviene vender (Priority: P2)

**Goal**: el hero destaca cuatro funciones reales, sin promesas que la app no cumple.

**Independent Test**: mostrar la primera pantalla 5 segundos a alguien ajeno al producto y preguntarle qué ofrece; auditar que cada frase tiene una función real detrás (spec US2, escenarios 1–4).

> **Puerta de producto (R1)**: la frase de **multas** necesita la confirmación de que la función está disponible para todos los usuarios de la versión publicada. Producto aprobó las cuatro funciones y sus textos (2026-10-07) pero no confirmó la disponibilidad. Hasta tenerla, la frase de multas se puede **construir** pero no **publicar**; si no llega, se elimina su ítem y la lista queda con tres.

- [X] T032 [P] [US2] Agregar el tipo `HeroHighlight` (`id`, `icon: IconName`, `text`) a `lib/content/types.ts` según `data-model.md §5`
- [X] T033 [US2] Agregar `highlights` a `homeContent.hero` en `lib/content/home.ts` con los cuatro ítems en este orden: "Pedí presupuestos y compará talleres" (`receipt`), "Entendé qué le pasa a tu auto" (`car`), "Mantené tu auto al día" (`clock`), "Enterate si tenés multas" (`alert`), con `satisfies readonly HeroHighlight[]`. **No** modificar `hero.subtitle`: repite parte de la lista, pero acortarlo es una decisión de redacción pendiente de producto (P2 de `research.md`); dejarlo anotado ahí (depende de T032, T025)
- [X] T034 [US2] Modificar `components/sections/home/hero.tsx`: renderizar `highlights` como `<ul>` entre el subtítulo y `StoreLinks`, con el ícono decorativo (`aria-hidden`, `Icon`) y el texto; una columna y desde `sm` dos; texto de 15–16 px sin efectos ni imágenes ni enlaces. Si en 375×667 los botones de tienda quedan fuera de la primera pantalla (R2), pasar la lista **debajo** de `StoreLinks` en mobile (`order-*`/render condicional por breakpoint con clases, sin JS) y dejarla entre subtítulo y botones desde `md` (depende de T026, T033)
- [X] T035 [US2] Verificar US2 con `quickstart.md` ("US2"): las cuatro frases en el HTML del servidor (`curl`), botones de tienda visibles sin scroll en 375×667, un solo `<h1>`, sin encabezados nuevos, ningún texto con "ahorrá", "reducí", "financiación" ni cifras, y contraste/foco/ táctil OK. Si falta la confirmación de producto, **retirar** el ítem de multas y anotarlo en `research.md` P1 (depende de T034)

**Checkpoint**: Fase B completa.

---

## Phase 7: Polish y cierre

**Propósito**: SEO/GEO, documentación, calidad y puerta de publicación.

- [X] T036 [P] Actualizar `app/sitemap.ts`: `lastModified` de `/` a `2026-10-07` (cambió el contenido de la home)
- [X] T037 [P] Revisar que `lib/seo/schema.ts` y los `JsonLd` de las páginas no nombren la sección eliminada ni cambien por la FAQ (el `FAQPage` sale de `allFaqItems`): `grep -rniE "compatib" lib/seo app`
- [X] T038 [P] Actualizar en `specs/209-public-provider-profile/` lo que depende de esta entrega: dejar en `tasks.md` T030/T039 una nota de que `SiteHeader` ya no acepta `secondary`/`showSectionLinks` y que el perfil lo usa sin overrides (la decisión del header global ya está aplicada allí; esto es solo la referencia cruzada)
- [X] T039 Correr los comandos de cierre: `npx tsc --noEmit`, `npm run lint`, `npm run build` (0 errores de TypeScript y de ESLint; sin `ts-ignore` ni `eslint-disable` nuevos)
- [ ] T040 Correr **toda** la lista de `quickstart.md` y `node scripts/site-nav/check-header.mjs http://localhost:3000` contra `npm run build && npm start`; Lighthouse mobile de `/` y comparar con `baseline.md` (LCP < 2,5 s, CLS < 0,1; el JS de la home debe **bajar**). Anotar resultados en `specs/210-header-hero-clarity/baseline.md` (depende de T017, T024, T031, T035)
- [ ] T041 **Puerta de publicación** (no automática): antes de publicar cumplir los cuatro puntos de `quickstart.md §3` — Fase A verde, aviso a marketing del corte en `quote_started` (modal → page) y del evento nuevo, línea de base de SC-006 (T003) y confirmación de multas para la Fase B. 🔧 Con la Fase B publicada, medir SC-004: mostrar la primera pantalla 5 segundos a 5 personas ajenas al producto
- [ ] T042 *(Fase C, opcional y solo si cada búsqueda da cero importadores)* Limpieza del código que dejó de usarse al sacar el modal de la home: mover `components/quote-flow/places-autocomplete.css` (lo importan `pedido-form.tsx` y `provider-form.tsx`) a un lugar neutral y actualizar sus dos importadores; después borrar `components/quote-modal/`, `components/quote-flow/quote-flow.tsx`, `quote-success.tsx`, `plate-field.tsx` y `use-quote-flow.ts` **solo si** `grep -rn "quote-modal\|quote-flow" app components lib` no los encuentra; no tocar `QUOTE_FLOWS.modal` (lo usa el tipo del servidor). Hacerlo en un commit aparte (D5)

---

## Dependencias y orden de ejecución

### Entre fases

- **Setup (1)**: sin dependencias. T001 conviene primero (puede cambiar la implementación del header).
- **Foundational (2)**: depende de Setup y **bloquea** todas las historias.
- **US4 (3) → US3 (4) → US1 (5)**: las tres son P1 y comparten archivos; se hacen en ese orden. US3 y US1 tocan `home.ts` (T019 antes que T025).
- **US2 (6)**: depende de US1 (mismo `hero.tsx`) y de la **puerta de producto**.
- **Polish (7)**: depende de las historias que se entreguen.

### Entre historias

- **US4**: independiente; deja el header que necesitan las otras.
- **US3**: independiente del resto salvo `app/page.tsx` y `home.ts`.
- **US1**: independiente en comportamiento; comparte `home.ts` y `hero.tsx` con US3 y US2.
- **US2**: depende de US1 solo por el archivo `hero.tsx`.

### Archivos compartidos (tareas sin `[P]`, en orden)

| Archivo | Tareas |
|---|---|
| `lib/content/site.ts` | T006 |
| `lib/content/home.ts` | T019 → T025 → T033 |
| `components/sections/home/hero.tsx` | T026 → T034 |
| `app/page.tsx` | T018 |
| `components/layout/site-header.tsx` | T009 |

### Paralelismo

- Setup: T002, T003 y T004 juntas.
- Foundational: T007 en paralelo con T006.
- US4: T012–T015 (cuatro archivos distintos) juntas, una vez hechas T009–T011.
- US3: T020, T021 y T022 juntas, una vez hecha T018.
- US1: T029 en paralelo con T026–T028.
- Polish: T036, T037 y T038 juntas.

### Ejemplo en paralelo: US4

```text
# Una vez hechas T009 (header), T010 (menú) y T011 (PageShell):
Task: "Quitar secondary en app/blog/page.tsx"                       (T012)
Task: "Quitar secondary en app/blog/[category]/page.tsx"            (T013)
Task: "Quitar secondary en app/blog/[category]/[slug]/page.tsx"     (T014)
Task: "Quitar secondary en app/proveedores/page.tsx"                (T015)
```

---

## Estrategia de implementación

### MVP primero (Fase A)

1. Setup (T001–T005): el spike y la línea de base.
2. Foundational (T006–T008).
3. US4 → US3 → US1, validando cada una con su tarea de verificación.
4. **PARAR y VALIDAR**: Fase A completa, `check-header` en verde, `tsc`/`lint`/`build` limpios.
5. Publicar la Fase A (T041) sin esperar a producto.

### Entrega incremental

1. Fase A (3 historias P1) → publicable.
2. Fase B (US2) en cuanto producto confirme multas.
3. Fase C (T042) en un commit aparte y solo si da cero importadores.

---

## Notas

- `[P]` = archivos distintos, sin dependencias pendientes.
- Esta feature **no toca** el backend, la app móvil ni el panel: no hay tareas 🔗.
- Las decisiones de producto abiertas (P1–P4 de `research.md`) no bloquean la Fase A.
- Commitear después de cada tarea o grupo lógico, con prefijo distinto al de la #209.
