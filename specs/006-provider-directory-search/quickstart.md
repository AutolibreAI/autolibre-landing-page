# Quickstart: validar la búsqueda y la zona del directorio

## Auditoría de zonas (Gate G1) — antes de implementar la historia de zona

Sólo lectura, sobre la base de producción (o una copia):

```sql
-- 1) Cuántos valores crudos y cuántos normalizados
WITH z AS (
  SELECT btrim(coverage_zone) AS raw,
         btrim(regexp_replace(
           translate(lower(coverage_zone), 'áàäâéèëêíìïîóòöôúùüûñ', 'aaaaeeeeiiiioooouuuun'),
           '[^a-z0-9]+', '-', 'g'), '-') AS key
  FROM partners WHERE status = 'active'
)
SELECT count(DISTINCT raw) AS valores_crudos,
       count(DISTINCT key) AS zonas_normalizadas,
       count(*) FILTER (WHERE key = '') AS sin_zona_util,
       count(*) FILTER (WHERE raw ~* '(,|;|/| y | e )') AS posibles_multizona
FROM z;

-- 2) Detalle: las zonas, con sus variantes y cantidad
SELECT key, count(*) AS negocios, array_agg(DISTINCT raw ORDER BY raw) AS variantes
FROM z GROUP BY key ORDER BY negocios DESC;
```

Pasa el gate si: `zonas_normalizadas ≤ 25`, `posibles_multizona = 0` (o revisados a mano y descartados) y hay zonas con 2+ negocios. Pegar el resultado en `research.md` § _Resultado de la auditoría_.

## Backend (`autolibre-backend-hex`, branch `AUT-139-search-providers-by-name-and-zone`)

```bash
npm run test -- partner-profiles       # unit: handler + normalizeSearchText
npm run test:e2e -- partner-profiles   # e2e contra Postgres
curl -s "http://localhost:3000/api/v1/partner-profiles?q=perez&pageSize=5"
curl -s "http://localhost:3000/api/v1/partner-profiles/facets/zones"
curl -s "http://localhost:3000/api/v1/partner-profiles?q=100%25"      # literal
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3000/api/v1/partner-profiles?q=$(printf 'a%.0s' {1..81})"   # 400
```

## Web (`autolibre-landing-page`, mismo branch)

```bash
npm run dev      # http://localhost:3000/proveedores
npm run lint
npm run build
npm run test:proveedores   # node --test sobre lib/proveedores (parseo y hrefs)
```

Recorrido manual (también con JavaScript deshabilitado):

1. `/proveedores` → escribir parte del nombre de un negocio → **Buscar** → aparece sólo ese; la URL tiene `?q=…#red`; abrirla en otra pestaña da lo mismo (US2, SC-003).
2. Buscar con otra capitalización y sin tildes → mismo resultado (FR-001).
3. Elegir una zona → **Buscar** → sólo negocios de la zona; el contador y el paginado son los del total filtrado (US1, SC-004).
4. Con rubro + zona + texto: quitar uno con su link "quitar" y verificar que los otros dos siguen; estando en `?pagina=3`, cambiar un filtro vuelve a la página 1 (US3).
5. Buscar `zzzz` → estado vacío con "Pedir presupuesto" (lleva a `/pedido`) y "Quitar filtros" (US4).
6. Apagar el backend → la página muestra el estado de **error**, no el vacío (FR-012).
7. `?zona=inexistente`, `?q=`, `?pagina=abc` → sin error (FR-010); `?q=zzzz&pagina=2` → 404.
8. `view-source:` de cualquier variante → `canonical` = `/proveedores`; `/sitemap.xml` sin `?q=`/`?zona=` (FR-013).
9. Teclado: Tab recorre input → select → Buscar → links "quitar"; foco visible; lector de pantalla anuncia las etiquetas (FR-015).
10. Confirmar que el `#red` del `action` sobrevive al envío del formulario GET (el navegador debe dejar la sección a la vista).

## Nota sobre el e2e del backend

`test:e2e` lee `POSTGRES_MIGRATIONS_URL` del `.env` de `autolibre-backend-hex`, que hoy apunta a una base Neon remota; el spec corre dentro de una transacción con `ROLLBACK`, pero escribe fixtures. Antes de ejecutarlo, o se confirma que esa base es de desarrollo, o se levanta un Postgres local (en `.env` hay `DB_PORT=5435`, `autolibre_ai_hex`) con las migraciones aplicadas y se apunta `POSTGRES_MIGRATIONS_URL` ahí.
