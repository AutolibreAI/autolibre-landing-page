# Data Model: Coming Soon Landing

## Overview

La feature no requiere persistencia de datos. El modelo se centra en entidades de presentación para estructurar y validar la paridad visual.

## Entities

### LandingPageReference

- **Description**: Fuente aprobada de contenido y estilo usada como baseline de comparación.
- **Fields**:
  - `sourceFilePath` (string, required): Ruta del template de referencia.
  - `requiredSections` (string[], required): IDs/secciones obligatorias.
  - `visualCheckpoints` (string[], required): Criterios de comparación visual.
- **Validation Rules**:
  - Debe existir al menos una sección requerida.
  - Debe existir al menos un checkpoint visual.

### LandingSection

- **Description**: Unidad de composición de la landing (hero, formulario/CTA, verticales, footer).
- **Fields**:
  - `sectionId` (string, required): Identificador estable.
  - `orderIndex` (number, required): Posición en el flujo de lectura.
  - `headline` (string, optional): Título visible de sección.
  - `bodyCopy` (string, optional): Texto descriptivo.
  - `primaryAction` (PrimaryAction, optional): Acción principal dentro de la sección.
  - `isVisibleOnMobile` (boolean, required): Visibilidad en viewport móvil.
  - `isVisibleOnDesktop` (boolean, required): Visibilidad en viewport desktop.
- **Validation Rules**:
  - `sectionId` debe ser único en la página.
  - `orderIndex` no puede repetirse.
  - Al menos una sección debe incluir `primaryAction`.

### PrimaryAction

- **Description**: Acción principal que guía al usuario desde la landing.
- **Fields**:
  - `label` (string, required): Texto de botón/enlace.
  - `destinationType` (enum: internal-anchor | internal-route | external-url, required)
  - `destinationValue` (string, required): Objetivo de navegación.
  - `isProminent` (boolean, required): Debe ser visualmente destacada.
- **Validation Rules**:
  - `label` no puede estar vacío.
  - `destinationValue` debe existir y ser válido según `destinationType`.

## Relationships

- `LandingPageReference` 1 -> N `LandingSection`
- `LandingSection` 0..1 -> 1 `PrimaryAction`

## State Considerations

- El estado de la página es estático en esta fase.
- No hay transiciones de negocio persistentes.
- Solo aplica estado de interacción visual (hover/focus/active) para componentes UI.
