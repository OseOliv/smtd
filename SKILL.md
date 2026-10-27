---
name: show-me-the-design
description: "Use when building, redesigning, or reviewing any frontend visual artifact (page, section, component, state, or flow), comparing 2-3 live on-brand options in a local browser, or critiquing pasted/referenced UI images. Extracts product design tokens first, checks primary sources (WCAG 2.2 AA, WAI-ARIA APG, MDN, Baseline, pinned framework docs), serves runnable HTML/CSS/JS with live reload, and applies the chosen option only on approval."
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
  layout, hierarchy, density, interaction signature, or tone — not only accent color.
- **Start from the product's design system.** Extract real tokens (color, typography,
  radius, shadow, spacing, motion, iconography) and existing components before
  proposing. Default to `faithful` mode; use `exploration` mode only when the user
  explicitly asks for a redesign or new visual direction. Every option must state its
  fidelity mode.
- **Make options feel alive.** Every option requires at least one purposeful
  interaction or motion moment (hover, reveal, transition, or state feedback) with
  `@media (prefers-reduced-motion: reduce)` handling, complete interactive states, and
  real domain content — never a polished wireframe or static box.
- **Be direct — strict question and research budget.** Ask at most one clarification
  round (and only when the brief and codebase do not already answer a blocking
  question). Research only what changes the design decision. Ship the first visible
  preview fast, and reply with the preview URL, one line on what to look at, and an
  explicit choice question.
- **Current primary sources.** Verify only the constraints that affect the decision
  against primary sources (WCAG 2.2 AA, WAI-ARIA APG, MDN, Baseline, and the project's
  pinned framework docs). Record document title, URL, version, and publication/check
  date in `REFERENCES.md`. Never present draft specs as requirements.
- **Images are evidence.** When an image is pasted or referenced, analyze it before
  asking questions. If the active model cannot read images, say so instead of
  guessing.
- **Accessibility is a constraint, not a final pass.** Apply the contract below from
  the first line of markup.
- **Preview never ships.** Applying a chosen option to the app is an explicit step
  (section 10). Mockup HTML, preview CSS, and `.preview` state never enter production
  paths.
- The unit of work is whatever the user needs to see: a page, a section, a component,
  a single state, a set of screens, or a flow. Do not inflate a component request into
  a page, and do not shrink a page request into a component.
- Each option is a complete artifact. Never present three half-finished sketches.
- Never modify application source, dependencies, routes, or config without explicit
  approval.
- Isolate preview artifacts in a design workspace. Default:
  `~/.omp/designs/<timestamp>-<slug>/`. If the user wants them inside the project,
  get approval and keep the workspace gitignored.
- Never end a design turn without the preview URL, one line on what to look at, and an
  explicit choice question.

## Trigger validation matrix

Use this matrix to validate when `show-me-the-design` should and should not trigger:

| Prompt | Trigger? | Why |
|---|---|---|
| "Design a new billing settings page for our app and show me a few options." | Yes | Requests a frontend page with side-by-side options in a browser preview. |
| "Our empty state for the alerts table feels dead. Give me 3 on-brand alternatives." | Yes | Targets a component/state and asks for live, on-brand visual options. |
| "Critique this screenshot `@checkout.png` and show me fixed versions." | Yes | Image critique plus visual artifact generation and comparison. |
| "Redesign our marketing hero section — explore a bolder editorial direction." | Yes | Explicit redesign request; triggers in `exploration` fidelity mode. |
| "Fix the off-by-one pagination bug in `useInvoices.ts`." | No | Logic/data bug with no visual design or UI comparison request. |
| "Add a `created_at` index to the PostgreSQL `orders` migration." | No | Backend database task; no frontend visual artifact involved. |

## Scale

Every row below is repeated per option: 2–3 distinct directions by default.

| Request | Build per option |
|---|---|
| Full page / screen | Complete page composition: header, nav, main, footer, real content |
| Section / block | The section inside a minimal page context, so spacing and hierarchy read correctly |
| Component | A specimen page: variants, sizes, and interactive states on one canvas |
| Single state | The artifact in that state, plus the default beside it when comparison helps |
| Flow | The screens linked in order, or side by side, with the transitions made explicit |

Every artifact is a runnable HTML document. A component specimen is still a document.
For large flows, options may differ at the structural level rather than in every screen.

## 1. Read the brief and the project

Identify:

- Subject, audience, and the job of each artifact.
- Brand/system constraints: colors, fonts, spacing, tone, existing patterns.
- Required artifacts, states, and breakpoints.

### Question budget

- **Zero questions by default** when the brief and codebase already provide enough
  context to build the first preview.
- **At most one clarification round** (1–2 direct questions in a single message) only
  when a blocking ambiguity cannot be answered from the repo or provided images. Never
  run a multi-turn interview before showing a preview.

### Visual-identity contract & fidelity modes

Inspect the project read-only before proposing options: `package.json`, CSS variables,
Tailwind/theme config, token files, existing components, typography, icon sets,
routing, and i18n. Detect the framework, UI library, and their pinned versions.

Extract the product's visual language into `<workspace>/tokens.json` and shared
`<workspace>/tokens.css`:

- **Color:** surfaces, ink/text hierarchy, borders, brand accents, semantic status
  tokens (`success`, `warning`, `danger`, `info`).
- **Typography:** font families (display, sans, mono), size scale, weights, line
  heights, letter-spacing, and numeric formatting (`tabular-nums`).
- **Radius & border:** corner radii (`sm`, `md`, `lg`, `pill`), border widths, hairline
  divider conventions.
- **Shadow & elevation:** card, popover, modal, and sticky-header elevation tokens.
- **Spacing & grid:** base spacing unit, container widths, column gaps, and section
  rhythm.
- **Motion:** duration tokens, easing curves, and transition conventions.
- **Iconography & existing components:** icon stroke/fill style, button/input/badge/table
  idioms that already exist in the product.

Every option must declare one of two fidelity modes:

- **`faithful` (default):** Strictly honors the product's extracted tokens, font stack,
  radii, shadows, and component idioms. Options explore distinct layout, hierarchy,
  density, and workflow trade-offs while looking unmistakably native to the product.
- **`exploration` (only when requested):** Used only when the user explicitly asks for
  a redesign, rebrand, or new visual direction. May propose new palette, typography, or
  surface tokens, and must explicitly document which product tokens it departs from and
  why.

Choose output mode:

- **Standalone preview (default).** Plain HTML/CSS/JS, no build step, no app changes.
- **Project-native (only if asked).** Vue 3 Composition API, the project's UI library,
  and its component-file conventions.

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

Research only what changes the design decision. Do not spend multiple turns browsing
generic articles before building. Prefer primary sources over blog posts and undated
snippets, and match the project's pinned versions rather than unverified latest
releases.

| Need | Primary source |
|---|---|
| Accessibility standard | W3C WCAG 2.2 (AA) |
| Widget behavior and keyboard patterns | WAI-ARIA Authoring Practices Guide (APG) |
| HTML, CSS, JS platform behavior | MDN Web Docs |
| Browser and feature support | Baseline / caniuse |
| Framework and UI library | Official docs for the project's pinned version |
| Design system | Project tokens, components, and style guide |

Rules:

- **Record date and version.** Every entry in `REFERENCES.md` must include:
  - Document title and canonical URL
  - Specification or package version (for example `WCAG 2.2 Recommendation`, `Vue 3.4`,
    `Baseline Widely Available`)
  - Publication or verification date (`YYYY-MM-DD`)
  - The specific constraint it informed in the options
- **Never present drafts as requirements.** Editor's drafts, working drafts, or stage-2
  proposals must never be enforced as normative requirements.
- Extract only the rules that affect the artifact being built. Do not paste whole pages.
- If web access is unavailable, use installed/project docs, record the local package
  version and check date, and state that offline sources were used.

## 4. Design plan — 5 to 10 lines per option, before code

Keep planning tight so the first preview ships fast. For each option (`A`, `B`, `C`),
define:

- **Label & name:** e.g. `A — Compact Ledger`
- **One-sentence thesis:** how this option solves the user's job differently.
- **Fidelity mode:** `faithful` (default, locked to extracted product tokens) or
  `exploration` (explicitly requested redesign).
- **Palette:** 4–6 named hex values drawn from `tokens.json` (or proposed tokens in
  `exploration` mode).
- **Type:** display, body, and utility/mono roles using project or system fonts.
- **Interaction & motion signature:** the purposeful interaction, transition, or state
  feedback that makes this option feel alive (plus its `prefers-reduced-motion`
  behavior).
- **Trade-offs & what to look at:** what this option optimizes for, what it gives up,
  and the specific detail the user should inspect.

Check the set: if two options would be described the same way in a sentence, they are
one option. Replace one. Reject generic AI defaults unless the product's own system or
the brief explicitly calls for them:

- warm cream background + serif display + terracotta accent;
- near-black background + single acid neon accent;
- broadsheet hairlines, dense columns, zero radius when the product uses rounded cards.

Ground every choice in the product's own design system and domain vocabulary.

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
- Shared `tokens.json`, `tokens.css`, and `components.css` per workspace, with
  per-option overrides.
- **Make options feel alive:**
  - Include at least one purposeful interaction or motion moment per option (for
    example: interactive state switcher, expandable detail drawer, live filter/sort,
    inline validation feedback, or choreographed elevation/reveal transition).
  - Always include an explicit `@media (prefers-reduced-motion: reduce)` rule that
    disables non-essential motion while preserving instant state feedback.
- **Complete states, not wireframes:**
  - Implement default, `:hover`, `:focus-visible`, `:active`, loading, empty, error,
    success, and `:disabled` states where they apply.
  - Provide an in-artifact state bar or interactive controls when helpful so the user
    can toggle loading/empty/error states directly in the preview.
- **Real domain content:**
  - Full page: compose the whole surface with realistic domain copy, plausible metrics,
    and authentic identifiers — never `lorem ipsum`, `Foo/Bar`, or grey placeholder
    blocks.
  - Section: show it inside a minimal product page frame so spacing and hierarchy read
    honestly.
  - Component: build an interactive specimen page with variants, sizes, and states.
  - Flow: link the screens in order or lay them side by side with working step
    transitions.
- Responsive at `390` / `768` / `1440`. Mobile-first.
- CSS: flat specificity, no clashing `.section` versus element selectors, product
  tokens over magic values.
- Assets: local/project assets or crisp inline SVG matching the product's icon style.
  Say so before using an external CDN.
- Copy: active voice, sentence case, specific, consistent verbs. Name things by what
  people control, not by how the system is built.

### Componentized comparison metadata (`options.json` & `<meta name="smtd-*">`)

So the preview gallery can render isolated, side-by-side comparison cards with full
context, supply metadata for every option via `<artifact>/options.json` (or workspace
`options.json`) **and** matching `<meta name="smtd-*">` tags in each option's `<head>`:

1. **`<artifact>/options.json`** (array or `{ "options": [...] }` keyed by file or
   label):

   ```json
   {
     "options": [
       {
         "file": "option-a.html",
         "label": "A",
         "title": "Compact Ledger",
         "thesis": "High-density split view that keeps invoice line items and approval actions above the fold.",
         "fidelity": "faithful",
         "palette": ["#0F172A", "#F8FAFC", "#2563EB", "#16A34A", "#E2E8F0"],
         "type": "Inter (display/body) · JetBrains Mono (amounts)",
         "tradeoffs": "Fits 2x more rows on 1440px, but truncates long vendor notes to a drawer.",
         "lookAt": "Try the inline status filter and keyboard row selection."
       }
     ]
   }
   ```

2. **HTML `<meta name="smtd-*">` fallback tags** inside each `option-*.html` so
   standalone files carry their own card metadata:

   ```html
   <meta name="smtd-label" content="A">
   <meta name="smtd-title" content="Compact Ledger">
   <meta name="smtd-thesis" content="High-density split view that keeps invoice line items and approval actions above the fold.">
   <meta name="smtd-fidelity" content="faithful">
   <meta name="smtd-palette" content="#0F172A, #F8FAFC, #2563EB, #16A34A, #E2E8F0">
   <meta name="smtd-type" content="Inter (display/body) · JetBrains Mono (amounts)">
   <meta name="smtd-tradeoffs" content="Fits 2x more rows on 1440px, but truncates long vendor notes to a drawer.">
   <meta name="smtd-look-at" content="Try the inline status filter and keyboard row selection.">
   ```

## 7. Serve it

```bash
scripts/start-preview.sh --design-dir /abs/path
```

Prints JSON:

```json
{"url":"http://localhost:PORT/","gallery":"http://localhost:PORT/","state":"/abs/path/.preview"}
```

- Open the URL immediately once the initial options are written. If browser tooling is
  available (for example omp `browser.open`), verify rendering and console errors,
  check accessibility, and capture desktop and mobile screenshots before reporting.
- The gallery renders one isolated comparison card per option (`A`, `B`, `C`) side by
  side at the same synchronized viewport (`390`, `768`, or `1440`), showing each
  option's badge, title, fidelity mode (`faithful` / `exploration`), thesis, color
  palette swatches, typography summary, trade-offs, "what to look at" callout, interactive
  iframe toggle, and full-screen link.
- Direct file URLs serve one artifact full-screen.
- Live reload on file changes.
- Binds `127.0.0.1` by default, picks a free port, and exits after 30 minutes idle.

Server contract:

- `GET /` gallery; `GET /<path>` static file; `GET /__reload` live-reload stream.
- State and logs in `<design-dir>/.preview/`.
- Path traversal is rejected; no directory outside the design workspace is served.
- Zero runtime dependencies.

## 8. Review loop (fast, direct replies)

- **Ship the first visible version fast.** Do not write multi-paragraph essays before
  or after starting the preview server; the comparison cards in the gallery already
  display the thesis, palette, type, and trade-offs.
- **Every design turn reply must be concise and contain three things:**
  1. **The preview URL** (and which options are new or updated).
  2. **One line on what to look at** (the key interaction or trade-off to test).
  3. **An explicit choice question:** e.g. `"Which option should I refine (A, B, or C) — or do you want a new direction or a mix?"`
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
- Re-read the chosen artifact, `tokens.json`, `DECISIONS.md`, and `REFERENCES.md`.
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

- [ ] Product design tokens and existing components extracted first (`tokens.json` / `tokens.css`)
- [ ] Every option declares its fidelity mode (`faithful` by default, `exploration` only when requested)
- [ ] 2–3 distinct options presented side by side in isolated A/B/C comparison cards
- [ ] Options differ in thesis, not only in color or spacing
- [ ] Every option includes purposeful interaction/motion (`prefers-reduced-motion` compliant), complete states, and real domain content
- [ ] Card metadata provided via `options.json` and/or `<meta name="smtd-*">` tags (title, thesis, fidelity, palette, type, trade-offs, what to look at)
- [ ] At most one clarification round when needed; fast first preview delivered with `URL + one line + explicit choice`
- [ ] Current references gathered from primary sources with version and date recorded in `REFERENCES.md` (no draft specs treated as requirements)
- [ ] Provided images analyzed and recorded in `IMAGE-NOTES.md`
- [ ] Image-only analysis requests delivered notes without starting a server
- [ ] WCAG 2.2 AA verified: keyboard, focus, names, contrast, 24×24 targets, reflow
- [ ] Every requested artifact works at 390 / 768 / 1440
- [ ] Gallery URL shared and server stopped on handoff
- [ ] No app source or dependencies modified without approval
- [ ] When applying: chosen option verified in the real app at 390 / 768 / 1440
- [ ] When applying: project type-check, lint, and tests pass
- [ ] When applying: no mockup markup, preview state, or fake data left in production

## Anti-patterns

- Ignoring the product's design system and inventing generic off-brand styles in `faithful` mode.
- Switching to `exploration` mode when the user did not ask for a redesign.
- Delivering static, lifeless mockups with no hover, focus, transition, or state feedback.
- Omitting `@media (prefers-reduced-motion: reduce)` when adding motion.
- Omitting option metadata (`options.json` or `<meta name="smtd-*">`) so comparison cards lack thesis, palette, type, trade-offs, or focus points.
- Running multi-turn interviews or lengthy research monologues before showing a first preview.
- Claiming to have seen an image the active model cannot read.
- Guessing cropped, blurred, or hidden details instead of stating limits.
- Treating sampled screenshot colors as exact design tokens.
- Ignoring a provided image and designing from scratch.
- Using stale or undated blog snippets instead of primary docs with recorded version and date.
- Citing draft specs as normative requirements.
- Adding ARIA where native HTML already works.
- Treating accessibility as a post-build checklist.
- Delivering one design when options were expected.
- Selling cosmetic variants as distinct options.
- Replacing existing options when the user asks for another.
- Describing a design instead of building it.
- Presenting wireframe boxes or `lorem ipsum` as final UI.
- Asking for approval before there is anything to see.
- Inflating a component request into a full page, or shrinking a page into a component.
- Generic AI-default aesthetics (warm cream + terracotta serif, acid-on-black, random brutalist hairlines).
- Pasting mockup HTML/CSS into the application instead of translating it.
- Shipping preview scaffolding, fake handlers, or mock data in production.
- Applying an option without a confirmed choice or target screen.
- Declaring the integration done from the mockup without checking the real app.
- Leaving the server running or artifacts inside the product tree.
