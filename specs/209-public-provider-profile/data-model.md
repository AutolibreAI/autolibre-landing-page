# Data Model: Perfil público de proveedor (web + app)

**Feature**: `209-public-provider-profile` · **Spec**: [spec.md](./spec.md) · **Research**: [research.md](./research.md)

Tres capas, de adentro hacia afuera:

1. **Persistencia (backend)**: tablas y columnas que hay que agregar a `autolibre-backend-hex`. Es el único dueño de los datos.
2. **Modelo de lectura** `PartnerProfile`: lo que viaja por la API pública. Su forma JSON está en [contracts/partner-profile-api.md](./contracts/partner-profile-api.md).
3. **Reglas derivadas (web y app)**: cálculos puros sobre ese modelo (estado "abierto", preguntas frecuentes, métricas visibles, indexabilidad). Viven en `lib/provider-profile/` y se prueban con `node --test`.

Convenciones del backend que se respetan: IDs `uuid`, columnas `snake_case` en inglés, **nada de borrar partners** (la baja es `status = 'archived'`), y las escrituras de partners pasan por funciones de la base invocadas desde el panel de operadores, no SQL a mano.

Fases: **A** = núcleo P1, **B** = P2 sin datos nuevos de dominio, **C** = dominios nuevos del backend (solo contrato acá).

---

## 1. Persistencia (backend)

### 1.1 `partners` — columnas nuevas *(Fase A salvo indicación)*

| Columna | Tipo | Nulo | Regla | Para qué |
|---|---|---|---|---|
| `primary_category_id` | `uuid` FK → `service_categories` | sí | si es nulo se **deriva** (ver §3.6) | rubro principal (título, migas, tipo de negocio) |
| `locality` | `text` | sí | no vacía si existe; se completa con la localidad del geocode de `004-partner-approval-data` | slug, migas, título, `addressLocality` |
| `province` | `text` | sí | idem | `addressRegion` |
| `cover_image_url` | `text` | sí | URL https de Spaces | portada |
| `cover_image_width`, `cover_image_height` | `int` | sí | **las tres de portada van juntas o ninguna** (`CHECK`) | `next/image` exige dimensiones |
| `founded_year` | `smallint` | sí | `CHECK` entre 1900 y el año en curso | "N años en el rubro" (se calcula, no se guarda) |
| `owner_name`, `owner_role` | `text` | sí | ambas o ninguna | "Quién atiende" |
| `owner_photo_url` | `text` | sí | https | foto opcional de quien atiende |
| `phone` | `text` | sí | E.164 si existe | "Llamar" y `telephone`; si es nulo se usa `whatsapp` (research D25) |
| `member_since` | `date` | sí | backfill = `created_at::date` **solo** si `source = 'application'` | "En AutoLibre desde" (research D26) |

Ya existen y se reutilizan sin cambios: `name`, `description`, `logo_url`, `whatsapp`, `whatsapp_message`, `address`, `latitude`/`longitude` (con su `CHECK` de "completas o ninguna"), `coverage_zone`, `modality`, `tier`, `status`, `source`, `created_at`, `updated_at`.

### 1.2 `partner_slugs` *(nueva, Fase A)*

| Columna | Tipo | Regla |
|---|---|---|
| `slug` | `text` **PK** | `CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(slug) <= 120)` |
| `partner_id` | `uuid` FK → `partners`, `ON DELETE RESTRICT` | los partners no se borran |
| `is_current` | `boolean` NOT NULL default `true` | |
| `created_at` | `timestamptz` NOT NULL default `now()` | |

Índice único **parcial**: `UNIQUE (partner_id) WHERE is_current` → un solo slug vigente por partner.
**Una PK para todos los slugs (vigentes e históricos) hace imposible por construcción que el slug viejo de A coincida con el vigente de B** (research D3).

### 1.3 `partner_business_hours` *(nueva, Fase A)*

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | |
| `partner_id` | `uuid` FK → `partners`, `ON DELETE CASCADE` | |
| `weekday` | `smallint` | `CHECK (weekday BETWEEN 1 AND 7)` — ISO: 1 = lunes … 7 = domingo |
| `opens_minute` | `smallint` | `CHECK (0 <= opens_minute < 1440)` — minutos desde las 00:00 |
| `closes_minute` | `smallint` | `CHECK (1 <= closes_minute <= 1440)` y `closes_minute > opens_minute` |

Varias filas por día = horario cortado. `UNIQUE (partner_id, weekday, opens_minute)`. **Sin tramos que crucen medianoche**: un local que cierra a las 02:00 carga dos tramos. **Sin solapamientos en un mismo día**, validado en la función de escritura (no hay `EXCLUDE` salvo que se habilite `btree_gist`).
El texto libre `partners.hours` **se conserva** como respaldo hasta migrar los 46 existentes (research D4).

### 1.4 `partner_vehicle_types` *(nueva, Fase A)*

| Columna | Tipo | Regla |
|---|---|---|
| `partner_id` | `uuid` FK, `ON DELETE CASCADE` | PK compuesta con `vehicle_type` |
| `vehicle_type` | enum `partner_vehicle_type` | `car`, `suv`, `pickup`, `motorcycle` |

Hoy el alta captura `vehicle_types` (`Autos`, `SUVs`, `Pickups`, `Motos`) en `partner_applications`, pero **la aprobación no lo copia** a `partners`. Hay que sumar el mapeo etiqueta → enum al flujo de aprobación (la spec `004-partner-approval-data` ya cubre "transferir lo capturado"; esto se coordina con ella).

### 1.5 `equipment_catalog` + `partner_equipment` *(nuevas, Fase A)*

`equipment_catalog (id uuid PK, slug text UNIQUE, name text, position int, active bool)` y `partner_equipment (partner_id FK, equipment_id FK, PK compuesta)`.
Es **estructurado y cerrado a propósito** (la spec: "no texto libre" y "no nombrar modelos de escáner"). Semilla inicial **a confirmar con operaciones**: escáner multimarca, elevador, alineadora (los tres del diseño); el resto lo define quien conoce los talleres.

### 1.6 `partner_service_areas` *(nueva, Fase B)*

| Columna | Tipo | Regla |
|---|---|---|
| `id` | `uuid` PK | |
| `partner_id` | `uuid` FK, `ON DELETE CASCADE` | |
| `locality` | `text` NOT NULL | nombre a mostrar ("San Isidro") |
| `partido` | `text` | opcional |
| `position` | `int` NOT NULL | orden de aparición |

Es la **zona de cobertura estructurada** de la variante sin local. `coverage_zone` (texto libre, sucio, obligatorio) sigue siendo lo que ven los listados hoy; **no se toca**.

### 1.7 Fase C — solo contrato *(la construcción es otra feature de backend)*

Para congelar la forma que va a consumir la web y la app, estas entidades se **describen** acá y se **modelan** en su propia spec:

| Entidad | Campos mínimos que el contrato espera |
|---|---|
| `partner_review` | partner, autor (solo nombre + inicial en la lectura), vehículo (marca/modelo), estrellas 1–5, texto, fecha, moderación |
| `partner_review_reply` | reseña, texto, fecha (una por reseña) |
| `partner_work` | partner, origen (`autolibre` \| `own`), servicio, vehículo (marca, modelo, año), mes/año, consentimiento del cliente si es `autolibre` |
| `partner_work_photo` | trabajo, URL, ancho, alto, rol (`before` \| `after` \| `other`) |
| Métricas | `response_time_minutes`, `response_rate`, `proposals_sent` por partner, calculadas por una regla determinística |

Nota de honestidad de dato: hoy las propuestas existentes (`quote_request_proposals`, `ops.quote_request_response`) **las consiguen operadores**; no hay fuente de tiempo ni tasa de respuesta por partner (research D14).

---

## 2. Modelo de lectura `PartnerProfile`

Una proyección **de solo lectura** armada por el backend; la landing y la app **no calculan reglas de negocio de visibilidad** (qué partner está publicado, qué dato se oculta): las reciben resueltas. Campos clave y de dónde sale cada uno:

| Campo del perfil | Origen |
|---|---|
| `slug` | `partner_slugs` (el vigente) |
| `name`, `description`, `logo` | `partners` |
| `isAlly` | `tier = 'founding'` |
| `memberSince` | `partners.member_since` (nulo si no es confiable) |
| `cover`, `logo` (con dimensiones) | `cover_image_*`, `logo_url` |
| `primaryCategory`, `secondaryCategories` | `primary_category_id` o derivada (§3.6); resto desde `partner_services` → `services` → `service_categories` |
| `locality`, `province` | `partners` |
| `locationMode` | derivado de `modality` (§3.4) |
| `address` (`full`, `latitude`, `longitude`) | `partners.address`, `latitude`, `longitude` |
| `serviceArea` | `partner_service_areas` |
| `businessHours` | `partner_business_hours` agrupado por día |
| `contact` (`whatsappUrl`, `phoneE164`) | `whatsapp_contact_url` derivado; `phone` o `whatsapp` |
| `links` | `partner_links` (`instagram`, `website`, `facebook`, …) |
| `people` | `owner_*` |
| `foundedYear` | `founded_year` |
| `services` (agrupados por categoría) | `partner_services` |
| `brands` (`mode: all \| specific`), `vehicleTypes`, `fuelTypes`, `equipment` | `partner_brands`, `partner_vehicle_types`, `partner_fuel_types`, `partner_equipment` |
| `works`, `reviews`, `metrics` | Fase C; `null` hasta entonces |
| `updatedAt` | máximo `updated_at` de lo que compone el perfil (alimenta `lastmod` del sitemap) |

**Regla del vacío ya documentada en el backend y que se respeta**: `brands: []` significa **todas** las marcas y `fuelTypes: []` **todos** los combustibles, no "ninguna". El contrato lo hace explícito con `brands` y `fuelTypes` como `{ mode: "all" | "specific", items }` para que ningún cliente tenga que adivinar. (`vehicleTypes` no tiene esa semántica: vacío es solo "no declaró".)

**Privacidad en la lectura**: el email del partner **no** viaja en el perfil. Las reseñas llegan con `displayName` ya abreviado ("Lucía M."); el apellido completo no sale del backend. Los trabajos nunca traen patente ni datos del cliente.

---

## 3. Reglas derivadas (módulos puros, `lib/provider-profile/`)

Cada una es una función **sin efectos, sin imports con alias** y con pruebas `node --test`.

### 3.1 Slug

- **Formación (backend, función `generate_partner_slug`)**: `base = slugify(name)`; si hay localidad utilizable, `base = base + "-" + slugify(locality)`. `slugify`: normalizar NFD, quitar marcas diacríticas, minúsculas, todo carácter fuera de `[a-z0-9]` pasa a `-`, colapsar guiones repetidos, recortar guiones de los extremos, **tope de 100 caracteres** (se corta en un límite de guion).
- **Localidades no utilizables**: vacío, `"a confirmar"`, `"nacional"`, `"zona norte"`… (lista corta y revisable). No entran al slug.
- **Colisión**: sufijo numérico `-2`, `-3`, … asignado **una vez** y estable.
- **Renombre**: se crea el slug nuevo como vigente y el anterior pasa a `is_current = false`; **nunca se borra** (así la redirección no se rompe). Un slug archivado sigue existiendo: el partner archivado responde 404, no redirige.
- **Validación en la web** (antes de llamar al backend): `^[a-z0-9]+(-[a-z0-9]+)*$` y largo ≤ 120; si no cumple → `notFound()` sin consultar.

### 3.2 Estado en vivo ("abierto ahora")

`getOpenStatus(businessHours, now, timeZone = "America/Argentina/Buenos_Aires")`

- Se obtiene día ISO y minutos desde medianoche **en esa zona** con `Intl.DateTimeFormat` (sin librerías; Argentina no tiene horario de verano, pero no se asume).
- Resultado: `{ kind: "open", closesAt }` · `{ kind: "closed", nextOpening: { dayOffset, weekday, opensAt } }` · `{ kind: "unknown" }` (sin horarios cargados → no se muestra nada).
- Soporta **tramos múltiples por día**: entre dos tramos está "cerrado" con `nextOpening` hoy ("abre 14:00").
- `nextOpening` busca hasta 7 días hacia adelante: `dayOffset = 1` → "abre mañana 8:00"; mayor → "abre el lunes 8:00"; `0` → "abre hoy 14:00".
- `closes_minute = 1440` se muestra como `00:00`.
- Un perfil con horarios pero **sin ningún tramo en la semana** equivale a `unknown`.
- Los textos finales ("Abierto · cierra 18:00", "Cerrado · abre mañana 8:00") salen de la capa de contenido; la función devuelve estructura, no strings.

### 3.3 Calificación

Promedio con **una decimal y coma** en pantalla ("4,8"); punto en `ratingValue` del JSON-LD ("4.8"). Si `reviews.count = 0` no hay puntuación en ningún lado (ni en el encabezado ni en datos estructurados).

### 3.4 Modo de ubicación

Del `modality` del backend (`en_local` / `a_domicilio` / `ambas`, propuesta de la spec 004 todavía a confirmar con el backend):

| `modality` | `locationMode` | Qué muestra el perfil |
|---|---|---|
| `en_local` | `in_person` | dirección, "Cómo llegar", mapa si hay coordenadas |
| `a_domicilio` | `mobile` | "A domicilio y online · <zona>", **sin** "Cómo llegar", bloque "Zona de cobertura" |
| `ambas` | `both` | **provisorio**: se comporta como `in_person` y, si hay `serviceArea`, agrega "También atiende a domicilio en: …". La spec lo deja abierto hasta validar con proveedores reales. |
| nulo / desconocido | `in_person` si hay dirección; `mobile` si solo hay zona; si no hay ninguna, el bloque de ubicación se omite |

### 3.5 Preguntas frecuentes

`buildFaq(profile) → FaqItem[]` (`{ id, question, answer }`). **Una lista alimenta el acordeón visible y el `FAQPage` de JSON-LD.** Las plantillas de texto están en `lib/content/provider-profile.ts`; la función decide **qué** plantillas se evalúan y con qué datos. Orden fijo y **tope de 8 ítems**.

| Id | Se genera si… | Respuesta |
|---|---|---|
| `location` | hay dirección | la dirección completa |
| `hours-weekly` | hay horarios | el horario semanal |
| `hours-saturday` | hay horarios | sí (con el tramo) o no, según los tramos del sábado |
| `brands-<marca>` | `brands.mode = "specific"`; **hasta 5** marcas | sí, y la lista completa de marcas |
| `brands-all` | `brands.mode = "all"` y hay servicios | sí: atiende todas las marcas |
| `vehicle-<tipo>` | por cada tipo declarado (hasta 3) | sí |
| `fuel-cng` | `fuelTypes.mode = "specific"` **e incluye** `cng` | sí |
| `diagnostic-scanner` | equipamiento incluye el escáner **o** un servicio de la lista de diagnóstico | sí |
| `mobile-service` | `locationMode` es `mobile` o `both` y hay zonas | sí, y la lista de localidades |

Reglas duras: nunca una pregunta **negativa** por una marca no declarada; `fuelTypes.mode = "all"` **no** implica GNC (sería afirmar algo que el proveedor no declaró); sin dato no hay pregunta (FR-024). El LLM no interviene en la v1 (research D13).

> **Brecha encontrada**: el backend ya soporta `cng`, pero el formulario de alta (`PROVIDER_FUEL_TYPES` en `lib/content/providers.ts`) ofrece solo **Nafta, Diesel, Híbridos y Eléctricos**. Hoy ningún proveedor puede declarar GNC, así que el ejemplo "¿Trabajan con autos con GNC?" de la spec **no se dispararía nunca**. Hay que agregar "GNC" al formulario y confirmar que la aprobación lo mapea a `cng`.

### 3.6 Rubro principal

`primaryCategory = partners.primary_category_id`, o si es nulo, **la familia con más servicios** del partner (desempate: menor `position` en el catálogo). Sin servicios → sin rubro principal (la página omite el rubro del título y de las migas, no inventa uno).

### 3.7 Tipo de negocio de schema.org

`businessTypeFor(primaryCategorySlug) → "AutoRepair" | "TireShop" | "AutoWash" | "AutoBodyShop" | "AutoPartsStore" | "AutomotiveBusiness"`. Tabla en [research D9](./research.md#d9-rubro-principal-y-tipo-de-negocio-de-schemaorg). Todo slug desconocido → `AutomotiveBusiness`. Una prueba falla si una familia del catálogo no está mapeada.

### 3.8 Métricas visibles

`selectVisibleMetrics(metrics, thresholds) → VisibleMetric[]`. `thresholds` es un objeto tipado (`responseTimeMaxMinutes`, `responseRateMin`, `proposalsSentMin`) cuyos valores son **`null` hasta que producto los defina**; una métrica con umbral `null`, o sin dato, **no se muestra**. Con cero visibles, el bloque entero se omite (research D14).

### 3.9 Indexabilidad

`isIndexable(profile) → boolean`: verdadero solo si hay **descripción**, **al menos un servicio**, **horarios estructurados** y (**dirección o zona de cobertura**). Falso → `noindex`, fuera del sitemap y **sin** datos estructurados de negocio (research D7). El interruptor global `PROVIDER_PROFILES_PUBLIC` manda por encima.

---

## 4. Ciclo de vida y transiciones

```text
solicitud (partner_application)
   └─ aprobación (función SQL)  ──▶ partner status=active  +  slug vigente generado
        │
        ├─ editar nombre/localidad ──▶ slug nuevo vigente; el anterior queda histórico
        ├─ pausar / archivar        ──▶ status≠active: el perfil responde 404, sale del sitemap,
        │                              los slugs se conservan
        └─ reactivar                ──▶ vuelve el mismo slug vigente
```

Estados visibles de una URL `/proveedor/<slug>`:

| La URL es… | Respuesta |
|---|---|
| slug vigente de un partner `active` | `200` (indexable según §3.9) |
| slug **histórico** de un partner `active` | redirección permanente al vigente |
| slug de un partner pausado/archivado, o inexistente | `404` |

---

## 5. Validaciones que vienen de la spec

| Requisito | Dónde se hace cumplir |
|---|---|
| FR-002 slug único, estable, normalizado | `partner_slugs` (PK + `CHECK`) y `generate_partner_slug` |
| FR-003 redirects sin cadenas | un solo salto: la tabla guarda **todos** los slugs apuntando al mismo `partner_id` y el backend resuelve al vigente |
| FR-011 estado en vivo con tramos múltiples | §3.2 + modelo de horarios §1.3 |
| FR-015 datos estructurados, no texto libre | §1.4, §1.5 y catálogo de servicios existente |
| FR-017 / FR-018 privacidad | contrato (abreviación en el backend) |
| FR-020 métricas con umbral determinístico | §3.8 |
| FR-024 FAQ determinística | §3.5 |
| FR-036 datos estructurados = contenido visible | una sola fuente por dato (§3.5, JSON-LD y página leen el mismo objeto) |
| FR-004 despublicar | `status` + 404 |
