# Tasks: Coming Soon Landing

**Input**: Design documents from `/specs/001-coming-soon-landing/`  
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: No se generan tareas de tests automáticos porque no fueron solicitadas explícitamente en la especificación; se incluyen validaciones manuales independientes por historia.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Puede correr en paralelo (archivos distintos, sin dependencia directa)
- **[Story]**: Historia de usuario (`[US1]`, `[US2]`, `[US3]`) para trazabilidad
- Cada tarea incluye ruta de archivo exacta

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Preparar estructura base para implementar la landing con Next.js + shadcn/ui.

- [x] T001 Crear estructura de componentes de landing en `components/landing/` con archivos placeholder `hero-section.tsx`, `form-section.tsx`, `verticals-section.tsx`, `final-cta-section.tsx` y `landing-footer.tsx`
- [x] T002 Crear `lib/landing-content.ts` con tipos y contenido inicial de copy de la landing (headline, subheadline, CTA, secciones)
- [x] T003 [P] Crear `lib/landing-types.ts` con tipos para `LandingSection`, `PrimaryAction` y configuración de checklist visual
- [x] T004 [P] Crear `public/landing/.gitkeep` y documentar convención de assets en `specs/001-coming-soon-landing/quickstart.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Infraestructura base que bloquea todas las historias de usuario hasta completarse.

**⚠️ CRITICAL**: No comenzar trabajo de historias hasta cerrar esta fase.

- [x] T005 Definir tokens base de marca (colores, tipografía, espaciado, efectos) en `app/globals.css` alineados al template de referencia
- [x] T006 [P] Crear componentes UI de marca reutilizables `components/landing/brand-heading.tsx`, `components/landing/brand-button.tsx` y `components/landing/brand-card.tsx`
- [x] T007 [P] Crear `components/landing/section-container.tsx` para layout común de secciones (ancho, paddings, responsive behavior)
- [x] T008 Reemplazar contenido inicial de `app/page.tsx` por composición base de secciones (`hero`, `form-section`, `verticals`, `final-cta`, `footer`) usando componentes de `components/landing/`
- [x] T009 Crear checklist de paridad visual ejecutable manualmente en `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`

**Checkpoint**: Base visual y composición principal listas para implementar historias de usuario.

---

## Phase 3: User Story 1 - Visual parity with reference page (Priority: P1) 🎯 MVP

**Goal**: Lograr paridad visual y estructural con el template final para la landing.

**Independent Test**: Ejecutar `npm run dev`, abrir `/` y validar orden de secciones, jerarquía visual y checkpoints definidos en `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`.

### Implementation for User Story 1

- [x] T010 [P] [US1] Implementar hero pixel-perfect en `components/landing/hero-section.tsx` (estructura, tipografía, gradientes, acciones principales)
- [x] T011 [P] [US1] Implementar bloque principal de formulario/CTA en `components/landing/form-section.tsx` siguiendo la sección `form-section` del template
- [x] T012 [P] [US1] Implementar sección de verticales en `components/landing/verticals-section.tsx` respetando contenido y jerarquía visual de referencia
- [x] T013 [P] [US1] Implementar bloque de cierre y footer en `components/landing/final-cta-section.tsx` y `components/landing/landing-footer.tsx`
- [x] T014 [US1] Integrar assets de referencia (logos, íconos, media) en `public/landing/` y enlazarlos desde componentes de `components/landing/`
- [x] T015 [US1] Ajustar `app/page.tsx` para asegurar orden final y composición exacta de secciones según contrato de UI
- [x] T016 [US1] Registrar resultado de comparación visual (pass/fail por checkpoint) en `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`

**Checkpoint**: US1 funcional de forma independiente con paridad visual aprobable.

---

## Phase 4: User Story 2 - Clear launch expectation and primary call to action (Priority: P2)

**Goal**: Asegurar claridad del mensaje "coming soon" y prominencia de la acción principal.

**Independent Test**: Validar que un usuario nuevo identifica estado "coming soon" y CTA principal en menos de 10 segundos al abrir `/`.

### Implementation for User Story 2

- [x] T017 [P] [US2] Refinar copy de lanzamiento y mensajes clave en `lib/landing-content.ts` para comunicar explícitamente estado "coming soon"
- [x] T018 [US2] Ajustar jerarquía tipográfica y contraste de mensajes principales en `components/landing/hero-section.tsx`
- [x] T019 [US2] Asegurar prominencia visual de CTA primaria y degradar acciones secundarias en `components/landing/brand-button.tsx` y `components/landing/form-section.tsx`
- [x] T020 [US2] Actualizar contrato de contenido y evidencias de validación manual en `specs/001-coming-soon-landing/contracts/landing-page-ui-contract.md`

**Checkpoint**: US2 validable de manera independiente sin depender de funcionalidades futuras.

---

## Phase 5: User Story 3 - Consistent experience across common devices (Priority: P3)

**Goal**: Garantizar experiencia consistente en viewports desktop y mobile.

**Independent Test**: Revisar `/` en viewport móvil y desktop; confirmar ausencia de solapamientos, clipping y texto ilegible.

### Implementation for User Story 3

- [x] T021 [P] [US3] Implementar reglas responsive de layout (breakpoints, paddings, grid/flex) en `components/landing/section-container.tsx` y `app/globals.css`
- [x] T022 [P] [US3] Ajustar comportamiento responsive del hero y bloque CTA en `components/landing/hero-section.tsx` y `components/landing/form-section.tsx`
- [x] T023 [P] [US3] Ajustar comportamiento responsive de verticales y cierre/footer en `components/landing/verticals-section.tsx`, `components/landing/final-cta-section.tsx` y `components/landing/landing-footer.tsx`
- [x] T024 [US3] Definir manejo de fallback de assets no críticos en `components/landing/hero-section.tsx` y `components/landing/verticals-section.tsx`
- [x] T025 [US3] Registrar matriz de validación por viewport en `specs/001-coming-soon-landing/contracts/visual-parity-checklist.md`

**Checkpoint**: US3 completa y testeable de forma independiente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cierre general y verificación transversal.

- [x] T026 [P] Ejecutar revisión de accesibilidad base (alt text, foco teclado, contraste) y aplicar ajustes en `components/landing/*.tsx`
- [x] T027 [P] Limpiar estilos y eliminar código legado/no usado en `app/page.tsx` y `app/globals.css`
- [x] T028 Ejecutar `npm run lint` y resolver hallazgos en archivos modificados del feature
- [x] T029 Actualizar guía operativa final en `specs/001-coming-soon-landing/quickstart.md` con pasos de validación definitivos

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sin dependencias
- **Phase 2 (Foundational)**: Depende de Phase 1 y bloquea todas las historias
- **Phase 3 (US1)**: Depende de Phase 2
- **Phase 4 (US2)**: Depende de Phase 2 y puede apoyarse en componentes construidos en US1
- **Phase 5 (US3)**: Depende de Phase 2 y puede ejecutarse en paralelo con US2
- **Phase 6 (Polish)**: Depende de US1 + US2 + US3 completas

### User Story Dependencies

- **US1 (P1)**: Inicia primero y define el MVP funcional
- **US2 (P2)**: Depende de la estructura base, no bloquea la validación independiente de US1
- **US3 (P3)**: Depende de la estructura base y refuerza calidad cross-device

### Within Each User Story

- Implementar componentes base antes de ajustes globales de composición
- Actualizar contratos/checklists al cerrar cada historia
- Cerrar criterio de prueba independiente antes de pasar a la siguiente prioridad

### Parallel Opportunities

- T003 y T004 en paralelo (Setup)
- T006 y T007 en paralelo (Foundational)
- T010, T011, T012 y T013 en paralelo (US1)
- T021, T022 y T023 en paralelo (US3)
- T026 y T027 en paralelo (Polish)

---

## Parallel Example: User Story 1

```bash
Task: "Implementar hero pixel-perfect en components/landing/hero-section.tsx"
Task: "Implementar bloque principal de formulario/CTA en components/landing/form-section.tsx"
Task: "Implementar sección de verticales en components/landing/verticals-section.tsx"
Task: "Implementar bloque de cierre y footer en components/landing/final-cta-section.tsx y components/landing/landing-footer.tsx"
```

---

## Parallel Example: User Story 3

```bash
Task: "Implementar reglas responsive en components/landing/section-container.tsx y app/globals.css"
Task: "Ajustar responsive de hero y CTA en components/landing/hero-section.tsx y components/landing/form-section.tsx"
Task: "Ajustar responsive de verticales y footer en components/landing/verticals-section.tsx, components/landing/final-cta-section.tsx y components/landing/landing-footer.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Completar Phase 1 y Phase 2
2. Completar US1 (Phase 3)
3. Validar paridad visual y estructura con checklist
4. Presentar demo de MVP

### Incremental Delivery

1. Entregar MVP con US1
2. Incrementar claridad de mensaje/CTA con US2
3. Cerrar robustez responsive con US3
4. Ejecutar polish transversal y lint final

### Parallel Team Strategy

1. Equipo A: base de diseño y tokens (Phase 1-2)
2. Equipo B: implementación de secciones US1 en paralelo por archivo
3. Equipo C: ajustes de mensaje/CTA y responsive (US2-US3) una vez establecida la base

---

## Notes

- Todas las tareas cumplen formato checklist con ID y path explícito
- Tareas marcadas `[P]` son paralelizables por archivo o responsabilidad
- Cada historia mantiene criterio de validación independiente
