# Data Model: Reclamo de taller por código

La landing no persiste nada. Estos son los tipos del lado del cliente.

## ClaimCodeInput

- `code: string`: lo que tipea el usuario. Antes de enviarlo se le aplica `trim()` y nada más (la normalización real la hace el backend).
- Validación local (FR-008): después del trim, la longitud tiene que ser de 1 a 32. Si no cumple, el error se resuelve en el cliente y no se hace request.

## RedeemResult (unión discriminada)

| kind | Origen | Mensaje (lib/content) |
|---|---|---|
| `success` + `partnerId: string`, `role: "owner"` | 201 | éxito (se resuelve el nombre por membresías) |
| `invalid-code` | 404 con el body EXACTO del contrato (`code: "NOT_FOUND"` + `message: "Claim code not found"`). Cualquier otro 404 (ruta inexistente o URL mal configurada) es `unknown` | "El código no es válido o ya venció. Pedile uno nuevo al equipo de AutoLibre" |
| `invalid-input` | 400 | "Revisá el código: tiene que tener entre 1 y 32 caracteres" |
| `unauthenticated` | 401 | pedir iniciar sesión de nuevo (se conserva el código) |
| `rate-limited` | 429 | "Hiciste muchos intentos. Esperá un minuto y probá de nuevo" |
| `unknown` | 5xx, otros status, red/CORS, JSON inválido | "No pudimos procesar el canje. Probá de nuevo en un rato" |

Todos los resultados que no son `success` llevan `requestId?: string` (header `x-request-id`), que solo se usa en `console.error`.

## Membership

- `partnerId: string` (uuid), `name: string`, `role: string`, `since: string` (ISO).
- Para la confirmación: se busca la membresía cuyo `partnerId` sea el del 201. Si no aparece o falla el GET, se muestra el mensaje sin nombre (spec, edge case).

## Estados de la pantalla (máquina de estados)

```
signed-out ──login──▶ idle ──submit──▶ submitting ──201──▶ success(name?)
                       ▲                  │
                       └──── error(kind) ◀┘   (401 ⇒ signed-out conservando el código)
```

- Mientras está en `submitting`, el botón queda deshabilitado (FR-014).
- En `error`, el código escrito queda en el input (FR-012, FR-013).
