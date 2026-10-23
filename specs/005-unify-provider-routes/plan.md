# Implementation Plan: Unificar las rutas de proveedores

**Branch**: `AUT-137-unify-provider-routes-directory-and-registration` | **Date**: 2026-10-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-unify-provider-routes/spec.md`

## Summary

Mover la sección de proveedores a un único prefijo, `/proveedores`:

| Hoy (development) | Hoy (producción) | Después |
|---|---|---|
| `/aliados` (directorio, no deployado) | `/proveedor` | `/proveedores` |
| `/aliados/[slug]` (perfil, no deployado) | `/proveedor/<slug>` | `/proveedores/<slug>` |
| `/proveedores` (formulario) | `/proveedores` | `/proveedores/registro` |

El trabajo existente bajo `/aliados` se **renombra** (rutas, módulos, componentes, símbolos y copy), no se reescribe. El formulario se mueve a una subruta. Los links viejos de producción (`/proveedor`, `/proveedor/<slug>`) se cubren con los primeros redirects del sitio, declarados en `next.config.ts` con **status 301 explícito** (ver `research.md` D1: `permanent: true` emite 308, no 301).

Todo sale en un solo release (clarify). No hay cambios de backend, dependencias ni modelo de datos.

## Technical Context

**Language/Version**: TypeScript 5 (strict), Node 20+ types  
**Primary Dependencies**: Next.js 16.2.4 (App Router), React 19.2.4, Tailwind v4. Sin dependencias nuevas.  
**Storage**: N/A. Los negocios y el catálogo siguen viniendo del backend vía `lib/autolibre-api.ts`; no se toca.  
**Testing**: No hay runner para código de la app (solo `node --test` en `scripts/blog/`). Verificación: `npm run lint`, `npm run build` (typecheck incluido) y el chequeo HTTP de `quickstart.md`.  
**Target Platform**: Web, Vercel (Next.js)  
**Project Type**: web-application (landing, un solo proyecto)  
**Performance Goals**: sin cambios. Los redirects se resuelven en la capa de rutas, antes del render, sin costo de página.  
**Constraints**: un solo salto de redirect; query string se conserva; ninguna ruta indexada queda sin destino; Core Web Vitals sin regresión (el contenido de las páginas no cambia).  
**Scale/Scope**: ~25 archivos. 3 rutas de página, 2 redirects, ~10 módulos de contenido y componentes renombrados, sitemap, JSON-LD, `llms.txt`, `analytics.md`.

## Constitution Check

*GATE: pasa antes de Phase 0. Re-chequeado tras el diseño de Phase 1.*

| Principio | Evaluación |
|---|---|
| I. App Router first | ✅ Rutas nuevas en `app/proveedores/`. Los componentes siguen siendo Server Components; no se agrega ningún `"use client"`. |
| II. Content-driven | ✅ El copy se queda en `lib/content/*`. Los módulos se renombran (`providers-directory`, `provider-profile`) y "Aliados" pasa a "Proveedores" ahí. Cero strings nuevos en componentes. |
| III. Typed contracts | ✅ Sin `any` ni `as` nuevos. Los tipos viajan con los módulos renombrados. |
| IV. Accesibilidad y performance | ✅ Sin cambios de markup salvo textos. `aria-current` sigue por igualdad exacta de `currentPath` (ver D5). |
| V. Section isolation | ✅ Sin imports cruzados nuevos. El directorio ya vive fuera de `components/sections/` (`components/aliados/`); se mueve a `components/proveedores/` sin reordenarlo (fuera de alcance). |
| VI. HTML semántico | ✅ Un `<h1>` por página; los ids `aliados-titulo` pasan a `proveedores-titulo`. |
| VII. SEO & GEO (no negociable) | ✅ Requiere **todas** las piezas: `createMetadata` con canonical nuevo, JSON-LD con breadcrumb nuevo, `app/sitemap.ts` y `public/llms.txt`. Son las tareas centrales (FR-011 a FR-014). |
| VIII. Tailwind v4 | ✅ Sin cambios de estilos. |

**Gates**: sin violaciones. `Complexity Tracking` vacío. Una desviación consciente, no de la constitución sino de `AGENTS.md` ("rutas planas"): el alta anidada en `/proveedores/registro`, decidida en clarify.

## Project Structure

### Documentation (this feature)

```text
specs/005-unify-provider-routes/
├── plan.md              # Este archivo
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── routes.md        # Phase 1: mapa de rutas y tabla de redirects
└── tasks.md             # Phase 2 (/speckit.tasks, no lo crea este comando)
```

### Source Code (repository root)

```text
next.config.ts                              # + redirects() (primeros del sitio, 301)
app/
├── sitemap.ts                              # rutas nuevas; filtra slug reservado; sin /aliados
└── proveedores/
    ├── page.tsx                            # ← app/aliados/page.tsx (directorio)
    ├── registro/
    │   └── page.tsx                        # ← app/proveedores/page.tsx (formulario)
    └── [slug]/
        ├── page.tsx                        # ← app/aliados/[slug]/page.tsx (perfil)
        └── not-found.tsx                   # ← app/aliados/[slug]/not-found.tsx
components/
├── aliados/ → proveedores/                 # directory, hero, card, share, monogram, profile/*
└── layout/                                 # solo comentarios que citan /proveedores
lib/
├── aliados/ → proveedores/                 # query.ts (PROVEEDORES_PATH, ...), profile.ts
├── content/
│   ├── aliados.ts → providers-directory.ts
│   ├── aliado-perfil.ts → provider-profile.ts
│   ├── site.ts                             # nav, footer, comentarios
│   ├── home.ts                             # providerBand.cta
│   └── about.ts                            # comentario de `traction`
└── seo/schema.ts                           # solo comentarios (los builders son genéricos)
public/llms.txt                             # Proveedores / Registro / Perfiles
analytics.md                                # fecha de corte de la serie del formulario
```

**Structure Decision**: un solo proyecto Next.js. Se usan `git mv` para conservar el historial y los cambios se limitan a rutas, nombres y copy. No se crea ninguna capa nueva.

## Phase 0 y 1

- Decisiones y alternativas: [research.md](./research.md)
- Entidades y reglas de ruta: [data-model.md](./data-model.md)
- Contrato de rutas y redirects: [contracts/routes.md](./contracts/routes.md)
- Cómo verificar: [quickstart.md](./quickstart.md)

## Orden de ejecución sugerido (insumo para `/speckit.tasks`)

1. `git mv` de directorio, perfil, componentes, `lib/aliados` y módulos de contenido; arreglar imports y símbolos hasta que compile.
2. Mover el formulario a `app/proveedores/registro/` (PATH, canonical, `currentPath`, breadcrumb de 3 niveles).
3. Copy: "Aliados" → "Proveedores"; CTAs de negocio → `/proveedores/registro`; nav y footer.
4. SEO: sitemap, `llms.txt`, JSON-LD y canonical del perfil.
5. Redirects 301 en `next.config.ts`.
6. `analytics.md`, comentarios que citan rutas viejas, `grep` final de `aliado|/proveedor\b`.
7. `npm run lint`, `npm run build`, chequeo HTTP del quickstart.

## Riesgos

| Riesgo | Mitigación |
|---|---|
| `permanent: true` emite 308 y no 301 | `statusCode: 301` explícito en cada redirect (D1). |
| Barra final o mayúsculas en `/proveedor/` (la config usa `skipTrailingSlashRedirect: true`) | Se verifica empíricamente en el quickstart; si no matchea, se agrega una regla para la variante con barra (D2). |
| Un negocio con slug `registro` quedaría tapado por la ruta estática | Slug reservado: se excluye del sitemap y de los links, y se pide al backend que lo rechace (D4). |
| Quedan referencias a `/aliados` en comentarios, ids o copy | Chequeo de cierre con `grep` (SC-003) y revisión de `.next/types` regenerados por el build. |
| El deploy del directorio y de los redirects se desfasan | Un solo release (clarify). Los redirects viven en `next.config.ts`, el mismo deploy que las rutas. |
