# Research: AutoLibreAI Landing Page — Next.js Best Practices Migration

**Branch**: `002-autolibre-landing` | **Date**: 2026-05-12

## 1. Linting Issues — Root Cause Analysis

| File | Line | Issue | Root Cause |
|---|---|---|---|
| `app/page.tsx` | 2 | `Zap` imported but unused | Commented out in JSX at line 19 — was previously the nav icon, replaced by `<img>` |
| `app/page.tsx` | 20 | `<img>` in nav | Favicon image added as raw `<img>` without migrating to `next/image` |
| `components/landing/brand-heading.tsx` | 16 | `eyebrow` destructured but unused | Eyebrow rendering was commented out (line 24) during a refactor and never restored |
| `components/landing/hero-section.tsx` | 57 | `<img>` for hero preview | External blob image added as raw `<img>` — the fastest workaround, never migrated |

**Decision**: Fix all four. No `// eslint-disable` suppressions — underlying issues are all fixable.

## 2. `next/image` Migration

### Local images (nav favicon `/autolibre-favicon.png`)
- Decision: Use `next/image` with `width={18}` `height={18}` and `alt=""` (decorative)
- Rationale: Local images in `/public` are served through Next.js image optimization automatically with no config needed

### External image (hero preview — vercel blob storage)
- Source URL: `https://hebbkx1anhila5yf.public.blob.vercel-storage.com/...`
- Decision: Use `next/image` and add the hostname to `next.config.ts` `images.remotePatterns`
- Pattern: `{ protocol: "https", hostname: "hebbkx1anhila5yf.public.blob.vercel-storage.com" }`
- Rationale: This is the only external image hostname; scoping to exact hostname avoids over-permissive wildcard patterns
- `fill` prop with `sizes` preferred over fixed dimensions since the image is responsive inside a flex container

## 3. Server Component Opportunities

### `hero-section.tsx`
- Current: `"use client"` due to `useMemo(() => ["MR","CA","LF","AG","+96"], [])`
- Finding: A static, never-changing constant array gains nothing from memoisation and does not require client-side rendering
- Decision: Remove `useMemo` + `"use client"`. Declare `const PROOF_INITIALS = ["MR","CA","LF","AG","+96"] as const` at module scope. Component becomes a Server Component.
- Alternatives considered: Keep `"use client"` — rejected because it forces React to ship the component's JS to the browser, harming FCP on the most important section

### `verticals-section.tsx`
- Current: `"use client"` due to `onError` handler on `next/image`
- Finding: `onError` on `next/image` requires a client event handler — this cannot be a Server Component while retaining the fallback
- Decision: Keep `"use client"`. The fallback state is valid interactivity.

### All other section components
- `form-section.tsx`, `faq-section.tsx`, `ai-chat-fab.tsx`: legitimately `"use client"` (state, events)
- `problem-section.tsx`, `brand-heading.tsx`, `brand-card.tsx`, `brand-button.tsx`, `section-container.tsx`, `landing-footer.tsx`, `final-cta-section.tsx`: already Server Components (no `"use client"`)

## 4. Component Modulation

### Nav bar extraction
- Current: The `<header>` nav block (lines 16–35 of `page.tsx`) is inline — a 20-line block with its own brand, icon, badge, and nav links
- Decision: Extract to `components/landing/landing-nav.tsx`
- Props interface: `{ brand: LandingPageContent["brand"] }`; nav links are hardcoded (no content-layer entry yet — acceptable, they're structural, not copy)
- Rationale: Fulfils Constitution Principle V (Section Isolation) and reduces `page.tsx` to pure page orchestration

### `eyebrow` prop in `brand-heading.tsx`
- Current: Prop is accepted, destructured, and commented out in render
- Finding: Every section that uses `BrandHeading` passes `eyebrow` (form, problem, faq, verticals, hero). The prop is in the type. The rendering was suppressed during a visual refactor.
- Decision: Restore the eyebrow render (uncomment line 24). The prop is valid and expected by callers.

## 5. Color Gap — Root Cause

- The problem section (`#problem`) has CSS class `.al-section-problem`:
  ```css
  background: var(--al-surface-dark);           /* #050709 solid */
  border-top: 1px solid rgba(0, 255, 255, 0.1); /* ← the visible gap */
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  ```
- The section directly above it (hero) uses the body's radial-gradient background with no explicit `background` on `.al-section-hero`
- The `border-top` renders as a 1px cyan-tinted line — visually a "color gap" between hero and problem sections
- Decision: Remove `border-top` from `.al-section-problem`. Keep `border-bottom` (it separates problem from form, which has its own background, and that separation is intentional).
- Alternatives: Make border-top transparent — rejected because `border-top: none` is cleaner and achieves the same result without residual CSS

## 6. Other Best-Practice Gaps

| Gap | Fix |
|---|---|
| `lang="en"` in `app/layout.tsx` — site is in Spanish | Change to `lang="es"` |
| `next.config.ts` is empty | Add `images.remotePatterns` for external hero image |
| `landing-types.ts` — inner types not exported | Export all named types so they can be referenced directly in tests or Storybook without re-declaring |
| `VerticalsSection` and `FinalCtaSection` components exist but are not wired in `page.tsx` | Out of scope for this plan — they are valid components pending content/design decision on page structure |
