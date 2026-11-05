# Implementation Plan: Reclamo de taller por código

**Branch**: `211-partner-claim-redemption` | **Date**: 2026-11-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/211-partner-claim-redemption/spec.md`

## Summary

El dueño de un taller publicado pide un código por WhatsApp desde el perfil público y lo canjea en `/proveedores/reclamar`, logueado con su cuenta de AutoLibre (Clerk, la misma instancia que la app, el admin y el backend). El canje se llama **desde el browser** con `Authorization: Bearer`, para que el rate limit del backend sea por IP de cada usuario. Clerk queda acotado a la ruta de canje (provider en un layout anidado y, si hace falta, un `proxy.ts` con matcher acotado): las páginas indexables no cargan nada de Clerk. El CTA del perfil es server-only y sin JS.

## Technical Context

**Language/Version**: TypeScript 5 (strict), React 19.2.4, Next.js 16.2.4 (App Router)
**Primary Dependencies**: `@clerk/nextjs` 7.x (NUEVA; peer `next ^16.1`, `react ~19.2.3`). El resto, sin cambios.
**Storage**: N/A (el estado vive en el backend)
**Testing**: `node --test` sobre módulos puros (patrón de `test:proveedores`); recorrido manual según `quickstart.md`
**Target Platform**: Web (Vercel). Orígenes: `autolibre.ai`, `autolibre-preview.vercel.app`, `localhost:3000`
**Project Type**: Web app (landing Next.js) que consume una API externa
**Performance Goals**: Core Web Vitals sin cambios en `/proveedores/[slug]` (LCP < 2.5 s, CLS < 0.1, INP < 200 ms); 0 bytes de Clerk en páginas indexables
**Constraints**: CORS del backend (GET/POST; headers `Authorization` y `Content-Type`; sin cookies); 404 uniforme; 60 req/min por IP
**Scale/Scope**: 1 ruta nueva, 1 isla client, 1 bloque server en el perfil, 1 módulo puro con tests

## Constitution Check

| Principio | Estado | Nota |
|---|---|---|
| I. App Router / RSC por defecto | ✅ | `page.tsx` y `layout.tsx` server; la única isla client es el formulario de canje (+ `<SignIn>`). El CTA del perfil es server. |
| II. Copy en la capa de contenido | ✅ | `lib/content/partner-claim.ts` (pantalla + mensajes) y la extensión de `lib/content/partner-profile.ts` (CTA y texto de WhatsApp). Número de WhatsApp vía `whatsappUrl()`/`siteConfig`. |
| III. Contratos tipados | ✅ | Unión discriminada `RedeemResult`, `Membership`; sin `any`. |
| IV. A11y y performance | ✅ | Label visible, `aria-live` para resultados, input ≥ 16px, focus visible; Clerk fuera de las páginas indexables. |
| V. Aislamiento de secciones | ✅ | `components/proveedores/claim/*` y `components/proveedores/profile/partner-claim-cta.tsx`; ninguno importa al otro. |
| VI. HTML semántico | ✅ | `/proveedores/reclamar`: un `<h1>`, `<main>` único (del layout), form con `<label>`. El CTA es un `<aside>` con su heading del nivel que le toca en el outline del perfil. |
| VII. SEO & GEO | ⚠️ justificado | Página privada: `index: false`, fuera del sitemap y de `llms.txt` (según AGENTS.md § 5). Sin JSON-LD: ver Complexity Tracking. |
| VIII. Tailwind canónico | ✅ | Primitivas de `components/ui/*` y tokens existentes. |
| Technology Stack (nueva dependencia) | ⚠️ acción | Agregar `@clerk/nextjs` a la sección Technology Stack de la constitución (bump PATCH/MINOR) con su justificación. |

**Post-design re-check**: sin violaciones nuevas.

## Project Structure

### Documentation (this feature)

```text
specs/211-partner-claim-redemption/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/partner-claims-api.md
├── checklists/requirements.md
└── tasks.md            # /speckit-tasks
```

### Source Code (repository root)

```text
app/proveedores/reclamar/
├── layout.tsx                # <ClerkProvider> acotado al segmento (server)
└── page.tsx                  # createMetadata({ index:false }), <h1>, monta la isla
proxy.ts                      # SOLO si hace falta (research D4): clerkMiddleware con matcher /proveedores/reclamar(.*)
components/proveedores/claim/
└── claim-form.tsx            # "use client": SignedOut ⇒ <SignIn routing="hash">; SignedIn ⇒ form + estados
components/proveedores/profile/
└── partner-claim-cta.tsx     # server: "¿Es tu taller?" + wa.me AutoLibre + link a /proveedores/reclamar
app/proveedores/[slug]/page.tsx   # monta <PartnerClaimCta> al final del cuerpo
lib/partner-claims/
├── redeem.ts                 # puro: validateCode, buildRequest, parseRedeemResponse, pickPartnerName
├── client.ts                 # fetch browser (usa NEXT_PUBLIC_AUTOLIBRE_API_URL + token)
└── __tests__/redeem.test.ts  # node --test
lib/content/partner-claim.ts  # copy de la pantalla y mensajes
lib/content/partner-profile.ts  # + claimCta (textos y mensaje de WhatsApp)
lib/proveedores/query.ts      # RESERVED_PROFILE_SLUGS += "reclamar"
package.json                  # + @clerk/nextjs, + script test:partner-claims
.specify/memory/constitution.md  # Technology Stack: + @clerk/nextjs
```

**Structure Decision**: Se sigue la estructura actual de `/proveedores` (rutas estáticas hermanas de `[slug]`, componentes en `components/proveedores/*`, un módulo puro testeable en `lib/`). `app/sitemap.ts`, `public/llms.txt` y `app/robots.ts` NO cambian (research D8).

## Riesgos y dependencias

- **Backend sin desplegar**: canje, memberships y CORS están en la rama `redesign`. En local se prueba contra `localhost:3005`; en preview y prod, cuando backend avise.
- **Instancia de Clerk**: tiene que ser la misma que valida el backend; si no, todo da 401.
- **Proxy**: no está confirmado si `<ClerkProvider>` anidado funciona sin `clerkMiddleware`; se verifica al implementar (D4).
- **Slug `reclamar`**: backend tiene que reservarlo (D6).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| `/proveedores/reclamar` sin JSON-LD | Pantalla privada, noindex, sin contenido citable | Un `webPageSchema` en una página noindex no aporta nada a SEO/GEO y suma bytes |
| `NEXT_PUBLIC_AUTOLIBRE_API_URL` (la URL del backend llega al cliente) | La llamada desde el browser es obligatoria para el rate limit por usuario (D1) | El route handler comparte la IP del server; el `X-Forwarded-For` reenviado es falsificable |
| Nueva dependencia `@clerk/nextjs` | Login con la misma cuenta de AutoLibre que valida el backend | Construir auth propio o validar tokens a mano es inseguro y duplica Clerk |
