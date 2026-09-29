# figma-build-qa

Turn a Figma design into a pixel-perfect React + Tailwind implementation by **consuming design data exactly, verifying every value, and building to specification**.

**Read this as instructions to execute, not documentation to summarize.** Each phase ends with a STOP gate. Do not enter the next phase until the gate condition is met.

**One process. All builds.** Whether building from a Jira ticket, a standalone Figma frame, or a full screen: execute this workflow every time. No shortcuts. No branches. No exceptions.

---

## The Mandate

Every pixel in the design is intentional. The build must match the design exactly.

- **Pixel-perfect accuracy:** measure, verify, match—do not approximate
- **Consume, don't eyeball:** every value comes from the Figma skeleton or a mapped token
- **Rigorous verification:** before claiming done, prove every element matches the spec
- **No negotiation:** follow the design as specified; if a real blocker emerges, surface it then

---

## Prerequisites (once per project)

- **React + Tailwind project.** Any React app with Tailwind configured.
- **Figma read-only token.** Set `$FIGMA_TOKEN` or write to `~/.config/figma/token`. Get one at https://www.figma.com/developers/api#access-tokens.
- **The REST helper.** `scripts/figma-fetch.mjs` in this skill folder. Commands: `url`, `nodes`, `image`, `vars`, `styles`.
- **The build log.** `build-log.md` in this skill folder. Read the relevant entry before building; append after passing all gates.
- **QA folder.** `qa/<task-slug>/` for checklists, specs, side-by-sides, and verification tables.

---

## Phase 0 - Setup (run first, every build)

1. `ls src/components 2>/dev/null || ls components 2>/dev/null || echo "NO components dir"` — record the existing component/asset folder convention.
2. Identify the preview entry file (e.g., `src/App.tsx`, `index.html`). Note its directory.
3. Confirm Tailwind is wired: find `tailwind.config.*` or the CDN script tag. Note any custom theme tokens.
4. `node <skill>/scripts/figma-fetch.mjs url "<figma-url>"` to get `fileKey` and `nodeId`.

**STOP GATE 0:** Write one sentence: (a) the component/asset folder convention, (b) preview file's directory, (c) Figma fileKey + nodeId. No code yet.

---

## Phase 0.5 - Generate the run checklist (MANDATORY)

**Why:** the user cannot verify whether you executed each phase unless it's visible and dated on disk.

1. Pick a `<task-slug>` (kebab-case, e.g., `pricing-hero`, `nav-bar`).
2. `mkdir -p qa/<task-slug>` at the project root.
3. Write `qa/<task-slug>/checklist.md` from the template below. Every box starts `[ ]`.
4. Print exactly `Checklist: qa/<task-slug>/checklist.md` in your reply.
5. Flip `[ ]` to `[x]` the moment each item is done. Never batch-check. Never check an item not yet done.

```markdown
# figma-build-qa checklist - <task title>
Source: <Figma fileKey + nodeId, or Jira ticket ID>
Started: <timestamp>

## Phase 0 - Setup
- [ ] Recorded component/asset folder convention
- [ ] Identified preview entry file + directory
- [ ] Confirmed Tailwind wired; noted custom theme tokens
- [ ] Parsed fileKey + nodeId
- [ ] Wrote STOP GATE 0 sentence

## Phase 0.5 - Checklist
- [ ] Created qa/<task-slug>/
- [ ] Wrote this checklist
- [ ] Printed checklist path in reply

## Phase 1 - Spec pull
- [ ] figma-fetch nodes on parent frame -> qa/<task-slug>/skeleton.json
- [ ] figma-fetch image on parent frame -> qa/<task-slug>/figma-parent.png
- [ ] Per-element spec written to qa/<task-slug>/specs/ (exact values, no "roughly")
- [ ] STOP GATE 1 satisfied

## Phase 1.4 - Component inventory
- [ ] Grepped project for each candidate component
- [ ] Components Referenced table written (REUSE / EXTEND / NEW, every NEW justified)

## Phase 1.5 - Animation spec (skip if none)
- [ ] Timeline table written; internal animations listed

## Phase 2 - Asset download (skip if none)
- [ ] Every asset rendered from Figma to disk
- [ ] Relative paths written down; no temp/localhost URLs

## Phase 3 - Implementation
- [ ] All components built from spec values (no eyeballing)
- [ ] Padding/margin traced into comments
- [ ] Font size/weight/lineHeight/letterSpacing match spec
- [ ] Colors are exact tokens or hex from skeleton
- [ ] All interactive states present or noted absent

## Phase 3.5 - Measurement Audit (MANDATORY)
- [ ] Spec-vs-implementation verification table written
- [ ] Every element verified: padding, color, size, weight, spacing, icon
- [ ] No "roughly" or approximations in verification
- [ ] All values trace back to skeleton or mapped token
- [ ] STOP GATE 3.5 satisfied (zero unverified values)

## Phase 4 - Three blocking gates
- [ ] GATE 1 structure passed (DOM matches skeleton)
- [ ] GATE 2 code passed (lint/typecheck/console clean at rest and on interaction)
- [ ] GATE 3 visual passed (side-by-side vs Figma: DIFF: none)
- [ ] All three ran; none skipped

## Phase 5 - Pre-commit
- [ ] No temp/localhost URLs in code
- [ ] Zero console errors, zero 404s on reload
- [ ] build-log.md entry appended
- [ ] Committed

## Phase 6 - Design Quality Check
- [ ] Ran design quality dimensions (typography, spacing, color, hierarchy, states)
- [ ] Ran AI slop detection (10 patterns checked)
- [ ] Design quality report written to qa/<task-slug>/design-quality.md
```

**STOP GATE 0.5:** The checklist file exists on disk AND its path is printed in your reply.

---

## Phase 1 - Spec pull (before any code)

Identify the **source** ($SOURCE):
- Figma frame/node → use the REST helper (below)
- Jira ticket → read title + AC; follow any linked Figma
- PRD / spec doc → read the section being built
- Screenshot/dev site only → ask for the Figma link before proceeding

**For a Figma node:**

1. **Pull the skeleton** (geometry, layout, text, typography, fills, corner radius, effects—all data):
   ```bash
   node <skill>/scripts/figma-fetch.mjs nodes <fileKey> <nodeId> > qa/<task-slug>/skeleton.json
   ```

2. **Pull the reference image**:
   ```bash
   node <skill>/scripts/figma-fetch.mjs image <fileKey> <nodeId> 2 qa/<task-slug>/figma-parent.png
   ```

3. **Pull tokens** (if available):
   ```bash
   node <skill>/scripts/figma-fetch.mjs vars <fileKey>
   node <skill>/scripts/figma-fetch.mjs styles <fileKey>
   ```

4. **Read each distinct child node in the skeleton.** Write the spec per element—nothing is assumed:
   - width × height (`absoluteBoundingBox`)
   - padding directional: `paddingTop/Right/Bottom/Left` → Tailwind `pt-/pr-/pb-/pl-`
   - layout: `layoutMode` (HORIZONTAL/VERTICAL) → `flex-row/col`, `itemSpacing` → `gap-`
   - alignment: `primaryAxisAlignItems` / `counterAxisAlignItems` → `justify-`/`items-`
   - fills / gradients: exact hex or token name
   - per text node: `fontSize`, `fontWeight`, `lineHeightPx`, `letterSpacing`, color
   - every image/vector node id needing a rendered asset

**Source-of-truth priority:** (1) Figma skeleton measurements (pixel-exact). (2) Mapped design token (Tailwind theme / Figma variable). (3) Never approximate.

**STOP GATE 1:** The plan contains measured specs for every element. No "roughly," "about," or approximations. No code yet.

---

## Phase 1.4 - Component inventory (MANDATORY)

**Before writing ANY React code:**

1. From Phase 1, list every element (button, card, badge, icon, input, divider, avatar, tab, etc.).
2. Grep the project for each candidate:
   ```bash
   grep -rnE "^export (function|const) [A-Z]" src/ components/
   ```
   Also check any component library the project uses (shadcn/ui, Radix, MUI, etc.).
3. Write a **Components Referenced** table:

   | Figma element | Code name | Location | Status |
   |---------------|-----------|----------|--------|
   | Primary CTA   | `Button`  | `components/ui/button.tsx` | REUSE |
   | Badge         | `Badge`   | `components/ui/badge.tsx` | REUSE |
   | Custom card   | `-`       | `-`                | NEW    |

4. For every `NEW` row, justify in one sentence. "It's slightly different" is not a justification—extend with a prop instead.
5. For every `REUSE`/`EXTEND` row, open the component and confirm it supports the variant you need.

**STOP GATE 1.4:** The table is written. Every row has a status. Every NEW row is justified. No JSX yet.

---

## Phase 1.5 - Animation spec (skip if none)

1. Find the reference timing (delays, durations, easings) from the design.
2. Watch the reference run in Figma. Describe in one sentence what animates, in what order.
3. List every internal animation the target component already has (mounts regardless).
4. Write the timeline as a table (`t=0 mounts`, `t=200 fades in`, ...).
5. Check the nested-component trap: a component inside another render body remounts on every parent re-render.

**The one rule: do not step on the reference component's internal animations.**

**STOP GATE 1.5:** Timeline table written. Internal animations listed. No animation code yet.

---

## Phase 2 - Asset download (skip if none)

For every image or icon that must be a real asset:

1. Render it from Figma:
   ```bash
   node <skill>/scripts/figma-fetch.mjs image <fileKey> <nodeId> 2 <assetdir>/<name>.png
   ```
2. `ls -la <dest>` — confirm non-zero size.
3. Compute the relative path from the preview file to the asset.
4. Reload the preview and confirm no 404.

**Never hand-draw an SVG when Figma has one. Render it, save it, reference it.**

**STOP GATE 2:** Every asset exists on disk. Relative path written. No 404.

---

## Phase 3 - Implementation

Write the component in React + Tailwind.

- **Every value comes from the Phase 1 spec.** Padding, gap, font, color—the numbers you wrote down, not new guesses.
- **Trace directional padding into a JSX comment** above the element.
- **Prefer Tailwind theme tokens**, but never at the cost of fidelity. If the spec says `13px` and Tailwind has no `13px` step, use `text-[13px]`. Exact arbitrary value beats approximate token.
- **Reuse components from the Phase 1.4 table.** Do not pattern-match to a component you did not put in the table.
- **For every `src=/href=/url(...)`, use the exact relative path from Phase 2.** No `localhost:*`, `file://`, or Figma render URLs in committed code.

**STOP GATE 3:** Every asset reference resolves to a file on disk.

---

## Phase 3.5 - Measurement Audit (THE CRITICAL GATE)

**This is the step that prevents drift.** Before gates, prove every value matches the spec.

1. **Create a verification table** in `qa/<task-slug>/measurement-audit.md`:

   | Element | Property | Spec (Skeleton) | Implemented | Verified |
   |---------|----------|-----------------|-------------|----------|
   | Card | padding | `pt-4 pr-6 pb-4 pl-6` (16/24/16/24px) | `pt-4 pr-6 pb-4 pl-6` | ✓ |
   | Badge | backgroundColor | `#adb2bb` (token: gray-400) | `#adb2bb` | ✓ |
   | Heading | fontSize | `32px` | `text-3xl` (30px) → `text-[32px]` | ✓ |
   | Heading | fontWeight | `600` | `font-semibold` (600) | ✓ |
   | Body text | lineHeight | `24px` | `leading-6` (24px) | ✓ |

2. **For every distinct element and property:**
   - Read the exact value from the skeleton (`skeleton.json` from Phase 1)
   - Measure the implemented value (inspect the DOM, check your code)
   - Write both in the table
   - Mark `✓` only when they match pixel-for-pixel or token-for-token

3. **No approximations.** If the spec says `#adb2bb` and you implemented `#999999`, that's a mismatch—mark it, fix it, re-verify.

4. **Every element, every property.** Don't skip the "obvious" ones. The detail is where drift happens.

**STOP GATE 3.5:** The verification table is complete. Every row marked `✓`. Zero unverified values. No "roughly" or "close enough" anywhere.

---

## Phase 4 - Three blocking gates

**You own the verdict.** All three gates must run and pass. A skipped gate BLOCKS.

### GATE 1 - Structure check

Compare the rendered DOM against the skeleton:
- Identity + child set/order match
- Cardinality correct (5 items in Figma = 5 items rendered, not 3 with ellipsis)
- Per-column widths match skeleton
- Content fill correct (no fabricated text, no swallowed strings)
- Value provenance: each weight/size/color traces to a skeleton value or mapped token

STOP if any element is missing, reordered, wrong-count, or unprovenanced.

### GATE 2 - Code check

Static + runtime, at rest and on interaction:

**Static:**
- Lint/typecheck passes (`eslint`, `tsc --noEmit`, or project's tool)
- No invalid props, no type errors, no unused

**Console (at rest):**
- Reload; zero React errors, zero warnings, zero nesting warnings, zero key warnings

**Console (on interaction):**
- For every interactive part (menu, dropdown, filter, modal, tab):
  - Exercise it (click, toggle, open)
  - Re-check console on each resulting state
  - A React error/warning on interaction BLOCKS exactly like a first-paint error

STOP if lint/typecheck fails or console shows any error/warning at rest or on interaction.

### GATE 3 - Visual check (pixel-perfect)

1. Screenshot the rendered component.
2. Put it side-by-side with the Phase 1 reference image. Save both to `qa/<task-slug>/diff-<component>.md`.
3. Scan systematically:
   - Column width, alignment, badge position + size + color
   - Gradient stops, shadow
   - Type size/weight per node, spacing between text lines
   - Section gaps, spacing between elements
   - Corner radius, border styles
4. Write a DIFF bullet list. Fix each diff item, re-screenshot, re-diff.
5. Emit `DIFF: none` **only when truly empty**, with the side-by-side saved as proof.

**Lead your report to the user with the GATE 3 side-by-side**, then structure and code results, then the DIFF list.

STOP - no `DIFF: none` claim without a saved side-by-side.

---

## Phase 5 - Pre-commit

1. `grep -rnE 'localhost:[0-9]+|file://|127\.0\.0\.1:|figma\.com|s3-alpha' <code-dirs>` — expect empty.
2. Reload the preview — zero console errors, zero 404s.
3. **Append a `build-log.md` entry** (what worked, what did not, pattern worth repeating). This is the flywheel; skipping it is skipping the point.
4. Commit. Reference the checklist path in the message.

**STOP GATE 5:** No temp URLs in code. Zero 404s. build-log entry written.

---

## Phase 6 - Design Quality Check (non-blocking observation)

Run after all gates pass. This is a design craft layer—does not fail the build, surfaces design team awareness.

### 6.1 Five Dimension Scores

Rate each as **Strong / Acceptable / Needs Work**:

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Typography | | Heading scale, weight contrast, consistency |
| Spacing | | Grid discipline, rhythm, padding consistency |
| Color | | Token usage, contrast, palette discipline |
| Hierarchy | | Visual weight, scan path, information priority |
| Interaction States | | Hover, focus, active, disabled, loading |

### 6.2 AI Slop Detection

Check for these 10 patterns. Flag if found; note where/how.

1. **Gradient hero** — decorative blue-to-purple hero background
2. **3-column icon grid** — symmetrical grid with icons above centered text
3. **Uniform border-radius** — same radius everywhere regardless of role
4. **Centered body text** — paragraphs center-aligned instead of left
5. **Floating decorative blobs** — abstract shapes as background decoration
6. **Too many colors** — more than 6 non-gray colors on one screen
7. **Flat heading scale** — headings too close in size (less than 1.5x ratio)
8. **Missing interaction states** — interactive elements with no hover/focus/active
9. **Bubbly everything** — soft rounded UI applied uniformly
10. **Generic CTA styling** — primary button looks like every other SaaS product

### 6.3 Design Quality Report

Save to `qa/<task-slug>/design-quality.md`:

```markdown
## Design Quality

| Dimension | Rating | Notes |
|-----------|--------|-------|
| Typography | Strong | Heading scale is clear; weight contrast well used |
| Spacing | Acceptable | Grid mostly consistent; one gap feels slightly off |
| Color | Strong | Token usage clean; contrast solid |
| Hierarchy | Strong | Scan path clear; visual weight appropriate |
| Interaction States | Strong | Hover, focus, active all present and distinct |

**AI Slop Check**
- No AI slop patterns detected.
```

**STOP GATE 6:** Design quality report written. Saved to disk.

---

## Anti-patterns — stop if you catch yourself

- Eyeballing a value off the screenshot instead of reading the skeleton
- "This looks like an existing component, I'll reuse it" — you must still put it in Phase 1.4 table
- "This looks like nothing we have, I'll build it" — you must still run Phase 1.4 grep
- "I'll fix the URLs later" — you won't. Fetch → save → relative path, now
- Hand-drawing an SVG when Figma has the asset
- Rounding an exact spec value to the nearest Tailwind step and calling it a match
- Skipping Phase 3.5 (Measurement Audit) — this is mandatory, not optional
- Declaring done with fewer than three gates run — all three must run and pass
- Claiming `DIFF: none` without a saved side-by-side
- Leading the report with "validated" instead of the visual side-by-side

---

## The Flywheel - build-log.md

`build-log.md` in this skill folder is the memory that makes the next build faster.

- **Before** building something that resembles a past build, read the matching entry.
- **After** a build passes all gates, append an entry: what worked, what did not, one pattern worth repeating.
- A pattern that shows up in **two** separate entries is a candidate to promote into this SKILL.md.

---

## Activation Triggers

Use this skill whenever:
- Building a component, screen, or flow from a Figma design
- Implementing a Jira ticket with a Figma link
- Converting a design into React + Tailwind code
- The user shares a Figma frame or URL with intent to produce code

**Always execute Phases 0-6 in order. No shortcuts. No branches. One process. All builds.**

---

## Your Role

- **Consume, don't eyeball.** Extract values from the skeleton.
- **Measure, don't approximate.** Every value comes from the spec or a mapped token.
- **Verify, don't claim.** Phase 3.5 forces measurement verification before gates.
- **Build pixel-perfect.** Match the design exactly—this is the mandate.
- **Report with proof.** Lead with the visual side-by-side, not self-declarations.

**Build as specified. No exceptions. No negotiations. Every pixel is intentional.**
