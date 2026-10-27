# Data Model: Buscar por nombre y por zona en el directorio de proveedores

No hay migraciones ni columnas nuevas. Todo se deriva de `partners.name` y `partners.coverage_zone` con expresiones.

## Filtros del directorio (web, `lib/proveedores/query.ts`)

Hoy: `ProveedoresFilters = { rubro: string; pagina: number }`.

| Campo | Tipo | Parámetro URL | Regla de lectura (nunca tira) |
|-------|------|---------------|-------------------------------|
| `rubro` | `string` (`""` = todos) | `rubro` | Igual que hoy: sólo si está en el catálogo. |
| `zona` | `string` (`""` = todas) | `zona` | Sólo si el slug está en la lista de zonas que devolvió el backend; si la lista no cargó, se ignora. |
| `q` | `string` (`""` = sin búsqueda) | `q` | Primer valor, `trim`, espacios colapsados, máx. 80 caracteres; vacío ⇒ `""`. Se conserva el texto tal cual lo escribió la persona (sin quitar tildes) para mostrarlo. |
| `pagina` | `number` ≥ 1 | `pagina` | Igual que hoy. |

`proveedoresHref(filters, hash?)` escribe sólo los parámetros no vacíos, en orden estable: `rubro`, `zona`, `q`, `pagina`. `pagina=1` no se escribe. `PROVEEDORES_Q_MAX_LENGTH = 80` se exporta y lo usa el `maxlength` del input.

`hasActiveFilters(filters)`: `rubro || zona || q`.

## Zona (web, `lib/autolibre-api.ts`)

```ts
export interface PartnerZone {
  readonly slug: string;   // clave estable en la URL: "zona-norte"
  readonly name: string;   // etiqueta a mostrar: "Zona Norte"
  readonly count: number;  // negocios activos con esa zona
}
```

`fetchPartnerZones(): Promise<PartnerZone[]>` — tira si falla; la página la envuelve y trata el fallo como "sin selector de zona".

## Zona (backend, derivada)

Revisado tras el Gate G1 (ver `research.md` D3): la celda de `coverage_zone` se **parte en zonas sueltas**.

- **Partición**: por coma, barra, punto y coma o " y " (sin importar mayúsculas) — `ZONE_SEPARATOR_SQL` en `normalize-zone.ts`. Cada trozo, recortado, es una zona candidata; los vacíos se descartan y una clave se cuenta una vez por negocio.
- **Clave (`zoneKey`)** de cada trozo: sin tildes (tabla única de `normalize-search-text.ts`, mayúsculas incluidas), en minúsculas, todo lo que no es letra o número a un guion, sin guiones en los bordes. `"General Rodríguez"` → `general-rodriguez`.
- **Slug de la faceta** = `zoneKey`.
- **Nacionales** (`nacional`, `todo-el-pais`): el negocio matchea CUALQUIER `zone=` y suma a todos los conteos; no son una opción del desplegable.
- **Placeholders** (`a-confirmar`): no son zona, no entran a la faceta y `zone=a-confirmar` no devuelve nada.
- **Etiqueta** = variante cruda del trozo más frecuente dentro del grupo (`mode()`); empate ⇒ la primera por orden.
- **Cuenta** = negocios `active` (con slug vigente, igual que el listado) que declaran la zona, más los nacionales (sin duplicar): es igual al `total` de `GET /partner-profiles?zone=<slug>`.
- **Orden** de la faceta: nombre sin tildes en minúsculas, por código de carácter (`collate "C"`), desempate por slug.

Relación con el modelo existente: no se agrega nada a `PartnerProfileSummary` (su `locality` sigue `null`, ver `research.md` H2).

## Criterios del backend

```ts
export interface ProfileCriteria {
  page: number;
  pageSize: number;
  category?: string;
  locality?: string; // sin cambios: placeholder, no matchea nada
  q?: string;        // ya normalizado por normalizeSearchText; vacío/ausente = sin filtro
  zone?: string;     // slug de zona
}

export interface PartnerZoneFacet { slug: string; name: string; count: number }
// IPartnerProfileReader.listZones(): Promise<PartnerZoneFacet[]>
```

## Reglas de validación

| Regla | Dónde | Resultado si no se cumple |
|-------|-------|---------------------------|
| `q` ≤ 80 caracteres | DTO backend (`@MaxLength(80)`) y recorte en la web | Backend: 400. Web: se recorta antes de pedir. |
| `q` tratado como literal | `escapeLike` (`\`, `%`, `_`) + parámetro enlazado, nunca concatenado | — |
| `zone` = `^[a-z0-9]+(-[a-z0-9]+)*$`, ≤ 120 | DTO backend (misma regex que `category`) | 400 |
| `q` en blanco o sólo espacios | controller (`trim() || undefined`) | Sin filtro |
| `pagina` fuera de rango sobre el resultado filtrado | página (`notFound()`) | 404; página 1 vacía ⇒ estado vacío |

## Estados del directorio (web)

```text
result === null                          -> ErrorState        (falla del servicio)
result.data = [] && hasActiveFilters      -> EmptyState        (sin resultados; pedir presupuesto / quitar filtros)
result.data = [] && !hasActiveFilters     -> grilla vacía      (sin cambios: directorio sin negocios)
result.data > 0                           -> grilla + paginado (con todos los filtros en los links)
```
