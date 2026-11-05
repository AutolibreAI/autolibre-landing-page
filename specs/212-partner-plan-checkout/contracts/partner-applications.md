# Contrato: Alta de taller con dueño (`partner-onboarding-owner`)

**Proveedor**: autolibre backend (diseñado, todavía NO desplegado al 2026-11-04)
**Consumidor**: `autolibre-landing-page`, server-side: `app/api/provider/route.ts` ⇒ `submitPartnerApplication` (`lib/autolibre-api.ts`)
**Base**: `AUTOLIBRE_API_URL` (server-only) + `/api/v1`

## Camino completo

```
browser (/proveedores/registro/formulario, con sesión de Clerk)
  POST /api/provider            Authorization: Bearer <token de Clerk>
    └─ route.ts reenvía el header TAL CUAL (no lo valida, no lo decodifica)
       POST {AUTOLIBRE_API_URL}/api/v1/partner-applications   Authorization: Bearer <token>
```

## POST /partner-applications (Bearer OPCIONAL)

Body: el mismo de siempre (`PartnerApplicationSubmission`, sin cambios).

- **Con Bearer válido**: el backend guarda la cuenta que pidió el alta. Al **aprobar** la solicitud, esa cuenta queda como dueña del taller (membresía `owner`). No se emite código de reclamo.
- **Sin Bearer**: se acepta como anónima (compatibilidad con formularios abiertos antes del deploy). La landing no la usa: el formulario SIEMPRE manda el header.

| Status | Body | Landing (`kind`) | Respuesta de `/api/provider` |
|---|---|---|---|
| 201 | `{ id }` (sin código) | `ok` | `200 { success: true, id }` ⇒ confirmación |
| 400 | validación (Nest array o `{ message, code }`) | `invalid` / `invalid-services` / `invalid-logo` | `400 { error }` |
| 409 | ese email ya tiene una solicitud abierta | `duplicate` | `200 { success: true, alreadyRegistered: true, message }` |
| 401 | token inválido o vencido | `unauthenticated` | `401 { ok: false, kind: "unauthenticated", error }` |
| otro / red | | `unknown` | `502 { error }` |

## Reglas para la landing

1. **401 nunca es "anónimo"**: no se reintenta sin el header ni se cae a un alta sin dueño.
2. **Renovar y reintentar UNA vez**: ante el 401, el browser pide `getToken({ skipCache: true })` (opción verificada en `GetTokenOptions` de `@clerk/shared`, con `@clerk/nextjs` 7.9.24) y reintenta con el header nuevo. Si vuelve a dar 401 (o no hay token), pide volver a entrar y conserva lo escrito.
3. **Sin token no hay POST**: si `getToken()` y `getToken({ skipCache: true })` devuelven `null`, el formulario no manda nada.
4. **Nunca se loguea `Authorization`** ni el token: ni en la ruta ni en `describePartnerApplicationRejection` (que solo lleva `status`, `message` y `code` del body de la respuesta).
5. **Next no valida el token**: no hay SDK de Clerk en el server ni `clerkMiddleware`. El backend es la única autoridad.
