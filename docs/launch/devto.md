---
title: "Building Monotile: an infinite, never-repeating tiling you can pan and export"
published: false
tags: javascript, canvas, math, webdev
---

In 2023, four mathematicians found the "hat": the first single shape proven to tile the whole
plane without its pattern ever repeating. Months later they found the "spectre", which does the
same without needing a mirror-image copy. It was a genuinely new result, and it settled a
question open since the 1970s.

I kept seeing the same still image of it in news articles and wanted to actually move around
inside the pattern. So I built [Monotile](https://apps.charliekrug.com/monotile/): drag an
infinite spectre tiling in the browser, recolor it, and export any view as a clean SVG poster.
Here are the two decisions that shaped the build.

## You can't place these tiles greedily

The obvious way to draw an aperiodic tiling is to place one tile, then fit the next against its
edge, and so on. That does not work here. Greedy placement drifts into false periodicity at the
seams and grinds to a halt as the region grows, because deciding whether a local placement is
globally valid is exactly the hard part.

The tiling comes from **substitution** instead, which is how the original paper proves
aperiodicity. You start with a small set of large "metatiles", and each one subdivides into a
fixed arrangement of smaller metatiles. Run that enough times and the boundaries between
metatiles trace out real spectre tiles. The rules are level-invariant for the spectre (unlike the
hat, whose metatiles subtly distort each generation), so one fixed set of placement transforms
drives every level.

In code the hierarchy is a small directed graph: about nine node types per generation, not an
eagerly expanded tree. Twelve generations of that graph cover a region whose diagonal is on the
order of a million world units, and building it costs under two milliseconds, because nothing is
materialized until it is drawn.

## Only draw what the viewport can see

An infinite tiling has to stay finite in practice. The renderer walks the substitution hierarchy
from the root and prunes any subtree whose bounding box does not reach the viewport plus a small
prefetch margin. Cost stays proportional to what is on screen, not to how far you have panned.

Two details make the panning feel solid:

- **Caching by a stable path key.** Every tile has an id derived from its position in the
  hierarchy (`0.3.1.2` and so on). A pan only adds newly revealed tiles and drops ones that
  scrolled off. Tiles still in view keep the same cached object, so nothing is recomputed
  frame to frame.
- **The camera is pure.** Pan and zoom are plain transforms of an `{ offset, zoom }` object.
  `worldToScreen` and `screenToWorld` are inverses, which makes cursor-anchored zoom (keep the
  world point under the pointer fixed) three lines instead of a special case.

Because the geometry is all pure functions, the whole thing is straightforward to test. The
substitution counts, the culling bounds, the color math, and the SVG export are covered by unit
tests with every core module at 100% line coverage, and the export path is asserted to emit no
external references so a saved poster prints correctly outside the app.

## What I would do differently

The color schemes (by orientation, generation, and supertile) started as an afterthought and
turned out to be the most fun part, because they make the substitution's own structure visible.
If I did it again I would design around that from the start, and probably add a way to color by
custom rules. I would also render the spectre's true curved edges; right now it draws the
straight-edged combinatorial version, which is faithful to the structure but less pretty than the
rounded tile most people picture.

Monotile is vanilla JavaScript and one canvas, no framework, bundled with Vite and deployable to
any static host.

- Live: [apps.charliekrug.com/monotile](https://apps.charliekrug.com/monotile/)
- Source: [github.com/ctkrug/monotile](https://github.com/ctkrug/monotile)

If you have ever wanted to see a hard proof move under your own hands, drag it around for a
minute. It really never repeats.
