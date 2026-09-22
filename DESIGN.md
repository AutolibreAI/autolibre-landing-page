---
name: AutoLibre
description: Verde de taller sobre papel blanco — una landing clara, plana y de una sola voz.
colors:
  brand: "#2a8c3a"
  brand-hover: "#23752f"
  brand-soft: "#5fa86b"
  ink: "#1c2b1c"
  surface: "#ffffff"
  surface-muted: "#eaf3ec"
  surface-subtle: "#f7faf8"
  line: "#eaf3ec"
  alert-bg: "#fbe2e2"
  alert-fg: "#c24949"
  danger: "#d20000"
typography:
  display:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4vw, 2.875rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1.5vw, 1.1875rem)"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "DM Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  field: "0.625rem"
  card: "1rem"
  panel: "1.25rem"
  pill: "9999px"
spacing:
  gutter: "6%"
  header: "4.5rem"
  section-sm: "3rem"
  section-md: "4rem"
  section-lg: "5rem"
  section-lg-desktop: "7.5rem"
  touch-min: "2.75rem"
components:
  button-primary:
    backgroundColor: "{colors.brand-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.field}"
    padding: "0.625rem 1.25rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.brand}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.625rem 1.25rem"
  button-inverse:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.625rem 1.25rem"
  card-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  card-elevated:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  input-field:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 0.875rem"
  chip-pill:
    backgroundColor: "{colors.surface-subtle}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 0.875rem"
  store-badge:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.field}"
    padding: "0.75rem 1.25rem"
  store-badge-on-dark:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 1.25rem"
---

# Design System: AutoLibre

## Overview

**Creative North Star: "El taller ordenado"**

AutoLibre is the digital version of a workshop that keeps good records: white
light, clean surfaces, one green tool hanging where you can reach it. The site
is bright by default (`#ffffff` ground, `colorScheme: "light"` fixed at the
root), flat by default, and it earns attention through contrast of tone rather
than through effects. Nothing glows, nothing floats without a reason, nothing
is decorative.

Density is generous but not airy for its own sake: a 6% viewport gutter, a
three-step vertical rhythm on sections, and headings set in Outfit at 700 with a
slight negative tracking so a two-line title reads as one confident block. Body
copy runs in DM Sans at 17–19px with `leading-relaxed` — comfortable at arm's
length on a phone, which is where most of this traffic lives.

The green does the pointing. It is the only saturated hue in the system and it
appears on CTAs, on the focus ring, on the alternating section grounds and on
the isotype — and nowhere else. Depth is carried by tone (white → `#f7faf8` →
`#eaf3ec` → `#1c2b1c`), not by stacking shadows. Where a shadow does appear it
is ink-tinted, large-blurred and vertically offset only: a soft lift, never a
hard edge.

**Key Characteristics:**

- One saturated hue; everything else is a green-tinted neutral.
- Flat by default — borders and tonal steps carry separation, not shadows.
- Two typefaces, strict roles: Outfit for headings, DM Sans for everything else.
- Three radii (10 / 16 / 20px) plus the pill; nothing else.
- Every interactive target reaches 44px, and bottom-anchored rows respect
  `env(safe-area-inset-bottom)`.
- All color comes from the `@theme` block in `app/globals.css`. There is no
  second source of truth.

## Colors

A single workshop green carried across a family of green-tinted neutrals, so
the palette never leaves its own hue.

### Primary

- **Workshop Green** (`brand`): the one saturated color in the system. CTAs,
  the global focus ring, the accent-color of native checkboxes and radios, the
  required-field asterisk, the closing band's ground, and text selection on the
  dark download route. Its scarcity is what makes it read as "act here".
- **Workshop Green Deep** (`brand-hover`): the resting fill of every primary
  CTA (white on it measures 5.74:1, AA for button text; on `brand` it would be
  4.28:1) and the color of small green text. Primary CTAs lighten to `brand`
  on hover (2026-09-22: states swapped on purpose).
- **Meadow Green** (`brand-soft`): the lighter green for grounds and marks that
  sit *on* ink or on the provider band — directional arrows,
  and the focus ring scoped to the dark `/descarga` route.

### Neutral

- **Green-Black Ink** (`ink`): body text on every light ground, and the dark
  ground itself — the diagnostic band, the footer, the phone frame's bezel, the
  store badge on white, and the full-page ground of `/descarga`.
- **Paper** (`surface`): the default page ground. The site is white end to end.
- **Pale Wash** (`surface-muted`): the alternating section ground that gives the
  home page its rhythm without introducing a second hue.
- **Whisper** (`surface-subtle`): inputs, soft cards, unselected pills — the
  lightest possible step off white.
- **Hairline** (`line`): every border and divider. Shares its value with
  Pale Wash on purpose: a border is a wash seen edge-on.

### Tertiary

- **Alert Wash / Alert Ink** (`alert-bg` / `alert-fg`): the only non-green pair
  in the system, reserved for form errors and failed submissions.
- **Danger** (`danger`): destructive and hard-failure signaling only.

### Named Rules

**The Token-Only Rule.** Every color in a component comes from the `@theme`
block in `app/globals.css`. No hex literal, no `rgb()`, no opacity-tinted
one-off hue appears in a component file. Adding a color means adding a token,
and adding a token means it is reused.

**The White-Ground Green Rule.** Workshop Green is a *mark*, not a reading
surface. White on `#2a8c3a` measures 4.28:1, which clears the 3:1 floor for
large text but not the 4.5:1 floor for body copy. A brand-green band may carry
a display heading and white store badges; it may not carry small body copy.
When a whole screen has to go dark, it goes to Green-Black Ink (white on ink
measures ~14.9:1), not to green.

**The Knockout Lockup Rule.** On any brand-green ground the lockup is the
monochrome knockout (`lockup-white.png`). The standard lockups carry a `#20A020`
isotype that measures 1.24:1 on brand green and disappears, splitting the mark
in half. On ink, use `lockup-dark.png`; on white, `lockup-light.png`. See
`public/brand/README.md`.

## Typography

**Display Font:** Outfit (variable, self-hosted via `next/font`, `swap`)
**Body Font:** DM Sans (variable, self-hosted via `next/font`, `swap`)

**Character:** Outfit is geometric and slightly condensed at weight 700 — it
makes short Spanish headlines land like statements. DM Sans underneath is
neutral and quiet, with open counters that hold up at 13px on a phone. The
pairing is deliberately undramatic: the contrast is size and weight, not style.

### Hierarchy

- **Display** (700, `2.75rem` → `3.5rem` → `4rem`, line-height 1.05): reserved
  for a page that *is* its headline — currently only the download route's two
  stacked lines.
- **Headline** (700, `2.25rem` → `2.875rem`, line-height 1.15): the largest
  section heading (`SectionHeading size="lg"`), used for the hero and closing.
- **Title** (700, `1.75rem` → `2.375rem`, line-height 1.15): ordinary section
  headings (`size="sm"` / `"md"`), plus `text-xl` for mobile nav rows.
- **Body** (400, `1.0625rem` → `1.1875rem`, `leading-relaxed`): section
  subtitles and paragraphs, held to roughly 35rem (`max-w-140`) or a
  `Container size="narrow"` at 720px so a line never outruns the eye.
- **Label** (600, `0.8125rem`): field labels, hints, legal links, store-badge
  notes. The smallest step is `0.6875rem`, used only inside the store badge's
  own two-line anatomy.

### Named Rules

**The Two-Role Rule.** Outfit appears on `h1`–`h4` and on short emphatic labels
(field-group titles, mobile nav rows, the store name inside a badge). Everything
that is read as a sentence is DM Sans. There is no third face, and no system
font stack is ever the visible face — both families are self-hosted variable
fonts, and the stack after them is a fallback, not a design.

**The Balanced Heading Rule.** Headings carry `text-wrap: balance` and
`letter-spacing: -0.01em` from the base layer; long subtitles carry
`text-balance` at the call site. A heading is never manually line-broken except
where the break is the composition itself.

**The 16px Input Rule.** Below 900px, `input`, `select` and `textarea` are
forced to 16px. Anything smaller makes iOS zoom the viewport on focus. This is
non-negotiable and lives in the base layer, not in components.

## Layout

The page is a stack of full-bleed horizontal bands. Each band owns its ground
and its vertical rhythm (`Section`, tones `surface` / `muted` / `ink` /
`brand`); the content inside is centered by `Container`.

**Gutter.** A single lateral padding of 6% of the viewport, applied on the outer
element while `max-width` lives on the inner one. Combining them on one node
would compute the 6% against the max-width and choke the content.

**Container widths.** `narrow` 720px (centered prose), `prose` 880px (FAQ and
legal), `content` 1280px (grids and general content), `wide` 1440px (hero,
header, footer, bands), `full` for edge-to-edge.

**Vertical rhythm.** Three section steps: `sm` 3rem → 4rem, `md` 4rem → 6rem,
`lg` 5rem → 7.5rem, with the second value from `md` (768px) up. Sections never
set their own paddings by hand.

**Header.** Sticky, 4.5rem tall, `bg-surface/92` with `backdrop-blur-md` and a
hairline bottom border. `html` carries `scroll-padding-top: 5rem` so an anchor
jump never lands under it.

**Overflow.** `html` carries `overflow-x: hidden` (as the root, it applies to
the viewport) as the safety net against horizontal drag on mobile; `body`
carries `overflow-x: clip` (2026-09-22), which clips without becoming a scroll
container. With `hidden` on `body`, the body turned into a never-scrolling
scrollport and broke everything tied to document scroll: `position: sticky` and
`animation-timeline: view()`. Same rule inside components: to round-clip a
container that holds a `reveal` or a sticky child, use `overflow-clip`, never
`overflow-hidden`.

### Named Rules

**The Six-Percent Gutter Rule.** Horizontal breathing room is always 6% of the
viewport, never a fixed px value. It scales from a 390px phone to a 1440px
desktop without a breakpoint.

**The 44px Touch Rule.** Every link, button and control reaches at least 44px of
touch height, even when its text is 13px — achieved with `min-h-11` plus padding
and absorbed back visually with a negative margin, so the fix costs no layout.
Any row anchored to the bottom of the viewport adds
`pb-[calc(2rem+env(safe-area-inset-bottom))]`; without it, half of a 44px target
falls under the iPhone home indicator and the target fix cancels itself.

## Elevation & Depth

The system is **flat by default**. Separation comes from tone — white,
`surface-subtle`, `surface-muted`, `ink` — and from hairline borders, not from
shadow. A card at rest is a border on white.

Shadow is reserved for objects that are genuinely *lifted off* the page: a modal
over a scrim, the phone mockup's frame, a floating map chip, and the one
`elevated` card variant. Every shadow in the build shares the same grammar: zero
horizontal offset, a large blur, and an ink-tinted (or brand-tinted) rgba —
never black, never a hard offset.

### Shadow Vocabulary

- **Lifted surface** (`box-shadow: 0 20px 50px rgba(28,43,28,0.10)`): the
  `elevated` card variant on a light ground.
- **Overlay** (`box-shadow: 0 20px 50px rgba(28,43,28,0.25)`): the quote modal
  above its scrim.
- **Object** (`box-shadow: 0 30px 70px rgba(28,43,28,0.25)`): the phone frame,
  the only piece of the page that is meant to read as a physical thing.
- **Floating chip, brand** (`box-shadow: 0 6px 18px rgba(42,140,58,0.28)`): the
  selected marketplace chip.
- **Floating chip, neutral** (`box-shadow: 0 4px 14px rgba(28,43,28,0.08)`): the
  unselected marketplace chip.

### Named Rules

**The Flat-By-Default Rule.** A new surface starts with a hairline border on
white. It earns a shadow only by being lifted above the page — an overlay, a
floating object, or a physical mockup. Decorative elevation is not part of this
system.

**The One-Motion Rule.** The home hero (2026-09-22) is the single moving,
expressive moment of the page, and it stays geometric: one continuous
`surface-muted` ground, the slogan as `<h1>`, and right below it — same display
size, in brand green — a word (VTV, Multas, Seguros…) that rises from below
with a small bounce and exits upward, masked by its own line. Next to it, real
app screens cross-fade inside a CSS `PhoneFrame` on their own cycle, not synced
to the words. Its only static ornament (from `xl`) is a thin dotted route in
`brand/60` that runs under the text block and ends in a location pin beside
the phone — "we take you to what you need, near you". No blobs, waves, halos
or gradients — organic shapes read
playful, and this brand sells trust. Motion is CSS only (`transform` and
`opacity`, compositor-friendly) and honors `prefers-reduced-motion`; there is
no pause control by product decision (note: WCAG 2.2.2 asks for one on
autoplay over 5s). No other section adds autoplay motion or decorative shapes.
The only other motion (2026-09-22, product decision): every home section below
the hero reveals as you scroll — each element rises 1.5rem and fades in over
0.7s, once, staggered 90ms by sibling. It is triggered by `revealScript` in
`app/layout.tsx` (an inline IntersectionObserver + Web Animations API, no
React, no hydration) on elements marked with `reveal` or as direct children of
`reveal-group`; `reveal-stagger` numbers siblings (`--reveal-step`). The CSS
never hides anything: without JS, without IntersectionObserver or with
`prefers-reduced-motion`, everything simply shows. Never on the hero, never on
what is on screen at load, never on unrendered (`display: none`) content.
Don't nest `reveal-group` with a `reveal` child: it would animate twice.
(A first, CSS-only version tied to `animation-timeline: view()` was dropped:
scrubbing with the scroll read as "nothing happens" and Firefox lacks it.)

**The Ink-Tinted Shadow Rule.** Shadows are `rgba(28,43,28,…)` (or the brand
equivalent for a green chip), with `0` horizontal offset and a blur at least
twice the vertical offset. Pure black, hard offsets and multi-layer stacks are
outside the vocabulary.

## Shapes

Three radii and one pill, all declared as tokens.

- **Field** (10px, `--radius-field`): inputs, selects, textareas, buttons, store
  badges, and the invisible focus-target boxes around small links and the logo.
- **Card** (16px, `--radius-card`): cards, the white QR plate.
- **Panel** (20px, `--radius-panel`): large panels and the modal shell.
- **Pill** (`rounded-full`): selectable choice chips and round icon wells only.

Borders are always 1px in `line`, or a low-alpha white on dark grounds
(`border-white/12`). There are no double borders, no dashed strokes and no
decorative rules; a divider is a hairline or it is nothing. Icons are line
drawings on a 24px box, inlined as SVG paths with `currentColor`.

### Named Rules

**The Three Radii Rule.** 10 / 16 / 20px plus the pill. A new arbitrary radius
is a bug unless it is a physical object — the only exception in the build is the
phone frame's 3rem bezel, which is describing a real device.

**The Inline-SVG Rule.** Icons, store logos and the QR are drawn as inline SVG
paths inheriting `currentColor`. No icon font, no glyph character standing in
for an icon, no icon package, no `<img>` for a mark that has to change color
with its surface.

## Components

### Buttons

- **Shape:** softly rounded (10px, `rounded-field`), `font-semibold`, contents
  centered with a 0.5rem gap for an optional icon, `transition-colors` on state.
- **Primary:** Workshop Green ground, white text; hover to Workshop Green
  Pressed. Sizes `sm` (`0.5rem 1rem`, 14px), `md` (`0.625rem 1.25rem`, 15px),
  `lg` (`0.875rem 1.5rem`, 16px). `md` is the default.
- **Outline:** transparent with a `ink/30` border and ink text; hover shifts
  both border and text to green. Secondary action on light grounds.
- **Soft:** Meadow Green ground with ink text, for CTAs sitting on the dark
  provider band.
- **Inverse:** white ground with ink text, for CTAs on the brand-green closing
  band.
- **Disabled:** 50% opacity and `cursor: not-allowed`.
- **Focus:** the global ring — `outline: 2px solid` Workshop Green at 2px
  offset — from the base layer, never removed.
- **Link-shaped buttons:** a CTA that navigates is a real `Link` styled with the
  same variants (`ButtonLink`), never a `button` with an `onClick` router push.

### Chips

- **Style:** pill, 1px border, 14px text, `transition-colors`.
- **Unselected:** `line` border on `surface-subtle`, ink text, hover border to
  `brand/40`.
- **Selected:** `brand` border on an 8% brand wash, ink text.
- **State:** the native checkbox/radio stays visible inside the pill at 16px
  with `accent-brand` — keyboard accessibility comes free, and the focus ring is
  driven by `has-[:focus-visible]` on the label.

### Cards / Containers

- **Corner Style:** 16px (`rounded-card`).
- **Outline (default):** hairline `line` border on white.
- **Solid:** white, no border — for cards already sitting on a tinted band.
- **Elevated:** `surface-subtle` ground with the Lifted surface shadow.
- **Internal padding:** set by the consumer; the primitive ships shape and
  ground only.

### Inputs / Fields

- **Style:** full width, 10px radius, hairline `line` border on `surface-subtle`,
  `0.75rem 0.875rem` padding, 15px ink text, placeholder at `ink/40`.
- **Focus:** the border shifts to Workshop Green; the global 2px green ring
  handles visibility. Native `outline` is suppressed only because the ring
  replaces it.
- **Disabled:** 60% opacity.
- **Label:** 13px semibold `ink/70`, with a green asterisk (`aria-hidden`) for
  required fields. Hints are 12px `ink/65`.
- **Select:** native arrow replaced with an inline data-URI chevron so the
  control looks identical across browsers.
- **Field groups:** separated by a top hairline and a 15px Outfit bold title.

### Navigation

- **Header:** sticky, 4.5rem, translucent white (92%) with `backdrop-blur-md`
  and a hairline bottom border. Links are 15px DM Sans medium in ink, hovering
  to green. The primary CTA is a `md` primary button, hidden below `sm`.
- **Mobile panel:** rendered through a portal into `document.body` — the
  header's `backdrop-filter` makes it a containing block, so a `fixed` panel
  rendered inside it would size against the header, not the viewport. The panel
  is a full white sheet from `4.5rem` to the bottom, rows separated by hairlines,
  set in Outfit semibold `text-xl`, with the CTA anchored to the bottom and
  safe-area padding below it.

### Store Badges (signature)

The download CTA is not a `Button`: it is a pair of native `<a>` elements with
their own anatomy — an inline monochrome store glyph at 26px, then a stacked
11px caption over a 17px Outfit semibold store name. The glyphs are inline SVG
in `currentColor` precisely so the badge can flip ground: ink-on-white by
default (`tone="light"`), white-on-dark on brand or ink grounds
(`tone="brand"`). iOS is always first. The URLs always come from
`siteConfig.stores`.

### QR Plate (signature)

A single inline-SVG QR (version 3, 29×29 modules, error correction Q, quiet zone
included in the `viewBox`), drawn in `currentColor` on a white 16px-radius plate
with 12px of padding, sized at 144px so each module clears ~3.9px for weak
webcams. It appears only from `lg` up, behind its own hairline rule, because it
is the desktop visitor's bridge to the phone — not an alternative to the badges.
It points at the page, not at a store: one code cannot serve iOS and Android.
The path is a build-time constant generated once offline; if the URL ever
changes it must be regenerated wholesale, never hand-edited.

### Route-Scoped Dark Surface (signature)

`/descarga` is the system's one full-page ink surface, and it is the reference
implementation for any future dark route:

- Ground `ink`, text white, secondary text `white/72`, tertiary `white/60`,
  dividers `border-white/12`.
- Store badges in `tone="brand"` so the white buttons are the brightest thing on
  screen.
- Green appears in exactly two roles: text selection (`selection:bg-brand`) and
  the focus ring, scoped to Meadow Green
  (`[&_a:focus-visible]:outline-brand-soft`) because it measures 5.01:1 on ink
  against the inherited Workshop Green ring's 3.47:1. `globals.css` is left
  untouched — the green ring is correct on every white ground in the site.
- The route declares its own `export const viewport` with
  `themeColor: "#1c2b1c"` and `colorScheme: "dark"`, overriding the root
  layout's brand green so mobile browsers do not paint a green band above a dark
  page.
- No shadows, no gradients, no glass.

### Named Rules

**The Adapt-From-Outside Rule.** A shared primitive used by more than one
surface is adapted by its consumer, never modified. `StoreLinks` is reshaped on
the download route with arbitrary variants on the wrapper
(`[&>div]:justify-center`, `[&>div>a]:w-full`, `sm:[&>div>a]:w-auto`) precisely
because the home hero and closing band share it. Adapting from the outside keeps
one implementation and zero regressions.

**The Scoped Override Rule.** When one route needs a different value than the
global token gives it, the override is scoped to that route — a wrapper variant,
a route-level `viewport` export — and `globals.css` stays untouched. The global
token is right for the ninety percent of the site that is white; the exception
pays for itself locally.

## Do's and Don'ts

### Do:

- **Do** take every color from the `@theme` block in `app/globals.css`. A new
  color means a new token, and a new token means it is reused.
- **Do** keep Workshop Green rare: CTAs, focus, the closing band, the isotype.
  Its scarcity is what makes it mean "act here".
- **Do** send a full dark screen to Green-Black Ink (`#1c2b1c`, ~14.9:1 with
  white), not to brand green.
- **Do** put Outfit on headings and DM Sans on anything read as a sentence.
- **Do** use the three radii — 10 / 16 / 20px — plus the pill, and nothing else.
- **Do** start a surface flat: a hairline `line` border on white.
- **Do** ink-tint shadows (`rgba(28,43,28,…)`) with zero horizontal offset and a
  large blur, and only on things genuinely lifted off the page.
- **Do** give every interactive target 44px of height and add
  `pb-[calc(2rem+env(safe-area-inset-bottom))]` to anything anchored to the
  bottom of the viewport.
- **Do** draw icons, store glyphs and the QR as inline SVG paths inheriting
  `currentColor`.
- **Do** adapt a shared primitive from the outside with wrapper variants rather
  than editing it for one caller.
- **Do** scope a route-level exception to that route and leave `globals.css`
  alone.
- **Do** pick the lockup by its ground: `lockup-light.png` on white,
  `lockup-dark.png` on ink, `lockup-white.png` on brand green.

### Don't:

- **Don't** set body-sized copy on brand green `#2a8c3a`. White on it measures
  4.28:1, under the 4.5:1 floor. Large display text and white badges are fine;
  paragraphs are not.
- **Don't** put a standard lockup on a brand-green ground — its `#20A020`
  isotype measures 1.24:1 there and the mark visibly splits.
- **Don't** remove the global focus ring. If it contrasts poorly on a new
  ground, scope a different *token* for that ground (Meadow Green on ink), never
  `outline: none`.
- **Don't** introduce a third typeface, and don't let a system font stack become
  the visible face — both families are self-hosted variable fonts.
- **Don't** use a glyph character or an icon package where an inline SVG path
  belongs.
- **Don't** use hard-offset or pure-black shadows, or stack multiple shadows on
  one element.
- **Don't** invent a radius. If a value isn't 10, 16 or 20px or the pill, it
  needs a reason as strong as "this is drawing a physical device".
- **Don't** edit a shared primitive to satisfy one page.
- **Don't** change `globals.css` to fix a single route.
- **Don't** set an input below 16px under 900px — iOS will zoom the viewport on
  focus.
- **Don't** put `overflow-hidden` on an ancestor of a sticky element or a
  `reveal`; use `overflow-clip` (it clips without creating a scroll container).
- **Don't** hardcode a store URL; it comes from `siteConfig.stores`.
