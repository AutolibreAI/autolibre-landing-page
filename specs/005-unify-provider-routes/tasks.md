---

description: "Task list for AUT-137: unificar las rutas de proveedores"
---

# Tasks: Unificar las rutas de proveedores

**Input**: Design documents from `/specs/005-unify-provider-routes/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes.md, quickstart.md

**Tests**: no se piden tests en la spec y el repo no tiene runner para código de la app (research D9). La verificación son `npm run lint`, `npm run build` y los chequeos HTTP de `quickstart.md`, que aparecen como tareas de verificación al final de cada historia.

**Organization**: tareas agrupadas por historia de usuario. Casi todo el trabajo es renombrar lo que ya existe bajo `/aliados`, así que el renombre mecánico (Phase 2) va primero y bloquea las historias.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: se puede hacer en paralelo (archivos distintos, sin dependencia con tareas incompletas)
- **[Story]**: historia de la spec a la que pertenece (US1 a US5)
- Todos los paths son relativos a la raíz de `autolibre-landing-page`
- Mover siempre con `git mv` para conservar el historial

## Path Conventions

Proyecto único Next.js (App Router): `app/`, `components/`, `lib/`, `public/` en la raíz. Ver "Source Code" en `plan.md`.

---

## Phase 1: Setup

**Purpose**: dejar una línea base conocida antes de mover nada.

- [X] T001 Confirmar que el branch es `AUT-137-unify-provider-routes-directory-and-registration`, que el árbol de trabajo solo tiene los cambios de `specs/005-unify-provider-routes/`, `.specify/feature.json` y `.cursor/rules/specify-rules.mdc`, y correr `npm run lint` y `npm run build` para registrar la línea base (errores previos, si hay, quedan anotados y no se atribuyen a este ticket)

---

## Phase 2: Foundational (renombre mecánico, bloquea todas las historias)

**Purpose**: mover archivos y renombrar símbolos hasta que el proyecto compile con las rutas nuevas. Sin cambios de copy ni de comportamiento todavía.

**⚠️ CRITICAL**: el orden de T002 y T003 importa. `app/proveedores/page.tsx` (formulario) hay que moverlo **antes** de traer el directorio a esa misma ruta.

- [X] T002 Mover el formulario: `git mv app/proveedores/page.tsx app/proveedores/registro/page.tsx` (crear la carpeta `app/proveedores/registro/` antes); solo mover, sin editar
- [X] T003 Mover el directorio y el perfil: `git mv app/aliados/page.tsx app/proveedores/page.tsx` y `git mv "app/aliados/[slug]" "app/proveedores/[slug]"` (incluye `page.tsx` y `not-found.tsx`); eliminar `app/aliados/` si quedó vacío
- [X] T004 Mover la lógica: `git mv lib/aliados lib/proveedores`; en `lib/proveedores/query.ts` renombrar `ALIADOS_PATH` → `PROVEEDORES_PATH` (valor `"/proveedores"`), `ALIADOS_PAGE_SIZE` → `PROVEEDORES_PAGE_SIZE`, `aliadosHref` → `proveedoresHref`, `parseAliadosFilters` → `parseProveedoresFilters`, `AliadosFilters` → `ProveedoresFilters`; agregar `PROVEEDORES_REGISTRO_PATH = "/proveedores/registro"` y `RESERVED_PROFILE_SLUGS = ["registro"] as const`; actualizar los imports en `lib/proveedores/profile.ts`
- [X] T005 [P] Mover el copy del directorio: `git mv lib/content/aliados.ts lib/content/providers-directory.ts` y renombrar el export `aliadosContent` → `providersDirectoryContent` (solo el símbolo; el texto se cambia en US1)
- [X] T006 [P] Mover el copy del perfil: `git mv lib/content/aliado-perfil.ts lib/content/provider-profile.ts` y renombrar el export `aliadoPerfilContent` → `providerProfileContent` (solo el símbolo; el texto se cambia en US5)
- [X] T007 Mover los componentes: `git mv components/aliados components/proveedores`; renombrar `aliados-directory.tsx` → `proveedores-directory.tsx` y `aliados-hero.tsx` → `proveedores-hero.tsx`, y sus componentes `AliadosDirectory` → `ProveedoresDirectory`, `AliadosHero` → `ProveedoresHero` (los `Partner*` conservan el nombre). Archivos: `components/proveedores/proveedores-directory.tsx`, `proveedores-hero.tsx`, `partner-card.tsx`, `partner-monogram.ts`, `share-profile-button.tsx`, `profile/partner-profile-body.tsx`, `profile/partner-profile-head.tsx`, `profile/partner-related.tsx`, `profile/partner-sticky-bar.tsx`
- [X] T008 Actualizar imports y símbolos renombrados en las páginas: `app/proveedores/page.tsx`, `app/proveedores/[slug]/page.tsx`, `app/proveedores/[slug]/not-found.tsx`, `app/sitemap.ts` (import de `partnerPath`) y en todos los componentes de `components/proveedores/` que importan de `@/lib/aliados/*`, `@/lib/content/aliados` o `@/components/aliados/*`
- [X] T009 Confirmar que compila: `npm run build` sin errores de TypeScript. Las rutas listadas deben ser `/proveedores`, `/proveedores/registro` y `/proveedores/[slug]`; ninguna `/aliados`

**Checkpoint**: el proyecto compila con la estructura nueva. Aún falta copy, links, SEO y redirects.

---

## Phase 3: User Story 1 - El dueño de auto llega al directorio de negocios (Priority: P1) 🎯 MVP

**Goal**: entrar a `/proveedores` muestra el directorio (filtro por rubro y paginado), con las tarjetas llevando a `/proveedores/<slug>`, y el sitio habla de "Proveedores".

**Independent Test**: abrir `/proveedores`, filtrar por rubro y paginar (la URL sigue bajo `/proveedores`), abrir una tarjeta y llegar a `/proveedores/<slug>`.

### Implementation for User Story 1

- [X] T010 [US1] En `lib/content/providers-directory.ts`: cambiar el copy de "Aliados" a "Proveedores" (`meta.title`, `breadcrumb`, `hero.eyebrow`, `hero.title`/`lead` si nombran "aliados"), y los `href` internos (`empty.secondaryCta` → `/proveedores`) usando `PROVEEDORES_PATH`; renombrar la clave `breadcrumb.aliados` → `breadcrumb.proveedores`. No tocar `hero.secondaryCta` (es de US3)
- [X] T011 [US1] En `app/proveedores/page.tsx`: usar `PROVEEDORES_PATH`/`PROVEEDORES_PAGE_SIZE`/`parseProveedoresFilters`, `providersDirectoryContent` y `ProveedoresDirectory`/`ProveedoresHero`; `createMetadata` con `path: PROVEEDORES_PATH` (el canonical es `/proveedores` también para `?rubro=`/`?pagina=`); `currentPath={PROVEEDORES_PATH}`; breadcrumb y `webPageSchema`/`itemListSchema` con las rutas nuevas; actualizar los comentarios y el `console.error("[aliados]…")` a `[proveedores]`
- [X] T012 [P] [US1] En `components/proveedores/proveedores-hero.tsx`: renombrar el id `aliados-titulo` → `proveedores-titulo` (y su `aria-labelledby`), nombres y comentarios que citan `/aliados`
- [X] T013 [P] [US1] En `components/proveedores/proveedores-directory.tsx` y `components/proveedores/partner-card.tsx`: reemplazar `aliadosHref`/`ALIADOS_PATH` por `proveedoresHref`/`PROVEEDORES_PATH` en filtros, paginado y links de tarjeta; confirmar que el link de cada tarjeta sale de `partnerPath()` y no está escrito a mano
- [X] T014 [US1] En `lib/content/site.ts`: reemplazar `aliadosLink` por `{ label: "Proveedores", href: PROVEEDORES_PATH }` (renombrar la constante a `proveedoresLink`) en el header y el menú mobile; actualizar el comentario de las líneas 10–11 y 59–63. "Para negocios" y el footer se cambian en US3
- [X] T015 [US1] Verificar en `npm run build && npm run start`: `/proveedores` responde 200 y muestra el directorio (no el formulario); filtro `?rubro=` y `?pagina=2` mantienen la URL bajo `/proveedores`; `/aliados` responde 404 (quickstart §5)

**Checkpoint**: US1 completa. El directorio vive en `/proveedores`.

---

## Phase 4: User Story 2 - Los links viejos siguen funcionando (Priority: P1)

**Goal**: `/proveedor` y `/proveedor/<slug>` redirigen con 301, en un solo salto y conservando la query.

**Independent Test**: los `curl` de quickstart §4 devuelven `301` con el `Location` esperado y `saltos=1` hasta un 200.

### Implementation for User Story 2

- [X] T016 [P] [US2] En `next.config.ts`: agregar `async redirects()` (los primeros del sitio) con `{ source: "/proveedor", destination: "/proveedores", statusCode: 301 }` y `{ source: "/proveedor/:slug", destination: "/proveedores/:slug", statusCode: 301 }`; usar `statusCode` y no `permanent` (research D1) y dejar un comentario con el motivo (308 vs 301) y la nota de que son rutas indexadas en producción
- [X] T017 [US2] Verificar los redirects contra `npm run start` (quickstart §4): `/proveedor`, `/proveedor?rubro=talleres&pagina=2`, `/proveedor/<slug real>` y la cadena completa con `-L` (un solo salto)
- [X] T018 [US2] Probar las variantes `/proveedor/` y `/Proveedor`. Si no redirigen, agregar la regla explícita en `next.config.ts`; si no es viable, ajustar el edge case de la spec. Anotar el resultado en la sección "Redirects" de `specs/005-unify-provider-routes/contracts/routes.md`

**Checkpoint**: US2 completa. No hay 404 para los links viejos de producción.

---

## Phase 5: User Story 3 - El taller encuentra cómo sumar su negocio (Priority: P2)

**Goal**: el formulario vive en `/proveedores/registro` y todos los accesos de negocios apuntan ahí.

**Independent Test**: desde el directorio, "Sumar mi negocio" lleva a `/proveedores/registro`; el menú "Para negocios", el footer y la banda de la home también; un alta de prueba se envía igual que antes.

### Implementation for User Story 3

- [X] T019 [US3] En `app/proveedores/registro/page.tsx`: `PATH = PROVEEDORES_REGISTRO_PATH` (canonical y `webPageSchema`); `currentPath={PROVEEDORES_REGISTRO_PATH}`; breadcrumb de tres niveles Inicio → Proveedores (`PROVEEDORES_PATH`) → Registro (`PROVEEDORES_REGISTRO_PATH`); mantener `cta`, `showQuoteLink={false}` y el resto del formulario sin cambios
- [X] T020 [P] [US3] En `lib/content/providers-directory.ts`: `hero.secondaryCta.href` → `PROVEEDORES_REGISTRO_PATH` ("Sumar mi negocio")
- [X] T021 [P] [US3] En `lib/content/site.ts`: "Para negocios" (línea ~104) y el link del footer grupo Empresa (línea ~237, `providersContent.form.title`) → `PROVEEDORES_REGISTRO_PATH`; actualizar los comentarios de las líneas ~143 y ~236
- [X] T022 [P] [US3] En `lib/content/home.ts`: `providerBand.cta.href` (línea ~259) → `/proveedores/registro`. Dejar la prosa "talleres aliados" de las líneas ~60 y ~71 (es el adjetivo común en un alt de imagen, no la sección)
- [X] T023 [P] [US3] Actualizar los comentarios que citan `/proveedores` como la página del formulario en `components/layout/nav-cta.tsx`, `components/layout/page-shell.tsx`, `components/layout/site-header.tsx`, `components/layout/mobile-nav.tsx` y `components/quote-flow/places-autocomplete.css` → `/proveedores/registro`; y el comentario de `.env.example` (línea 2) con la misma corrección. Sin cambios de comportamiento
- [X] T024 [US3] Verificar (quickstart §5 y §7): `/proveedores/registro` responde 200 y muestra el formulario; un alta de prueba se envía y completa; "Sumar mi negocio", "Para negocios", footer y banda de la home llevan a `/proveedores/registro`; solo una entrada del header lleva `aria-current="page"` en cada página

**Checkpoint**: US3 completa. La conversión de oferta sigue alcanzable.

---

## Phase 6: User Story 5 - Buscadores y compartidos entienden la nueva estructura (Priority: P2)

**Goal**: perfil con breadcrumb Inicio → Proveedores → negocio y canonical nuevo; sitemap, JSON-LD y `llms.txt` apuntan a las rutas nuevas.

**Independent Test**: en un perfil, canonical, breadcrumb visible y JSON-LD coinciden en `/proveedores/<slug>`; `sitemap.xml` solo lista rutas nuevas (quickstart §6).

### Implementation for User Story 5

- [X] T025 [US5] En `lib/content/provider-profile.ts`: cambiar el copy de "Aliados" a "Proveedores" (`breadcrumb.aliados` → `breadcrumb.proveedores`, eyebrow, "Más aliados de…", "Ver todos los aliados") y el `href` de `primaryCta` a `PROVEEDORES_PATH`; actualizar el comentario de cabecera
- [X] T026 [US5] En `app/proveedores/[slug]/page.tsx`: usar `providerProfileContent`, `PROVEEDORES_PATH` y `partnerPath()`; breadcrumb Inicio → Proveedores → nombre con `crumbs` compartido entre el breadcrumb visible y `breadcrumbSchema` (ya lo está; mantenerlo así); canonical vía `partnerPath(partner.slug)` en `createMetadata`; actualizar comentarios y el `console.error("[aliado]…")`
- [X] T027 [P] [US5] En `app/proveedores/[slug]/not-found.tsx`, `components/proveedores/profile/partner-profile-head.tsx`, `partner-profile-body.tsx`, `partner-related.tsx` y `partner-sticky-bar.tsx`: reemplazar `ALIADOS_PATH`/`aliadoPerfilContent`/links a `/aliados` por las constantes y el contenido nuevos; sin textos "aliados" visibles
- [X] T028 [P] [US5] En `components/proveedores/share-profile-button.tsx`: confirmar que comparte `window.location.href` sin hash (ya es así, líneas ~38–51), de modo que comparte `/proveedores/<slug>` sin cambios de código; ajustar solo comentarios o copy si nombran "aliados"
- [X] T029 [US5] En `app/sitemap.ts`: reemplazar la entrada `/aliados` por `/proveedores` (directorio, `weekly`, prioridad 0,7) y la entrada `/proveedores` actual por `/proveedores/registro` (`monthly`, prioridad 0,8); actualizar el `lastModified` de ambas a la fecha del release; excluir de los perfiles los slugs de `RESERVED_PROFILE_SLUGS`; actualizar los comentarios (`/aliados/[slug]` → `/proveedores/[slug]`)
- [X] T030 [P] [US5] En `public/llms.txt`: reemplazar las líneas "Proveedores" (registro), "Aliados" y "Perfiles de aliados" por tres líneas con las rutas nuevas: Proveedores (directorio) `/proveedores`, Registro de proveedores `/proveedores/registro` y Perfiles de proveedores `/proveedores/{slug}`; sin menciones a `/aliados`
- [X] T031 [P] [US5] En `lib/seo/schema.ts` (comentarios de `itemListSchema` y `localBusinessSchema`, líneas ~281 y ~319), `lib/seo/metadata.ts` (ejemplo de `path`, línea ~10) y `lib/autolibre-api.ts` (comentario, línea ~277): reemplazar las menciones a `/aliados` y "aliados" por las rutas y el vocabulario nuevos. Sin cambios de lógica
- [X] T032 [US5] Verificar (quickstart §6): en un perfil real, canonical = `/proveedores/<slug>`, breadcrumb visible y `BreadcrumbList` con los mismos tres elementos y URLs; `sitemap.xml` lista `/proveedores`, `/proveedores/registro` y perfiles, y ninguna ruta `/proveedor`, `/aliados` ni perfil `registro`

**Checkpoint**: US5 completa. Las señales de SEO cambian juntas.

---

## Phase 7: User Story 4 - Quien tenía el formulario guardado no se pierde (Priority: P3)

**Goal**: quien abre `/proveedores` esperando el formulario ve de inmediato el acceso a "sumar mi negocio".

**Independent Test**: abrir `/proveedores` en desktop y en mobile (375 px) y comprobar que "Sumar mi negocio" se ve sin hacer scroll.

### Implementation for User Story 4

- [X] T033 [US4] Verificar en `npm run start` (desktop y 375 px) que `hero.secondaryCta` ("Sumar mi negocio", hecho en T020) queda visible sin scroll en `/proveedores`. Si en mobile queda debajo del pliegue, ajustar el orden o el espaciado de los botones en `components/proveedores/proveedores-hero.tsx` usando solo clases canónicas de Tailwind y tokens; no se crea un componente nuevo (research D8)
- [ ] T034 [US4] Verificar que con el backend caído (estado de error del listado) el hero y el acceso a "sumar mi negocio" siguen mostrándose, como pide el edge case de la spec

**Checkpoint**: US4 completa.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: cierre del ticket, criterios de éxito y deuda de vocabulario.

- [X] T035 [P] En `analytics.md` (línea ~129): cambiar `/proveedores` por `/proveedores/registro` en la línea del formulario y anotar la fecha de salida como corte de la serie (FR-017); la fecha final se completa al deployar
- [X] T036 [P] En `AGENTS.md` (línea ~60, "rutas planas"): sumar una nota breve de que `/proveedores/registro` es una excepción deliberada de anidamiento (clarify, 2026-10-23)
- [X] T037 Revisar vocabulario viejo (quickstart §2): `git grep -nEi "aliado|/proveedor([^e]|$)" -- . ":!specs" ":!node_modules" ":!.next"`. Lo único aceptable son las reglas de redirect de `next.config.ts` y su comentario, y la prosa "talleres aliados" de `lib/content/home.ts`. Corregir cualquier otra línea (SC-003, FR-018)
- [X] T038 `npm run lint` y `npm run build` sin errores nuevos respecto de la línea base de T001
- [ ] T039 Correr `specs/005-unify-provider-routes/quickstart.md` completo contra `npm run start` y marcar el resultado de cada sección
- [ ] T040 Confirmar con el backend que ningún negocio existente tiene el slug `registro` y que el alta de negocios lo rechaza (quickstart §8). Anotar la respuesta en `quickstart.md`. Si hay un negocio con ese slug, avisar antes de deployar
- [ ] T041 Actualizar `specs/005-unify-provider-routes/checklists/requirements.md` si algún supuesto cambió durante la implementación, y dejar listo el resumen del PR con el título `AUT-137: Unificar las rutas de proveedores` (no se pushea ni se abre PR sin pedido explícito)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: sin dependencias.
- **Foundational (Phase 2)**: depende de Setup. **Bloquea** todas las historias. Dentro de la fase: T002 antes que T003; T004 antes que T008; T005, T006 y T007 son independientes entre sí; T008 espera a T003–T007; T009 al final.
- **User Stories (Phase 3 en adelante)**: dependen de Foundational.
- **Polish (Phase 8)**: depende de todas las historias que se quieran entregar. Como es un solo release, las cinco entran.

### User Story Dependencies

- **US1 (P1)**: tras Foundational. Sin dependencias de otras historias.
- **US2 (P1)**: la implementación (T016) es solo `next.config.ts` y puede hacerse en paralelo con US1; su verificación necesita que las rutas nuevas existan (después de T009).
- **US3 (P2)**: tras Foundational. Comparte `lib/content/site.ts` con US1 (T014 y T021) y `providers-directory.ts` con US1 (T010 y T020): esas tareas no son [P] entre historias.
- **US5 (P2)**: tras Foundational. Independiente de US1 y US3, salvo `site.ts`/`provider-profile.ts` que no comparten.
- **US4 (P3)**: depende de T020 (US3), porque verifica el acceso que esa tarea cambia.

### Within Each User Story

- Contenido (`lib/content/*`) antes que las páginas que lo consumen.
- Páginas y componentes antes que la verificación de la historia.
- Cada historia termina con su tarea de verificación.

### Parallel Opportunities

- T005, T006 y T007 (módulos distintos) en paralelo dentro de Foundational.
- T012 y T013 (US1) en paralelo; T016 (US2) en paralelo con todo US1.
- T020, T021, T022 y T023 (US3) en paralelo entre sí.
- T027, T028, T030 y T031 (US5) en paralelo entre sí.
- T035 y T036 (Polish) en paralelo.
- Con más de una persona: A hace US1 + US3, B hace US5, C hace US2; los tres confluyen en Polish.

---

## Parallel Example: User Story 3

```bash
# Después de T019, estas cuatro tocan archivos distintos:
Task: "T020 hero.secondaryCta en lib/content/providers-directory.ts"
Task: "T021 'Para negocios' y footer en lib/content/site.ts"
Task: "T022 providerBand.cta en lib/content/home.ts"
Task: "T023 comentarios en components/layout/*.tsx, places-autocomplete.css y .env.example"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

Estas dos historias son las P1 y juntas son lo mínimo que **no** rompe producción: US1 pone el directorio en `/proveedores` y US2 evita 404 en los links viejos. Pero como el formulario también se mudó en Foundational (T002), **no se puede deployar US1 + US2 sin US3**: `/proveedores/registro` existe pero ningún link lleva ahí y la home sigue mandando a `/proveedores`, que ahora es el directorio. Por eso el release es único (decisión de clarify).

1. Phase 1 y Phase 2.
2. US1 y US2 → verificar.
3. US3 → verificar (cierra la conversión de oferta).
4. US5 → verificar (SEO).
5. US4 → verificar.
6. Polish → un solo PR contra `development`.

### Notas

- [P] = archivos distintos y sin dependencias.
- Commit sugerido al terminar cada fase (Foundational, cada historia) para poder revertir por partes; no se commitea ni pushea sin que lo pidas.
- Detenerse en cada checkpoint para validar la historia.
- Evitar: cambiar comportamiento durante el renombre mecánico de Foundational, y tocar `lib/autolibre-api.ts` más allá de un comentario.
