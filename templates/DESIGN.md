---
version: alpha
name: option-a
artifact: page
provenance:
  source: brief
  source_url: ""
  captured_at: TODO
  method: brief
  confidence: high
colors:
  canvas: "#ffffff"
  canvas-soft: "#f7f7f5"
  canvas-soft-2: "#efefec"
  ink: "#161616"
  body: "#3f3f3f"
  mute: "#767676"
  hairline: "#e4e4e0"
  hairline-strong: "#a3a39d"
  primary: "#161616"
  on-primary: "#ffffff"
  link: "#1a56db"
  link-deep: "#123fa8"
  success: "#1a7f4b"
  success-soft: "#e6f5ec"
  success-deep: "#0f5c34"
  error: "#c02626"
  error-soft: "#fbe9e9"
  error-deep: "#8c1a1a"
  warning: "#9a6700"
  warning-soft: "#fff4d6"
  warning-deep: "#6b4800"
typography:
  display-xl:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 48px
    fontWeight: 600
    lineHeight: 52px
    letterSpacing: -1px
  display-lg:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 32px
    fontWeight: 600
    lineHeight: 38px
    letterSpacing: -0.6px
  display-md:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 24px
    fontWeight: 600
    lineHeight: 30px
    letterSpacing: -0.3px
  display-sm:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 20px
    fontWeight: 600
    lineHeight: 26px
    letterSpacing: -0.2px
  body-lg:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 18px
    fontWeight: 400
    lineHeight: 28px
  body-md:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
  body-md-strong:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
  body-sm:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  body-sm-strong:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  caption:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  caption-mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  code:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
  button-md:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 14px
    fontWeight: 600
    lineHeight: 20px
  button-lg:
    fontFamily: system-ui, -apple-system, "Segoe UI", sans-serif
    fontSize: 16px
    fontWeight: 600
    lineHeight: 24px
rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  pill: 999px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 40px
  3xl: 48px
  4xl: 64px
  5xl: 96px
  6xl: 128px
  section: 160px
shadows:
  hairline: "inset 0 0 0 1px #00000014"
  sm: "0 1px 2px #0000000a, inset 0 0 0 1px #00000014"
  md: "0 2px 4px #0000000f, 0 8px 16px -8px #00000014, inset 0 0 0 1px #00000014"
  lg: "0 4px 8px #0000000f, 0 16px 32px -12px #0000001a, inset 0 0 0 1px #00000014"
  modal: "0 8px 16px #00000014, 0 32px 48px -16px #0000001f, inset 0 0 0 1px #00000014"
components:
  nav-bar:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    typography: "{typography.body-sm}"
    padding: "{spacing.sm} {spacing.lg}"
    height: 64px
  nav-link:
    textColor: "{colors.body}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "{spacing.xs} {spacing.sm}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm} {spacing.lg}"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.pill}"
    padding: "{spacing.sm} {spacing.lg}"
  input:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    borderColor: "{colors.hairline-strong}"
    typography: "{typography.body-md}"
    rounded: "{rounded.sm}"
    padding: "{spacing.sm} {spacing.md}"
  card:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.body}"
    borderColor: "{colors.hairline}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
    shadow: "{shadows.sm}"
---

<!--
  DESIGN.md — the design language contract for one option (or one analysis).

  Rules:
  - Every visual value lives in the frontmatter. tokens.css mirrors it 1:1.
  - Prose refers to tokens as {colors.ink}, {spacing.lg}, {typography.body-md}.
  - Replace every TODO. The validator fails on TODO provenance and warns on any TODO.
  - Keep the prose between 120 and 300 lines. The frontmatter carries the token load.
  - All thirteen sections are required. If one does not apply, keep the heading and say
    why there instead of deleting it.
-->

# <Option name> — Design Language

## Overview

One paragraph: the subject, the audience, the job of the artifact, and the single
thesis this language commits to. Then 3–5 non-negotiable principles as a list. A
principle is testable: "display never exceeds weight 600" beats "feels premium".

TODO: write the overview and the principles.

## Colors

### Brand & Accent

The primary, the on-primary, link colors, and any signature accent. One line per
role: what it means, where it is allowed, where it is forbidden.

TODO: describe the accent roles.

### Surface

The surface ladder (`canvas`, `canvas-soft`, `canvas-soft-2`) and how bands alternate.
State whether depth comes from surface polarity, shadow, or both.

TODO: describe the surface ladder.

### Text

`ink` for headings, `body` for paragraphs, `mute` for secondary metadata, and the
contrast each pair is expected to clear.

TODO: describe the text roles and their contrast pairs.

### Semantic

Success, error, and warning, each with base, soft, and deep. Say what the soft tone is
for (banners, badges) and what the deep tone is for (pressed, text-on-soft).

TODO: describe the semantic roles.

## Typography

### Font Family

List each family, what it is for, and where it is forbidden. If a family is
proprietary or unavailable, use the next subsection.

TODO: list the families.

### Hierarchy

| Token | Size | Weight | Line Height | Tracking | Use |
|---|---|---|---|---|---|
| `{typography.display-xl}` | 48px | 600 | 52px | -1px | TODO |
| `{typography.display-lg}` | 32px | 600 | 38px | -0.6px | TODO |
| `{typography.display-md}` | 24px | 600 | 30px | -0.3px | TODO |
| `{typography.display-sm}` | 20px | 600 | 26px | -0.2px | TODO |
| `{typography.body-lg}` | 18px | 400 | 28px | 0 | TODO |
| `{typography.body-md}` | 16px | 400 | 24px | 0 | TODO |
| `{typography.body-sm}` | 14px | 400 | 20px | 0 | TODO |
| `{typography.caption}` | 12px | 400 | 16px | 0 | TODO |
| `{typography.code}` | 13px | 400 | 20px | 0 | TODO |

### Principles

The rules that make the type read as one voice: tracking behaviour, casing, weight
ceiling, when mono is allowed, maximum line length.

TODO: write 3–5 type principles.

### Font Substitutes

For every proprietary face: the open-source substitute, the weight set to use, the
feature settings that get closest, and the license of the substitute. Write "No
substitutes needed" when every face ships with the project.

TODO: list substitutes and licenses.

## Layout

### Spacing System

Base unit, the scale, and which steps are allowed for section padding, card padding,
and inline gaps. Name the forbidden in-between values.

TODO: describe the spacing system.

### Grid & Container

Max width, gutters, column patterns, and how each pattern collapses.

TODO: describe the grid.

### Whitespace Philosophy

Where the page breathes and where it deliberately does not. One paragraph.

TODO: describe the whitespace philosophy.

## Elevation & Depth

| Level | Token | Treatment | Use |
|---|---|---|---|
| 0 — Flat | none | No shadow, no border | TODO |
| 1 — Hairline | `{shadows.hairline}` | Inset 1px ring | TODO |
| 2 — Raised | `{shadows.sm}` | Ring + small offset | TODO |
| 3 — Floating | `{shadows.md}` | Ring + soft stack | TODO |
| 4 — Modal | `{shadows.modal}` | Ring + wide stack | TODO |

State whether elevation is built from stacked small shadows, a single drop, surface
polarity, or none at all. Say which level each surface uses.

TODO: describe the depth strategy.

## Shapes

### Border Radius Scale

Which radius steps exist and which components are allowed to use each. State the rule
that keeps shapes coherent (for example: pick one scale per surface class and stay
there).

TODO: describe the radius logic.

### Imagery & Iconography Geometry

Aspect ratios, crop rules, icon stroke width, icon grid, illustration style, and what
imagery is forbidden.

TODO: describe the imagery and icon rules.

## Components

### Buttons

Every variant, size, and state (default, hover, focus, active, disabled, loading).
Include height, padding, radius, and type role.

TODO: document the buttons.

### Cards & Containers

The card chrome, its elevation level, internal spacing, and what may never be placed
inside a card.

TODO: document the cards.

### Inputs & Forms

Field chrome, label placement, error presentation, and focus treatment.

TODO: document the inputs.

### Navigation

Structure, height, active state, collapse behaviour, and mobile treatment.

TODO: document the navigation.

### Signature

The one component or moment this language is remembered by, described precisely enough
to rebuild.

TODO: document the signature component.

## Do's and Don'ts

### Do

- TODO: a rule that protects the thesis.
- TODO: a rule about tokens, type, or spacing.
- TODO: a rule about states or accessibility.

### Don't

- TODO: the most tempting way to break this language.
- TODO: a decoration, gradient, or weight that is off-limits.
- TODO: a shortcut that would ship the preview look into production.

## Responsive Behavior

### Breakpoints

| Name | Width | Key changes |
|---|---|---|
| Mobile | < 600px | TODO |
| Tablet | 600–959px | TODO |
| Desktop | 960–1279px | TODO |
| Wide | ≥ 1280px | TODO |

### Touch Targets

Minimum 24×24 CSS px, preferred 44×44 for primary actions on touch. State how small
controls reach the preferred size without changing their visual size.

TODO: describe the target strategy.

### Collapsing Strategy

Per region (nav, hero, grids, tables, footer): what collapses, in what order, and what
never collapses.

TODO: describe the collapse order.

### Image Behavior

How imagery scales, crops, lazy-loads, and what happens at each breakpoint.

TODO: describe image behaviour.

## Motion

The budget: how many orchestrated moments, what easing and duration tokens are used,
what is forbidden, and how `prefers-reduced-motion` is honoured.

TODO: describe the motion budget.

## Iteration Guide

How to extend this language without breaking it. Which tokens may be added, which are
frozen, and what must be re-verified after a change.

TODO: write the iteration rules.

## Known Gaps

What could not be verified, sampled, or inferred, and how that limits the design.
Write "None." only when every value has a real source.

TODO: list the gaps, or replace this line with "None.".

## Agent Prompt Guide

Quick reference for another agent or session:

- Canvas `{colors.canvas}`, ink `{colors.ink}`, primary `{colors.primary}`, accent `{colors.link}`.
- Display `{typography.display-lg}`, body `{typography.body-md}`, caption `{typography.caption}`.
- Radius `{rounded.md}`, section spacing `{spacing.4xl}`, card padding `{spacing.lg}`.
- Signature: TODO.
- Never: TODO.

Ready-to-use prompt:

> Build a <artifact> for <audience> using this design language. Read DESIGN.md and
> tokens.css first. Use only tokens; do not invent colors, type sizes, or spacing.
> Follow the Do's and Don'ts, respect the accessibility contract, and show the result
> at 390 / 768 / 1440.
