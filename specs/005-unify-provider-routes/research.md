# Research: Unificar las rutas de proveedores

No quedaban `NEEDS CLARIFICATION` en el contexto técnico. Lo que sigue son las decisiones de diseño y los puntos que había que confirmar en la documentación de Next 16 (`node_modules/next/dist/docs`, como exige `AGENTS.md`).

## D1. Status de los redirects: 301 explícito

- **Decision**: declarar los redirects en `next.config.ts` con `statusCode: 301`.
- **Rationale**: la doc de `redirects` dice que `permanent: true` usa **308** y `permanent: false` usa 307; para un código distinto hay que usar `statusCode` en lugar de `permanent` (no los dos a la vez). El ticket y FR-004/FR-005 piden 301. Para buscadores 301 y 308 son equivalentes, pero con 301 se cumple la letra del ticket y se evita una diferencia entre lo pedido y lo entregado.
- **Alternatives considered**: `permanent: true` (308). Es el default recomendado por Next y conserva el método HTTP, pero no es lo que se pidió; se descarta salvo que el equipo prefiera 308, en cuyo caso se cambia en un solo lugar.

## D2. Dónde viven los redirects y cómo se escriben

- **Decision**: `redirects()` en `next.config.ts` (el sitio no tiene ninguno todavía; es el primero), con dos reglas:
  - `/proveedor` → `/proveedores`
  - `/proveedor/:slug` → `/proveedores/:slug`
- **Rationale**: se resuelven antes del render, sin página ni middleware, y en un solo salto. La doc confirma que los parámetros de query de la request se **pasan al destino** automáticamente, lo que cubre el escenario de `?rubro=&pagina=` (Historia 2, escenario 3).
- **Pendiente de verificar en el quickstart**: `next.config.ts` tiene `skipTrailingSlashRedirect: true` (para PostHog). Eso puede cambiar si `/proveedor/` (con barra) matchea la regla de `/proveedor`. Si no matchea, se agrega una regla explícita para la variante con barra. Lo mismo para mayúsculas (`/Proveedor`): la doc no lo define, se prueba contra el servidor y, si no matchea, se acota el requisito del spec.
- **Alternatives considered**:
  - Middleware/`proxy.ts`: el repo no tiene ninguno; agrega una capa de runtime por algo que la config resuelve.
  - Páginas `app/proveedor/` con `redirect()`: devuelven 307/308 según el contexto y agregan código que mantener.
  - Redirect en Vercel (`vercel.json`): ata el comportamiento a la plataforma y no se prueba en `next dev`.

## D3. Qué se renombra y con qué nombres

- **Decision**:
  - Rutas: `app/aliados/**` → `app/proveedores/**`; formulario `app/proveedores/page.tsx` → `app/proveedores/registro/page.tsx`.
  - Componentes: `components/aliados/` → `components/proveedores/`.
  - Lógica: `lib/aliados/` → `lib/proveedores/`; símbolos `ALIADOS_PATH`, `ALIADOS_PAGE_SIZE`, `aliadosHref()`, `parseAliadosFilters`, `AliadosFilters` → `PROVEEDORES_PATH`, `PROVEEDORES_PAGE_SIZE`, `proveedoresHref()`, `parseProveedoresFilters`, `ProveedoresFilters`; se suma `PROVEEDORES_REGISTRO_PATH`. `partnerPath()` y los componentes `Partner*` conservan el nombre.
  - Copy: `lib/content/aliados.ts` → `providers-directory.ts` (`providersDirectoryContent`) y `aliado-perfil.ts` → `provider-profile.ts` (`providerProfileContent`). Ya existe `providers.ts` con el copy del formulario (`providersContent`); los nombres nuevos lo siguen y no chocan.
- **Rationale**: lo pide el ticket ("renombrarlo, no rehacerlo") y FR-018. `git mv` conserva el historial de lo que ya está revisado. Los nombres de módulo siguen la convención en inglés de `providers.ts`; los parámetros de la URL (`rubro`, `pagina`) siguen en español, como indica `query.ts`.
- **Alternatives considered**: dejar los nombres internos como `aliados` y cambiar solo las rutas. Más barato, pero deja el vocabulario descartado en el código y en los textos, y contradice FR-018 y SC-003.

## D4. Slug reservado `registro`

- **Decision**: en Next la ruta estática `app/proveedores/registro` tiene prioridad sobre `app/proveedores/[slug]`, así que un negocio con slug `registro` quedaría inalcanzable y su URL del sitemap llevaría al formulario. Se define `RESERVED_PROFILE_SLUGS = ["registro"]` en `lib/proveedores/query.ts`; el sitemap excluye esos slugs y `partnerPath()` queda sin cambios. Se avisa al backend para que rechace el slug al crear negocios.
- **Rationale**: FR-016 pide reservar la palabra. Con las rutas estáticas ya bloqueada la colisión, lo que falta es que el sitio no publique una URL rota. No se verificó contra el backend si existe hoy un negocio así; el supuesto del spec sigue vigente y se chequea en el quickstart.
- **Alternatives considered**: renombrar el formulario a otra palabra (ej. `sumar`). Rechazado: el nombre `registro` está en el título y en el "Listo cuando" del ticket.

## D5. Navegación y estado actual

- **Decision**: en `lib/content/site.ts`, `aliadosLink` pasa a `{ label: "Proveedores", href: "/proveedores" }`; "Para negocios" y el link del footer apuntan a `/proveedores/registro`. Ambas entradas se mantienen (clarify). Los comentarios que citan `/aliados` y `/proveedores` como "la página que le habla a negocios" se actualizan.
- **Rationale**: `site-header.tsx` y `mobile-nav.tsx` marcan `aria-current="page"` por **igualdad exacta** entre `href` y `currentPath`. Con `currentPath="/proveedores"` en el directorio, `/proveedores/registro` en el formulario y la URL del perfil en el perfil, nunca se marcan dos entradas a la vez y no hay que tocar la lógica.
- **Alternatives considered**: marcar "Proveedores" también en el formulario y en el perfil por pertenecer a la sección. Mejora semántica menor y exige cambiar la comparación; fuera de alcance.

## D6. Breadcrumb y canonical del perfil, y breadcrumb del formulario

- **Decision**:
  - Perfil: Inicio → Proveedores (`/proveedores`) → nombre; canonical `/proveedores/<slug>` salen de `partnerPath()` y `PROVEEDORES_PATH`, una sola fuente para breadcrumb visible, JSON-LD y `createMetadata`.
  - Directorio: Inicio → Proveedores. Canonical `/proveedores`, igual para todas las variantes `?rubro=`/`?pagina=` (se mantiene el criterio ya documentado en la página).
  - Formulario: Inicio → Proveedores (`/proveedores`) → Registro (`/proveedores/registro`); canonical `/proveedores/registro`. Hoy el breadcrumb del formulario es Inicio → Proveedores; dejarlo así lo haría compartir `/proveedores` con el directorio.
- **Rationale**: FR-011/FR-012 y la nota del ticket: breadcrumb y canonical son dos señales que cambian juntas. Que las dos salgan de las mismas constantes evita que se desalineen.

## D7. Sitemap, `llms.txt` y analítica

- **Decision**:
  - `app/sitemap.ts`: `/proveedores` (directorio, `weekly`, prioridad 0,7), `/proveedores/registro` (`monthly`, 0,8, hereda hoy la del formulario) y los perfiles; se borra la entrada `/aliados`. `lastModified` de las dos rutas se actualiza a la fecha del release, como pide el comentario del archivo.
  - `public/llms.txt`: tres líneas (Proveedores: directorio; Registro de proveedores; Perfiles de proveedores) con las rutas nuevas.
  - `analytics.md`: la línea del formulario pasa a `/proveedores/registro`, con la fecha de corte de la serie (clarify). No se toca PostHog ni el código de analítica: hoy el formulario solo emite `$pageview` y no hay eventos atados a la ruta.
- **Rationale**: constitución, principio VII: toda ruta pública va en sitemap y `llms.txt`.

## D8. Acceso a "Sumar mi negocio" desde el directorio

- **Decision**: el hero del directorio ya tiene `secondaryCta: "Sumar mi negocio"`, hoy con `href: "/proveedores"`. Pasa a `/proveedores/registro`. Cubre FR-008 y la Historia 4 sin agregar UI.
- **Rationale**: está en el hero, arriba del listado. En el quickstart se comprueba que es visible sin scroll en mobile y desktop. Si en mobile queda debajo del pliegue se evalúa un ajuste de orden, no un componente nuevo.

## D9. Verificación sin runner de tests

- **Decision**: no agregar infraestructura de tests. Verificación con `npm run lint`, `npm run build` (incluye typecheck y regenera `.next/types/routes.d.ts`) y un chequeo HTTP de redirects y rutas contra `next start` o `next dev` descrito en el quickstart.
- **Rationale**: el repo no testea código de la app y el alcance es de renombres y config. El chequeo HTTP mide justo lo que importa (status, `Location`, query, un solo salto).
- **Alternatives considered**: test con `node --test` sobre una lista de redirects exportada. Útil para regresión, pero obliga a extraer los redirects a un módulo y a sumar un script; se puede agregar después si el equipo lo pide.
