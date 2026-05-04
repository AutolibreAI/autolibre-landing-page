# Research: Coming Soon Landing

## Decision 1: Use Next.js App Router as the page shell

- **Decision**: Implement the landing in `app/page.tsx` with composable presentational sections.
- **Rationale**: The repository is already bootstrapped with Next.js 16 App Router, reducing setup friction and preserving framework conventions.
- **Alternatives considered**:
  - **Pages Router**: Rejected because it diverges from current project baseline.
  - **Single monolithic JSX file**: Rejected because it harms maintainability and testability.

## Decision 2: Build UI blocks using shadcn/ui + custom brand wrappers

- **Decision**: Use shadcn/ui primitives where useful and define AutoLibreAI-specific wrappers for branded blocks (CTA, cards, badges, section headers).
- **Rationale**: Keeps consistency with installed tooling while enabling brand-level customization without duplicating low-level behavior.
- **Alternatives considered**:
  - **Only custom CSS components**: Rejected due to higher maintenance and less reuse.
  - **Only raw shadcn defaults**: Rejected because pixel parity likely needs brand overrides.

## Decision 3: Split page into section components mapped to template anchors

- **Decision**: Create section composition that mirrors template anchors (`hero`, `form-section`, `verticals`, final CTA, footer).
- **Rationale**: Direct mapping to reference simplifies parity validation and future content edits.
- **Alternatives considered**:
  - **Semantic grouping by visual style only**: Rejected; makes one-to-one comparison harder.
  - **One file per tiny atom**: Rejected due to over-fragmentation for current scope.

## Decision 4: Define visual parity by checkpoint list, not subjective review

- **Decision**: Validate with explicit checkpoints (spacing, typography, color, section order, CTA prominence, responsive behavior).
- **Rationale**: Reduces ambiguity and aligns with success criteria in the feature spec.
- **Alternatives considered**:
  - **Only stakeholder eyeballing**: Rejected as inconsistent and hard to reproduce.

## Decision 5: Keep this phase static-first

- **Decision**: Prioritize static rendering and visual fidelity; defer dynamic integrations (analytics, waitlist backend) to future features.
- **Rationale**: Matches current scope and accelerates delivery of a production-ready coming soon page.
- **Alternatives considered**:
  - **Integrate forms/backend now**: Rejected because it expands scope beyond the approved spec.
