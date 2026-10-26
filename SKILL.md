---
name: show-me-the-design
description: "Build any frontend visual artifact — a full page, screen, section, component, state, or flow — and show it in a local browser for review. Always presents 2-3 distinct options side by side so the user can choose, request another, or mix them. Also analyzes pasted or referenced images as design briefs, visual references, or critique targets. Researches current frontend and accessibility references (WCAG 2.2 AA, WAI-ARIA APG, MDN, framework docs) before designing. Produces isolated runnable HTML/CSS/JS, serves it on localhost with live reload, and iterates from browser feedback. Never modifies app source without approval."
---

# Show Me The Design

You are the design lead. The deliverable is something the user can see, click, and
judge at a local URL — not a description of a design.

## Operating rules

- **Option gate.** For every new visual request, produce 2–3 genuinely distinct
  options and show them side by side. Do not commit to a single direction before the
  user chooses. A single artifact is allowed only when the user explicitly asks for
  one, or after a direction is chosen and the work is refinement.
- Options are alternatives, not cosmetic variants. They must differ in thesis:
  layout, type, density, tone, or signature — not only accent color.
- **Current references first.** Research the platform, framework, and accessibility
  guidance before designing. Use primary sources, note versions, and record them.
- **Images are evidence.** When an image is pasted or referenced, analyze it before
  asking questions. If the active model cannot read images, say so instead of
  guessing.
- **Accessibility is a constraint, not a final pass.** Apply the contract below from
  the first line of markup.
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
- Never end a design turn without the preview URL and a one-line "what to look at".

## Scale

Every row below is repeated per option: 2–3 distinct directions by default.

| Request | Build per option |
|---|---|
| Full page / screen | Complete page composition: header, nav, main, footer, real content |
| Section / block | The section inside a minimal page context, so spacing and hierarchy read correctly |
| Component | A specimen page: variants, sizes, and states on one canvas |
| Single state | The artifact in that state, plus the default beside it when comparison helps |
| Flow | The screens linked in order, or side by side, with the transitions made explicit |

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
fonts, assets, routing, i18n. Detect framework, UI library, and their versions.

Choose output mode:

- **Standalone preview (default).** Plain HTML/CSS/JS, no build step, no app changes.
- **Project-native (only if asked).** Vue 3 Composition API, the project's UI library,
  and its component-file conventions.

Choose fidelity:

- **Wireframe** for layout exploration only.
- **High fidelity** for everything else. Default to high fidelity.

If the user supplied images, treat them as part of the brief and analyze them next.

## 2. Analyze provided images

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
- **Record:** write `IMAGE-NOTES.md` in the workspace with the observations and which
  option each informed. Keep it factual and short.

If the user asks only for image analysis, deliver the notes and stop; do not start a
preview server or build artifacts.

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

Rules:

- Check the document's version and date. Do not present drafts as requirements.
- Extract only the constraints that change this design. Do not paste whole pages.
- If web access is unavailable, use installed/project docs and say so explicitly.
- Record every source in `REFERENCES.md`: URL, title, version/date, and what it
  informed. The gallery can link to it.

## 4. Design plan — 5 to 10 lines per option, before code

For each option, define:

- Name and one-sentence thesis.
- Subject, audience, and the job of the artifact.
- Palette: 4–6 named hex values.
- Type: display, body, and utility roles. Prefer project or system fonts.
- Layout: one-sentence concept plus an ASCII wireframe.
- Signature: the one element this option will be remembered by.
- One justified risk.

Check the set: if two options would be described the same way in a sentence, they are
one option. Replace one. Reject generic defaults unless the brief explicitly asks for
them:

- warm cream background + serif display + terracotta accent;
- near-black background + single acid accent;
- broadsheet hairlines, dense columns, zero radius.

Ground choices in the subject's own world: its materials, instruments, artifacts, and
vernacular. If the brief pins a direction, the brief wins.

## 5. Accessibility contract

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
- **Targets:** at least 24×24 CSS px (WCAG 2.5.8), with adequate spacing.
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

## 6. Build the artifacts

- One HTML document per artifact per option. Organize as
  `<artifact>/option-a.html`, `option-b.html`, `option-c.html`.
- Shared `tokens.css` and `components.css` per workspace, with per-option overrides.
- Full page: compose the whole surface with real content, no lorem ipsum.
- Section: show it inside a minimal page so its spacing and hierarchy are honest.
- Component: build a specimen page with variants, sizes, and interaction states.
- States: default, hover, focus, loading, empty, error, success, and disabled where
  they apply. Show them side by side when the comparison matters.
- Flow: link the screens in order or lay them side by side. Do not fake interaction
  that the artifact cannot actually perform.
- Responsive at 390 / 768 / 1440. Mobile-first.
- Motion: at most one orchestrated moment. No ambient noise.
- CSS: flat specificity, no clashing `.section` versus element selectors, tokens over
  magic values.
- Assets: local/project assets or CSS/SVG. Say so before using an external CDN.
- Copy: active voice, sentence case, specific, consistent verbs. Name things by what
  people control, not by how the system is built.

## 7. Serve it

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
  viewport, so differences are visible at a glance.
- Direct file URLs serve one artifact full-screen.
- Live reload on file changes.
- Binds `127.0.0.1` by default, picks a free port, and exits after 30 minutes idle.

Server contract:

- `GET /` gallery; `GET /<path>` static file; `GET /__reload` live-reload stream.
- State and logs in `<design-dir>/.preview/`.
- Path traversal is rejected; no directory outside the design workspace is served.
- Zero runtime dependencies.

## 8. Review loop

- Every turn: URL, one line on what to look at, and which options are new or changed.
- Ask the choice explicitly: "Which option should I refine — or do you want another
  direction?"
- Merge browser feedback (clicks/screenshots) with terminal feedback. Treat browser
  screenshots as image input: inspect them and record findings; use DOM/ARIA when the
  screenshot alone cannot prove a behavior.
- When the user picks one: mark it, refine it in place, and keep the alternatives
  reachable.
- When the user asks for another: add `option-d` (or the next letter). Never replace an
  existing option.
- When the user mixes: build the combination as a new option and say what came from
  where.
- Record the chosen option and the reason in `DECISIONS.md`.
- Iterate until the user approves the visual.

## 9. Handoff

- Stop the server: `scripts/stop-preview.sh <design-dir>`, unless the user is still
  comparing options.
- Summarize artifacts, options, states, references, and files.
- Confirm the chosen option and record it in `DECISIONS.md`.
- Keep approved designs. Delete throwaway workspaces only with consent.
- If the user wants to apply the chosen option, continue to section 10.

## 10. Apply the chosen option to the project

Trigger: the user says "apply", "implement", "levar para o código", "usar a opção B",
or similar. This is the only step allowed to modify application source. If no option is
recorded in `DECISIONS.md`, ask which one. If the target screen or route is ambiguous,
ask one question.

Before editing:

- Locate the design workspace from the handoff. If the path is unknown, ask; do not
  reconstruct the design from memory.
- Re-read the chosen artifact, `DECISIONS.md`, and `REFERENCES.md`.
- Read the target route/page, its components, theme tokens, i18n, and data layer.
- Build a short mapping: each mockup region → existing or new component; each color,
  type, and spacing value → existing token or a proposed token.
- Reuse first. Add a token or component only when nothing existing fits, and say why.

Implementation:

- Translate the mockup into the project's architecture. Never paste mockup HTML or CSS
  into the app.
- Follow the project's rules. For this repository's Vue stack: Vue 3 Composition API,
  TypeScript strict, PrimeVue, the four-file component split, BEM/component-prefixed
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
- Run the real app and compare against the chosen mockup at 390 / 768 / 1440.
- Do a keyboard-only pass and a contrast/target check on the real UI.
- Remove preview-only scaffolding, temporary routes, and unused assets.
- Report: files changed, tokens/components added, deviations from the mockup, and the
  verification evidence.

Do not commit or open a PR unless asked. Keep the design workspace as the reference;
never commit `.preview` or the workspace itself.

## Definition of done

- [ ] 2–3 distinct options presented side by side for each new request
- [ ] Options differ in thesis, not only in color or spacing
- [ ] Current references gathered from primary sources and recorded in `REFERENCES.md`
- [ ] Provided images analyzed and recorded in `IMAGE-NOTES.md`
- [ ] Image-only analysis requests delivered notes without starting a server
- [ ] WCAG 2.2 AA verified: keyboard, focus, names, contrast, 24×24 targets, reflow
- [ ] Every requested artifact exists at 390 / 768 / 1440
- [ ] Variants and relevant states covered
- [ ] Real copy, no placeholders
- [ ] Gallery URL shared and server stopped
- [ ] No app source or dependencies modified without approval

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
- Leaving the server running or artifacts inside the product tree.
