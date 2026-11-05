# Quickstart: probar el canje en local

## 1. Backend (repo backend, rama `redesign`)

- En el `.env` del backend: `CORS_ALLOWED_ORIGINS=http://localhost:3000` y `PARTNER_CLAIM_HASH_SECRET=<cualquier valor en local>`.
- Levantarlo en `http://localhost:3005` con las migraciones al día (incluye `partner_members` 0141).
- Generar un código de reclamo para un taller sin dueño desde el admin (o como indique la sesión del backend).

## 2. Landing (`.env.local`, sin commitear)

```
NEXT_PUBLIC_AUTOLIBRE_API_URL=http://localhost:3005/api/v1
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...   # MISMA app de Clerk (development) que valida el backend
CLERK_SECRET_KEY=sk_test_...
```

Si la instancia de Clerk no es la misma que usa el backend, el canje devuelve 401.

## 3. Recorrido

1. Abrí `http://localhost:3000/proveedores/<slug>`. Verificá que aparezca "¿Es tu taller?", que "Pedí tu código" abra WhatsApp con el nombre y el slug, y que en el código fuente y en la pestaña Network no haya nada de Clerk.
2. Andá a `http://localhost:3000/proveedores/reclamar` sin sesión: tiene que pedir login o alta.
3. Logueado, probá:
   - un código válido ⇒ "¡Listo! Ya administrás {taller}";
   - el mismo código otra vez ⇒ el mensaje único de código inválido;
   - un código inventado ⇒ el mismo mensaje;
   - un campo vacío o con más de 32 caracteres ⇒ error local, sin request.
4. Verificá que `<meta name="robots" content="noindex, nofollow">` esté en `/proveedores/reclamar` y que la ruta no figure en `/sitemap.xml` ni en `/llms.txt`.

## 4. Tests

`npm run test:partner-claims` (`node --test` sobre `lib/partner-claims`).
