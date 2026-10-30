# Show Me The Design

A design skill for building, documenting, and reviewing frontend visual artifacts in
the browser.

## What it does

Show Me The Design turns a design request into something you can see, click, and
judge at a local URL. For every new visual request it produces two or three genuinely
distinct options and shows them side by side so you can choose one, ask for another,
or mix them.

It covers any artifact size: a full page, a section, a component, a single state, or
a flow of screens. Each option is a complete runnable HTML document, never a
description or a half-finished sketch.

Every option also ships its design language: a `DESIGN.md` contract, a `tokens.css`
mirror, and a `system.html` catalog that proves the tokens on real product surfaces.
The skill can also run in analysis-only mode — analyzing a site, brand, or screenshot
and producing the language document without opening a preview.

## Core principles

- Options are alternatives, not cosmetic variants. They differ in layout, type,
  density, tone, or signature, not only in accent color.
- The design language is a deliverable. An artifact without `DESIGN.md` is unfinished.
- Tokens are the only source of visual values. No raw color, type size, radius,
  spacing, or shadow outside `tokens.css`.
- Provenance is mandatory. Every language document states source, date, method, and
  confidence.
- Research comes first. The skill gathers current references from primary sources,
  including WCAG 2.2 AA, the WAI-ARIA Authoring Practices Guide, MDN, the official docs
  for the detected framework, and the Google Stitch DESIGN.md specification.
- Accessibility is a constraint from the first line of markup, not a final pass.
- Images, live sites, and existing products are evidence. They are analyzed before any
  question is asked.
- Analysis is not authorship. A third-party brand is interpreted, never cloned.
- Build first, explain second. The deliverable is the artifact, not a description of
  it.
- App source is never modified without approval. Preview artifacts live in an
  isolated workspace.

## Option layout

```
<workspace>/
  REFERENCES.md          # sources, versions, dates
  IMAGE-NOTES.md         # visual evidence and confidence
  DECISIONS.md           # chosen option and the principle it protects
  <artifact>/
    option-a/
      DESIGN.md          # thirteen-section language contract
      tokens.css         # 1:1 mirror of the DESIGN.md frontmatter
      components.css     # component CSS, token-only
      system.html        # swatch/type/radius/spacing/elevation/components catalog
      index.html         # the artifact itself
    option-b/ ...
```

## DESIGN.md

The contract follows the Google Stitch format, extended with the sections that keep a
design usable in a real product:

1. Overview
2. Colors — Brand & Accent, Surface, Text, Semantic
3. Typography — Family, Hierarchy, Principles, Font Substitutes
4. Layout — Spacing System, Grid & Container, Whitespace Philosophy
5. Elevation & Depth
6. Shapes — Border Radius Scale, Imagery & Iconography Geometry
7. Components — Buttons, Cards, Inputs, Navigation, Signature
8. Do's and Don'ts
9. Responsive Behavior — Breakpoints, Touch Targets, Collapsing, Image Behavior
10. Motion
11. Iteration Guide
12. Known Gaps
13. Agent Prompt Guide

The section structure follows the Google Stitch DESIGN.md specification and the
analyses published in
[VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md). Only
structure and reasoning conventions are reused; brand values never are.

The frontmatter holds the tokens:

```yaml
version: alpha
name: option-a
artifact: page
provenance:
  source: brief
  captured_at: 2026-01-01
  method: brief
  confidence: high
colors:      # canvas, canvas-soft, ink, body, mute, hairline, primary, ...
typography:  # display-xl, body-md, caption, code, ...
rounded:     # none, sm, md, lg, pill, full
spacing:     # xxs, xs, sm, md, lg, xl, section
shadows:     # hairline, sm, md, lg, modal
components:  # button-primary, input, card, nav-bar, ...
```

`DESIGN.md` and `tokens.css` map 1:1:

| DESIGN.md | tokens.css |
|---|---|
| `colors.ink` | `--color-ink` |
| `rounded.md` | `--radius-md` |
| `spacing.lg` | `--space-lg` |
| `shadows.sm` | `--shadow-sm` |
| `typography.body-md.fontSize` | `--type-body-md-size` |
| `typography.body-md.lineHeight` | `--type-body-md-leading` |

Prose refers to tokens as `{colors.ink}`. Every reference must resolve.

Start from [`templates/DESIGN.md`](templates/DESIGN.md) and
[`templates/system.html`](templates/system.html).

## Validator

```bash
scripts/check-design.mjs --design-dir /abs/path --pretty
```

Zero dependencies. It fails on:

- unparseable frontmatter or missing provenance
- unresolved `{token.ref}` references
- missing required sections or an empty Known Gaps
- token drift between `DESIGN.md` and `tokens.css`
- missing `system.html`, its token link, or required specimens
- raw color literals in any CSS outside `tokens.css` or in artifact markup
- an option with no artifact page

Warnings cover TODO markers, orphan tokens, a missing optional surfaces block, and
explicit overrides. Use `--strict` to make warnings fatal.

Exit code is `0` when the workspace is valid and `1` when it is not.

## Analysis-only mode

Point the skill at a URL, a brand, or a screenshot and it produces:

- `DESIGN.md` with `artifact: analysis`, a real `provenance.method`, and a
  `source_url`
- `system.html` proving the extracted tokens
- `REFERENCES.md` and `IMAGE-NOTES.md`
- no preview server unless you ask for one

The document is labeled an inspired interpretation, never an official
specification. Known Gaps records what the evidence could not reveal.

## Accessibility contract

Every option must satisfy WCAG 2.2 AA before it is reported. This includes keyboard
reachability and visible focus, correct names and states for controls, 4.5:1 contrast
for body text, 24 by 24 CSS pixel targets with 44 by 44 preferred for primary touch
actions, reflow at 320 CSS pixels and 200% zoom, and support for
`prefers-reduced-motion`.

## Preview server

The repo ships a zero-dependency Node preview server that serves a design workspace
on localhost with live reload. The gallery groups options by artifact and renders
them side by side at the same viewport so differences are visible at a glance. Each
group links its `DESIGN.md` and `system.html`.

Server contract:

- `GET /` gallery
- `GET /<path>` static file with live-reload injection for HTML
- `GET /__reload` server-sent events stream for live reload
- binds `127.0.0.1` by default, picks a free port, exits after 30 minutes idle
- rejects path traversal; nothing outside the design workspace is served
- state and logs live in `<design-dir>/.preview/`

## Repository layout

- `SKILL.md`: the full skill instructions for the agent
- `templates/DESIGN.md`: the language contract skeleton
- `templates/system.html`: the catalog skeleton
- `scripts/check-design.mjs`: the contract validator
- `scripts/preview-server.mjs`: the preview server
- `scripts/start-preview.sh`: starts the server for a workspace
- `scripts/stop-preview.sh`: stops the server, keeping the design files

## Usage

Validate a workspace:

```bash
scripts/check-design.mjs --design-dir /abs/path --pretty
```

Start a preview:

```bash
scripts/start-preview.sh --design-dir /abs/path
```

It prints JSON with the gallery URL, for example:

```json
{"url":"http://localhost:PORT/","gallery":"http://localhost:PORT/","state":"/abs/path/.preview"}
```

Stop the preview:

```bash
scripts/stop-preview.sh /abs/path
```

## Requirements

- Node.js (for the validator and the preview server)
- bash (for the start and stop scripts)

## License

MIT. See [LICENSE](LICENSE).
