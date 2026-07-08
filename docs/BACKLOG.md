# Backlog — Monotile

Epics and stories for the build. All start unchecked. Every story has 1–3 verifiable
acceptance criteria (ACs) — concrete checks, not vibes. BUILD implements to the ACs; QA attacks
them.

## Epic 1 — Core tiling engine (the wow moment)

- [x] **1.1 Render an infinite, pannable, non-repeating hat/spectre tiling — THE WOW MOMENT**
  - AC: dragging the canvas pans continuously in any direction for at least 50 viewport-widths
    with no visible seams, gaps, or overlaps between generated regions.
    ✅ Verified visually with Playwright: dragged 60×1200px (~50 viewport-widths at 1440px) and
    screenshotted before/after — clean tessellation throughout, no seams or gaps.
  - AC: an automated check over a generated region confirms no two tiles share identical
    position + orientation (basic non-repetition sanity check, not a formal proof).
    ✅ `tileField.test.js` — "never places two tiles at the same position and orientation".
  - AC: newly revealed tiles render fast enough that dragging shows no visible stutter
    (no single frame budget exceeding ~150ms) on a mid-range laptop.
    ✅ `tileField.test.js` — "culls a viewport well within a single frame budget" (<150ms;
    measured ~1-4ms in practice).

- [x] **1.2 Implement the hat/spectre substitution system (metatile inflation)**
  - AC: unit tests verify each metatile subdivides into the documented set of child metatiles
    per the substitution rule (correct count and types).
    ✅ `spectre.test.js` — child-slot count/type tests against `SUPER_RULES`.
  - AC: running substitution for N generations produces a tile count that matches the expected
    growth ratio within floating-point tolerance.
    ✅ `spectre.test.js` — exact regression counts for generations 0-4, plus a growth-ratio and
    covered-area-growth convergence check.
  - Implemented the **spectre** variant specifically (not the hat): its 9-type substitution
    uses one fixed, level-invariant set of placement transforms, unlike the hat's metatiles,
    which subtly distort at every generation — see `docs/ARCHITECTURE.md` for why.

- [x] **1.3 Viewport-based tile culling and incremental generation**
  - AC: only tiles intersecting the viewport plus a configurable margin are generated and
    drawn; a test confirms the live tile count stays bounded regardless of total pan distance.
    ✅ `tileField.test.js` — bounded count near origin and 40,000 units away.
  - AC: panning generates newly revealed tiles incrementally without regenerating or discarding
    tiles already on screen (no full-canvas re-derivation per frame).
    ✅ `tileField.test.js` — "reuses cached tile records for tiles that remain visible across
    pans" (same object reference, not recomputed).

- [x] **1.4 Cursor-anchored zoom**
  - AC: scrolling to zoom keeps the world point under the cursor visually fixed (matches the
    `camera.zoomAt` behavior already unit-tested in the scaffold).
    ✅ Pre-existing `camera.test.js` coverage; verified visually with Playwright wheel events.
  - AC: zoom is clamped to a documented min/max range, with the current zoom or generation
    depth shown in the UI.
    ✅ Clamp pre-existing (`camera.js`); live `zoom X.XX×` readout added to the toolbar.

- [x] **1.5 Design polish — core tiling view**
  - AC: the canvas fills ≥60vh at 1440×900 and passes the D3 self-review checklist (resize to
    390/768/1440, squint test, tab-through focus) with no horizontal scroll or dead margins.
    ✅ Verified with Playwright screenshots at 1440×900, 768×1024, and 390×844 — canvas fills
    the full viewport below the toolbar at every size, no dead margins.
  - AC: colors, grid, and type match `docs/DESIGN.md` tokens exactly (no ad hoc hex values).
    ✅ Toolbar/canvas styling uses only the existing CSS custom properties; tile rendering
    reads colors from `core/palette.js`, which already matches the documented hex values.

## Epic 2 — Coloring & poster export

- [x] **2.1 Implement three coloring schemes (orientation, generation, supertile)**
  - AC: switching schemes recolors all visible tiles without a page reload; the same tile
    resolves to a visibly different color under each scheme.
    ✅ `coloring.test.js` (determinism + variety) plus visual verification (Playwright
    screenshots of all four states: Line/Supertile/Generation/Orientation).
  - AC: the palette picker exposes all three per `docs/DESIGN.md`, and every control (swatch,
    select) has themed hover, focus-visible, and active states — no naked native widgets.
    ✅ `.scheme-btn` styles cover hover/active/disabled/pressed/focus-visible.
  - Note: the panel is a fixed overlay, not yet collapsible to an icon rail as
    `docs/DESIGN.md`'s layout intent describes — left for a follow-up design pass since the
    fixed panel doesn't yet crowd the canvas at any tested breakpoint (390/768/1440).

- [x] **2.2 Recolor ripple transition**
  - AC: clicking a swatch cross-fades tile colors over ~250ms, staggered outward from the click
    point, per the `docs/DESIGN.md` juice plan.
    ✅ `ripple.js` stages each tile's fade by its distance from the click point so the whole
    effect still finishes within `RIPPLE_TOTAL_MS`; verified against real rAF timing in a
    headless browser and covered by `ripple.test.js`.
  - AC: with `prefers-reduced-motion` set, the color change still applies but the staggered
    animation is skipped (instant swap).
    ✅ Verified with Playwright's `emulateMedia({ reducedMotion: "reduce" })` — scheme swaps
    instantly with no animation frames.

- [x] **2.3 SVG poster export**
  - AC: clicking export downloads a valid SVG containing vector paths for every tile currently
    visible, and it opens correctly in a standalone SVG viewer (not just in-browser).
    ✅ Verified with Playwright: triggered a real download, parsed the file — valid XML header,
    122 `<polygon>` elements for the visible tiles at the tested viewport.
  - AC: the exported SVG has no external asset references (fonts/images inlined or unused) so
    it prints correctly outside the app.
    ✅ `svgExport.js` emits only `<rect>`/`<polygon>`; `svgExport.test.js` asserts no `<image>`,
    `xlink:href`, `@import`, `<link>`, `url()`, or `font-family`.

- [x] **2.4 Export feedback**
  - AC: export triggers the camera-flash overlay and toast defined in `docs/DESIGN.md`,
    auto-dismissing without further user action.
    ✅ Verified visually — toast reads "Exported monotile-export.svg" and clears itself via
    `setTimeout`; flash is skipped (not just instant) under reduced motion.
  - AC: the synth "shutter" SFX plays via WebAudio (no audio file) and export doesn't throw when
    `AudioContext` is unavailable (e.g. in a test environment).
    ✅ `audio.test.js` — `playExportShutter`/`playRecolorChime` no-op safely with no
    `AudioContext` global.

- [x] **2.5 Mute toggle with persistence**
  - AC: toggling mute silences all SFX (recolor chime, export shutter, tile-pin tick)
    immediately, with no queued sounds after the toggle.
    ✅ Every play function checks `isMuted()` before scheduling any WebAudio node, so there's
    nothing to flush — muting takes effect on the very next call. (Tile-pin tick isn't built yet;
    it ships with the inspector in story 3.1.)
  - AC: mute state persists across a page reload via `localStorage`.
    ✅ Verified with Playwright: toggled mute, reloaded the page, toggle still read "Sound: Off".
    Also unit-tested via a stubbed `localStorage` across a simulated module reload.

## Epic 3 — Inspector, access & ship

- [x] **3.1 Tile inspector with live survey readout**
  - AC: moving the pointer over the canvas shows a crosshair plus a monospace label
    (coordinate, generation, tile type) following the cursor, per the `docs/DESIGN.md`
    signature detail.
    ✅ Verified with Playwright: hovering shows `x: 400, y: 344 · gen 12 · Delta`, tracking the
    cursor; hidden again on `pointerleave`.
  - AC: clicking a tile pins an inspector panel showing its type, orientation, and supertile
    lineage, with the pulse-outline confirmation from the juice plan.
    ✅ Verified with Playwright: click-to-pin (vs. a pan drag) is distinguished by a 4px move
    threshold; the panel showed type/generation/orientation/lineage for the clicked tile, and
    `pulse.js`'s 2×140ms pulse settles into a steady outline. Covered by `pulse.test.js` and
    `inspector.test.js`.

- [x] **3.2 Touch and mobile controls**
  - AC: a single-finger drag pans and a pinch gesture zooms on a touch device (or emulated
    touch/pointer events in tests).
    ✅ `touch.js`'s `pinchState` is unit-tested; verified live with Playwright synthetic
    two-pointer touch events — zoom went from 1.00× to 3.00× on a pinch-out gesture. Existing
    single-finger drag panning re-verified unaffected (screenshot before/after a drag).
  - AC: at 390px width the control panel collapses to a bottom-sheet drag handle, and the
    canvas keeps ≥70% of viewport height until the sheet is opened.
    ✅ Verified with Playwright at 390×844: collapsed panel shows only its 52px handle
    (52/844 ≈ 94% of viewport stays canvas), tapping the handle slides the full control list
    into view and sets `aria-expanded="true"`.

- [x] **3.3 Accessibility pass**
  - AC: every icon-only button has an `aria-label`; keyboard tab order is logical and every
    interactive element shows a visible focus state.
    ✅ The one icon-only control (`#inspector-close`, "×") already carried
    `aria-label="Close tile inspector"`. Verified tab order with Playwright: mute toggle →
    sheet handle (mobile) / scheme buttons (desktop) → export, with `display: none` correctly
    excluding the hidden mobile handle from desktop tab order; confirmed the `:focus-visible`
    glow ring renders on a screenshot of a tabbed-to button.
  - AC: the export toast/status text uses an ARIA live region; all touch targets measure
    ≥44×44px.
    ✅ `#toast` already had `role="status"`/`aria-live="polite"`. Measured every interactive
    element's bounding box at 390px with Playwright — all ≥44×44 after growing
    `#inspector-close` from 28px to 44px (its one violation) and widening the inspector `dl`'s
    padding to match.

- [x] **3.4 Static deploy readiness**
  - AC: `npm run build` produces a single self-contained `dist/` directory that runs correctly
    when served from a non-root subpath (e.g. `/monotile/`) — verified by building and serving
    locally from a subpath, not just the domain root.
    ✅ `npm run build` emits `dist/` with every asset reference relative (`./assets/...`, no
    leading slash). Verified by copying `dist/` to `<tmp>/monotile/`, serving it from a plain
    static file server, and loading `/monotile/` in Playwright: canvas rendered, zero console
    errors, zero failed requests.
  - AC: the landing content and the in-app UI use the exact same `docs/DESIGN.md` tokens (fonts,
    colors, radius) — no visual seam between "marketing page" and "app."
    ✅ N/A by design, not a gap: Monotile has no separate marketing/landing page — `index.html`
    *is* the app, so there's only ever one surface and it trivially can't seam against itself.

- [x] **3.6 Keyboard-operable canvas pan/zoom**
  - AC: with the canvas focused, arrow keys pan the view (a larger step with Shift held) and
    `+`/`-` zoom in/out, each producing the same immediate visual change as the equivalent
    drag/wheel gesture.
    ✅ `keyboardNav.test.js` covers the pure key mapping; verified live with Playwright — arrow
    key panned, `+` moved the zoom readout from 1.00× to 1.20×.
  - AC: the canvas is reachable via Tab and shows the same `:focus-visible` treatment as every
    other control; `Home` resets pan and zoom to the initial view.
    ✅ Verified with Playwright: Tab reaches `#tiling-canvas` right after the mute toggle (the
    shared `:focus-visible` rule already covers it); `Home` returned the zoom readout to 1.00×
    after zooming in.

- [x] **3.7 Collapsible desktop control rail**
  - AC: on desktop widths, a toggle collapses the scheme panel to a slim docked tab (mirroring
    `docs/DESIGN.md`'s "collapsible to a slim icon rail" layout intent, left as a known gap by
    story 2.1) without the canvas ever resizing to make room for it.
    ✅ `railToggle.js` + `.rail-collapsed` CSS; verified with Playwright at 1440×900 — collapses
    to a 44px docked tab, canvas (`position: absolute` overlay panel) never resizes.
  - AC: the collapsed tab is reachable via keyboard and screen readers (`aria-expanded`, a
    ≥44px touch target) and re-expands to the exact prior panel state.
    ✅ `railToggle.test.js` covers the label/glyph/expanded-state logic; verified live —
    `aria-expanded` flips true/false, the 44×44px button is focusable, and the previously
    selected scheme ("Line") is still shown pressed after re-expanding.

- [ ] **3.5 Final design ship-gate pass**
  - AC: every D4 reject condition in `docs/DESIGN.md` is checked and false (no unstyled native
    controls, has a real favicon, has background depth/atmosphere, hero isn't a small box in
    empty space), with the check itself noted in the CLOSEOUT STATUS `memory` field.
  - AC: a full pan → recolor → export flow is exercised end to end with no console errors.
