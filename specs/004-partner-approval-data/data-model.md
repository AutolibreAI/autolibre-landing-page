# Data Model: Completar los datos del partner que hoy se cargan a mano después de aprobar

Este repo no posee las tablas `partner_applications`/`partners` (viven en el backend, repo separado). Lo que sigue describe la forma de los datos que **este repo captura y envía**, no el esquema de base de datos — ese es responsabilidad de `autolibre-backend-hex` (ver `contracts/partner-application-submission.md`).

## PlaceGeo (compartido, `lib/google-places.ts`)

Ya existe hoy en `components/quote-flow/use-quote-flow.ts` como `PlaceGeo`; se mueve tal cual a `lib/google-places.ts` sin cambios de forma.

| Campo | Tipo | Notas |
|---|---|---|
| `latitude` | `number \| null` | `null` si no se seleccionó ninguna sugerencia de Places |
| `longitude` | `number \| null` | ídem |
| `locality` | `string \| null` | `long_name` del `address_component` tipo `locality` (o `sublocality` como fallback) |
| `province` | `string \| null` | `long_name` del `address_component` tipo `administrative_area_level_1` |

**Regla de invalidación**: si la persona edita el texto de dirección después de haber seleccionado una sugerencia, `PlaceGeo` vuelve a `EMPTY_GEO` (los cuatro campos en `null`) hasta que se seleccione una nueva sugerencia. Mismo comportamiento que ya tiene `use-quote-flow.ts`.

## PartnerHours (nuevo)

Texto libre, sin estructura (ver Decisión 6 en `research.md`).

| Campo | Tipo | Notas |
|---|---|---|
| `hours` | `string \| undefined` | Opcional. No bloquea el envío si está vacío. Sin formato validado más allá de longitud razonable (ver `contracts/`). |

## PartnerModality (nuevo)

| Valor | Significado |
|---|---|
| `"en_local"` | Atiende solo en el local del taller |
| `"a_domicilio"` | Atiende solo a domicilio |
| `"ambas"` | Atiende de las dos formas |

Campo `modality?: "en_local" \| "a_domicilio" \| "ambas"` — opcional, no bloquea el envío.

**Nota de contrato**: estos tres valores son una propuesta de este repo; el backend puede requerir nombres distintos para el enum que ya usa internamente en `partners.modality` (si existe uno). Confirmar contra el backend antes de fijar el contrato — ver `contracts/partner-application-submission.md`.

## Extensión de `PartnerApplicationSubmission` (`lib/autolibre-api.ts`)

Interfaz existente (`lib/autolibre-api.ts:155-175`), con los campos nuevos que este trabajo agrega:

```ts
export interface PartnerApplicationSubmission {
  readonly businessName: string;
  readonly whatsapp: string;
  readonly email: string;
  readonly address: string;
  readonly declaredServices: string[];
  readonly declaredBrands: string[];
  readonly declaredFuelTypes: string[];
  readonly vehicleTypes: string[];
  readonly serviceOther?: string;
  readonly howFound?: string;
  readonly howFoundOther?: string;

  // ── Nuevos (AUT-81) ──────────────────────────────────────────────
  /** Geocode de `address`; ausente si no se seleccionó una sugerencia de Places. */
  readonly latitude?: number;
  readonly longitude?: number;
  readonly locality?: string;
  readonly province?: string;
  readonly hours?: string;
  readonly modality?: "en_local" | "a_domicilio" | "ambas";
}
```

Todos los campos nuevos son opcionales — mantiene compatibilidad con el contrato actual y respeta que ninguno de ellos bloquea el envío (research.md, Decisión 5).

## Relación con las entidades del spec

- **Solicitud de partner** (spec.md, Key Entities) = el body de `POST /api/v1/partner-applications` después de este cambio: todo lo de arriba, más los campos que ya existían.
- **Partner** (spec.md, Key Entities) = fuera del alcance de este repo; el contrato de qué columnas nuevas debe leer `approve_partner_application()` está en `contracts/partner-application-submission.md`.
