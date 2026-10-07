# Quickstart: desarrollar y verificar el perfil público de proveedor

**Feature**: `209-public-provider-profile` · **Plan**: [plan.md](./plan.md)

Esta guía es para quien implemente (y para quien revise) la parte de la **landing**. Los endpoints del backend **todavía no existen**, así que se desarrolla contra un servidor de prueba que respeta el [contrato](./contracts/partner-profile-api.md).

---

## 1. Requisitos

- Node 22 (el repo ya usa `node --test` con *type stripping* nativo) y `npm install`.
- Variables en `.env.local` (las nuevas se documentan además en `.env.example`):

| Variable | Para qué | Valor local |
|---|---|---|
| `AUTOLIBRE_API_URL` | base del backend (ya existe) | `http://localhost:4020` apuntando al servidor de prueba |
| `PROVIDER_PROFILE_REVALIDATE_SECRET` | secreto del aviso de cambio | cualquier cadena, ej. `dev-secret` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | mapa estático (ya existe para Places) | la de desarrollo, con la API de *Maps Static* habilitada |

- El interruptor de publicación es **una constante** (`lib/provider-profile/visibility.ts`, como `BLOG_PUBLIC`), no una variable: en desarrollo se pone en `true` para ver el sitemap y el indexado; en el commit que se mergea queda en **`false`** hasta el lanzamiento.

## 2. Servidor de prueba del contrato

`scripts/provider-profile/mock-api.mjs` (se crea en la Fase 0; vive en `scripts/`, fuera del typecheck de Next y **nunca** se empaqueta en la app) sirve cuatro perfiles de prueba que cubren los casos que importan:

| Slug de prueba | Caso |
|---|---|
| `mecanica-barrancas-san-isidro` | **completo, con local, con coordenadas** (indexable). Tramos de horario partidos y sábado. Marcas específicas, equipamiento, GNC. |
| `gestoria-norte-san-isidro` | **sin local** (`locationMode: "mobile"`): zona de cobertura, sin dirección, sin "Cómo llegar". |
| `taller-incompleto` | **no indexable**: sin descripción ni horarios. Debe llevar `noindex` y quedar fuera del sitemap. |
| `mecanica-barrancas` | slug **histórico** → responde `{ "status": "moved", "slug": "mecanica-barrancas-san-isidro" }`. |

Cualquier otro slug → `404`. El servidor expone también `GET /api/v1/partner-profiles` (listado paginado) con los tres perfiles vigentes.

```bash
node scripts/provider-profile/mock-api.mjs   # escucha en :4020
npm run dev                                   # en otra terminal
```

Los mismos datos de prueba se reutilizan como *fixtures* tipadas de las pruebas unitarias.

## 3. Comandos del día a día

```bash
npm run dev                       # http://localhost:3000/proveedor/mecanica-barrancas-san-isidro
npm run test:provider-profile     # lógica pura: horario, FAQ, métricas, indexabilidad, tipo de negocio, slug
npm run typecheck:provider-profile
npx tsc --noEmit                  # typecheck de la app
npm run lint
npm run build                     # tiene que terminar con 0 errores de TS y de ESLint (Constitución)
```

`npm run build` con el mock **apagado** también tiene que terminar bien: la landing no puede fallar el build si el backend no responde (devuelve `[]` y loguea, como hace el blog).

---

## 4. Lista de verificación

Cada ítem apunta al requisito que prueba. Hacerlo contra `/proveedor/mecanica-barrancas-san-isidro` salvo que se indique otro slug.

### Contenido en la primera respuesta *(SC-002, FR-030)*
```bash
curl -s http://localhost:3000/proveedor/mecanica-barrancas-san-isidro | grep -c "Servicios"
```
Con **ver código fuente** (no con las devtools): están el nombre, la descripción, los servicios, el horario semanal, la ubicación y las preguntas frecuentes **como texto**. No debe haber ningún bloque que aparezca recién después de hidratar (salvo el badge de "abierto ahora", que es una isla y se verifica aparte).

### Redirección y 404 *(FR-003, FR-004)*
```bash
curl -sI http://localhost:3000/proveedor/mecanica-barrancas        # 308, Location: /proveedor/mecanica-barrancas-san-isidro
curl -sI http://localhost:3000/proveedor/no-existe                 # 404
curl -sI "http://localhost:3000/proveedor/Slug_Inválido!"          # 404 sin llamar al backend
```
El `308` en lugar de `301` es una decisión documentada (research D6).

### Indexabilidad *(FR-004, FR-035, FR-036)*
- `/proveedor/taller-incompleto`: tiene `<meta name="robots" content="noindex…">`, **no** declara JSON-LD de negocio y **no** aparece en `/sitemap.xml`.
- `/sitemap.xml` incluye `/proveedor` y los perfiles **indexables** (con el interruptor en `true`); con `false`, ninguno.

### Datos estructurados *(SC-003, FR-032 a FR-034)*
- Pegar la URL (o el HTML) en el **Rich Results Test** de Google y en `validator.schema.org`: cero errores para `AutoRepair`, `FAQPage` y `BreadcrumbList`.
- Comprobar **a mano** que lo declarado coincide con lo visible: el horario del JSON-LD es el de la tabla; las preguntas del `FAQPage` son las del acordeón; no hay `aggregateRating` si no se ve la puntuación.
- `/proveedor/gestoria-norte-san-isidro`: `areaServed` presente, **sin** `address` ni `geo`.

### Vista previa al compartir *(SC-004, FR-040 a FR-042)*
- `http://localhost:3000/proveedor/mecanica-barrancas-san-isidro/og` devuelve un **PNG de 1200×630** en menos de 3 s.
- Degradación: probar los tres casos del mock más uno con `cover: null` y `logo: null` — nunca una imagen rota.
- En un entorno **público** (preview deploy): pegar el link en WhatsApp real y en el *Sharing Debugger* de Facebook / `opengraph.xyz`. La tarjeta muestra título, descripción e imagen.

### Estructura semántica *(Constitución VI)*
- Un solo `<h1>` (el nombre). Sin saltos de nivel. Verificar el outline con la extensión *HeadingsMap* o con el equivalente de `document.querySelectorAll("h1,h2,h3,h4")`.
- Un solo `<main>`; cada `<section>` con `aria-labelledby`; las preguntas son `<details>/<summary>`.

### Estado "abierto ahora" *(FR-011, SC-001)*
- Pruebas unitarias de `getOpenStatus` con horas fijas: abierto, cerrado antes/después, **horario cortado** (descanso al mediodía), sábado cerrado, domingo → "abre el lunes", sin horarios → nada.
- Manual: el badge **no mueve el diseño** al aparecer (CLS) y resalta el día de hoy en la tabla.

### Rendimiento y accesibilidad *(SC-005, SC-006, FR-052)*
- Lighthouse **mobile** sobre el build de producción (`npm run build && npm start`): LCP < 2,5 s, CLS < 0,1.
- Solo la portada tiene `preload`; ninguna imagen usa `priority`.
- Auditoría automática (axe) sin violaciones críticas; recorrido **solo con teclado**: botones, acordeón y compartir son alcanzables y se ven con foco.
- Objetivos táctiles ≥ 44 px en 390 px de ancho.

### Alineación *(AGENTS.md § 9)*
- Los bordes del contenido se alinean con el encabezado y el pie a **390, 1024 y 1440 px**. En mobile la columna derecha queda **debajo** de la principal.

### Analítica *(SC-008)*
- Con PostHog apuntando a un proyecto de prueba: los 5 botones (WhatsApp, Llamar, Cómo llegar, Pedir propuesta, Compartir) generan **un** evento cada uno, con `provider` y `placement` correctos. Un `data-analytics-provider` malformado no genera el prop pero el evento sale igual. Ver [contrato](./contracts/analytics-events.md).

### Aviso de cambio *(SC-007)*
```bash
curl -s -X POST http://localhost:3000/api/revalidate/provider \
  -H "x-revalidate-secret: dev-secret" -H "Content-Type: application/json" \
  -d '{"slug":"mecanica-barrancas-san-isidro"}'                 # 200
# sin header → 401 · con slug inválido → 400
```
Cambiar un dato en el mock, avisar y verificar que **la página y su imagen** muestran el cambio sin reiniciar. Sin avisar, el cambio aparece solo a los ≤ 10 minutos (`revalidate: 600`).

### Interruptor apagado
Con `PROVIDER_PROFILES_PUBLIC = false`: las páginas siguen accesibles por URL directa pero con `noindex`; nada en el sitemap; ningún link en el sitio (header, pie, `llms.txt`).

### Seguridad del contenido del proveedor *(research D27)*
Con un perfil de prueba cuya descripción contiene `<script>alert(1)</script>` y un link `javascript:…`: se muestra como **texto**; el link no se renderiza como `<a href>`; los links válidos llevan `rel="nofollow ugc noopener noreferrer"`.

---

## 5. Puerta de lanzamiento (encender `PROVIDER_PROFILES_PUBLIC`)

No es técnica sino de calidad de contenido; sin esto no se enciende:

1. Backend con los endpoints desplegados y los **46 slugs generados y revisados a mano** (los que sacan la localidad de `coverage_zone` sucia son los dudosos).
2. Al menos una cantidad razonable de perfiles **indexables** (descripción + servicios + horarios estructurados + dirección o zona). Cuántos es decisión de producto; ningún perfil pobre se indexa de todos modos (research D7).
3. Imágenes migradas a infraestructura propia (o los logos legacy resueltos con `unoptimized`).
4. Panel de operadores con los campos nuevos y el mensaje de bienvenida con la URL y la instrucción de Google.
5. Analítica verificada (SC-008) y la confirmación de marketing sobre `Contact` de Meta.
6. Cambiar la constante, **actualizar `public/llms.txt`**, enviar el sitemap a Search Console.
