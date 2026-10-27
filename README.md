# Show Me The Design

A design skill for building and reviewing live, on-brand frontend visual artifacts in
the browser.

## What it does

Show Me The Design turns a design request into something you can see, click, and
judge at a local URL. For every new visual request it extracts the product's design
tokens first, produces two or three genuinely distinct options (`A`, `B`, `C`), and
renders them side by side in rich comparison cards so you can choose one, ask for
another, or mix them.

It covers any artifact size: a full page, a section, a component, a single state, or
a flow of screens. Each option is a complete, interactive runnable HTML document with
real domain content and full states — never a description or a static wireframe.

## Core principles

- **Start from the product's design system.** Before proposing options, the skill
  extracts real tokens (color, typography, radius, shadow, spacing, motion,
  iconography) and existing components into `tokens.json` and `tokens.css`. It defaults
  to `faithful` mode (strictly honoring the product's visual language) and uses
  `exploration` mode only when a redesign is explicitly requested. Every option
  declares its fidelity mode.
- **Options are alternatives, not cosmetic variants.** They differ in thesis — layout,
  hierarchy, density, interaction signature, or workflow — not only in accent color.
- **Make options feel alive.** Every option includes at least one purposeful
  interaction or motion moment (hover, reveal, transition, or state feedback) with
  `@media (prefers-reduced-motion: reduce)` handling, complete interactive states
  (default, hover, focus-visible, active, loading, empty, error, disabled), and real
  domain copy.
- **Componentized comparison.** Each option renders in an isolated A/B/C comparison
  card with its title, fidelity badge (`faithful` / `exploration`), thesis, color
  palette swatches, typography roles, trade-offs, and "what to look at" callout,
  synchronized across `1440`, `768`, and `390` viewports.
- **Be direct.** At most one clarification round when the brief and codebase do not
  already answer a blocking question. Research only what changes the decision, ship the
  first visible version fast, and reply with `URL + one line + explicit choice`.
- **Keep sources current.** Verify constraints against primary sources (WCAG 2.2 AA,
  WAI-ARIA APG, MDN, Baseline, and the project's pinned framework docs) with recorded
  version and date in `REFERENCES.md`. Draft specs are never treated as requirements.
- **Accessibility from line one.** Semantic HTML, keyboard operability, contrast,
  target sizes, reflow, and reduced motion are enforced before reporting.
- **Images are evidence.** Pasted or referenced images are analyzed before asking
  questions, recorded in `IMAGE-NOTES.md`, and treated as design briefs, visual
  references, or critique targets.
- **App source is never modified without approval.** Preview artifacts live in an
  isolated workspace.

## Comparison card metadata

The gallery populates each option card from `<artifact>/options.json` (or root
`options.json`) and falls back to `<meta name="smtd-*">` tags in each option's HTML:

- `smtd-label`: option badge (`A`, `B`, `C`)
- `smtd-title`: option name
- `smtd-fidelity`: `faithful` (default) or `exploration`
- `smtd-thesis`: one-sentence design thesis
- `smtd-palette`: comma-separated hex palette values
- `smtd-type`: display, body, and utility/mono font summary
- `smtd-tradeoffs`: what the option optimizes for and what it trades off
- `smtd-look-at`: specific interaction or detail to inspect

## Accessibility contract

Every option must satisfy WCAG 2.2 AA before it is reported. This includes keyboard
reachability and visible focus, correct names and states for controls, 4.5:1 contrast
for body text (3:1 for large text and UI boundaries), 24 by 24 CSS pixel targets,
reflow at 320 CSS pixels and 200% zoom, and support for `prefers-reduced-motion`.

## Preview server

The repo ships a zero-dependency Node preview server that serves a design workspace
on localhost with live reload. The gallery groups options by artifact and renders
isolated A/B/C comparison cards side by side at synchronized `1440`, `768`, and `390`
viewports (with keyboard shortcuts `1`, `2`, `3` and an in-card interactive iframe
toggle).

Server contract:

- `GET /` keyboard-accessible comparison gallery
- `GET /<path>` static file with live-reload injection for HTML
- `GET /__reload` server-sent events stream for live reload
- links workspace docs (`tokens.json`, `REFERENCES.md`, `DECISIONS.md`, `IMAGE-NOTES.md`) when present
- binds `127.0.0.1` by default, picks a free port, exits after 30 minutes idle
- rejects path traversal and hidden files; nothing outside the design workspace is served
- state and logs live in `<design-dir>/.preview/`

## Repository layout

- `SKILL.md`: the full skill instructions for the agent
- `scripts/preview-server.mjs`: the zero-dependency preview server
- `scripts/start-preview.sh`: starts the server for a workspace
- `scripts/stop-preview.sh`: stops the server, keeping the design files

## Usage

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

- Node.js (for the preview server)
- bash (for the start and stop scripts)

## License

MIT. See [LICENSE](LICENSE).
