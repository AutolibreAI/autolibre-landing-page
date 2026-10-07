# Contrato: aviso de cambio de perfil (revalidación)

**Quién lo llama**: quien escribe el dato de un partner. Hoy es el **panel de operadores** (`autolibre-admin`, al guardar la ficha o aprobar una solicitud); si algún día los proveedores editan solos, lo llama el backend.
**Quién lo implementa**: esta landing, `app/api/revalidate/provider/route.ts`.
**Para qué**: que un cambio se vea en la página pública, en su imagen de vista previa y en el sitemap **en segundos**, sin esperar la ventana de revalidación ni un deploy.

Es el mismo esquema que `app/api/revalidate/route.ts` (el aviso de Hygraph del blog): secreto en header, comparación en tiempo constante, `revalidateTag(tag, { expire: 0 })`. Se separa en una ruta propia **con su propio secreto** para que un secreto filtrado de un sistema no sirva para vaciar el caché del otro.

---

## Request

```http
POST https://autolibre.ai/api/revalidate/provider
x-revalidate-secret: <PROVIDER_PROFILE_REVALIDATE_SECRET>
Content-Type: application/json

{
  "slug": "mecanica-barrancas-san-isidro",
  "previousSlugs": ["mecanica-barrancas"]
}
```

| Campo | Tipo | Regla |
|---|---|---|
| `slug` | `string` | **obligatorio**; `^[a-z0-9]+(-[a-z0-9]+)*$`, máx. 120 |
| `previousSlugs` | `string[]` | opcional; máx. 10; cada uno con el mismo formato. Se manda al renombrar: sin esto el slug viejo seguiría mostrando la página y no la redirección |

Cualquier otro campo se ignora. El cuerpo se **valida estrictamente** antes de tocar el caché: sin esa validación, un llamador autenticado podría crear etiquetas arbitrarias y crecer el índice de caché sin límite.

## Efecto

Por cada slug recibido (`slug` y cada `previousSlugs`):
- `revalidateTag("provider:<slug>", { expire: 0 })` — expira la página `/proveedor/<slug>`, su imagen `/proveedor/<slug>/og` y las lecturas del backend etiquetadas con ese slug.

Además, siempre:
- `revalidateTag("provider-profiles", { expire: 0 })` — expira el **listado** (página índice `/proveedor` y sitemap).

`{ expire: 0 }` y no `"max"`: con *stale-while-revalidate* la primera visita después del cambio seguiría viendo la versión vieja. Para un webhook la doc de Next recomienda expirar de inmediato.

## Respuestas

| Caso | HTTP | Cuerpo |
|---|---|---|
| OK | `200` | `{ "revalidated": true, "tags": ["provider:…", "provider-profiles"], "now": 1790000000000 }` |
| Falta el secreto en el entorno | `500` | `{ "error": "PROVIDER_PROFILE_REVALIDATE_SECRET no está configurado." }` — la ruta queda **cerrada**: mejor un 500 visible que un endpoint público |
| Secreto ausente o incorrecto | `401` | `{ "error": "No autorizado." }` |
| Cuerpo inválido (slug con formato incorrecto, JSON roto, demasiados `previousSlugs`) | `400` | `{ "error": "<motivo>" }` |

Es **idempotente**: llamarlo dos veces con lo mismo es inocuo.

## Qué NO hace

- No reconstruye la página en el acto: la expira. La primera visita siguiente la regenera (con la semántica de error de la spec técnica: si el backend está caído, **tira** y Next conserva la última buena).
- No sirve para publicar/despublicar por sí solo: la visibilidad la decide el backend. El aviso solo evita que se tarde en notarse.

## Respaldo si el aviso falla

Las lecturas del backend llevan `revalidate: 600`. **Aunque nadie llame al webhook, el peor retraso es de 10 minutos**, que es exactamente el tope de SC-007. El webhook baja ese retraso a segundos; no es la única defensa.

## Configuración

| Variable | Dónde | Notas |
|---|---|---|
| `PROVIDER_PROFILE_REVALIDATE_SECRET` | landing (`.env.local`, entorno de producción) y panel de operadores | Generar con `openssl rand -hex 32`. **Distinto** de `HYGRAPH_REVALIDATE_SECRET`. |
| URL de la landing | panel de operadores | `https://autolibre.ai/api/revalidate/provider` |

Se documenta en `.env.example` junto a los de Hygraph.

## Refactor menor asociado

`secretMatches` (comparación en tiempo constante) hoy está **copiada dentro** de `app/api/revalidate/route.ts`. Con una segunda ruta que la necesita, se extrae a `lib/revalidation.ts` y se importa desde las dos, en vez de duplicar código de seguridad.
