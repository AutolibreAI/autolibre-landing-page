---
description: "Task list for AutoLibreAI Landing Page — Next.js Best Practices"
---

# Tasks: AutoLibreAI Landing Page — Next.js Best Practices

**Input**: Design documents from `specs/002-autolibre-landing/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)
- File paths are included in every implementation task

---

## Phase 1: Setup (Shared Configuration)

**Purpose**: Fix shared infrastructure that is a prerequisite for all user stories. These are zero-behavior-change tasks — they unblock image optimization, type safety, and lint cleanliness across the entire codebase.

- [x] T001 [P] Remove unused `Zap` import from `app/page.tsx` (line 2)
- [x] T002 [P] Add `export` keyword to all named types in `lib/landing-types.ts` (`PrimaryAction`, `BenefitItem`, `VerticalItem`, `SocialLink`, `VisualCheckpoint`, `HeroContent`, `FormSectionContent`, `VerticalsSectionContent`, `FinalCtaContent`, `FooterContent`, `ProblemItem`, `ProblemSectionContent`, `FAQItem`, `FAQSectionContent`, `ChatConfig`, `LandingSections`, `LandingBrand`)
- [x] T003 [P] Add `images.remotePatterns` to `next.config.ts` for hostname `hebbkx1anhila5yf.public.blob.vercel-storage.com` so `next/image` can serve the external hero image

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Site-wide fixes that must land before user story work can be validated. Affects every section simultaneously.

**⚠️ CRITICAL**: No user story validation can be done until this phase is complete.

- [x] T004 [P] Change `lang="en"` to `lang="es"` on the `<html>` element in `app/layout.tsx` — the entire page is in Spanish (Argentine Spanish)
- [x] T005 [P] Restore eyebrow rendering in `components/landing/brand-heading.tsx` — uncomment the `<p className="al-eyebrow">{eyebrow}</p>` line (currently suppressed at line 24); the `eyebrow` prop is passed by every section caller
- [x] T006 Remove `border-top: 1px solid rgba(0, 255, 255, 0.1)` from the `.al-section-problem` rule in `app/globals.css` — this line creates the visible cyan color gap above the "Tu auto tiene datos. Ahora son accesibles." heading; keep `border-bottom`

**Checkpoint**: Foundation complete — section eyebrows visible, color gap removed, image config ready. User story phases can now begin.

---

## Phase 3: User Story 1 — Discover Value Proposition (Priority: P1) 🎯 MVP

**Goal**: Visitor lands on the page, sees the hero above the fold, reads the product name and description, scrolls through consistently branded sections, and understands AutoLibreAI within 10 seconds.

**Independent Test**: Open `http://localhost:3000` in a browser with no prior knowledge. Verify: (1) hero loads with product name and description above the fold; (2) no cyan gap above the problem section; (3) eyebrow labels visible in each section; (4) nav renders from `LandingNav` component; (5) `npm run lint` reports 0 warnings.

### Implementation for User Story 1

- [x] T007 [P] [US1] Create `components/landing/landing-nav.tsx` — extract the entire `<div className="al-nav-shell">...<header className="al-nav">...</header></div>` block currently inline in `app/page.tsx` (lines 16–35) into a Server Component; props: `{ brand: LandingPageContent["brand"] }`; import `Image` from `next/image` and `Link` from `next/link`
- [x] T008 [US1] Replace the inline nav block in `app/page.tsx` with `<LandingNav brand={landingPageContent.brand} />`; add import for `LandingNav` from `@/components/landing/landing-nav`; remove the now-redundant `Link` import if no longer used elsewhere in the file
- [x] T009 [P] [US1] In the new `components/landing/landing-nav.tsx`: replace `<img src="/autolibre-favicon.png" alt="" />` with `<Image src="/autolibre-favicon.png" alt="" width={18} height={18} />` using `next/image` — this is a local `/public` asset, no remote pattern needed
- [x] T010 [US1] In `components/landing/hero-section.tsx`: replace the raw `<img src="https://hebbkx1anhila5yf..." className="al-preview-image" />` with `<Image src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/app%20sin%20fondo%20HD.png-den0XAYw6LBc5IeDq0PPsTFQaL9FM1.jpeg" alt="" fill sizes="(max-width: 980px) 100vw, 280px" className="al-preview-image" style={{ mixBlendMode: "screen", objectFit: "contain" }} />` — wrap in a `<div style={{ position: "relative" }}>` if needed for `fill` to work; depends on T003
- [x] T011 [US1] In `components/landing/hero-section.tsx`: remove the `"use client"` directive at line 1; remove the `useMemo` import; replace `const initials = useMemo((): readonly string[] => ["MR", "CA", "LF", "AG", "+96"], [])` with module-scope `const PROOF_INITIALS = ["MR", "CA", "LF", "AG", "+96"] as const`; update the JSX to use `PROOF_INITIALS`; component becomes a Server Component — depends on T010

**Checkpoint**: User Story 1 fully functional — hero renders as Server Component, nav extracted, images optimized, no lint warnings for these files.

---

## Phase 4: User Story 2 — Register for Early Access (Priority: P2)

**Goal**: Visitor finds the form, fills in valid email, submits, sees confirmation. Edge cases: duplicate email → "already on list" message; backend failure → inline error + "Try again"; bot submission → silently rejected via honeypot.

**Independent Test**: Open `http://localhost:3000#form-section`. Test: (1) valid email → success message; (2) invalid email → field-level error; (3) same email twice → "already on the list" message; (4) add `data-testid="honeypot"` check — honeypot field must be hidden and empty on submit; (5) simulate backend error → inline error + "Try again" appears, email preserved.

### Implementation for User Story 2

- [x] T012 [P] [US2] Add honeypot hidden input to the form in `components/landing/form-section.tsx` — add `<input type="text" name="_hp_email" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }} />` inside `<form>` before the submit button; add `honeypot` field to the form state and check it on submit — if non-empty, call `setSubmitted(true)` silently without actually submitting
- [x] T013 [US2] Add duplicate email detection to `components/landing/form-section.tsx` — add `isDuplicate: boolean` state; in `handleSubmit`, after validation, check if submitted email is already registered (simulate with a hardcoded set or a `Set` in state); if duplicate, set `isDuplicate(true)` and render a distinct "¡Ya estás en la lista!" message block instead of the success confirmation; depends on T012
- [x] T014 [US2] Add backend failure state to `components/landing/form-section.tsx` — add `submitError: string | null` state; in `handleSubmit`, wrap the submission in try/catch; on failure set `submitError` with message "Algo salió mal. Por favor intentá de nuevo."; render the error inline below the submit button; add a "Intentar de nuevo" button that clears `submitError` and re-enables the form; ensure the email field value is preserved (do not reset the form on error); depends on T013

**Checkpoint**: User Story 2 independently testable — submit flow, duplicate handling, failure state, and honeypot all work independently of other stories.

---

## Phase 5: User Story 3 — Resolve Questions via FAQ (Priority: P3)

**Goal**: Visitor navigates to the FAQ section, finds answers by expanding items, and can find a contact link in the footer if their question is not answered.

**Independent Test**: Open `http://localhost:3000#faqs`. Verify: (1) first 5 FAQ items visible; (2) clicking an item expands its answer; (3) "Ver más" button reveals remaining items; (4) footer contains a visible contact link (email or social).

### Verification for User Story 3

- [x] T015 [US3] Visual verification — run `npm run dev`, navigate to `#faqs`, confirm: accordion expand/collapse works for all 16 items; "Ver más" / "Ver menos" toggle functions; footer `#footer` contains `contact@autolibre.ai` email link; no console errors related to FAQ or footer components

*Note: `FAQSection` and `LandingFooter` are fully implemented. This task is a validation checkpoint confirming no regression from Phase 2–4 changes.*

**Checkpoint**: User Story 3 independently verified — FAQ and footer contact link work without changes.

---

## Phase 6: User Story 4 — Get Instant Answers via AI Chat (Priority: P4)

**Goal**: Visitor opens the floating AI chat, asks a question, gets a relevant response. When the question cannot be answered, a graceful fallback message with links to FAQ and contact is shown.

**Independent Test**: Open `http://localhost:3000`. Click the chat FAB. Send a question. Verify: (1) a response appears; (2) send a question the bot cannot answer — response shows "No tengo esa respuesta" with links to `#faqs` and `contact@autolibre.ai`; (3) closing the chat does not affect page scroll or layout.

### Implementation for User Story 4

- [x] T016 [US4] Update the fallback response logic in `components/landing/ai-chat-fab.tsx` — replace the hardcoded `assistantMessage.content` string in the `setTimeout` with a response that detects unanswerable queries; for now implement as: all queries return the fallback message `"No tengo esa respuesta, pero podés revisar las <a href='#faqs'>preguntas frecuentes</a> o escribirnos a <a href='mailto:contact@autolibre.ai'>contact@autolibre.ai</a>."` until a real AI integration is wired; render the message content as HTML using `dangerouslySetInnerHTML` only for assistant messages (user messages remain plain text); add appropriate `aria-label` to the link elements

**Checkpoint**: User Story 4 independently testable — chat FAB opens, fallback message with FAQ and contact links renders correctly.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final validation gate — all stories complete, lint clean, types correct.

- [x] T017 [P] Run `npm run lint` from project root — must output `✖ 0 problems (0 errors, 0 warnings)`; fix any remaining issues before marking done
- [x] T018 [P] Run `.\node_modules\.bin\tsc --noEmit` from project root — must output no errors; fix any type errors before marking done
- [x] T019 Visual QA on `npm run dev`: confirm no visible cyan border/gap above the "Tu auto tiene datos. Ahora son accesibles." section heading
- [x] T020 Visual QA on `npm run dev`: confirm eyebrow labels (`AUTO LIBRE AI`, `EL PRODUCTO`, `EARLY ACCESS`, `PREGUNTAS FRECUENTES`) are visible above headings in each section after the T005 fix

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately; T001, T002, T003 fully parallel
- **Foundational (Phase 2)**: No dependencies on Phase 1 — T004, T005 parallel; T006 independent
- **US1 (Phase 3)**: Depends on Phase 2 completion + T003 (for image config)
  - T007, T009 parallel (different files)
  - T008 depends on T007
  - T010 depends on T003
  - T011 depends on T010
- **US2 (Phase 4)**: Independent of US1 — can start after Foundational
  - T012, then T013 (depends T012), then T014 (depends T013)
- **US3 (Phase 5)**: Independent of US1 and US2 — verification only
- **US4 (Phase 6)**: Independent of US1–US3
- **Polish (Phase N)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Depends on Foundational + T003. No dependency on US2/US3/US4.
- **US2 (P2)**: Depends on Foundational only. Independent of US1.
- **US3 (P3)**: No new implementation. Verify after Foundational.
- **US4 (P4)**: Depends on Foundational only. Independent of US1–US3.

### Parallel Opportunities

```bash
# Phase 1 — all parallel:
T001 app/page.tsx (remove import)
T002 lib/landing-types.ts (add exports)
T003 next.config.ts (add remotePatterns)

# Phase 2 — parallel:
T004 app/layout.tsx (lang fix)
T005 components/landing/brand-heading.tsx (eyebrow)
T006 app/globals.css (border-top removal)

# Phase 3 — partial parallel:
T007 components/landing/landing-nav.tsx (new file)
T009 components/landing/landing-nav.tsx (Image in nav) — after T007
T010 components/landing/hero-section.tsx (Image)
T008 app/page.tsx (use LandingNav) — after T007
T011 components/landing/hero-section.tsx (Server Component) — after T010
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T006)
3. Complete Phase 3: User Story 1 (T007–T011)
4. **STOP and VALIDATE**: `npm run lint` → 0 warnings; visual QA on hero + nav + problem section
5. US1 is the visual foundation — all other stories build on top

### Incremental Delivery

1. Setup + Foundational → lint warnings removed, color gap fixed, eyebrows visible
2. US1 → hero + nav optimized; Server Component upgrade; image optimization active
3. US2 → form edge cases complete (duplicate, failure, honeypot)
4. US3 → verified (no code change needed)
5. US4 → chat fallback message wired
6. Polish → full lint + type + visual gate passes

---

## Notes

- `[P]` = task touches a different file from other `[P]` tasks in the same phase — safe to run in parallel
- US3 has no implementation tasks — it was already complete from the original codebase
- The `dangerouslySetInnerHTML` in T016 is scoped to assistant messages only — user input is always rendered as plain text (no XSS risk from user-supplied content)
- T010 uses `fill` layout for `next/image` — the parent container `.al-hero-preview` must have `position: relative` set (it already has `position: relative` via the CSS class)
