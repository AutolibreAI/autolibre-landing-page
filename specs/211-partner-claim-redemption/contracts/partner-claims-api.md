# Contrato: API de canje (consumida desde el browser)

**Proveedor**: autolibre backend (rama `redesign`: canje `2e5815ac`, memberships `fe8e7236`, CORS `2d9c8d73`)
**Consumidor**: `autolibre-landing-page`, módulo cliente `lib/partner-claims/*`
**Base**: `NEXT_PUBLIC_AUTOLIBRE_API_URL` (incluye `/api/v1`)

## CORS (por entorno, `CORS_ALLOWED_ORIGINS` en el backend)

| Entorno landing | Origin | Backend |
|---|---|---|
| prod | `https://autolibre.ai` | prod |
| preview | `https://autolibre-preview.vercel.app` | preview |
| local | `http://localhost:3000` | local `http://localhost:3005/api/v1` |

- Métodos: `GET`, `POST`. Headers permitidos: `Authorization`, `Content-Type`. `credentials: false`, así que el fetch va con `credentials: "omit"`. Header expuesto: `x-request-id`.

## POST /partner-claims/redemptions

- Headers: `Authorization: Bearer <Clerk session token>`, `Content-Type: application/json`
- Body: `{ "code": string }`: 1 a 32 caracteres, sin campos extra. Se manda lo tipeado con trim.
- Respuestas:
  - `201` `{ "partnerId": "<uuid>", "role": "owner" }`
  - `400` body inválido (falta, vacío, >32, campo extra). Un código mal escrito NO devuelve 400.
  - `401` sin token o token inválido.
  - `404` SIEMPRE `{"statusCode":404,"message":"Claim code not found","code":"NOT_FOUND"}`, sea cual sea la causa (anti-enumeración). La UI NO distingue causas.
  - `429` límite global de 60 req/min por IP. Trae headers CORS, así que es legible.

## GET /partners/me/memberships

- Headers: `Authorization: Bearer <token>`
- `200` `[{ "partnerId": "<uuid>", "name": string, "role": string, "since": string }]`: las membresías activas del usuario.
- `401` sin token o token inválido.
