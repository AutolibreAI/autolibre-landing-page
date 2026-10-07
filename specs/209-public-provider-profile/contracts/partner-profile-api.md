# Contrato: API pública del perfil de proveedor

**Quién lo implementa**: `autolibre-backend-hex`, contexto `marketplace/partner` (mismo patrón que `PartnerController`: `QueryBus` + read-model, `@Public()`, `ParseUUIDPipe` donde haya id).
**Quién lo consume**: la landing (servidor, SSR/ISR) y la app móvil.
**Base**: `${AUTOLIBRE_API_URL}/api/v1`.
**Estado**: **propuesta** — ningún endpoint existe todavía. Los endpoints actuales `GET /partners` y `GET /partners/:id` **no se tocan** (la app instalada los usa).

Convenciones del backend que se respetan: respuestas sin envoltorio salvo donde se indica, errores con el shape `{ statusCode, message, error }`, solo partners `active` (pausado/archivado ≡ inexistente: `404`, nunca `403`, para no permitir enumerar lo que se despublicó).

---

## 1. `GET /partner-profiles/:slug`

Devuelve el perfil de un partner por su slug público.

**Parámetros**: `slug` — `^[a-z0-9]+(-[a-z0-9]+)*$`, máx. 120. Fuera de ese formato → `400`.

### Respuestas

| Caso | HTTP | Cuerpo |
|---|---|---|
| Slug **vigente** de un partner `active` | `200` | `{ "status": "ok", "profile": PartnerProfile }` |
| Slug **histórico** de un partner `active` | `200` | `{ "status": "moved", "slug": "<slug vigente>" }` |
| Slug inexistente, o de un partner pausado/archivado | `404` | error estándar |
| Slug con formato inválido | `400` | error estándar |

`moved` va en el cuerpo y no como `3xx` a propósito: la landing llama servidor a servidor y un cuerpo explícito es más simple de probar que un `redirect: "manual"` (research D2). El cliente responde con `permanentRedirect("/proveedor/" + slug)`.

### `PartnerProfile`

```jsonc
{
  "slug": "mecanica-barrancas-san-isidro",
  "name": "Mecánica Barrancas",
  "isAlly": true,                       // tier === "founding"
  "memberSince": "2026-03",             // "YYYY-MM" | null  (null si no es confiable: research D26)
  "description": "Taller familiar de mecánica general…",   // string | null

  "logo":  { "url": "https://…/logo.png",  "width": 512,  "height": 512  } | null,
  "cover": { "url": "https://…/cover.jpg", "width": 1600, "height": 600  } | null,

  "primaryCategory":     { "slug": "motor", "name": "Motor" } | null,
  "secondaryCategories": [ { "slug": "tren-rodante-y-frenos", "name": "Tren rodante y frenos" } ],

  "locality": "San Isidro" | null,
  "province": "Buenos Aires" | null,

  "locationMode": "in_person" | "mobile" | "both",
  "address": {                          // null si locationMode = "mobile" o no hay dirección
    "full": "Av. Ejemplo 1234, San Isidro, Buenos Aires",
    "latitude": -34.47,                 // number | null  (hoy es null para todos)
    "longitude": -58.52                 // number | null  (las dos o ninguna)
  } | null,
  "serviceArea": {                      // null si no hay zonas cargadas
    "localities": [ { "name": "San Isidro", "partido": "San Isidro" } ]
  } | null,

  "businessHours": [                    // null si no hay horarios estructurados
    { "weekday": 1, "ranges": [ { "opensAt": "08:00", "closesAt": "18:00" } ] },
    { "weekday": 6, "ranges": [ { "opensAt": "09:00", "closesAt": "13:00" } ] }
    // un día sin entrada = cerrado ese día
  ] | null,

  "contact": {
    "whatsappUrl": "https://wa.me/549…?text=…",   // derivado, nunca guardado; string | null
    "phoneE164": "+5491155550000"                 // phone ?? whatsapp; string | null
  },
  "links": [ { "kind": "instagram", "url": "https://instagram.com/…" } ],   // instagram | website | facebook | x | tiktok | mercado_libre | other

  "people":      { "name": "Jorge", "role": "Dueño", "photo": Image | null } | null,
  "foundedYear": 2011 | null,

  "services": [                         // agrupados por familia, en orden del catálogo
    { "category": { "slug": "motor", "name": "Motor" },
      "items": [ { "slug": "service-y-lubricentro", "name": "Service y lubricentro" } ] }
  ],
  "brands":       { "mode": "all" } | { "mode": "specific", "items": [ "Volkswagen", "Ford" ] },
  "vehicleTypes": [ "car", "suv", "pickup", "motorcycle" ],   // lista vacía = no declaró
  "fuelTypes":    { "mode": "all" } | { "mode": "specific", "items": [ "gasoline", "diesel", "cng" ] },   // mismo criterio que brands
  "equipment":    [ { "slug": "escaner-multimarca", "name": "Escáner multimarca" } ],

  // Fase C. null hasta que el backend modele estos dominios. La web los renderiza solo si llegan con contenido.
  "works": {
    "registeredCount": 12, "totalCount": 18,
    "items": [ {
      "id": "…", "origin": "autolibre" | "own",
      "service": "Kit de distribución",
      "vehicle": { "brand": "Volkswagen", "model": "Vento 2.5", "year": 2012 },
      "monthYear": "2026-08",
      "photos": [ { "role": "before" | "after" | "other", "image": Image } ]
    } ]
  } | null,
  "reviews": {
    "count": 27, "average": 4.8,        // average: number con 1 decimal
    "items": [ {
      "id": "…", "displayName": "Lucía M.",        // YA abreviado: el apellido completo no sale del backend
      "vehicle": "Peugeot 208", "date": "2026-09", "stars": 5, "text": "…",
      "reply": { "text": "…", "date": "2026-09" } | null
    } ]
  } | null,
  "metrics": {
    "responseTimeMinutes": 45 | null,
    "responseRate": 0.9 | null,
    "proposalsSent": 34 | null
  } | null,

  "indexable": true,                    // la regla de §3.9 del data-model; la web la RECALCULA igual (defensa en profundidad)
  "updatedAt": "2026-10-06T14:22:00Z"
}
```

`Image` = `{ "url": string, "width": number, "height": number }`. **Siempre con dimensiones**: la landing las necesita para `next/image` (Constitución IV).

### Reglas del contrato

- **El backend decide la visibilidad**: la web nunca recibe un partner no publicado ni un dato que deba ocultarse (email, apellido completo, patente).
- `brands.mode = "all"` y `fuelTypes.mode = "all"` son la forma explícita del `[]` interno del backend ("todas las marcas", "todos los combustibles"). Ningún cliente interpreta listas vacías. `vehicleTypes` es distinto: vacío significa solo "no declaró" (el alta no tiene la semántica de "todos" para ese campo).
- `address` y `serviceArea` **no son mutuamente excluyentes**: `locationMode = "both"` puede traer las dos (comportamiento provisorio, data-model §3.4).
- `businessHours` viene **ordenado** por `weekday` y cada día por `opensAt`. `closesAt = "24:00"` es válido (equivale a 1440 minutos).
- Los campos de Fase C pueden ser `null` o venir con `count: 0`; la web los trata igual (bloque omitido).

---

## 2. `GET /partner-profiles`

Listado paginado de perfiles publicados. Alimenta el **sitemap** y la página índice `/proveedor`.

**Query**: `page` (≥1, default 1), `pageSize` (1–100, default 50, **tope duro**: es anónimo), `category` (slug de familia, opcional), `locality` (slug de localidad, opcional). `category` y `locality` pueden combinarse.

**`200`**
```jsonc
{
  "data": [ {
    "slug": "mecanica-barrancas-san-isidro",
    "name": "Mecánica Barrancas",
    "isAlly": true,
    "logo": Image | null,
    "primaryCategory": { "slug": "motor", "name": "Motor" } | null,
    "locality": "San Isidro" | null,
    "rating": { "average": 4.8, "count": 27 } | null,
    "indexable": true,
    "updatedAt": "2026-10-06T14:22:00Z"
  } ],
  "total": 46, "page": 1, "pageSize": 50, "totalPages": 1
}
```

Orden **fijo y total**: aliados primero, luego nombre, desempate por `slug` (mismo criterio que el listado actual: un `ORDER BY` no total repite o pierde filas entre páginas).
`indexable` permite al sitemap incluir solo lo indexable sin cargar cada perfil.

---

## 3. Errores

Mismo shape que el resto de la API: `{ "statusCode": number, "message": string | string[], "error": string }`.

| Caso | HTTP |
|---|---|
| `slug` con formato inválido, `pageSize` > 100, `page` < 1 | `400` |
| No existe / no está publicado | `404` |
| Error interno | `500` (la landing **tira** en vez de renderizar un 404: ver research D5) |

---

## 4. Caché

El backend responde con `Cache-Control: public, max-age=60, stale-while-revalidate=300`. La landing **igual** cachea con su propio data cache de Next (`revalidate: 600`, etiquetas `provider-profiles` y `provider:<slug>`) y se invalida por evento (ver [revalidation-webhook.md](./revalidation-webhook.md)).

---

## 5. Compatibilidad y versionado

- Es un recurso **nuevo**: no altera `GET /partners*`.
- Los campos nuevos se agregan siempre como opcionales (`| null`). Un campo existente **no cambia de significado** sin versionar la ruta.
- El `id` UUID del partner **no** aparece en el perfil: la identidad pública es el `slug`. La app resuelve el UUID que ya conoce contra `GET /partners/:id` para el CTA y el `lead`; el perfil por slug es la fuente de lo que se muestra.
  *(A confirmar con el equipo de la app: si prefieren recibir también `id`, se suma como campo — es información que `GET /partners` ya publica, no abre superficie nueva.)*
- El `slug` se agrega además al **resumen del listado** `GET /partners` y al **detalle** `GET /partners/:id` como campo opcional, para que la app pueda armar la URL pública (`autolibre.ai/proveedor/<slug>`) y compartirla. Es un campo nuevo no obligatorio: no rompe a ningún cliente existente, pero el test de OpenAPI que fija la lista completa de campos del resumen hay que actualizarlo **deliberadamente** (es justamente la conversación que ese test pide).

---

## 6. Qué tiene que escribir quien implemente esto en el backend

Para que la lectura devuelva lo anterior hay que crear (detalle en [data-model.md](../data-model.md#1-persistencia-backend)): `partner_slugs`, `partner_business_hours`, `partner_vehicle_types`, `equipment_catalog` + `partner_equipment`, `partner_service_areas` (Fase B) y las columnas nuevas de `partners`; la función `generate_partner_slug` (invocada desde `approve_partner_application` y desde un backfill de los 46 existentes); y el mapeo de `vehicle_types`/`GNC` en la aprobación.
Cuidado ya documentado en el repo: un `drizzle-kit` que genere `DROP … CASCADE` puede llevarse puestos objetos que no están en su schema (le pasó a `v_partner_directory`); y `test/marketplace/schema-invariants.e2e-spec.ts` existe para detectarlo.
