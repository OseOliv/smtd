# Show Me The Design

A design skill for building and reviewing frontend visual artifacts in the browser.

## What it does

Show Me The Design turns a design request into something you can see, click, and
judge at a local URL. For every new visual request it produces two or three genuinely
distinct options and shows them side by side so you can choose one, ask for another,
or mix them.

It covers any artifact size: a full page, a section, a component, a single state, or
a flow of screens. Each option is a complete runnable HTML document, never a
description or a half-finished sketch.

## Core principles

- Options are alternatives, not cosmetic variants. They differ in layout, type,
  density, tone, or signature, not only in accent color.
- Research comes first. The skill gathers current references from primary sources
  before designing, including WCAG 2.2 AA, the WAI-ARIA Authoring Practices Guide,
  MDN, and the official docs for the detected framework.
- Accessibility is a constraint from the first line of markup, not a final pass.
- Images are evidence. Pasted or referenced images are analyzed before any question
  is asked and treated as design briefs, visual references, or critique targets.
- Build first, explain second. The deliverable is the artifact, not a description of
  it.
- App source is never modified without approval. Preview artifacts live in an
  isolated workspace.

## Accessibility contract

Every option must satisfy WCAG 2.2 AA before it is reported. This includes keyboard
reachability and visible focus, correct names and states for controls, 4.5:1 contrast
for body text, 24 by 24 CSS pixel targets, reflow at 320 CSS pixels and 200% zoom,
and support for `prefers-reduced-motion`.

## Preview server

The repo ships a zero-dependency Node preview server that serves a design workspace
on localhost with live reload. The gallery groups options by artifact and renders
them side by side at the same viewport so differences are visible at a glance.

Server contract:

- `GET /` gallery
- `GET /<path>` static file with live-reload injection for HTML
- `GET /__reload` server-sent events stream for live reload
- binds `127.0.0.1` by default, picks a free port, exits after 30 minutes idle
- rejects path traversal; nothing outside the design workspace is served
- state and logs live in `<design-dir>/.preview/`

## Repository layout

- `SKILL.md`: the full skill instructions for the agent
- `scripts/preview-server.mjs`: the preview server
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
