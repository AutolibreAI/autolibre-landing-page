# Quickstart: verificar AUT-137

Todo corre en la raíz de `autolibre-landing-page`, sobre el branch `AUT-137-unify-provider-routes-directory-and-registration`.

## 1. Chequeos estáticos

```bash
npm run lint
```

```bash
npm run build
```

El build compila, hace typecheck y regenera `.next/types/routes.d.ts`. Debe terminar sin errores, y las rutas listadas deben incluir `/proveedores`, `/proveedores/registro` y `/proveedores/[slug]`, y ninguna `/aliados`.

## 2. Que no quede vocabulario viejo

```bash
git grep -nEi "aliado|/proveedor([^e]|$)" -- . ":!specs" ":!node_modules" ":!.next"
```

Lo único aceptable son las dos reglas de redirect de `next.config.ts` (y su comentario). Cualquier otra línea falla SC-003 y FR-018.

## 3. Servidor local

```bash
npm run build && npm run start
```

Se prueba contra `next start` y no contra `next dev` porque los redirects y el prerender se comportan como en producción.

## 4. Redirects (SC-001, FR-004 a FR-006)

Cada comando debe mostrar `301` y el `Location` indicado, y un solo salto.

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/proveedor
```

Esperado: `301 http://localhost:3000/proveedores`

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "http://localhost:3000/proveedor?rubro=talleres&pagina=2"
```

Esperado: `301 http://localhost:3000/proveedores?rubro=talleres&pagina=2`

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/proveedor/SLUG-DE-UN-NEGOCIO
```

Esperado: `301 http://localhost:3000/proveedores/SLUG-DE-UN-NEGOCIO`. Para un slug real, se toma el primero que aparezca en `/sitemap.xml` bajo `/proveedores/`.

Seguir la cadena entera debe terminar en 200 con un solo salto:

```bash
curl -sIL -o /dev/null -w "%{http_code} saltos=%{num_redirects}\n" http://localhost:3000/proveedor
```

Esperado: `200 saltos=1`

Variantes pendientes de confirmar (research D2). Anotar el resultado en `contracts/routes.md` y, si no redirigen, agregar la regla correspondiente o ajustar el spec:

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/proveedor/
```

```bash
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/Proveedor
```

## 5. Páginas (FR-001 a FR-003, FR-007)

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/proveedores
```

Esperado `200`, **sin** redirect. En el navegador: se ve el directorio, no el formulario.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/proveedores/registro
```

Esperado `200`. En el navegador: se ve el formulario y un alta de prueba se envía igual que antes.

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/aliados
```

Esperado `404`.

## 6. SEO (FR-011 a FR-014, SC-004)

En el perfil de un negocio (`/proveedores/<slug>`), abrir el HTML y confirmar que coinciden:

- `<link rel="canonical">` = `/proveedores/<slug>`
- el breadcrumb visible dice Inicio → Proveedores → nombre
- el JSON-LD `BreadcrumbList` tiene los mismos tres elementos y las mismas URLs

```bash
curl -s http://localhost:3000/proveedores/SLUG-DE-UN-NEGOCIO | grep -oE 'rel="canonical"[^>]*'
```

Sitemap:

```bash
curl -s http://localhost:3000/sitemap.xml | grep -oE "<loc>[^<]*(proveedor|aliado)[^<]*</loc>" | head -20
```

Esperado: `/proveedores`, `/proveedores/registro` y perfiles `/proveedores/<slug>`. Ni `/proveedor/`, ni `/aliados`, ni un perfil con slug `registro`.

`public/llms.txt`: una línea por directorio, registro y perfiles, sin `/aliados`.

## 7. Navegación y acceso al alta (FR-008, FR-009, Historia 4)

En desktop y en mobile (375 px):

1. Abrir `/proveedores`: "Sumar mi negocio" se ve sin hacer scroll y lleva a `/proveedores/registro`.
2. Header y menú mobile: "Proveedores" → directorio, "Para negocios" → registro. Solo la entrada de la página actual lleva `aria-current="page"`.
3. Footer (grupo Empresa) y banda de la home: ambos → `/proveedores/registro`.
4. Botón de compartir en un perfil: copia `/proveedores/<slug>`.

## 8. Slug reservado

Confirmar con el equipo de backend que ningún negocio existente tiene slug `registro` y que el alta de negocios lo rechaza. Resultado: ______ (completar al cerrar el ticket).

## 9. Analítica

Anotar en `analytics.md` la fecha de salida del release como corte de la serie de `/proveedores/registro`.
