# Contract: rutas públicas y redirects

Contrato HTTP que expone la sección de proveedores al terminar el ticket. Es lo que verifican `quickstart.md` y las tareas.

## Páginas

| Ruta | Status | Contenido | Canonical | Sitemap |
|---|---|---|---|---|
| `/proveedores` | 200 | Directorio de negocios, con filtro por rubro y paginado | `/proveedores` (también con `?rubro=` y `?pagina=`) | Sí |
| `/proveedores?pagina=<n>` fuera de rango | 404 | — | — | — |
| `/proveedores/registro` | 200 | Formulario de alta | `/proveedores/registro` | Sí |
| `/proveedores/<slug>` (negocio existente) | 200 | Perfil público | `/proveedores/<slug>` | Sí |
| `/proveedores/<slug>` (inexistente) | 404 | `not-found` del perfil, `noindex` | — | No |

Breadcrumb (visible y JSON-LD `BreadcrumbList`):

| Página | Migas |
|---|---|
| Directorio | Inicio → Proveedores |
| Registro | Inicio → Proveedores → Registro |
| Perfil | Inicio → Proveedores → *nombre del negocio* |

## Redirects

Declarados en `next.config.ts`, con `statusCode: 301`. La query de la request se conserva.

| Origen | Destino | Status | Notas |
|---|---|---|---|
| `/proveedor` | `/proveedores` | 301 | `?rubro=...&pagina=...` pasa al destino |
| `/proveedor/:slug` | `/proveedores/:slug` | 301 | el slug se conserva tal cual, incluidos caracteres codificados |

Reglas del contrato:

- Un solo salto: el `Location` es una ruta final que responde 200 o 404, nunca otro redirect.
- `/proveedores` **no** redirige (sigue existiendo, ahora con el directorio).
- `/aliados` y `/aliados/<slug>` no existen en producción y dejan de existir en el código: responden 404, sin redirect.
- Variantes con barra final y mayúsculas, verificadas contra `next start` el 2026-10-23: `/proveedor/` → 301 `/proveedores`, `/Proveedor` → 301 `/proveedores`, `/Proveedor/<slug>` → 301 `/proveedores/<slug>`. No hace falta ninguna regla extra, aunque `skipTrailingSlashRedirect` esté en `true`.

## Sitemap (`/sitemap.xml`)

Debe listar `/proveedores`, `/proveedores/registro` y `/proveedores/<slug>` por cada negocio (excepto slugs reservados). No debe listar `/proveedor`, `/proveedor/<slug>` ni `/aliados`.

## `public/llms.txt`

Una línea por cada una de: directorio (`/proveedores`), registro (`/proveedores/registro`) y perfiles (`/proveedores/{slug}`). Sin menciones a `/aliados`.

## Links internos

| Quién | Destino |
|---|---|
| Header y menú mobile, "Proveedores" | `/proveedores` |
| Header y menú mobile, "Para negocios" | `/proveedores/registro` |
| Footer, grupo Empresa | `/proveedores/registro` |
| Home, banda "¿Tenés un taller...?" | `/proveedores/registro` |
| Hero del directorio, "Sumar mi negocio" | `/proveedores/registro` |
| Tarjetas del directorio y perfiles relacionados | `/proveedores/<slug>` |
| "Ver todos los rubros" (estado vacío) y "Ver todos los proveedores" (perfil) | `/proveedores` |
| Botón de compartir perfil | URL actual del perfil (`/proveedores/<slug>`), sin hash |
