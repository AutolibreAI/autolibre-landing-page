# Tasks: Completar los datos del partner que hoy se cargan a mano después de aprobar

**Input**: Design documents from `/specs/004-partner-approval-data/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: No se generaron tareas de test — este repo no tiene framework de test automatizado (ver plan.md, Technical Context) y no se pidió TDD. La verificación es `next build` + los pasos manuales de `quickstart.md`.

**Alcance real**: este repo (`autolibre-landing-page`) solo implementa la parte cliente. De las 3 historias del spec:
- **US1** (P1, dirección con Places) — se implementa acá, completa.
- **US2** (P1, transferir datos al aprobar) — vive en `autolibre-backend-hex` (repo separado); acá solo queda el contrato documentado.
- **US3** (P2, orden por cercanía) — el ordenamiento por Haversine ya existe en el backend; no requiere cambios en este repo, queda validado una vez que US1 (acá) y US2 (backend) estén.

Los campos de horarios y modalidad (FR-008/FR-010) no tienen una historia numerada propia en spec.md — se agrupan bajo **US1**, porque se capturan en la misma pantalla y el mismo submit que la dirección.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencias entre sí)
- **[Story]**: A qué historia de usuario pertenece (US1, US2, US3)

---

## Phase 1: Setup

- [X] T001 Revisar `node_modules/next/dist/docs/01-app/` (Route Handlers, Client Components) por cambios que afecten a `app/api/provider/route.ts` o `components/forms/provider-form.tsx`, por el aviso de `AGENTS.md` de que esta versión de Next.js rompe con lo esperado — hacerlo antes de tocar código

---

## Phase 2: Foundational (bloqueante para US1)

**Propósito**: mover la lógica de Google Places hoy privada en `use-quote-flow.ts` a un módulo compartido, sin romper el flujo de presupuesto existente. Ver `research.md`, Decisión 2.

- [X] T002 Crear `lib/google-places.ts` moviendo desde `components/quote-flow/use-quote-flow.ts`: la declaración global `Window.google`, los tipos `GoogleAddressComponent`/`GooglePlaceResult`, `PlaceGeo`, `EMPTY_GEO`, `findAddressComponent` y `GOOGLE_MAPS_API_KEY` — sin cambiar su comportamiento
- [X] T003 Actualizar `components/quote-flow/use-quote-flow.ts` para importar `PlaceGeo`, `EMPTY_GEO`, `GOOGLE_MAPS_API_KEY` y `findAddressComponent` desde `@/lib/google-places` en vez de declararlos localmente, re-exportando los mismos nombres para que `components/quote-flow/index.ts` no necesite cambios (depende de T002)
- [X] T004 Probar a mano el modal de pedido de presupuesto (seleccionar sugerencia, editar la dirección, enviar) para confirmar que no hay regresión después del refactor (depende de T003) — verificado por el usuario con backend local corriendo: `POST /api/v1/quote-requests` respondió `201`, submit exitoso, sin regresión del refactor de `use-quote-flow.ts`

**Checkpoint**: módulo compartido listo, flujo de presupuesto sin regresiones.

---

## Phase 3: User Story 1 (P1) — Dirección con Places + horarios + modalidad 🎯 MVP

**Goal**: el formulario de `/proveedores` captura la dirección con autocompletado de Google Places (direcciones puntuales, con geocode real), más horarios y modalidad de atención, y manda todo eso al backend.

**Independent Test**: completar el formulario de proveedores, seleccionar una sugerencia de dirección, completar (u omitir) horarios/modalidad, y verificar en el body del POST a `/api/provider` que viajan `latitude`, `longitude`, `locality`, `province`, `hours` y `modality` según corresponda — sin que el flujo de aprobación exista todavía.

### Implementation

- [X] T005 [P] [US1] Agregar a `lib/content/providers.ts` el copy nuevo (texto de ayuda del campo de dirección, label/placeholder de horarios, labels de las opciones de modalidad), siguiendo el Principio II de la constitución — nada hardcodeado en el componente
- [X] T006 [P] [US1] Extender `PartnerApplicationSubmission` en `lib/autolibre-api.ts` con los campos opcionales `latitude`, `longitude`, `locality`, `province`, `hours`, `modality?: "en_local" | "a_domicilio" | "ambas"`, según `data-model.md`
- [X] T007 [US1] En `components/forms/provider-form.tsx`, cargar el script de Google Maps (`next/script`, `id="google-maps-places"`, `strategy="afterInteractive"`, mismo `src` que `components/quote-flow/quote-flow.tsx`), condicionado a `GOOGLE_MAPS_API_KEY` importado de `@/lib/google-places` (depende de T002)
- [X] T008 [US1] En `components/forms/provider-form.tsx`, enganchar `google.maps.places.Autocomplete` al input `prov-address` con `componentRestrictions: { country: "ar" }` y `types: ["address"]` (no `"(regions)"`), extrayendo el geocode con `findAddressComponent` de `@/lib/google-places`. **Regla del contrato**: si `address_components` no trae `locality` (ni `sublocality` como fallback) o `administrative_area_level_1`, tratar el resultado completo como `EMPTY_GEO` — nunca guardar lat/lng sin localidad/provincia, ni viceversa (depende de T007)
- [X] T009 [US1] En `components/forms/provider-form.tsx`, resetear el geocode capturado a `EMPTY_GEO` cada vez que se edita el texto de dirección después de haber seleccionado una sugerencia — mismo comportamiento que `setAddress` en `components/quote-flow/use-quote-flow.ts` (depende de T008)
- [X] T010 [US1] Agregar los campos de horarios (texto libre) y modalidad al formulario en `components/forms/provider-form.tsx`, reusando los primitivos `Field`/`Input`/`ChoiceRow` ya usados en el resto del form. Modalidad es de **selección única** (`en_local`/`a_domicilio`/`ambas`, un solo valor, no un array) — usar `ChoiceRow type="radio"`, mismo patrón que el grupo `brand_specialized` más arriba en el mismo archivo, no checkboxes. Ambos campos opcionales, sin bloquear el envío (research.md, Decisión 5)
- [X] T011 [US1] Actualizar `handleSubmit` en `components/forms/provider-form.tsx` para incluir `latitude`, `longitude`, `locality`, `province`, `hours`, `modality` en el body del POST a `/api/provider`, omitiendo por completo los cuatro campos de geocode cuando el estado sigue en `EMPTY_GEO` (depende de T009, T010)
- [X] T012 [US1] Actualizar `app/api/provider/route.ts` para leer y reenviar los campos nuevos (`latitude`, `longitude`, `locality`, `province`, `hours`, `modality`) a `submitPartnerApplication`, con el mismo estilo de coerción opcional (`asOptionalString`) que ya usa el archivo, sin marcar ninguno como obligatorio (depende de T006, T011)
- [X] T013 [US1] Revisar accesibilidad de los campos nuevos/modificados: el input de dirección conserva `<label>`/`htmlFor`, los controles de horarios/modalidad son alcanzables por teclado y tienen label asociado — sin regresión de WCAG 2.1 AA (depende de T010)

**Checkpoint**: US1 completa y testeable de forma independiente siguiendo los pasos 1-5 de `quickstart.md`.

---

## Phase 4: User Story 2 (P1) — Transferir los datos al aprobar

**Nota de alcance**: sin tareas de implementación en este repo. El trabajo (columnas nuevas en `partner_applications`, actualizar `approve_partner_application()`, derivar `coverage_zone`) vive en `autolibre-backend-hex`, repo separado no incluido en este working directory.

- [ ] T014 [US2] Compartir `contracts/partner-application-submission.md` con el equipo de backend (o abrir el ticket correspondiente en `autolibre-backend-hex`) una vez que la forma real del payload esté cerrada en T012 (depende de T012)

---

## Phase 5: User Story 3 (P2) — Orden por cercanía real

**Nota de alcance**: sin tareas de implementación en este repo. El ordenamiento por Haversine ya existe en el backend (según el ticket AUT-81); queda validado automáticamente una vez que existan partners con geo (US1 + US2), sin cambios acá.

---

## Phase 6: Polish & Cross-Cutting

- [X] T015 [P] Correr `npm run build` y confirmar cero errores de TypeScript y de ESLint (gate de la constitución)
- [X] T016 Recorrer a mano los pasos 1-6 de `quickstart.md` sobre `/proveedores` — verificado por el usuario con backend local corriendo: seleccionó una sugerencia real de Places, el geocode (`latitude`/`longitude`/`locality`/`province`) llegó correcto al backend y pasó su validación sin error. `hours`/`modality` rechazados por el backend (esperado, ver contracts/ — falta el lado de `autolibre-backend-hex`)

---

## Dependencies & Execution Order

- **Setup (Phase 1)**: sin dependencias, arranca de inmediato.
- **Foundational (Phase 2)**: depende de Setup. Bloquea toda la Phase 3 (US1 necesita `lib/google-places.ts`).
- **US1 (Phase 3)**: depende de Foundational. Es la única historia con código en este repo.
- **US2 (Phase 4)**: depende de que T012 (US1) defina la forma final del payload — no tiene código propio.
- **US3 (Phase 5)**: sin tareas — depende conceptualmente de US1 + US2, pero nada que hacer acá.
- **Polish (Phase 6)**: depende de que Phase 3 esté completa.

### Dentro de US1

T005 y T006 son paralelizables entre sí (archivos distintos, sin dependencia mutua). T007→T008→T009 son secuenciales (mismo archivo, cada paso depende del anterior). T010 puede hacerse en paralelo con T007-T009 (misma componente pero secciones de formulario independientes; ojo al mergear). T011 depende de que T009 y T010 estén. T012 depende de T006 y T011. T013 depende de T010.

---

## Parallel Example: Foundational + arranque de US1

```bash
# Foundational, en orden (mismo archivo/dependencia real):
Task: "T002 Crear lib/google-places.ts"
Task: "T003 Actualizar use-quote-flow.ts para importar desde lib/google-places.ts"

# Una vez lista Phase 2, estos dos de US1 en paralelo:
Task: "T005 Agregar copy nuevo a lib/content/providers.ts"
Task: "T006 Extender PartnerApplicationSubmission en lib/autolibre-api.ts"
```

---

## Implementation Strategy

### MVP

1. Phase 1 (Setup) → Phase 2 (Foundational, módulo de Places) → Phase 3 (US1).
2. **Parar y validar**: correr `quickstart.md` completo sobre US1 antes de tocar nada del lado del backend.
3. Con US1 mergeado y el contrato (`contracts/partner-application-submission.md`) compartido (T014), el trabajo de backend (US2) puede arrancar en paralelo en el otro repo — no bloquea el cierre de este.

### Notas

- No hay trabajo de US2/US3 que hacer en este repo — no inventar tareas ahí solo para llenar la sección.
- Confirmar en T014 el nombre exacto que el backend le va a dar al enum de `modality` antes de considerar el contrato "cerrado" (pregunta abierta en `contracts/partner-application-submission.md`).
