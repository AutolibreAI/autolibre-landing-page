# Contrato: `POST /api/v1/partner-applications` (extensión)

**Consumidor**: `autolibre-landing-page` (este repo), vía `submitPartnerApplication()` en `lib/autolibre-api.ts`
**Proveedor**: backend NestJS en `autolibre-backend-hex` (repo separado — este contrato es lo que ese repo necesita aceptar; su implementación NO es parte de este plan)

Este documento existe porque el trabajo de AUT-81 queda dividido en dos repos: este plan cubre solo el lado que manda los datos. Sirve como el pedido concreto para planificar el lado que los recibe y los transfiere a `partners`.

## Body actual (sin cambios, para referencia)

```json
{
  "businessName": "string",
  "whatsapp": "string",
  "email": "string",
  "address": "string",
  "declaredServices": ["string"],
  "declaredBrands": ["string"],
  "declaredFuelTypes": ["string"],
  "vehicleTypes": ["string"],
  "serviceOther": "string | omitido",
  "howFound": "string | omitido",
  "howFoundOther": "string | omitido"
}
```

## Campos nuevos que este repo empieza a mandar

| Campo | Tipo | Presencia | Descripción |
|---|---|---|---|
| `latitude` | `number` | Ausente si no hubo geocode (persona no eligió sugerencia de Places) | Latitud de la dirección elegida |
| `longitude` | `number` | Ídem | Longitud de la dirección elegida |
| `locality` | `string` | Ídem | Localidad/partido extraído del `address_component` de Google (`locality` o `sublocality`) |
| `province` | `string` | Ídem | Provincia extraída del `address_component` `administrative_area_level_1` |
| `hours` | `string` | Ausente si la persona lo dejó vacío | Horarios en texto libre, tal cual los escribió la persona |
| `modality` | `"en_local" \| "a_domicilio" \| "ambas"` | Ausente si la persona no eligió ninguna opción | Modalidad de atención declarada |

**Los cuatro campos de geocode viajan juntos o ninguno** — nunca coordenadas sin `locality`/`province`, ni viceversa: si `place.geometry` o los `address_components` esperados no vienen en la respuesta de Google, este repo trata el resultado como "sin geocode" (equivalente a no haber elegido sugerencia) y no manda ninguno de los cuatro.

## Lo que este repo espera que el backend haga con esto

1. **Persistir** los seis campos nuevos en `partner_applications` (requiere columnas nuevas — no existen hoy, ver el ticket AUT-81 original).
2. **Derivar `coverage_zone`** a partir de `locality`/`province` en vez de seguir pidiéndolo como parámetro manual de `approve_partner_application()` (ver `research.md`, Decisión 4, del lado de este repo — la regla de derivación en sí la define el backend).
3. **Transferir** `latitude`, `longitude`, `hours`, `modality` (y el `coverage_zone` derivado) a `partners` cuando se aprueba la solicitud, junto con lo que `approve_partner_application()` ya copia hoy.

## Sin cambios

- Los códigos de respuesta y su semántica (`200`/`201` éxito, `400` inválido, `409` duplicado) no cambian — este repo sigue interpretándolos igual (`lib/autolibre-api.ts`, `classifyBadRequest`).
- Ningún campo existente cambia de nombre, tipo o de obligatoriedad.

## Verificado contra el backend local (2026-09-22)

Prueba manual end-to-end con el backend de `autolibre-backend-hex` corriendo local: `latitude`, `longitude`, `locality` y `province` pasan la validación del `ValidationPipe` de Nest sin error — el DTO ya los acepta. `hours` y `modality` fallan con `"property hours should not exist"` / `"property modality should not exist"` (whitelist estricta): todavía no están declarados en el DTO del lado del backend. Falta agregar esos dos ahí antes de que el submit de `/proveedores` funcione de punta a punta.

## Abierto para el equipo de backend

- **El ticket original solo menciona modalidad binaria** (a domicilio / en local, usada como peso de scoring). Este repo agrega una tercera opción, `"ambas"`, porque un taller real puede combinar las dos y no tiene sentido forzarlo a elegir — pero si el scoring del lado del backend espera estrictamente un flag binario, `"ambas"` no tiene una traducción obvia ahí. Confirmar si el backend puede aceptar un tercer valor (y cómo lo pesa) o si conviene que este repo lo recorte a las dos opciones originales antes de mandarlo.
- ¿Los valores de `modality` (`en_local` / `a_domicilio` / `ambas`, si se confirma la tercera) coinciden con el enum que ya usa (o va a usar) `partners.modality`? Si el backend prefiere otros nombres, este repo los adapta — son un detalle de serialización, no de producto.
- ¿Qué pasa si `locality`/`province` vienen pero no alcanzan para derivar una `coverage_zone` válida (dirección ambigua, fuera de la cobertura conocida)? Este repo no bloquea el envío en ese caso (ver spec.md, Edge Cases) — el backend decide si la aprobación queda con `coverage_zone` vacía o requiere completarla a mano como excepción.
