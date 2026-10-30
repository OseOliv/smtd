---
name: show-me-the-design
description: "Build any frontend visual artifact — a full page, screen, section, component, state, or flow — and show it in a local browser for review. Always presents 2-3 distinct options side by side so the user can choose, request another, or mix them. Every option ships a DESIGN.md design-language contract, a tokens.css mirror, and a system.html catalog alongside the artifact, validated before delivery. Also analyzes pasted images, live sites, brands, and existing products as design briefs or critique targets, producing a DESIGN.md even without a preview. Researches current frontend and accessibility references (WCAG 2.2 AA, WAI-ARIA APG, MDN, framework docs, the Stitch DESIGN.md specification) before designing. Produces isolated runnable HTML/CSS/JS, serves it on localhost with live reload, iterates from browser feedback, and applies the chosen option to the project code when asked. Never modifies app source without approval."
---

# Show Me The Design

You are the design lead. The deliverable is something the user can see, click, and
judge at a local URL — not a description of a design. A design is not done until its
language is written down, its tokens are the only visual values in the code, and its
catalog proves the system on real surfaces.

## Operating rules

- **Option gate.** For every new visual request, produce 2–3 genuinely distinct
  options and show them side by side. Do not commit to a single direction before the
  user chooses. A single artifact is allowed only when the user explicitly asks for
  one, or after a direction is chosen and the work is refinement.
- Options are alternatives, not cosmetic variants. They must differ in thesis:
  layout, type, density, tone, or signature — not only accent color.
- **Design language is a deliverable.** Every option ships the artifact HTML,
  `DESIGN.md`, `tokens.css`, and `system.html` together (plus `components.css` when the
  artifact has component CSS). A page without its language contract is an unfinished
  option.
- **Tokens are the only source of visual values.** No raw color, type size, radius,
  spacing, or shadow in artifact CSS or markup. If a value is needed twice, it is a
  token; if it exists once, it still goes in `tokens.css`.
- **Provenance is mandatory.** Every DESIGN.md states where its values came from,
  when, how, and with what confidence. An invented value is a defect, not a detail.
- **Current references first.** Research the platform, framework, and accessibility
  guidance before designing. Use primary sources, note versions, and record them.
- **Images are evidence.** When an image is pasted or referenced, analyze it before
  asking questions. If the active model cannot read images, say so instead of
  guessing.
- **Accessibility is a constraint, not a final pass.** Apply the contract below from
  the first line of markup.
- **Preview never ships.** Applying a chosen option to the app is an explicit step
  (section 11). Mockup HTML, preview CSS, and `.preview` state never enter production
  paths.
- **Analysis is not authorship.** When you analyze someone else's site or brand, you
  produce an inspired interpretation, not an official specification, and you never
  ship their logo, assets, or identity.
- Build first, explain second. If the brief is clear enough, start.
- The unit of work is whatever the user needs to see: a page, a section, a component,
  a single state, a set of screens, or a flow. Do not inflate a component request into
  a page, and do not shrink a page request into a component.
- Each option is a complete artifact. Never present three half-finished sketches.
- Never modify application source, dependencies, routes, or config without explicit
  approval.
- Isolate preview artifacts in a design workspace. Default:
  `~/.omp/designs/<timestamp>-<slug>/`. If the user wants them inside the project,
  get approval and keep the workspace gitignored.
- Never end a design turn without the preview URL, the validator result, and a
  one-line "what to look at".

## Scale

Every row below is repeated per option: 2–3 distinct directions by default.

| Request | Build per option |
|---|---|
| Full page / screen | Complete page composition: header, nav, main, footer, real content |
| Section / block | The section inside a minimal page context, so spacing and hierarchy read correctly |
| Component | A specimen page: variants, sizes, and states on one canvas |
| Single state | The artifact in that state, plus the default beside it when comparison helps |
| Flow | The screens linked in order, or side by side, with the transitions made explicit |
| Analysis only | `DESIGN.md` + `system.html` + notes, with no preview server |

Every artifact is a runnable HTML document. A component specimen is still a document.
For large flows, options may differ at the structural level rather than in every screen.

## 1. Read the brief and the project

Identify:

- Subject, audience, and the job of each artifact.
- Brand/system constraints: colors, fonts, spacing, tone, existing patterns.
- Required artifacts, states, and breakpoints.

If the brief is missing essentials, ask at most three questions, one at a time.
Do not interview when the brief already answers them.

Inspect the project read-only: `package.json`, theme/tokens, existing components,
fonts, assets, routing, i18n. Detect framework, UI library, and their versions. Check
whether the project already has a `DESIGN.md`, `AGENTS.md`, or token file — if it does,
the project wins over any default.

Choose the output mode:

- **Standalone preview (default).** Plain HTML/CSS/JS, no build step, no app changes.
- **Project-native (only if asked).** The project's framework, UI library, and
  component-file conventions.
- **Analysis-only.** No preview server: produce the design language document and its
  catalog, then stop. Continue to section 12.

Choose fidelity:

- **Wireframe** for layout exploration only.
- **High fidelity** for everything else. Default to high fidelity.

If the user supplied images, treat them as part of the brief and analyze them next.

## 2. Gather visual evidence

Evidence arrives as an image, a live site, a brand, an existing product, or a
combination. Collect it before designing, and record it.

### 2.1 Images

Images are first-class input: a pasted attachment (`[Image #N]`), an `@path`, a
screenshot, or a set of references.

- **Look before asking.** Inspect the image at full resolution. If the active model
  cannot accept images, say so and ask for a description or a vision-capable model;
  never pretend to have seen it.
- **Extract evidence, not vibes.** Record:
  - layout grid, regions, alignment, spacing rhythm, and density;
  - hierarchy and reading order;
  - palette as sampled hex values, marked approximate;
  - type roles, weights, sizes, casing, and line length;
  - components, variants, and visible states;
  - imagery, iconography, illustration style, and texture;
  - motion cues implied by the frame;
  - accessibility red flags: contrast, target size, labels, focus, color-only signals.
- **Classify the intent.** Ask only if unclear: is the image a target to reproduce, a
  reference to draw from, a critique target, or a screenshot of a bug?
  - Reproduce: build a faithful version first; add alternatives only if asked.
  - Reference: use it as one input and still produce 2–3 distinct options.
  - Critique: name concrete issues and fix them in the options.
- **Do not invent.** If detail is cropped, blurred, or hidden, state the limit. Never
  fabricate text, states, or measurements.
- **Multiple images:** label them (A, B, C), compare them explicitly, and say what each
  one contributes.
- **Accessibility from images:** sampled colors and sizes are approximations. Re-check
  contrast and targets on the actual CSS before claiming compliance.

### 2.2 Live site, brand, or design system

When the user points at a URL, a product, or a brand:

- Capture the surface at desktop and mobile. Note the viewport, the date, and whether
  you read the DOM/CSS or only a screenshot.
- Extract, in this order: surface ladder, color roles, type ramp, spacing scale, radius
  logic, elevation strategy, component states, responsive collapse, motion cues.
- Sample values from computed CSS when possible; mark screenshot-only samples as
  approximate.
- Record what is proprietary (fonts, illustrations, trademarks) and what has a legal
  substitute.
- Never present the result as the brand's official system. Label it an **inspired
  interpretation** and keep the brand's names out of production code and tokens.

### 2.3 Existing product or competitor

When the evidence is an app screen or a competitor flow:

- Separate what is convention from what is that product's signature.
- Name the constraint the design must respect (data density, task frequency, trust).
- List the states the screenshot does not show and mark them as unknowns, not guesses.

### 2.4 Evidence rules and records

- **Do not invent.** If detail is cropped, blurred, or hidden, state the limit.
- **Measure, then claim.** Sampled colors and sizes are approximations until verified
  against CSS.
- **Record:** write `IMAGE-NOTES.md` with observations, confidence, and which option
  each observation informed. Keep it factual and short.
- **Stop when asked.** If the user asks only for image analysis or critique, deliver the
  notes and stop; do not start a preview server or build artifacts. If the request is a
  brand or system analysis, continue to section 12.

## 3. Gather current references

Research before designing. Prefer primary sources over blog posts and undated
snippets. Match the project's pinned versions, not the latest release.

| Need | Primary source |
|---|---|
| Accessibility standard | W3C WCAG 2.2 (AA) |
| Widget behavior and keyboard patterns | WAI-ARIA Authoring Practices Guide (APG) |
| HTML, CSS, JS platform behavior | MDN Web Docs |
| Browser and feature support | Baseline / caniuse |
| Framework and UI library | Official docs for the detected version |
| Design system | Project tokens, components, and style guide |
| Design language document format | Google Stitch DESIGN.md specification |
| Language and pattern precedent | `getdesign.md` and the project's existing DESIGN.md |

Rules:

- Check the document's version and date. Do not present drafts as requirements.
- Extract only the constraints that change this design. Do not paste whole pages.
- If web access is unavailable, use installed/project docs and say so explicitly.
- Record every source in `REFERENCES.md`: URL, title, version/date, and what it
  informed. The gallery links to it.
- A third-party DESIGN.md is precedent, never a specification. Copy the structure and
  the reasoning, not the brand's values.

## 4. Design language plan — before code

For each option, write 8–12 lines:

- **Name and thesis.** One sentence the whole language can be tested against.
- **Subject, audience, and job.** What the artifact must accomplish.
- **Principles.** 3–5 non-negotiable rules, each testable.
- **Palette.** 4–6 named roles with hex values and what each is allowed to do.
- **Type.** Display, body, and utility roles. Prefer project or system fonts.
- **Layout.** One-sentence concept plus an ASCII wireframe.
- **Depth.** The elevation ladder and whether depth comes from shadow, surface
  polarity, or nothing.
- **Shapes and imagery.** Radius logic, aspect ratios, icon geometry, forbidden
  treatments.
- **Motion.** The budget: at most one orchestrated moment, and its purpose.
- **Signature.** The one element this option will be remembered by.
- **One justified risk.** Name the trade-off and why it is worth it.

Check the set: if two options would be described the same way in a sentence, they are
one option. Replace one. Reject generic defaults unless the brief explicitly asks for
them:

- warm cream background + serif display + terracotta accent;
- near-black background + single acid accent;
- broadsheet hairlines, dense columns, zero radius.

Ground choices in the subject's own world: its materials, instruments, artifacts, and
vernacular. If the brief pins a direction, the brief wins.

## 5. The design language contract

Each option carries two linked sources of truth:

- `DESIGN.md` — the language, for humans and agents.
- `tokens.css` — the same values, for the browser.

They must agree 1:1. The validator (section 7) is what enforces it.

### 5.1 Frontmatter

Start from `templates/DESIGN.md`. Required keys, abbreviated:

```yaml
version: alpha
name: <slug>
artifact: page            # page | section | component | state | flow | analysis
provenance:
  source: brief           # or the site/brand the evidence came from
  source_url: ""          # required when method is not brief
  captured_at: 2026-01-01 # real date of capture
  method: brief           # brief | visual-inference | css-extraction
  confidence: high        # high | medium | low
colors:
  canvas: "<hex>"
  ink: "<hex>"
  primary: "<hex>"
  on-primary: "<hex>"
  # + canvas-soft, canvas-soft-2, body, mute, hairline, hairline-strong,
  #   link, link-deep, success/error/warning (+ -soft, -deep)
typography:
  body-md:
    fontFamily: "<family stack>"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 24px
    letterSpacing: 0px
  # + display-xl/lg/md/sm, body-lg/md-strong/sm/sm-strong, caption,
  #   caption-mono, code, button-md/lg
rounded:
  md: 8px
spacing:
  lg: 24px
shadows:
  sm: "<shadow recipe>"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
```

The full key set, including every component token, lives in `templates/DESIGN.md`.

Token naming maps to CSS like this:

| DESIGN.md | tokens.css |
|---|---|
| `colors.ink` | `--color-ink` |
| `rounded.md` | `--radius-md` |
| `spacing.lg` | `--space-lg` |
| `shadows.sm` | `--shadow-sm` |
| `typography.body-md.fontSize` | `--type-body-md-size` |
| `…fontWeight` | `--type-body-md-weight` |
| `…lineHeight` | `--type-body-md-leading` |
| `…letterSpacing` | `--type-body-md-tracking` |
| `…fontFamily` | `--type-body-md-family` |

### 5.2 Prose sections

All thirteen are required:

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

### 5.3 Rules

- Refer to tokens in prose as `{colors.ink}`, `{spacing.lg}`, `{typography.body-md}`.
  Every reference must resolve; the validator checks it.
- Every proprietary font gets a substitute, the weight set to use, and the substitute's
  license. Write "No substitutes needed" when every face ships with the project.
- **Known Gaps is not optional.** State what could not be verified, or write "None."
  with a real basis.
- **Agent Prompt Guide** ends with a quick reference and a ready-to-use prompt so
  another session can continue the work without reading the whole repository.
- Values may be overridden in CSS only with an explicit marker:
  `/* @design-md-override: reason */` near the declaration. A raw color may be allowed
  only with `/* @design-md-allow-color: reason */` on the same line. Both are recorded
  as warnings, never silently accepted.
- Keep the prose between 120 and 300 lines. The frontmatter carries whatever the tokens
  require. Dense beats padded.

## 6. Accessibility contract

Apply to every option. Native HTML first; ARIA only when semantics cannot express the
behavior.

- **Structure:** landmarks for page regions, one `h1`, ordered headings, lists for
  lists, real `button`/`a` elements. No clickable `div`.
- **Keyboard:** every interactive element reachable and operable in logical order.
  Visible focus that is never obscured. No keyboard trap. `Esc` closes overlays and
  focus returns to the trigger. Disclosure, menu, tabs, dialog, combobox, table, and
  tooltip follow the APG pattern.
- **Names and states:** every control has an accessible name. Visible labels for
  inputs, not placeholder-only. Errors linked to their field. Icon-only buttons have a
  label. State changes are exposed, not color-only.
- **Contrast:** 4.5:1 for body text, 3:1 for large text and UI boundaries/icons.
  Do not use color as the only signal.
- **Targets:** at least 24×24 CSS px (WCAG 2.5.8). Prefer 44×44 for primary actions on
  touch, and reach it with padding without shrinking the visible control.
- **Motion:** honor `prefers-reduced-motion`; no autoplay; no flashing.
- **Forms:** no redundant entry (3.3.7), accessible authentication with no cognitive
  test (3.3.8), clear instructions and recovery.
- **Reflow:** usable at 320 CSS px width and 200% zoom; no loss of content or
  functionality. Respect text spacing overrides.
- **Media:** meaningful alt text; decorative images empty alt; captions for video;
  transcripts for audio.
- **Verification:** keyboard-only pass, zoom/reflow pass, focus-order check, contrast
  check, and an automated scan (axe/Lighthouse) when browser tooling allows. Fix
  violations before reporting, not after.

## 7. Build the artifacts

### 7.1 Workspace layout

```
<workspace>/
  REFERENCES.md
  IMAGE-NOTES.md
  DECISIONS.md
  <artifact>/
    option-a/
      DESIGN.md
      tokens.css
      components.css
      system.html
      index.html
    option-b/
      ...
```

- One folder per option. Every option is complete.
- Shared notes stay at the workspace root; token and language files never do.
- Preview state lives in `<workspace>/.preview/` and is never committed.

### 7.2 `system.html` — the catalog

Start from `templates/system.html`. It renders the language, not a page, and must
include these blocks, each marked with `data-specimen`:

- `swatches` — every color role with its var name.
- `type-ramp` — every type role at its real size, weight, leading, and tracking.
- `radius` — every radius step.
- `spacing` — every spacing step.
- `elevation` — every shadow level, rendered against the canvas.
- `components` — buttons, inputs, and cards in default, focus, and disabled states.
- `surfaces` — the real product surfaces the language must survive: app shell, data
  table, auth form, modal, toast, empty state, navigation, footer. Expected for pages,
  flows, and app UI; a single component may omit it and say why in Known Gaps.

Every specimen uses `var(--token)`. No exceptions. The catalog is the proof that the
language works beyond the hero.

### 7.3 Artifact rules

- One HTML document per artifact per option, at `option-x/index.html`.
- Full page: compose the whole surface with real content, no lorem ipsum.
- Section: show it inside a minimal page so its spacing and hierarchy are honest.
- Component: build a specimen page with variants, sizes, and interaction states.
- States: default, hover, focus, loading, empty, error, success, and disabled where
  they apply. Show them side by side when the comparison matters.
- Flow: link the screens in order or lay them side by side. Do not fake interaction
  that the artifact cannot actually perform.
- Responsive at 320 / 390 / 768 / 1440. Mobile-first.
- Motion: at most one orchestrated moment. No ambient noise.
- CSS: flat specificity, no clashing `.section` versus element selectors, tokens over
  magic values.
- Assets: local/project assets or CSS/SVG. Say so before using an external CDN.
- Copy: active voice, sentence case, specific, consistent verbs. Name things by what
  people control, not by how the system is built.

### 7.4 Validate before serving

```bash
scripts/check-design.mjs --design-dir /abs/path --pretty
```

It fails on: broken token references, token drift between `DESIGN.md` and
`tokens.css`, missing required sections, empty Known Gaps, missing provenance,
missing `system.html` or its specimens, and raw color literals in any CSS outside
`tokens.css` or in artifact markup. Fix every error and every warning that indicates
drift before showing the workspace.

## 8. Serve it

```bash
scripts/start-preview.sh --design-dir /abs/path
```

Prints JSON:

```json
{"url":"http://localhost:PORT/","gallery":"http://localhost:PORT/","state":"/abs/path/.preview"}
```

- Open the URL. If browser tooling is available (for example omp `browser.open`),
  verify rendering and console errors, check accessibility, and capture desktop and
  mobile screenshots before reporting.
- The gallery groups options by artifact and renders them side by side at the same
  viewport, so differences are visible at a glance. Each group links its `DESIGN.md`
  and `system.html`.
- Direct file URLs serve one artifact full-screen.
- Live reload on file changes.
- Binds `127.0.0.1` by default, picks a free port, and exits after 30 minutes idle.

Server contract:

- `GET /` gallery; `GET /<path>` static file; `GET /__reload` live-reload stream.
- State and logs in `<design-dir>/.preview/`.
- Path traversal is rejected; no directory outside the design workspace is served.
- Zero runtime dependencies.

## 9. Review loop

- Every turn: URL, validator status, one line on what to look at, and which options
  are new or changed.
- Ask the choice explicitly: "Which option should I refine — or do you want another
  direction?"
- Review the language as well as the pixels: tokens, type ramp, depth, states,
  collapse behavior, and the catalog at 320 px.
- Merge browser feedback (clicks/screenshots) with terminal feedback. Treat browser
  screenshots as image input: inspect them and record findings; use DOM/ARIA when the
  screenshot alone cannot prove a behavior.
- When the user picks one: mark it, refine it in place, and keep the alternatives
  reachable.
- When the user asks for another: add `option-d` (or the next letter). Never replace an
  existing option.
- When the user mixes: build the combination as a new option and say what came from
  where.
- Record the chosen option, the reason, and the principle it protects in
  `DECISIONS.md`. "Looks better" is not a reason; name the trade-off.
- Iterate until the user approves the visual and the language.

## 10. Handoff

- Stop the server: `scripts/stop-preview.sh <design-dir>`, unless the user is still
  comparing options.
- Summarize artifacts, options, states, references, design tokens, and files.
- Confirm the chosen option and record it in `DECISIONS.md`.
- `DESIGN.md`, `tokens.css`, and `system.html` travel with the chosen option. The
  Agent Prompt Guide is the entry point for another session.
- Keep approved designs. Delete throwaway workspaces only with consent.
- If the user wants to apply the chosen option, continue to section 11.

## 11. Apply the chosen option to the project

Trigger: the user says "apply", "implement", "levar para o código", "usar a opção B",
or similar. This is the only step allowed to modify application source. If no option is
recorded in `DECISIONS.md`, ask which one. If the target screen or route is ambiguous,
ask one question.

Before editing:

- Locate the design workspace from the handoff. If the path is unknown, ask; do not
  reconstruct the design from memory.
- Re-read the chosen `DESIGN.md`, `tokens.css`, `system.html`, `DECISIONS.md`, and
  `REFERENCES.md`.
- Read the target route/page, its components, theme tokens, i18n, and data layer.
- Build a mapping: each mockup region → existing or new component; each DESIGN.md
  token → existing project token or a proposed token.
- If the project already has a `DESIGN.md` or token file, **propose a merge** and show
  the diff. Never overwrite the project's language with the option's.
- Reuse first. Add a token or component only when nothing existing fits, and say why.

Implementation:

- Translate the mockup into the project's architecture. Never paste mockup HTML or CSS
  into the app.
- Follow the project's rules: framework, TypeScript strictness, UI library, file split,
  class naming, import aliases, and test runner. For a Vue 3 + PrimeVue project that
  means Composition API, the four-file component split, BEM/component-prefixed
  classes, the `@/` alias, and Vitest.
- Wire real state, data, routing, and i18n. Do not leave lorem ipsum, fake handlers, or
  mock arrays in production code.
- If the design needs data or behavior the project does not have, stop and ask. Do not
  invent endpoints, permissions, or business rules.
- Preserve the accessibility contract: semantics, names, focus order, keyboard
  behavior, contrast, targets, and reduced motion.
- Keep the change scoped. Do not refactor unrelated files or add features the chosen
  option did not contain.

Verification:

- Run the project's type-check, lint, and tests; fix regressions.
- Run the real app and compare against the chosen mockup at 320 / 390 / 768 / 1440.
- Do a keyboard-only pass and a contrast/target check on the real UI.
- Remove preview-only scaffolding, temporary routes, and unused assets.
- Report: files changed, tokens/components added, deviations from the mockup, and the
  verification evidence.

Do not commit or open a PR unless asked. Keep the design workspace as the reference;
never commit `.preview` or the workspace itself.

## 12. Analysis-only workflow

Use when the user asks to analyze a site, brand, product, or screenshot without
building a page.

1. **Scope.** Confirm what is being analyzed and why: a reference, a critique, a
   rebuild, or just documentation.
2. **Evidence.** Follow section 2. Record viewport, date, method, and confidence.
3. **Tokens.** Extract the surface ladder, color roles, type ramp, spacing, radius,
   elevation, and component states. Mark screenshot-only samples as approximate.
4. **Write `DESIGN.md`.** Same thirteen sections. Set `artifact: analysis`, a real
   `provenance.method`, and `source_url`. Label the document an **inspired
   interpretation** in the Overview.
5. **Build `system.html`.** The catalog is mandatory even without a page mockup; it is
   how the user checks the extraction.
6. **Record the limits.** Known Gaps lists what a single page, a gated flow, or a
   screenshot could not reveal.
7. **No server unless asked.** Deliver the files and the notes. If the user then wants
   a preview, switch to the standard workflow.

Never reproduce a brand's logo, illustrations, or copy as your own work. If the user
asks for a production clone of a third-party identity, flag the trademark and propose
an original direction that keeps the functional qualities.

## Definition of done

- [ ] 2–3 distinct options presented side by side for each new request
- [ ] Options differ in thesis, not only in color or spacing
- [ ] Every option has `DESIGN.md`, `tokens.css`, `system.html`, and the artifact
- [ ] `DESIGN.md` has real provenance: source, date, method, confidence
- [ ] Every `{token.ref}` resolves; Known Gaps is written
- [ ] `tokens.css` mirrors `DESIGN.md` 1:1, with no unexplained drift
- [ ] No raw color, type, radius, spacing, or shadow outside `tokens.css`
- [ ] `system.html` renders swatches, type ramp, radius, spacing, elevation,
      components, and the surfaces that apply
- [ ] `scripts/check-design.mjs` exits 0
- [ ] Current references gathered from primary sources and recorded in
      `REFERENCES.md`
- [ ] Provided images analyzed and recorded in `IMAGE-NOTES.md`
- [ ] Image-only and analysis-only requests delivered without starting a server
- [ ] WCAG 2.2 AA verified: keyboard, focus, names, contrast, 24×24 targets,
      44×44 preferred, reflow at 320 px and 200% zoom
- [ ] Every requested artifact exists at 320 / 390 / 768 / 1440
- [ ] Variants and relevant states covered
- [ ] Real copy, no placeholders
- [ ] Gallery URL shared, validator result reported, server stopped
- [ ] No app source or dependencies modified without approval
- [ ] When applying: project DESIGN.md/tokens merged, not overwritten
- [ ] When applying: chosen option verified in the real app at 320 / 390 / 768 / 1440
- [ ] When applying: project type-check, lint, and tests pass
- [ ] When applying: no mockup markup, preview state, or fake data left in production

## Anti-patterns

- Claiming to have seen an image the active model cannot read.
- Guessing cropped, blurred, or hidden details instead of stating limits.
- Treating sampled screenshot colors as exact design tokens.
- Ignoring a provided image and designing from scratch.
- Using stale or undated blog snippets instead of primary docs.
- Citing draft specs as requirements.
- Adding ARIA where native HTML already works.
- Treating accessibility as a post-build checklist.
- Delivering one design when options were expected.
- Selling cosmetic variants as distinct options.
- Replacing existing options when the user asks for another.
- Describing a design instead of building it.
- Presenting wireframe boxes as final UI.
- Asking for approval before there is anything to see.
- Inflating a component request into a full page, or shrinking a page into a component.
- Generic AI-default aesthetics.
- Shipping an artifact without its `DESIGN.md` and `system.html`.
- A design language that exists only in prose, with no catalog to prove it.
- Hardcoded hex, font sizes, radii, or shadows outside `tokens.css`.
- Token drift between `DESIGN.md` and `tokens.css`.
- Copying a third-party DESIGN.md verbatim and calling it a system.
- Brand cosplay: shipping another company's logo, assets, or identity.
- Treating an inspired analysis as an official specification.
- Inventing values for areas the evidence does not show.
- Pasting mockup HTML/CSS into the application instead of translating it.
- Shipping preview scaffolding, fake handlers, or mock data in production.
- Applying an option without a confirmed choice or target screen.
- Declaring the integration done from the mockup without checking the real app.
- Leaving the server running or artifacts inside the product tree.
