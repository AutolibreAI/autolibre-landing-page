<!--
SYNC IMPACT REPORT
==================
Version change: 1.2.1 → 1.2.2 (PATCH: the Clerk scope also covers the registration form `/proveedores/registro/formulario`, spec 212 US3; the indexable `/proveedores/registro` stays Clerk-free)
Previous: 1.2.0 → 1.2.1 (PATCH: the Clerk scope also covers `/proveedores/contratar`, spec 212)
Earlier: 1.1.0 → 1.2.0 (MINOR: Technology Stack gains an authentication entry)
Added sections: none
Modified principles: none
Technology Stack:
  - Added `@clerk/nextjs` 7.x (auth): ONLY for the partner claim-code redemption flow
    (`/proveedores/reclamar`, spec 211). Rationale: the owner logs in with the same
    AutoLibre account (same Clerk instance) that the app, the admin and the backend
    validate; building auth or validating tokens by hand is insecure and duplicates
    Clerk. Scope rule: `<ClerkProvider>` lives in a nested layout of that segment,
    never in `app/layout.tsx`, so indexable pages ship zero Clerk bytes.
Removed sections: none
Templates checked:
  - .specify/templates/plan-template.md ✅ aligned
  - .specify/templates/spec-template.md ✅ aligned
  - .specify/templates/tasks-template.md ✅ aligned
Follow-up TODOs: none.

Previous amendment (1.0.0 → 1.1.0, 2026-09-22): added principles VI–VIII, moved copy to
lib/content/*, removed shadcn/ui, Radix, tw-animate-css and lucide-react from the stack.
-->

# Autolibre Landing Page Constitution

## Core Principles

### I. Next.js App Router First

All routing, layouts, and pages MUST use the App Router (`app/` directory). The Pages Router (`pages/`) is prohibited. React Server Components are the default rendering mode; `"use client"` is used only where interactivity strictly requires it (forms, state, event handlers, browser APIs). The client boundary MUST be pushed to the smallest possible leaf island, receiving server content as `children`/props; an entire section MUST NOT become a client component because of a single interactive element. All indexable content MUST be present in the server-rendered HTML. No mixing of rendering strategies within a single component tree without explicit justification.

**Rationale**: Client components ship less HTML and more JS, hurting LCP/INP and indexing. App Router enables granular server/client boundaries, streaming, and built-in metadata APIs — critical for a performance- and SEO-focused site.

### II. Content-Driven Architecture

All user-visible copy — headings, body text, CTAs, labels, metadata, and alt text — MUST reside in the content layer (`lib/content/*`, one module per page or domain). Component files MUST NOT contain hardcoded strings. Types for content structures MUST be declared in `lib/content/types.ts` (or next to their module) and kept in sync with the content layer. Store URLs, contact data and social links MUST come from `siteConfig` (`lib/seo/config.ts`).

**Rationale**: A single source of truth for copy enables fast iteration on messaging without touching component logic, and makes A/B testing and localization tractable.

### III. Typed Component Contracts

Every component MUST accept all its data via explicitly typed props derived from the content-layer types (`lib/content/types.ts`). The TypeScript `strict` compiler flag MUST remain enabled. The `any` type is prohibited. Inline type assertions (`as`) require a justifying comment.

**Rationale**: Strict typing prevents silent content mismatches and makes refactors safe across the content layer and component tree simultaneously.

### IV. Accessibility and Performance (NON-NEGOTIABLE)

Every page element MUST meet WCAG 2.1 AA. All images MUST use `next/image` with explicit `width`, `height` (or `fill` inside a sized container), `sizes`, and meaningful `alt` text; `preload` is reserved for the LCP image only (`priority` is deprecated since Next.js 16 and MUST NOT be used; when the LCP image varies by viewport, use `loading="eager"` or `fetchPriority="high"` instead). Fonts MUST load through `next/font`. Focus MUST be visible and `prefers-reduced-motion` MUST be respected (sole approved exception: the hero rotating words keep changing with an in-place fade and no displacement, marked `motion-exempt`; see AGENTS.md). Core Web Vitals targets: LCP < 2.5 s, CLS < 0.1, INP < 200 ms. No layout shifts caused by late-loading fonts or images. Heavy client-side libraries require justification.

**Rationale**: Accessibility is a baseline requirement, not a polish step. Performance directly affects conversion on a landing page.

### V. Section Isolation

Each page section is a self-contained component under `components/sections/<page>/` (e.g. `components/sections/home/`, `components/sections/providers/`). Sections MUST NOT import from one another. Shared primitives live in `components/ui/`. Utility functions live in `lib/utils.ts`. Cross-cutting concerns (e.g., analytics events) are injected via props or context, never imported directly from section components.

**Rationale**: Section isolation allows individual sections to be developed, tested, and replaced independently without risk of cascading regressions.

### VI. Semantic HTML & Heading Hierarchy

Every page MUST have exactly one `<h1>` describing its main topic. Headings MUST NOT skip levels, and the heading level is chosen by document outline, never by visual size (size is a class concern; eyebrows are `<p>`). Each `<section>` starts with its own heading linked via `aria-labelledby`. Pages MUST use semantic landmarks (one `<main>`, `<header>`, `<nav>`, `<section>`, `<article>`, `<aside>`, `<footer>`; lists as `<ul>`/`<ol>`, `<a>` for navigation, `<button>` for actions). Reusable heading components MUST take the level as a prop so the page owns the hierarchy. Detailed rules: AGENTS.md § 2.

**Rationale**: Document structure is the primary signal search engines and LLMs use to understand a page, and what assistive technology navigates by.

### VII. SEO & GEO by Default (NON-NEGOTIABLE)

Every page MUST export metadata via `createMetadata()` (`lib/seo/metadata.ts`) with a unique description and canonical path, and MUST render JSON-LD through `<JsonLd>` using the builders in `lib/seo/schema.ts` (at minimum `webPageSchema` + `breadcrumbSchema`, plus type-specific schemas). Every public route MUST be listed in `app/sitemap.ts` and `public/llms.txt`; `app/robots.ts` MUST be reviewed for private routes. Content MUST be factual and citable, with entity names consistent with `siteConfig` and the `Organization` schema. Detailed rules and the per-page checklist: AGENTS.md §§ 5–6.

**Rationale**: Organic search and AI-assistant discovery are the site's main acquisition channels; a page without metadata, structured data and a sitemap entry is effectively invisible.

### VIII. Tailwind v4 Canonical Classes & Design Tokens

Styling MUST use canonical Tailwind scale classes (`w-5`, `max-w-155`) instead of arbitrary values (`w-[20px]`, `max-w-[620px]`). Colors, radii and fonts MUST come from `@theme` tokens in `app/globals.css` (`bg-brand`, `rounded-field`); loose hex values in classes are prohibited. When no equivalent exists, a token is added to `@theme`. Arbitrary values are a last resort and require a justifying comment. Detailed rules: AGENTS.md § 7.

**Rationale**: Canonical classes and tokens keep the design system single-sourced and the stylesheet small and consistent.

## Technology Stack

- **Framework**: Next.js 16.x (App Router, TypeScript)
- **UI**: in-house primitives in `components/ui/` (variants via `class-variance-authority`); no external component library
- **Styling**: Tailwind CSS v4 (CSS-first `@theme` tokens in `app/globals.css`); motion via plain CSS transitions/keyframes; class management via `clsx` + `tailwind-merge`
- **Icons**: inline SVG paths in `components/ui/icon.tsx` — no icon libraries
- **Language**: TypeScript 5 in strict mode
- **Runtime**: React 19 (Server Components default)
- **Linting**: ESLint with `eslint-config-next`
- **Auth**: `@clerk/nextjs` 7.x, scoped to the private partner routes (claim-code redemption `/proveedores/reclamar`, spec 211, plan checkout `/proveedores/contratar`, spec 212, and the noindex registration form `/proveedores/registro/formulario`, spec 212 US3; the indexable `/proveedores/registro` itself MUST stay Clerk-free) via nested layouts that share `components/auth/scoped-clerk-provider.tsx`; MUST NOT be mounted in `app/layout.tsx` or loaded by any indexable page. Rationale: same AutoLibre account (Clerk instance) the app, admin and backend use (spec 211). Its UI strings come from `@clerk/localizations` (`esUY`, voseo), loaded in the same nested layout only

No new runtime dependencies may be added without updating this section and providing a rationale in the PR description.

## Development Workflow

- Features are specified under `specs/` before implementation begins.
- All new sections or components MUST have a corresponding spec.
- Content changes (copy, CTAs, metadata) do not require a spec — they go directly via `lib/content/*` (and `public/llms.txt` when product facts change).
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

**Version**: 1.2.2 | **Ratified**: 2026-05-12 | **Last Amended**: 2026-11-04
