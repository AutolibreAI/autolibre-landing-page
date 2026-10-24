# Contract: búsqueda y zona en el listado de perfiles

Backend: `autolibre-backend-hex`, controller `PartnerProfileController` (`@Public`). Cambio **aditivo**: el contrato actual no se rompe.

## `GET /api/v1/partner-profiles`

Parámetros nuevos (los existentes `page`, `pageSize`, `category`, `locality` no cambian):

| Parámetro | Tipo | Validación | Semántica |
|-----------|------|------------|-----------|
| `q` | string | opcional, `trim`, ≤ 80 caracteres; vacío = ausente | Negocios cuyo **nombre** contiene el texto, sin distinguir mayúsculas ni tildes. Literal: `%`, `_` y `\` no son comodines. |
| `zone` | string | opcional, `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 120 | Negocios cuya zona normalizada (slug) es exactamente `zone`. Un slug desconocido devuelve lista vacía, no error. |

Combinación: `category`, `q` y `zone` son un `AND`. Orden sin cambios (`tier`, `name`, `slug`). `total` y `totalPages` son los del resultado filtrado.

Respuestas: `200` con el `PartnerProfilePageDto` actual; `400` si `q` supera 80 caracteres o `zone` no cumple el patrón.

Ejemplos:

```text
GET /api/v1/partner-profiles?q=perez&pageSize=24
GET /api/v1/partner-profiles?category=frenos&zone=zona-norte&page=2&pageSize=24
GET /api/v1/partner-profiles?q=100%25     # busca el texto literal "100%"
```

## `GET /api/v1/partner-profiles/facets/zones` (nuevo)

Sin parámetros. Zonas con al menos un negocio activo, ordenadas por `name` (ascendente, sin distinguir tildes).

```json
{
  "data": [
    { "slug": "caba", "name": "CABA", "count": 31 },
    { "slug": "zona-norte", "name": "Zona Norte", "count": 12 }
  ]
}
```

- Mismo `Cache-Control` que el listado (`public, max-age=60, stale-while-revalidate=300`).
- Ruta con `facets/` para no chocar con `GET /partner-profiles/:slug` (ver `research.md` D1).
- Cae del selector cualquier zona vacía o sólo-símbolos.

## Contrato web (URL de `/proveedores`)

| URL | Resultado |
|-----|-----------|
| `/proveedores` | Como hoy. |
| `/proveedores?q=perez` | Negocios cuyo nombre contiene "perez". |
| `/proveedores?zona=zona-norte` | Negocios de esa zona. |
| `/proveedores?rubro=frenos&zona=zona-norte&q=perez&pagina=2` | Los tres filtros + página 2 del resultado. |
| `?q=` , `?zona=`, `?zona=<desconocida>` | Se leen como "sin ese filtro"; nunca error. |
| `?pagina=99` sobre un resultado filtrado | 404 (igual que hoy sin filtros). |

Todas las variantes: `<link rel="canonical" href=".../proveedores">`, sin entrada en el sitemap.

## Contratos de prueba que deben cambiar

- `test/marketplace/partner-profiles.e2e-spec.ts`: casos de `q` (tildes, mayúsculas, comodines literales, vacío), `zone` (igualdad, desconocida, combinada con `category`), facet de zonas (agrupa variantes, excluye vacías) y 400 por validación.
- Snapshot/documento OpenAPI del módulo `marketplace`, si lo aserta (se confirma al implementar).
