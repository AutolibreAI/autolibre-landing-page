# Data Model: Unificar las rutas de proveedores

El ticket no crea ni modifica datos persistidos: los negocios (`PartnerSummary`, `PartnerDetail`) y el catálogo de servicios siguen viniendo del backend por `lib/autolibre-api.ts`, sin cambios de forma. Lo que cambia es la **identidad por URL** de tres entidades de la sección.

## Entidades y su ruta

| Entidad | Ruta canónica | Identificada por | Reglas |
|---|---|---|---|
| Directorio de proveedores | `/proveedores` | (única) | Filtros por query: `?rubro=<slug de familia>&pagina=<n>`. Un `rubro` fuera del catálogo se lee como "Todos"; una `pagina` inválida, como la primera; una `pagina` fuera de rango es 404. Todas las variantes llevan canonical `/proveedores`. |
| Perfil de proveedor | `/proveedores/<slug>` | `slug` del negocio (backend) | Slug desconocido responde 404 real. No puede ser una palabra reservada. |
| Registro de proveedor | `/proveedores/registro` | (única) | Formulario de alta con el catálogo cargado en el servidor. Mismo comportamiento y envío que hoy. |
| Ruta vieja | `/proveedor`, `/proveedor/<slug>` | — | Solo redirigen (301). No tienen contenido propio. |

## Reglas de ruta

1. **Slug reservado**: `registro`. En el App Router la ruta estática `app/proveedores/registro` gana a `app/proveedores/[slug]`, por lo que un negocio con ese slug sería inalcanzable. Se define `RESERVED_PROFILE_SLUGS` en `lib/proveedores/query.ts`:
   - el sitemap omite esos slugs,
   - el backend debería rechazarlos al dar de alta un negocio (a coordinar, fuera de este repo).
2. **Una sola fuente de la ruta**: `PROVEEDORES_PATH = "/proveedores"`, `PROVEEDORES_REGISTRO_PATH = "/proveedores/registro"` y `partnerPath(slug)` en `lib/proveedores/query.ts`. Breadcrumb visible, JSON-LD, canonical, sitemap, links de las tarjetas y el botón de compartir derivan de ahí; ningún archivo escribe la ruta a mano. (Los links de `site.ts`, `home.ts` y `providers-directory.ts` son datos de copy y usan las constantes cuando el módulo puede importarlas; si no, el literal queda en una sola línea por módulo.)
3. **Sin cadenas de redirect**: el destino de cada redirect es una ruta final, nunca otra ruta vieja.

## Transiciones de estado

Ninguna. Las rutas no tienen ciclo de vida: el cambio es de una sola vez, en el release.

## Símbolos renombrados (referencia para las tareas)

| Antes | Después |
|---|---|
| `ALIADOS_PATH` | `PROVEEDORES_PATH` |
| `ALIADOS_PAGE_SIZE` | `PROVEEDORES_PAGE_SIZE` |
| `aliadosHref()` | `proveedoresHref()` |
| `parseAliadosFilters`, `AliadosFilters` | `parseProveedoresFilters`, `ProveedoresFilters` |
| `aliadosContent` | `providersDirectoryContent` |
| `aliadoPerfilContent` | `providerProfileContent` |
| `AliadosDirectory`, `AliadosHero` | `ProveedoresDirectory`, `ProveedoresHero` |
| `partnerPath()`, `Partner*` | sin cambios |
| (nuevo) | `PROVEEDORES_REGISTRO_PATH`, `RESERVED_PROFILE_SLUGS` |
