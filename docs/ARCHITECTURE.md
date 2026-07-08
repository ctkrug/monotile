# Architecture — Monotile

A map of the codebase for anyone (including a future BUILD/QA run) picking this up cold.

## Stack

Vanilla JS + Canvas, bundled with Vite, tested with Vitest. No framework, no backend — see
`docs/VISION.md` for why.

## Module map

```
src/
  core/
    matrix.js      2x3 affine transforms (rotation/reflection/translation/scale) — the only
                   math primitive tile placement needs.
    spectre.js     The substitution engine: the spectre tile's 14-vertex outline, the 9-type
                   (Gamma/Delta/Theta/Lambda/Xi/Pi/Sigma/Phi/Psi) substitution rule, and
                   buildHierarchy(generation) which builds the tiling to a given depth.
    tileField.js   Turns the (huge, effectively unbounded) hierarchy into the bounded set of
                   tiles worth drawing for a viewport: viewport culling + an incremental cache.
    camera.js      Pan/zoom state (offset + zoom), screen<->world conversion, cursor-anchored
                   zoom. Pre-existing scaffold, unchanged this run.
    palette.js     Named flat color schemes for the default "line art" view (background/grid/
                   tile color) — see coloring.js for the per-tile schemes.
    coloring.js    Per-tile color schemes: supertile (by type label), generation (by
                   substitution depth), orientation (by placement rotation), plus lerpColor —
                   parses hex/hsl()/rgb() strings and blends them — used by ripple.js. Pure
                   functions of a tile record, so easy to unit test independent of the canvas.
    ripple.js      The recolor-ripple animation's math: createRipple() measures each visible
                   tile's distance from the click point; rippleColor(ripple, tile, elapsedMs) is
                   pure and time-injected (elapsed is a parameter, never read from a clock), so
                   the whole stagger-outward curve is unit-testable without a real rAF loop.
    svgExport.js   buildSvg(tiles, palette, scheme, bounds) renders the current tile set to a
                   standalone SVG string for the poster export — plain <rect>/<polygon> only, no
                   external asset references.
    audio.js       Synth SFX (WebAudio oscillators/noise, no audio files) for the recolor chime
                   and export shutter, plus the isMuted()/setMuted() flag that backs the mute
                   toggle — persisted to localStorage when available, in-memory-only otherwise.
                   Every play function no-ops safely if AudioContext doesn't exist.
    geometry.js    Plain point/vector helpers (add/subtract/rotate/bounds/pointInPolygon) shared
                   across the above; pointInPolygon backs the tile inspector's hit-testing.
    inspector.js   findTileAt(tiles, point) — a ray-casting hit-test over the visible tile list,
                   used both by the hover readout and the click-to-pin inspector panel.
    pulse.js       The pinned-tile outline pulse: pulseIntensity(elapsedMs) is pure and
                   time-injected like ripple.js — 2 bright 140ms pulses, then it settles at a low
                   steady intensity so a pin stays visible without staying loud indefinitely.
    touch.js       pinchState(pointA, pointB) — distance + midpoint between two active touch
                   points, the two inputs a pinch-to-zoom gesture needs. Pure and DOM-free like
                   ripple.js/pulse.js, so the gesture math is unit-tested without a browser;
                   main.js compares distance across moves to derive a zoom factor for
                   camera.zoomAt and uses the midpoint as its anchor point.
    keyboardNav.js panStepForKey/zoomFactorForKey/isResetKey — pure key-to-intent mapping for
                   the canvas's keydown handler, so arrow/+-/Home behavior is unit-tested without
                   a DOM. main.js's keydown listener just calls these and re-renders.
    railToggle.js  nextRailExpanded/railToggleLabel/railToggleGlyph — pure expand/collapse state
                   for the desktop control-rail toggle (aria-label + glyph per state), unit-tested
                   without a DOM like keyboardNav.js/touch.js.
    hint.js        hasSeenHint/markHintSeen — persisted dismissal for the first-visit pan-hint
                   callout, same localStorage-with-safe-fallback pattern as audio.js's mute flag.
    renderer.js    Canvas draw pass: background, grid, then every visible tile as a stroked,
                   lightly-filled polygon (via the shared tracePolygon() helper). Colors come
                   from coloring.js via a scheme name, or from an optional per-tile
                   colorFor(tile) override — main.js uses the latter during a recolor ripple, so
                   renderer.js never needs to know about ripples. An optional {tile, intensity}
                   highlight param draws the pinned-tile outline from pulse.js.
  main.js          Wires it all together: owns the camera, a single TileField, and the active
                   coloring scheme; handles pointer/wheel input, scheme-button clicks (which spin
                   up a ripple animation via ripple.js unless prefers-reduced-motion is set), the
                   export button (svgExport.js + a Blob download + flash/toast feedback), the
                   mute toggle (audio.js), and the tile inspector (inspector.js + pulse.js —
                   every pointermove updates the crosshair/readout, and a non-drag click pins a
                   tile); re-renders on every change. Pointer handling tracks every active
                   pointer in a Map so a second touch promotes a single-finger pan into a
                   two-finger pinch-zoom (touch.js + camera.zoomAt) mid-gesture; losing a finger
                   mid-pinch resets the gesture rather than resuming a pan. Also wires the
                   mobile-only sheet-handle tap to expand/collapse the scheme panel, the
                   desktop-only rail-toggle tap to collapse it to a slim docked tab
                   (railToggle.js), the canvas keydown handler (keyboardNav.js) for
                   arrow/+-/Home pan and zoom, and the first-visit pan-hint's dismissal
                   (hint.js) on the first drag/pinch/wheel/keyboard gesture.
  style.css        Design tokens (see docs/DESIGN.md) as CSS custom properties, toolbar/canvas/
                   scheme-panel layout, plus the export button, mute toggle, camera-flash
                   overlay, toast, crosshair, survey readout, and inspector panel styling. Below
                   480px the scheme panel becomes a bottom sheet (translateY to just its handle's
                   height by default, `.sheet-open` reveals it) so the canvas keeps most of the
                   viewport on phones.
index.html         Toolbar (wordmark, live zoom readout, mute toggle), the canvas, the
                   coloring-scheme picker panel (drag handle + body with the scheme buttons and
                   export button), the crosshair/survey readout, the tile inspector panel, and
                   the flash/toast feedback elements.
```

## The substitution engine, and why it's the *spectre* not the *hat*

`docs/VISION.md` names both the 2023 "hat" and "spectre" aperiodic monotiles. This build
implements the **spectre** specifically:

- The hat's four metatiles (H, T, P, F) **subtly change shape at every generation** — a
  faithful renderer has to re-derive each generation's metatile geometry from scratch via
  edge-matching, which is a much larger and more failure-prone algorithm to get exactly right
  (a single wrong transform silently produces gaps or overlaps far from the origin, undetectable
  by eye until you pan there).
- The spectre's nine hexagon-derived supertile types (Gamma/Delta/Theta/Lambda/Xi/Pi/Sigma/Phi/
  Psi) use **one fixed set of eight rigid placement transforms, reused unchanged at every
  generation** (`buildPlacementTransforms` in `spectre.js`). That made it possible to implement
  and verify with much higher confidence, while still being a real, citable 2023 aperiodic
  monotile construction — not a simplification or a stand-in like a Penrose tiling.

If a future run wants to add the hat as a second, user-selectable tile shape, treat it as a
parallel module (`hat.js`) implementing the same `{ kind, label, quad, bbox, children }` node
shape `tileField.js` already consumes — `tileField.js` and `renderer.js` don't know or care which
substitution system produced the tree.

## How a generation becomes pixels

1. `buildHierarchy(generation)` builds a DAG, not a tree: at every depth there are only 9
   distinct type objects (one per label), each referencing objects from the depth below. This
   is why `buildHierarchy(12)` costs ~1-3ms despite conceptually representing ~8^12 tiles — nothing
   is eagerly expanded.
2. `createTileField()` picks one type (`Delta`) at a fixed, large generation (12, chosen because
   its covered area's diagonal is ~10^6 world units — vastly more than any realistic pan
   session) as the root, and **recenters** it: the substitution assembly's own placement math
   drifts the hierarchy's local coordinate origin arbitrarily far from the tile system's own
   (0, 0), so without recentering a camera starting at world (0, 0) can land in empty space.
3. `TileField#update(viewportBounds, margin)` walks the DAG from the root, computing each
   node's **bounding box** (not its `quad` — see the note in `spectre.js`; the 4 quad points are
   alignment pins for gluing supertiles together, not a hull of their silhouette, and using them
   for culling undershoots badly and gets worse every generation) under the accumulated
   transform, and prunes any subtree whose box misses the viewport + margin. Surviving leaf
   tiles are cached by a stable path key (e.g. `"3.1.0.5"`) so a small pan only computes the
   newly-revealed tiles and drops the ones that scrolled out.
4. `main.js` recomputes the world-space viewport from the camera on every render, calls
   `update()` with a half-viewport prefetch margin, and hands the resulting tile list straight
   to `renderer.draw()`.

## Coordinate spaces

- **Local (tile) space**: the spectre's own 14 vertices, unit edge length.
- **Hierarchy space**: what `buildHierarchy` produces — the recentering transform in
  `tileField.js` maps this into...
- **World space**: what `camera.js` and `main.js` operate in (1 world unit = `DEFAULT_TILE_SCALE`
  local units = 40, chosen to feel similar in scale to the scaffold's original 48-unit grid).
- **Screen space**: CSS pixels, via `camera.worldToScreen`.

## Running it

```bash
npm install
npm run dev      # local dev server
npm test         # vitest run — pure logic, no browser needed
npm run lint     # eslint .
npm run build    # static dist/ bundle, base-path-relative (see vite.config.js)
```
