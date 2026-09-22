# Quickstart: Completar los datos del partner que hoy se cargan a mano después de aprobar

## Antes de tocar código

Este repo corre una versión de Next.js con cambios que rompen con lo que un modelo de lenguaje puede asumir por entrenamiento previo (ver `AGENTS.md`). Si el trabajo toca algo de App Router o route handlers que no esté ya calcado del patrón existente en `provider-form.tsx` / `route.ts`, revisar `node_modules/next/dist/docs/01-app/` antes de escribir código nuevo en vez de asumir la API de versiones anteriores.

## Correr el entorno

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000/proveedores`.

**Variable de entorno necesaria** para probar el autocompletado de Places: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (la misma que ya usa el modal de presupuesto — ver `.env.local` / `.env.example` si existe). Sin ella, el campo de dirección sigue funcionando como texto libre sin sugerencias — es el fallback esperado, no un error.

## Cómo probar el flujo manualmente

No hay test automatizado en este repo (ver `plan.md`, Technical Context) — la verificación es manual + `next build`.

1. **Selección de sugerencia**: en `/proveedores`, escribir una dirección real de Argentina en el campo de dirección y elegir una sugerencia. Confirmar (con las devtools, inspeccionando el body del POST a `/api/provider`, o con un `console.log` temporal) que viajan `latitude`, `longitude`, `locality`, `province`.
2. **Edición después de seleccionar**: elegir una sugerencia y después agregar texto a mano al final de la dirección (ej. un número de depto). Confirmar que el geocode se invalida — no debe viajar `latitude`/`longitude` en el submit si el texto cambió después de la selección.
3. **Sin seleccionar sugerencia**: escribir una dirección a mano sin clickear ninguna sugerencia, y enviar el formulario. Confirmar que el envío se completa igual (sin bloquear) y sin los campos de geocode.
4. **Sin `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`**: correr el dev server sin la variable seteada. Confirmar que el campo de dirección sigue aceptando texto libre y el formulario se puede enviar igual.
5. **Horarios y modalidad**: completar y dejar vacíos por separado — en ambos casos el formulario debe permitir el envío (son opcionales, ver `research.md` Decisión 5).
6. **Gate de la constitución**: `npm run build` debe terminar sin errores de TypeScript ni de ESLint antes de dar el trabajo por terminado.

## Dónde mirar si algo no encaja

- Patrón de referencia para Places: `components/quote-flow/use-quote-flow.ts` (antes de este trabajo) / `lib/google-places.ts` (después, una vez hecha la extracción).
- Contrato con el backend: `contracts/partner-application-submission.md` — si el submit falla con 400 para los campos nuevos, es porque el backend todavía no los acepta (trabajo aparte en `autolibre-backend-hex`, no de este repo).
