# Quickstart: probar la contratación en local

## 1. Backend (repo backend, rama `redesign`)

- Todo lo de la 211 (`CORS_ALLOWED_ORIGINS=http://localhost:3000`, Clerk de development, migraciones al día).
- Billing: `BILLING_CHECKOUT_ENABLED=true`, credenciales de **prueba** de Mercado Pago y `BILLING_CHECKOUT_BACK_URL`. MP exige `https` en la `back_url`: en local, apuntala a `https://autolibre-preview.vercel.app/proveedores/contratar/resultado` (o a un túnel https a `localhost:3000`) y, si volvés a otra URL, abrí a mano `http://localhost:3000/proveedores/contratar/resultado` en la misma pestaña.
- Con `BILLING_CHECKOUT_ENABLED=false` se prueba el 403 `FEATURE_DISABLED`.

## 2. Landing (`.env.local`, sin commitear)

Las mismas variables de la 211: `NEXT_PUBLIC_AUTOLIBRE_API_URL=http://localhost:3005/api/v1`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.

## 3. Recorrido

1. `http://localhost:3000/proveedores/planes`: los botones de Plus y Plus Max llevan a `/proveedores/contratar?plan=plus|plus_max`; Gratis lleva al registro y "Hablar con ventas" a WhatsApp. En Network no hay nada de Clerk (tampoco al pasar el mouse por los botones).
2. `/proveedores/contratar?plan=otro` y `?plan=free` ⇒ mensaje con link a planes.
3. Sin sesión ⇒ login/alta; después vuelve al mismo plan.
4. Cuenta **sin talleres** ⇒ "Para contratar un plan necesitás un taller en tu cuenta" con las dos opciones. "Mi taller ya está en AutoLibre" lleva a `/proveedores/reclamar?next=…`; tras canjear un código aparece "Seguir con la contratación" y vuelve al plan.
5. Cuenta **dueña de un taller** ⇒ resumen con plan, precio del backend ("ARS 20.000 por mes + IVA"), prueba condicional y taller. Con **varios** ⇒ radios para elegir.
6. El botón queda deshabilitado hasta aceptar los términos. El email arranca con el de la cuenta.
7. Pagar ⇒ redirige a MP (sandbox). Al volver a `/proveedores/contratar/resultado`: "Estamos confirmando tu pago" y después "¡Listo!" o "pendiente".
8. Errores: kill switch apagado ⇒ 403. Un taller que ya tiene un plan `active`/`trialing` ⇒ el aviso "Tu taller ya tiene el plan …" aparece de entrada, sin formulario. Si cambiás la versión de los términos en el backend con la pantalla abierta ⇒ 409, la landing recarga los términos y hay que volver a aceptarlos. Si `GET /billing/terms` falla ⇒ mensaje + "Reintentar" y no se puede pagar.
8b. Prueba: con `trialEligible` true/false/ausente en el GET de la suscripción, cambia el texto del resumen ("Incluye 30 días…" / "ya usó su período de prueba…" / condicional).
9. `noindex, nofollow` en las dos pantallas y ninguna en `/sitemap.xml` ni en `/llms.txt`.
10. Open redirect: `/proveedores/reclamar?next=//evil.com` o `?next=https://evil.com` NO muestran el botón de continuar.

## 4. Tests

```
npm run test:partner-billing
npm run typecheck:partner-billing
npm run test:partner-claims
npm run test:proveedores
```

## 5. Registro con dueño (US3)

Requiere el backend con `partner-onboarding-owner` desplegado (`contracts/partner-applications.md`). Sin él, el backend ignora el header y el alta sale como siempre (sin dueño).

1. `http://localhost:3000/proveedores/registro`: hay contenido (hero, motivos, planes, "Cómo es el registro") y el botón "Registrar mi taller", pero NO el formulario. En Network no hay nada de Clerk (`clerk`, `*.clerk.accounts.dev`), tampoco al pasar el mouse por el botón. "Ver código fuente": un solo `<h1>`, JSON-LD presente, sin `noindex`. `/proveedores/registro#form` cae en la sección del botón.
2. Tocar "Registrar mi taller" ⇒ `/proveedores/registro/formulario`. Sin sesión ⇒ `<SignIn>` (entrar o crear cuenta); al terminar vuelve al formulario. El código fuente tiene `noindex, nofollow` y no tiene JSON-LD; la URL no está en `/sitemap.xml` ni en `/llms.txt`.
3. Con sesión, completar y enviar. En DevTools › Network, el `POST /api/provider` lleva `Authorization: Bearer …`. Respuesta 200 ⇒ "¡Registro recibido!" con "Cuando aprobemos tu taller, vas a poder administrarlo y contratar un plan desde tu cuenta."
4. En el backend, la solicitud tiene la cuenta asociada. Aprobarla y entrar a `/proveedores/contratar?plan=plus` con la misma cuenta ⇒ el taller aparece como propio.
5. 409: repetir con el mismo email ⇒ "Ya te teníamos anotado".
6. 401 con reintento: con el backend devolviendo 401 una sola vez (o con un token vencido) se ven DOS `POST /api/provider`, los dos con `Authorization`, el segundo con el token renovado. Si el backend devuelve 401 siempre ⇒ dos POST (nunca un tercero, nunca uno sin header), el mensaje "Tu sesión venció…" con el link "Volver a entrar (se abre en otra pestaña)", y todos los campos siguen completos. Entrar en la otra pestaña, volver y reenviar ⇒ sale bien.
7. Cerrar sesión en otra pestaña con el formulario a medio completar: el formulario NO desaparece; al enviar no sale ningún POST y aparece el mensaje de sesión vencida.
8. Logs del server (`next dev`): ante un rechazo solo aparece la línea `partner-application rejected by backend` con `status`/`reason`/`code`. Nunca el header ni el token.
9. "Todavía no lo registré" (contratación, cuenta sin talleres) lleva directo a `/proveedores/registro/formulario`.
