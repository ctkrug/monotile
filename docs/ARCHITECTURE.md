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
    palette.js     Named color schemes (only "blueprint" is fully wired into the renderer yet;
                   the others are recognized but not yet selectable — see BACKLOG Epic 2).
    geometry.js    Plain point/vector helpers (add/subtract/rotate/bounds) shared across the
                   above.
    renderer.js    Canvas draw pass: background, grid, then every visible tile as a stroked,
                   lightly-filled polygon.
  main.js          Wires it all together: owns the camera and a single TileField, handles
                   pointer/wheel input, and re-renders (grid + tiles + toolbar readout) on
                   every camera change.
  style.css        Design tokens (see docs/DESIGN.md) as CSS custom properties, toolbar/canvas
                   layout.
index.html         Toolbar (wordmark + live zoom readout) + the canvas.
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
