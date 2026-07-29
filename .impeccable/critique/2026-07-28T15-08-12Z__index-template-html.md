---
target: Index.template.html
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
timestamp: 2026-07-28T15-08-12Z
slug: index-template-html
---
Method: dual-agent (A: general-purpose · B: general-purpose)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Global status bar (loading/success/error) works, but doesn't attribute *which* row/cell is saving when edits overlap |
| 2 | Match System / Real World | 3 | Catalan domain terms fit the business; abbreviated column headers (MÍN, PREU/P) assume tribal knowledge |
| 3 | User Control and Freedom | 2 | Row delete uses native `confirm()` (actions.js:67), no undo, no in-app styled confirmation |
| 4 | Consistency and Standards | 3 | Consistent `.btn`/`.icon-btn`/tooltip patterns; dropdown chevron hidden-at-rest is a standards break (looks like plain text until hovered) |
| 5 | Error Prevention | 2 | Native `confirm()` only gate on destructive delete; no guard against rapid duplicate saves on the same cell |
| 6 | Recognition Rather Than Recall | 3 | Field help icons reduce recall in the modal; table headers themselves have no inline help for abbreviations |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no bulk select/delete/duplicate, no saved filter presets — real friction for repetitive price entry |
| 8 | Aesthetic and Minimalist Design | 3 | Clean neutral palette and token discipline; breakdown-modal 5-column field row risks density overload |
| 9 | Error Recovery | 2 | Raw exception text surfaces verbatim in the status line (state.js:173-175), no Catalan translation or retry action |
| 10 | Help and Documentation | 1 | No onboarding, no docs link; only help is per-field tooltip icons in the modal |
| **Total** | | **23/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment**: Specific in domain modeling (masia color tokens, per-sheet hints, Catalan copy tuned to real sheet semantics, bee-derived "Any" color scheme), but generic in visual system — a standard light-neutral admin CRUD skin (tabs/table/modal/calendar) with a brand veneer (Cormorant Garamond wordmark, sand palette) layered on top. Fine for an Operate surface; just don't oversell it as bespoke.

**Deterministic scan**: `detect.mjs` ran clean against `Index.template.html` (0 findings — expected, it's a shell). Against `components/` and the generated `Index.html`: one `overused-font` warning (Google Fonts Inter, `components/head.html:5`) and two `layout-transition` warnings (`Index.html:631`, `Index.html:678` — `transition: width`, which can cause layout thrash; prefer `transform`/`clip-path`).

**False positives identified in synthesis**:
- The `overused-font` flag is not actionable: `--font-ui: Inter` is a locked, cross-project brand token mandated in the user's own global CLAUDE.md rules, not an incidental AI choice.
- Assessment B's claim that `#addRowBtn` (`Index.html:1421`) has "no visible text content and no aria-label" is a **false positive** — the static markup is empty on purpose; `js/init.js` injects `ICONS.plus + '<span>Fila</span>'` into it at runtime (confirmed at `Index.html:4140`), so the rendered button does have visible text. Not a real issue.
- Assessment B's claim that `.icon-btn` (26×26px) has "no `@media (pointer: coarse)` override anywhere" is also a **false negative** — `css/table.css:105-107` already bumps it to 44×44px under `@media (pointer: coarse)`, specifically for touch devices. Confirmed by direct read earlier in this session. Not a real issue.

**Visual overlays**: Not available — no injection attempt was made or possible (see below).

## Overall Impression

The domain modeling is genuinely thoughtful — this isn't a templated CRUD scaffold, it understands masies, seasons, and the pricing sheet's real shape. But the interaction layer hasn't caught up to how this tool actually gets used day-to-day: a single admin repeatedly entering and adjusting prices has no keyboard efficiency, no bulk actions, and — most importantly — no safety net when they delete a row or hit a save error. The biggest opportunity is closing that gap between "well-modeled data" and "forgiving, efficient editing," which is exactly what an internal Operate tool should optimize for over polish.

## What's Working

- `css/table.css:78-107` — `.icon-btn` opacity and touch-target sizing carry a documented WCAG 1.4.11 contrast rationale (0.55→0.75) and a deliberate `@media (pointer: coarse)` bump to 44px. Real accessibility engineering, not decoration.
- `css/variables.css:9-11` — `--color-muted` was measured and adjusted from ~3.5:1 to ~5:1 contrast with the ratio cited in a comment. Shows actual AA discipline in the token system, confirmed independently by both assessments.
- `js/actions.js:50-57` `handleDuplicateRow` — a small, well-considered domain shortcut (blanks Id/DATA so the backend regenerates them) that directly serves the repetitive "copy a price row, tweak the date" workflow.

## Priority Issues

**[P0] Row deletion has no safety net.** `js/actions.js:67` gates delete behind a native browser `confirm()` with no undo and no context about what's being removed. In a pricing database this is destructive and irreversible — one misclick during a busy edit session permanently loses a price row.
- **Why it matters**: destroys trust in the tool and real data with zero recovery path.
- **Fix**: replace with a styled in-app confirmation (matching `.modal`) that shows the row's identifying fields, and/or add a short-lived "Desfés" undo toast after delete.
- **Suggested command**: `/impeccable harden`

**[P1] Errors surface as raw, untranslated exception text.** `js/state.js:173-175`, used throughout `actions.js`/`modal.js`/`render-cell.js`. Apps Script errors are technical, often in English, and dumped into a small status line — breaking the all-Catalan convention and giving the admin no next step.
- **Why it matters**: a failed save with no actionable guidance leaves the admin unsure whether their edit was lost.
- **Fix**: map known error classes to plain Catalan, actionable messages with a retry affordance; keep raw errors in the console only.
- **Suggested command**: `/impeccable clarify`

**[P1] Dropdown affordance is invisible at rest.** `css/table.css:151-159` — the chevron on Masia/Any/Dia/Mes cells is hidden until hover/focus/open, so a table full of editable dropdowns looks like plain text until accidentally hovered. This was a deliberate change made earlier this session at the user's request to make dropdown cells "look like other columns," but both independent assessments flagged it as hiding functionality from first-time/infrequent users (violates recognition-over-recall, heuristic #6).
- **Why it matters**: an admin who doesn't already know which columns are dropdowns has no visual cue to discover it.
- **Fix**: consider a faint permanent chevron (low opacity) that intensifies on hover, rather than fully hidden → visible, preserving most of the "looks like text" goal while keeping the affordance discoverable.
- **Suggested command**: `/impeccable clarify`

**[P2] No bulk actions or keyboard efficiency for repetitive data entry.** No multi-row select+delete/duplicate, no keyboard cell-to-cell navigation, no shortcut for "+ Fila," no saved filter presets. For an admin entering many seasonal prices in one sitting, this is the single biggest daily-use friction point (heuristic #7 scored 1/4).
- **Why it matters**: repetitive one-row-at-a-time work costs real time every session.
- **Fix**: add multi-select + bulk duplicate/delete, and Tab/Enter cell navigation.
- **Suggested command**: `/impeccable optimize`

**[P3] Column headers are cryptic abbreviations with no in-table help.** `js/state.js:57-61` — MÍN, PREU/P, DATA etc. only get explained via tooltip icons inside the add-row modal, not on the table `<th>` itself.
- **Why it matters**: a new admin (or the current one, months later) has to guess or dig into the modal to decode a header.
- **Fix**: reuse the existing `.field-help-icon` pattern on `.header-cell-label`.
- **Suggested command**: `/impeccable document`

## Persona Red Flags

**Alex (Power User)**: No keyboard shortcuts anywhere in `init.js`/`actions.js`, no bulk operations, filters require the full multiselect UI with no type-ahead. Every repetitive seasonal price update is manual, one row at a time — the single biggest gap for daily use.

**Sam (Accessibility-Dependent)**: The hidden-until-hover multiselect chevron (`table.css:151-159`) does become visible on keyboard focus, which is something, but a screen-reader user has no way to know a cell is a dropdown before tabbing into it — the `aria-label` set in `render.js:150-152` only reads "ColumnName, fila N," never "dropdown" or `aria-haspopup` context.

**Riley (Stress Tester)**: `saveTableCell` (`render-cell.js:76-97`) fires an independent `google.script.run` per cell edit with no request sequencing or debounce. Rapid successive edits on the same cell could return out of order, letting a stale success handler silently overwrite a newer value — no `requestedName`-style guard like the one already used in `onSheetLoaded`.

## Minor Observations

- Success/error status text uses the same small `text-sm` size as everything else — a failed save on a price doesn't visually escalate proportional to its stakes.
- Calendar picker year/month font sizes (5rem / 2rem) are a notably large typographic jump for a plain number picker in an otherwise restrained Operate tool.
- No dark mode is a documented deliberate decision (`variables.css:99-100`) — worth revisiting since admin work sometimes happens at odd hours (day-of-wedding logistics).
- `layout-transition` detector warnings (`transition: width` at `Index.html:631`/`678`) are minor but free to fix — swap to `transform`/`clip-path` to avoid layout thrash.

## Questions to Consider

- If a price row is referenced by confirmed bookings, does deleting it have downstream consequences the UI never warns about — should delete really be one native `confirm()` away?
- Is "Simplifica" (hide columns) solving a real problem, or masking that the underlying sheet has too many cryptically-named columns that deserve renaming at the data level?
- Given this is single-admin-gated today, what happens to onboarding/help the day a second person needs to use it?

**Caveat on evidence**: No live browser inspection was possible for either assessment — the app is a Google Apps Script deployment gated behind Google login plus an `ADMIN_EMAIL` allowlist in `doGet()`, with no reachable local instance or way to authenticate in this sandboxed environment. All findings come from direct reading of the HTML/CSS/JS source (template, components, generated `Index.html`, and all `css/`/`js/` files) plus the deterministic detector scan.
