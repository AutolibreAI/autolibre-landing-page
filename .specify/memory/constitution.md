<!--
SYNC IMPACT REPORT
==================
Version change: [placeholder] → 1.0.0
Added sections:
  - Core Principles (I–V)
  - Technology Stack
  - Development Workflow
  - Governance
Modified principles: N/A (initial ratification)
Removed sections: all placeholder tokens replaced
Templates checked:
  - .specify/templates/plan-template.md ✅ aligned (Constitution Check section present)
  - .specify/templates/spec-template.md ✅ aligned (user stories, requirements structure compatible)
  - .specify/templates/tasks-template.md ✅ aligned (phase-based structure compatible)
Follow-up TODOs: none
-->

# Autolibre Landing Page Constitution

## Core Principles

### I. Next.js App Router First

All routing, layouts, and pages MUST use the App Router (`app/` directory). The Pages Router (`pages/`) is prohibited. React Server Components are the default rendering mode; `"use client"` is used only where interactivity strictly requires it (forms, state, event handlers). No mixing of rendering strategies within a single component tree without explicit justification.

**Rationale**: App Router enables granular server/client boundaries, streaming, and built-in metadata APIs — critical for a performance-focused landing page.

### II. Content-Driven Architecture

All user-visible copy — headings, body text, CTAs, labels, metadata, and alt text — MUST reside in the content layer (`lib/landing-content.ts`). Component files MUST NOT contain hardcoded strings. Types for content structures MUST be declared in `lib/landing-types.ts` and kept in sync with the content layer.

**Rationale**: A single source of truth for copy enables fast iteration on messaging without touching component logic, and makes A/B testing and localization tractable.

### III. Typed Component Contracts

Every component MUST accept all its data via explicitly typed props derived from `lib/landing-types.ts`. The TypeScript `strict` compiler flag MUST remain enabled. The `any` type is prohibited. Inline type assertions (`as`) require a justifying comment.

**Rationale**: Strict typing prevents silent content mismatches and makes refactors safe across the content layer and component tree simultaneously.

### IV. Accessibility and Performance (NON-NEGOTIABLE)

Every page element MUST meet WCAG 2.1 AA. All images MUST use `next/image` with explicit `width`, `height`, and meaningful `alt` text. Core Web Vitals targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms. No layout shifts caused by late-loading fonts or images.

**Rationale**: Accessibility is a baseline requirement, not a polish step. Performance directly affects conversion on a landing page.

### V. Section Isolation

Each landing page section is a self-contained component under `components/landing/`. Sections MUST NOT import from one another. Shared primitives live in `components/ui/`. Utility functions live in `lib/utils.ts`. Cross-cutting concerns (e.g., analytics events) are injected via props or context, never imported directly from section components.

**Rationale**: Section isolation allows individual sections to be developed, tested, and replaced independently without risk of cascading regressions.

## Technology Stack

- **Framework**: Next.js 16.x (App Router, TypeScript)
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with `tw-animate-css` for motion; class management via `clsx` + `tailwind-merge`
- **Icons**: `lucide-react` exclusively — no other icon libraries
- **Language**: TypeScript 5 in strict mode
- **Runtime**: React 19 (Server Components default)
- **Linting**: ESLint with `eslint-config-next`

No new runtime dependencies may be added without updating this section and providing a rationale in the PR description.

## Development Workflow

- Features are specified under `specs/` before implementation begins.
- All new sections or components MUST have a corresponding spec.
- Content changes (copy, CTAs, metadata) do not require a spec — they go directly via `lib/landing-content.ts`.
- The `next build` MUST succeed with zero TypeScript errors and zero ESLint errors before any PR is merged.
- No `// @ts-ignore` or `// eslint-disable` suppressions without a comment explaining the root cause and a linked issue or TODO.

## Governance

This constitution supersedes all implicit conventions. Any amendment requires:

1. A pull request updating this file with a version bump following semantic versioning:
   - **MAJOR**: removal or redefinition of a principle
   - **MINOR**: new principle or mandatory section added
   - **PATCH**: clarification, wording fix, non-semantic refinement
2. The PR description MUST include the amended Sync Impact Report block.
3. Compliance with this constitution is verified during code review. Reviewers MUST reject PRs that violate principles without documented justification.

For runtime development guidance, refer to `.specify/` workflow docs and AGENTS.md.

**Version**: 1.0.0 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-05-12
