# Plan SEO, GEO y conversión

Creado el 2026-11-27 a partir de la auditoría del 2026-11-26 (SEO técnico, contenido y semántica, performance e instrumentación, datos reales de PostHog y producción).

**Regla de orden:** primero medir, después arreglar lo roto, después unificar el mensaje, y al final construir cosas nuevas.

**Tamaños:** S = cambio acotado · M = varios archivos o una decisión · L = merece su propio SDD.

---

## Punto de partida

El 85% de bounce de Vercel es sobre todo una definición: cuenta toda sesión de una sola página, y en este sitio el pedido termina en un overlay sin cambiar de URL y el resto de los CTAs abre otra pestaña.

Datos de PostHog, 2026-10-27 a 2026-11-26 (UTC), 3.190 sesiones:

| Métrica | Valor |
|---|---|
| Sesiones de una sola página (equivalente a Vercel) | 80,4% |
| Bounce según PostHog (1 página y menos de 10 s) | 35,8% |
| Mediana de duración de sesión | 28 s |
| Sesiones de una página con click a tienda o WhatsApp | 15,2% |

**KPI que reemplaza al bounce:** porcentaje de sesiones con conversión, por página de entrada.

| Página de entrada | Sesiones (30d) | Conversión hoy |
|---|---|---|
| `/` | 926 | 34,3% |
| `/pedido` | 867 | 18,8% |
| `/proveedores/registro` | 597 | 1,2% |
| `/blog/*` | 433 | 0,5% |

Otros datos de base:

- `quote_submitted`: 3 en 30 días. Muestra demasiado chica para sacar una tasa.
- Campaña de Meta a `/proveedores/registro` (Android): 485 sesiones, 69% de bounce, mediana de 2 s.
- Web vitals de campo (p75) en verde, salvo `/proveedores/registro` en mobile: LCP 2,40 s, INP 296 ms.
- Producción estaba 41 commits atrás de `development` al momento de la auditoría.

---

## Preguntas abiertas (bloquean la Fase 2)

- [ ] ¿Los pedidos funcionan solo en AMBA? ¿Los +150 proveedores están todos ahí?
- [ ] ¿Se atienden motos por el pedido web? ¿Y camionetas o utilitarios?
- [ ] ¿Cuál es la razón social real (con CUIT y domicilio) para Términos, Privacidad y schema?
- [ ] ¿Se puede publicar cómo se financia AutoLibre (planes de proveedores, publicidad de aliados)?
- [ ] "En el día": ¿es la respuesta de AutoLibre o las propuestas de los talleres? ¿Qué días y horario?
- [ ] ¿Seguros se ofrece o no? ¿Qué relación hay con Intēgrity?

Secundarias:

- [ ] ¿Quién recomienda proveedores: una IA, el equipo, o ambos? ¿Con qué criterio?
- [ ] ¿La consulta de deuda de patente y los turnos de VTV están en la app hoy? ¿Avisa el vencimiento de la licencia?
- [ ] ¿Sigue vigente el "desde $10.000" del adaptador OBD2?
- [ ] ¿Qué relación tienen los aliados con AutoLibre (publicidad paga, comisión, acuerdo sin dinero)?
- [ ] ¿Los proveedores se verifican de alguna forma publicable?

---

## Fase 0: línea de base y medición

Sin esto no se puede demostrar qué movió la aguja.

- [ ] **S** · Deployar `development` a producción.
- [ ] **S** · Reenviar el sitemap en Search Console y pedir inspección de algunos perfiles de proveedor.
- [ ] **S** · Conseguir acceso a Search Console y exportar queries, CTR, posición y cobertura.
- [ ] **S** · Exportar de Vercel Analytics el desglose del bounce por página, referrer y dispositivo.
- [ ] **S** · Armar en PostHog el tablero de conversión por página de entrada y por canal.
- [ ] **S** · Trackear clicks a aliados del carrusel, incluido el banner de publicidad (`components/sections/home/allies.tsx:116`, `:209`, `:310`, `:387`; evento nuevo en `lib/analytics/events.ts`).
- [ ] **S** · Trackear las tiendas del footer (`components/layout/site-footer.tsx:20-40`).
- [ ] **S** · Trackear el envío de los formularios de soporte y de eliminar cuenta.
- [ ] **S** · Mandar las conversiones también a Vercel (`lib/analytics/track.ts`). Confirmar antes que el plan de Vercel incluye eventos custom.
- [ ] **S** · Atribución en los links de tiendas: `referrer=` en Play, `ct`/`pt` en App Store (`lib/seo/config.ts:49-51`).
- [ ] **S** · Pausar o revisar la campaña de Meta a `/proveedores/registro`.
- [ ] **S** · Confirmar en Google Argentina qué aparece al buscar "AutoLibre" (homónimos franceses).

---

## Fase 1: arreglos técnicos de SEO

No dependen de decisiones de producto.

- [ ] **S** · 404 global en español, con `PageShell` y links a `/`, `/pedido`, `/proveedores` y `/blog` (`app/not-found.tsx`, copy en `lib/content/site.ts`).
- [ ] **S** · Título del perfil con rubro y localidad, con fallback (`app/proveedores/[slug]/page.tsx:99`).
- [ ] **S** · Sacar la marca duplicada del título de `/proveedores/registro` (`lib/content/providers.ts:13`).
- [ ] **S** · Reescribir los títulos genéricos: `/proveedores`, `/blog`, `/descarga`, `/support`.
- [ ] **S** · Ajustar descriptions fuera de rango: largas en `/proveedores` (187) y `/preguntas-frecuentes` (176); cortas en `/terminos` (53), `/blog` (102), `/privacidad` (108), `/support` (110).
- [ ] **M** · Self-canonical para `?pagina=N` del directorio y `noindex, follow` solo en `?q=`. Requiere separar `follow` de `index` en `lib/seo/metadata.ts:52-53`.
- [ ] **S** · Sufijo "Página N" en título y description de la paginación del blog (`app/blog/page.tsx:51-56`, `app/blog/[category]/page.tsx:82-87`).
- [ ] **S** · `websiteSchema()` en todos los grafos (hoy solo en el Home y el resto lo referencia).
- [ ] **S** · `SoftwareApplication` con `@id` estable y un solo nodo compartido entre Home y `/descarga` (`lib/seo/schema.ts:141-166`).
- [ ] **S** · Sacar el `BreadcrumbList` de un solo ítem del Home (`app/page.tsx:40`).
- [ ] **M** · Schema del perfil con subtipo real, teléfono, horarios y localidad; sanear `sameAs`; no usar el CTA como `description` (el builder rico ya existe en `lib/seo/schema.ts:435-534`).
- [ ] **S** · Redirect 308 de `/ruta/` a `/ruta`, probando que no rompa `/ingest/*` (`next.config.ts`).
- [ ] **S** · Decidir la URL canónica de descarga (`/descarga` o `/#descargar`) y enlazarla en consecuencia.
- [ ] **S** · `aria-labelledby` e `id` en el `<h1>` de `/support` y `/eliminar-cuenta`.
- [ ] **S** · Skip link "saltar al contenido" en el layout.

**Cómo se mide:** páginas indexadas e impresiones en Search Console, a 2-4 semanas del deploy.

---

## Fase 2: un solo mensaje

Lo que más pesa para GEO. Bloqueada por las preguntas abiertas.

- [ ] **M** · Fuente única de verdad en `lib/content/`: definición de AutoLibre, cobertura, lista de funciones y cifras, de la que salgan FAQ, schema, `llms.txt` y metas.
- [ ] **M** · Reescribir Términos con legal: sacar "Early Access" y "Lista de espera", sumar pedidos, proveedores y planes (`app/terminos/page.tsx`).
- [ ] **S** · Unificar la cobertura en todo el sitio y expandir "AMBA" una vez por página (`lib/content/home.ts`, `presupuesto.ts`, `providers-directory.ts`, `lib/seo/schema.ts:78`).
- [ ] **S** · Resolver auto vs. moto: decirlo en bajada, FAQ y `llms.txt`, o sacar la rotación del `<h1>`.
- [ ] **S** · `<h1>` del Home con palabras de búsqueda; el eslogan pasa a `<p>` eyebrow (`lib/content/home.ts`, `components/sections/home/home-hero.tsx`).
- [ ] **S** · `<h1>` propio para `/descarga` y `/sobre-nosotros` (hoy repiten el eslogan).
- [ ] **S** · Bajada del Home sin jerga: decir qué se pide y qué se recibe.
- [ ] **M** · Limpiar la FAQ: quitar "diez veces menos" y los "garantiza", pasar a futuro la función no lanzada (`lib/content/faq.ts:100`, `:130`, `:153`, `:213`), verificar el claim de OBD-II por ley (`:118`), fechar o quitar el precio del adaptador (`:124`).
- [ ] **M** · Reescribir las FAQ del pedido para que cada respuesta nombre el sujeto y se entienda sola (`lib/content/home.ts:290-317`, `presupuesto.ts:324-345`).
- [ ] **S** · Unificar "¿hace falta la app?" (`lib/content/faq.ts:165`).
- [ ] **S** · Una sola versión sobre seguros en FAQ y `llms.txt`.
- [ ] **M** · Una etiqueta por acción: hoy hay siete para pedir y ocho para sumar un negocio.
- [ ] **M** · Glosario aplicado: adaptador/escáner OBD2, "impuesto de patente" para el tributo, "historial clínico", AutoLibre vs. AutoLibre.AI, "+150" vs. "700+".
- [ ] **M** · Generar `llms.txt` desde un route handler con las categorías y posts reales (`app/llms.txt/route.ts`).
- [ ] **S** · Footer en dos columnas: "Para tu auto" y "Para tu negocio" (`lib/content/site.ts:198-205`).
- [ ] **S** · `<h1>` del directorio orientado al conductor (`lib/content/providers-directory.ts:24`).
- [ ] **M** · Aclarar los planes: definir "pedidos compatibles", unificar unidades de la tabla (`lib/content/providers-plans.ts`).
- [ ] **S** · FAQs nuevas: por qué es gratis, cómo se eligen los proveedores, qué pasa con mis datos.
- [ ] **S** · Erratas y registro: `lib/content/faq.ts:58`, `:130`, `:147`, `:153`.
- [ ] **M** · Validar contra Search Console el cambio de vocabulario ("presupuestos" y "talleres" en lugar de "propuestas" y "proveedores") antes de aplicarlo en todo el sitio.

**Cómo se mide:** conversión del Home y de `/pedido`; respuestas de ChatGPT, Perplexity y Gemini a "¿qué es AutoLibre?" y "¿AutoLibre funciona en [ciudad]?" antes y después.

---

## Fase 3: conversión

- [ ] **S** · **Primero diagnosticar:** revisar session replays de `/pedido` para ver dónde se cae el formulario.
- [ ] **S** · Revisar las 254 sesiones con excepciones JS (30d) y las 215 con dead clicks.
- [ ] **M** · Precargar el servicio cuando se llega desde los 15 links de la sección Servicios (`components/sections/home/services.tsx:31-64`).
- [ ] **S** · En el Home, el CTA del header va a `#pedido` y no a `/pedido` (`lib/content/site.ts:18`).
- [ ] **M** · Evaluar con producto si Auxilio y Multas siguen como pestañas del módulo principal (mandan a terceros).
- [ ] **L** · URL propia para el pedido enviado (`/pedido/enviado`, `noindex`, fuera del sitemap). Implica rehacer el estado "enviado" del overlay y mover el `Lead` de Meta. Decisión de producto.
- [ ] **M** · Bajar el JS de `/proveedores/registro` (17 scripts, 973 KB sin comprimir).
- [ ] **M** · CTA contextual a `/pedido` dentro del cuerpo de las notas del blog.
- [ ] **S** · Seguir la serie de click a tienda del Home tras el rediseño del 24/11 (el placement `hero` concentraba 334 de 404 clicks).
- [ ] **S** · Investigar la diferencia iPhone vs. Android (52,5% vs. 32% de bounce) separando artefacto de `$pageleave` de rebote real.

**Cómo se mide:** `quote_submitted` y `whatsapp_clicked` por sesión de entrada a `/pedido`; alta de proveedor por sesión de entrada a `/proveedores/registro`.

---

## Fase 4: performance

Mantenimiento: los vitals de campo ya están en verde.

- [ ] **S** · Cargar `RequestFlowOverlay` de forma diferida, con precarga en `onPointerEnter`/`onFocus` (`components/modulo-pedido/modulo-form.tsx:36-41`).
- [ ] **M** · `/blog` y `/blog/[category]` cacheables: página base ISR y rewrite para `?q=` y `?page=`, como `/proveedores`.
- [ ] **S** · Recomprimir los videos de `/pedido` (9,6 MB, 4,5 MB, 1,7 MB) o servir variante para celular.
- [ ] **S** · Declarar `PROVIDER_IMAGE_HOST` en producción.
- [ ] **S** · `images.formats: ["image/avif", "image/webp"]` en `next.config.ts`.
- [ ] **S** · Borrar ~10 MB de archivos sin referencias en `public/`.
- [ ] **S** · Revisar la config remota de PostHog (replay, heatmaps) y evaluar muestreo.
- [ ] **S** · `beforeSend` en `<Analytics />` para excluir `/cuenta`, `/ingresar` y tráfico interno.
- [ ] **S** · `useSyncExternalStore` para `matchMedia` en `components/sections/home/allies-carousel.tsx:46-48`.
- [ ] **S** · Rehacer Lighthouse contra producción, mediana de cinco corridas.

**Cómo se mide:** p75 de LCP e INP por ruta en mobile, en Speed Insights.

---

## Fase 5: crecimiento orgánico

Cada ítem L va con su propio SDD.

- [ ] **L** · Landings por rubro y zona ("talleres mecánicos en Morón"), con `generateMetadata`, `ItemList` y sitemap. Cada segmento estático nuevo bajo `/proveedores/` va a `RESERVED_PROFILE_SLUGS` y se avisa al backend.
- [ ] **L** · Páginas por servicio (frenos, cambio de aceite, alineación, aire acondicionado).
- [ ] **M** · Página que explique la app, para búsquedas como "app vencimiento VTV".
- [ ] **M** · Categoría de mecánica y mantenimiento en el blog, con link a `/pedido`. Continuo.
- [ ] **S** · Reforzar la entidad `Organization`: `address`, fichas de tienda en `sameAs`, `foundingDate` y `founder` en todas las páginas.
- [ ] **S** · `BlogPosting` con `articleSection`, `wordCount` e `image` como `ImageObject`.
- [ ] **S** · Evaluar renombrar `/support` a `/soporte` con 301, manteniendo la URL declarada en las tiendas.
- [ ] **S** · Borrar el código muerto de `lib/provider-profile/*` y `components/sections/provider-profile/*` que arma links a `/proveedor/<slug>`.

**Cómo se mide:** impresiones y clicks orgánicos no de marca en Search Console.

---

## Registro de avances

| Fecha | Qué se hizo | Resultado medido |
|---|---|---|
| 2026-11-26 | Auditoría completa (solo lectura) | Línea de base de arriba |
