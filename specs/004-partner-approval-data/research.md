# Phase 0 Research: Completar los datos del partner que hoy se cargan a mano después de aprobar

No quedaron `NEEDS CLARIFICATION` en el Technical Context del plan — se resolvieron durante `/speckit.specify` y `/speckit.clarify`. Este documento registra las decisiones técnicas tomadas para pasar del spec al diseño (Phase 1).

## Decisión 1: Reusar el patrón de Places de `use-quote-flow.ts`, no reinventar la integración

**Decision**: El input de dirección de `provider-form.tsx` usa `google.maps.places.Autocomplete` con `componentRestrictions: { country: "ar" }` y `types: ["address"]` (en vez de `["(regions)"]`, que usa el flujo de presupuesto), reusando el resto del patrón tal cual: carga del script vía `next/script` con `strategy="afterInteractive"`, extracción de `address_components` con una función `findAddressComponent`, y limpieza del geocode capturado si la persona edita el texto después de elegir una sugerencia.

**Rationale**: Es un patrón ya en producción en este mismo repo (`components/quote-flow/use-quote-flow.ts:245-277`, `434-439`) que resuelve exactamente los mismos problemas que este ticket plantea (fallback sin key, limpieza al editar, restricción a Argentina). Reimplementarlo desde cero arriesgaría reintroducir bugs ya resueltos ahí (por ejemplo, no limpiar `.pac-container` al desmontar, o no invalidar el geocode al editar el texto).

**Alternatives considered**:
- Construir una integración nueva desde cero para el form de proveedores — rechazado, duplica trabajo ya hecho y probado.
- Pedir solo geocoding por API REST sin autocompletado de UI — rechazado, el ticket pide explícitamente el mismo tipo de UX que el modal (sugerencias mientras se escribe), no un geocoder silencioso.

## Decisión 2: Extraer la lógica de Places a un módulo compartido (`lib/google-places.ts`)

**Decision**: Mover de `use-quote-flow.ts` a un nuevo `lib/google-places.ts` las piezas que no dependen del flujo de presupuesto: el `declare global { interface Window { google?: ... } }`, los tipos `GoogleAddressComponent`/`GooglePlaceResult`, `PlaceGeo`, `EMPTY_GEO`, `findAddressComponent`, y la constante `GOOGLE_MAPS_API_KEY`. `use-quote-flow.ts` pasa a importarlos desde ahí en vez de declararlos. `provider-form.tsx` (o un hook propio, ver Decisión 3) importa del mismo lugar.

**Rationale**: Sin esto, `provider-form.tsx` necesitaría su propio `declare global` para `window.google` — dos declaraciones globales del mismo tipo en el mismo proyecto TypeScript son redundantes y quedan libradas a que alguien las mantenga sincronizadas a mano si Google cambia la forma de la respuesta. Ya existe un solo lugar donde se resolvió esto una vez; que siga siendo uno solo.

**Alternatives considered**:
- Duplicar los ~80 líneas de tipos y helpers dentro de `provider-form.tsx` — rechazado, es exactamente el tipo de divergencia que el propio código de este repo evita en otros lados (ver el comentario de `provider-form.tsx` sobre por qué los servicios dejaron de tener su propio vocabulario).
- Importar directamente desde `components/quote-flow` (que ya exporta `PlaceGeo`, `EMPTY_GEO`, `GOOGLE_MAPS_API_KEY` en su `index.ts`) — rechazado como dependencia de largo plazo: acoplaría el formulario de proveedores a un módulo pensado y nombrado para el flujo de presupuesto (`findAddressComponent` ni siquiera está exportado ahí hoy), en vez de a un módulo neutral. La extracción a `lib/` dejaría además a `quote-flow` re-exportando desde `lib/google-places.ts` para no romper su `index.ts` público.

## Decisión 3: Autocomplete para proveedores vive en un hook propio, no en `useQuoteFlow`

**Decision**: La lógica de attachear el Autocomplete al input de dirección de `provider-form.tsx` se implementa como su propio hook pequeño (o efecto local dentro del componente) — no se reusa `useQuoteFlow`, que trae consigo estado y pasos ajenos a este formulario (patente, WhatsApp, pasos 1-4, etc.).

**Rationale**: `useQuoteFlow` es un controlador de flujo de varios pasos específico del modal de presupuesto; usarlo acá para un solo campo de un formulario de una sola pantalla traería una superficie enorme de estado no usado. Lo que se reusa es el módulo de la Decisión 2, no el hook completo.

**Alternatives considered**: Generalizar `useQuoteFlow` para que sirva ambos casos — rechazado, sería una abstracción prematura para dos consumidores con formas muy distintas (modal de 4 pasos vs. campo suelto en un formulario largo de una sola pantalla).

## Decisión 4: `coverage_zone` se deriva en el backend, no en este repo

**Decision**: Este repo manda `locality`/`province` (ya extraídos por `findAddressComponent`) como parte del body de `POST /api/v1/partner-applications`. La derivación de `coverage_zone` a partir de esos valores es responsabilidad del backend (`autolibre-backend-hex`), no de este repo.

**Rationale**: Este repo no tiene visibilidad de si existe una taxonomía de zonas a validar contra — eso vive en el dominio del backend. El precedente de `use-quote-flow.ts` (zona capturada como string libre vía Places, sin matching) sugiere que no hay tal taxonomía cerrada hoy, pero esa es una confirmación que le corresponde al equipo de backend, no algo para inventar acá.

**Alternatives considered**: Derivar `coverage_zone` en el frontend y mandarlo como campo propio — rechazado, invertiría la fuente de verdad: si el backend después decide una regla distinta de derivación (por ejemplo, agrupar varias localidades bajo una zona), este repo quedaría mandando un valor que contradice esa regla en vez de dejar que el backend la aplique una sola vez.

## Decisión 5: Horarios y modalidad se piden pero no bloquean el envío

**Decision**: Los campos de horarios (texto libre, ej. "Lun a Vie 9 a 18hs") y modalidad (`en_local` / `a_domicilio` / `ambas`) se agregan al formulario como opcionales — se piden, pero no tienen `required` ni bloquean el submit si quedan vacíos.

**Rationale**: Es el mismo patrón que el propio formulario ya usa para el catálogo de servicios caído (degrada, no bloquea) — perder un taller que se estaba anotando por un campo secundario sin completar es peor que recibirlo incompleto. El spec (FR-008) pide que el form "los pida", no que los exija.

**Alternatives considered**: Marcarlos `required` — rechazado, el spec no lo exige y contradice el patrón de fricción mínima que el propio comentario de `provider-form.tsx` documenta como decisión deliberada para otros campos.

## Decisión 6: Horarios como texto libre, no un picker estructurado de día/horario

**Decision**: El campo de horarios es un único input de texto libre, no una grilla de día-por-día con rangos horarios.

**Rationale**: AUT-119 (mostrar los horarios junto a la cotización) es el único consumidor mencionado en el ticket, y no hay en este repo ningún componente de horario estructurado existente para reusar. Construir un picker estructurado sin que AUT-119 haya definido cómo necesita consumir el dato sería diseñar una UI para un contrato que todavía no existe.

**Alternatives considered**: Estructura `{ day, opensAt, closesAt }[]` — rechazado por ahora; si AUT-119 termina necesitando datos estructurados, es una migración de este mismo campo, no un bloqueante para este ticket.
