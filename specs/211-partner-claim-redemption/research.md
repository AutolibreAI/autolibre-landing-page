# Research: Reclamo de taller por código

**Feature**: `211-partner-claim-redemption` | **Date**: 2026-11-03

Versiones instaladas: `next` 16.2.4, `react`/`react-dom` 19.2.4.

## D1. Llamada al backend desde el browser (no desde un route handler)

- **Decision**: El canje (`POST /partner-claims/redemptions`) y la lectura de membresías (`GET /partners/me/memberships`) se llaman con `fetch` desde el browser, con `Authorization: Bearer <token de Clerk>`, sin cookies (`credentials: "omit"`).
- **Rationale**: El backend tiene un rate limit global de 60 req/min **por IP**. Desde un route handler de Next, todos los usuarios comparten la IP del server de la landing: el cupo se reparte entre todos y el freno anti fuerza bruta deja de ser por persona. Reenviar `X-Forwarded-For` no sirve, porque cualquiera que le pegue directo al backend puede falsearlo. Esta decisión se acordó con backend (sesión `mp-integration-partners`) y la aprobó el usuario.
- **Alternatives considered**: (b) route handler que reenvía el token y la IP (`/api/...`, como `/api/provider`): descartada por lo de arriba. Proxy de Next con rewrite al backend: tiene el mismo problema de IP.

## D2. Excepción a "la URL del backend no llega al cliente"

- **Decision**: Agregar `NEXT_PUBLIC_AUTOLIBRE_API_URL` (incluye `/api/v1`), que se usa SOLO en el módulo cliente de canje. `AUTOLIBRE_API_URL` (server-only) sigue igual para todo lo demás.
- **Rationale**: `lib/autolibre-api.ts:1-17` deja la URL del backend fuera del bundle a propósito. La llamada desde el browser (D1) necesita la URL; la URL no es un secreto (el backend autentica con Bearer y restringe por CORS). La excepción queda acotada a un módulo y a las rutas de canje.
- **Alternatives considered**: Inyectarla como prop desde el server component de la página: evita el `NEXT_PUBLIC_`, pero la URL termina igual en el HTML/RSC payload. Lo que se gana es solo poder cambiarla sin rebuild. Lo descartamos por simplicidad; queda como opción si hace falta cambiarla en runtime.
- **Valores por entorno**: prod: el backend de prod; preview (`autolibre-preview.vercel.app`): el backend de preview; local: `http://localhost:3005/api/v1`.

## D3. Clerk acotado a las rutas de canje

- **Decision**: `@clerk/nextjs` 7.x (peer `next ^16.1`, `react ~19.2.3`: compatible). `<ClerkProvider>` va en `app/proveedores/reclamar/layout.tsx`, nunca en `app/layout.tsx`. `app/layout.tsx` hoy no tiene providers y sigue así.
- **Rationale**: FR-006 / SC-004: ninguna página indexable carga JS de Clerk. Un layout anidado alcanza para acotar el provider. Un segundo root layout no hace falta y, además, fuerza un full reload al navegar.
- **Alternatives considered**: Route group `(auth)` con root layout propio: más estructura sin beneficio. Clerk en todo el sitio: viola el principio de SEO/performance.

## D4. `proxy.ts` (ex `middleware.ts` en Next 16) con matcher acotado

- **Decision**: Agregar `proxy.ts` en la raíz con `clerkMiddleware()` y un `matcher` que cubre SOLO `/proveedores/reclamar` (y subrutas) y las rutas internas de Clerk si las hubiera. Ninguna otra ruta lo ejecuta.
- **Rationale**: En Next 16 el archivo es `proxy.ts`, que exporta `proxy` (o un default) y un `config.matcher` estático, y corre en runtime Node (`node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`). La doc de Clerk indica que `<ClerkProvider>` usa `auth()` cuando no corrió `clerkMiddleware`, y no está confirmado que el provider anidado funcione limpio sin el proxy. Con el matcher acotado, el costo en las páginas indexables es cero.
- **Verificación en implementación**: Probar primero SIN `proxy.ts`. Si el provider anidado renderiza y `getToken()` funciona, se omite el proxy (menos piezas). Si falla, entra el proxy acotado. Cualquiera de las dos cumple la spec.
- **Alternatives considered**: El matcher genérico de Clerk (todas las rutas menos estáticos): ejecutaría Clerk en cada página indexable, así que se descarta.
- **Resultado de la implementación (2026-11-03)**: SIN `proxy.ts`. En `@clerk/nextjs` 7.9.24, el `ClerkProvider` de App Router (`dist/esm/app-router/server/ClerkProvider.js`) solo lee la sesión en el server (`getDynamicAuthData` ⇒ `auth()`) cuando recibe `dynamic`; sin ese prop pasa `initialState: undefined` al provider de cliente y la sesión se resuelve en el browser. La isla usa solo hooks de cliente (`useAuth`, `useClerk`) y nunca `auth()`/`currentUser()` del server, así que `clerkMiddleware` no es necesario. El layout NO pasa `dynamic`. La verificación con el dev server y `curl` quedó pendiente: el `next dev` del usuario en `:3000` (mismo directorio, PID 21432) estaba colgado y Next no permite un segundo dev server sobre el mismo proyecto. Si al probar a mano aparece "clerkMiddleware() was not run" o similar, se suma `proxy.ts` con `clerkMiddleware()` y `matcher: ["/proveedores/reclamar(.*)"]`.

## D5. Componente de login

- **Decision**: `<SignIn routing="hash" />` embebido en la pantalla de canje cuando no hay sesión (también permite crear cuenta), con `forceRedirectUrl="/proveedores/reclamar"`.
- **Rationale**: `routing="hash"` evita crear la ruta catch-all `[[...sign-in]]`. Redirigir siempre al mismo lugar cumple FR-005 (volver a la pantalla de canje).
- **A verificar en implementación**: el prop exacto para habilitar el alta desde `<SignIn>` (`withSignUp` o `signUpUrl` con hash) en la versión instalada.
- **Resultado (v7.9.24)**: `withSignUp` existe (`SignInProps`, "sign-in-or-up flow"); se usa junto con `forceRedirectUrl` y `signUpForceRedirectUrl`, ambos a `/proveedores/reclamar`. OJO: en v7 `<SignedIn>`/`<SignedOut>` ya no existen (`removedControlComponents`, reemplazados por `<Show>`); la isla ramifica con `useAuth()` (`isLoaded`/`isSignedIn`). El header de Clerk se oculta con `appearance.elements.header = "hidden"` porque trae su propio `<h1>` y la página ya tiene uno. Sin `@clerk/localizations` (no se suman dependencias): el widget sale en inglés; queda como pendiente decidir si se suma esa dependencia o una `localization` parcial a mano.

## D6. Ruta `/proveedores/reclamar` y colisión con `[slug]`

- **Decision**: Ruta estática `app/proveedores/reclamar/`. Agregar `"reclamar"` a `RESERVED_PROFILE_SLUGS` (`lib/proveedores/query.ts:17-22`) y pedirle a backend que lo sume a sus slugs reservados.
- **Rationale**: Es el mismo patrón que `registro` y `planes` (spec 005, D4): en App Router el segmento estático gana sobre el dinámico, y el sitemap ya filtra los reservados. OJO: el backend nunca había reservado ninguno de esos slugs (la premisa de 005 D4 era falsa). La migración 0145 del backend reserva `registro`, `planes` y `reclamar`, y en esos casos el slug arranca en `-2`. Cubre solo negocios nuevos; los existentes en producción los revisa backend. Commit `a4a3d4c9` (rama `redesign`): `generate_partner_slug` aplica `-2` solo si el nombre da EXACTAMENTE una de esas palabras. Un nombre que solo las contiene ("Planes y Más") no se ve afectado.
- **Regla nueva**: toda ruta estática nueva bajo `/proveedores/` se le avisa al backend para que la sume a su lista de reservados.

## D7. CTA en el perfil público

- **Decision**: Un bloque server-only (sin `"use client"`) en el cuerpo del perfil, visualmente secundario: "¿Es tu taller?" con dos enlaces: "Pedí tu código" (wa.me de AutoLibre vía `whatsappUrl(text)` de `lib/whatsapp.ts`, con el nombre y el slug del taller en el texto) y "Ya tengo mi código" (`/proveedores/reclamar`).
- **Rationale**: El perfil ya tiene un CTA de WhatsApp primario hacia el **taller** (`partner-profile-head.tsx`, `partner-sticky-bar.tsx`, vía `redirectLink`). El nuevo va hacia **AutoLibre** y no puede competir ni confundirse con ese: es texto chico y va al final del contenido, no en la sticky bar.
- **Visibilidad**: Se muestra en todos los perfiles. Los datos públicos del perfil no dicen si el taller ya tiene dueño. Si lo tiene, el código no se emite y el equipo lo resuelve por WhatsApp.

## D8. SEO de la pantalla de canje

- **Decision**: `createMetadata({ ..., index: false })` (pone `robots` en noindex/nofollow), sin entrada en `app/sitemap.ts` ni en `public/llms.txt`, y SIN `Disallow` en `robots.ts`, porque un Disallow impediría que el crawler vea el `noindex`. Sin JSON-LD: es una pantalla privada y transaccional, sin contenido citable.
- **Alternatives considered**: `Disallow: /proveedores/reclamar`: la URL podría indexarse igual por enlaces externos sin ver el noindex. Descartado.

## D9. Manejo de respuestas

- **Decision**: Un módulo puro (`lib/partner-claims/redeem.ts`) que mapea la respuesta HTTP a una unión discriminada: `success` (201) | `invalid-code` (404, siempre el mismo mensaje) | `invalid-input` (400) | `unauthenticated` (401) | `rate-limited` (429) | `network`/`unknown`. Guarda `x-request-id` para el log de consola.
- **Rationale**: Mismo estilo que `SubmitPartnerApplicationResult` (`lib/autolibre-api.ts:200-216`). Al ser una función pura, se testea con `node --test`, como el resto del repo (no hay vitest/jest).

## D10. Tests

- **Decision**: `node --test` sobre el módulo puro (normalización del input, validación de 1 a 32 caracteres, mapeo de cada status, extracción del nombre del taller desde las membresías), con un script `test:partner-claims` siguiendo el patrón de `test:proveedores`. El flujo con Clerk se prueba a mano según `quickstart.md`.
- **Ubicación (desvío del plan)**: el test vive en `scripts/partner-claims/redeem.test.ts` (no en `lib/partner-claims/__tests__/`), como `scripts/proveedores/*`. Razón: corre con el type stripping de Node, que exige imports con extensión `.ts`; el `tsconfig.json` raíz incluye todo `**/*.ts` sin `allowImportingTsExtensions` (TS5097) y excluye `scripts/`. Se suma `scripts/partner-claims/tsconfig.json` y el script `typecheck:partner-claims`, como en `provider-profile`. `lib/partner-claims/redeem.ts` es autocontenido (sin `@/`) para poder importarse desde el test.
