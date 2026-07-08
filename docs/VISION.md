# Vision — Monotile

## The problem

In March 2023, David Smith, Joseph Samuel Myers, Craig S. Kaplan, and Chaim Goodman-Strauss
published the "hat" — the first known shape that tiles the infinite plane using only copies of
itself, with no periodic repetition, ever. A few months later they found the "spectre," a
close relative that does the same job without needing the hat's mirror image. It's one of the
more striking results in recreational/discrete geometry in decades, and it settled a question
open since Penrose tilings in the 1970s: does an "aperiodic monotile" — a single tile, not a
matched set — exist at all?

Almost everyone who's heard of it has seen a static picture in a news article. Almost nobody has
*played* with it: dragged around inside an infinite copy of the pattern and watched, with their
own eyes and their own hands, that it truly never loops back on itself. The math papers have the
proofs; nothing accessible has the feel.

## Who it's for

People who like elegant, hands-on math toys — the audience that bookmarks Numberphile videos,
plays with Conway's Game of Life implementations, or has a Penrose-tiling poster somewhere. They
don't need the substitution proof explained to enjoy this; they need to *drag the canvas* and
have the "oh, it really doesn't repeat" moment land in under five seconds. A secondary audience
is people who want a genuinely novel, mathematically real piece of wall art — not a generic
generative-art poster, but one built from a specific, citable 2023 discovery.

## The core idea

Aperiodic tilings can't be generated tile-by-tile by trial and error — they're built by
*substitution*: start with a handful of large "metatiles," recursively subdivide each one into
smaller copies of the metatile set per fixed rules, and after enough generations the boundaries
between metatiles trace out actual hat/spectre tiles. Monotile implements that substitution
system directly, generates only the tiles visible in (and just outside) the current viewport, and
regenerates the visible set as the camera pans — so the pattern is infinite in principle and
finite in practice, always.

Two things make it a *tool* and not just a demo:
1. **It's genuinely infinite and genuinely non-repeating** — not a large-but-finite tiled image
   that loops at the edges. Pan far enough and you're still inside honest substitution output.
2. **It exports.** The same tiling that's fun to explore becomes a poster: recolor by
   orientation, generation, or supertile membership, then export the current view as clean SVG —
   vector, scalable, printable.

## Key design decisions

- **Vanilla JS + Canvas, no framework.** The whole interactive surface is one canvas and a slim
  control panel; a UI framework would add weight for no real benefit. See
  [`README.md`](../README.md) for the full stack.
- **Substitution over brute-force tiling search.** Placing tiles by trying to fit shapes against
  existing edges doesn't scale and can produce false periodicity at the seams. Substitution is
  the approach the original paper uses and it's the only one that stays fast at arbitrary zoom
  and pan distance.
- **Static site, no backend.** Everything — generation, coloring, export — runs client-side.
  Nothing needs to be stored or computed server-side, so it ships as a static bundle deployable
  to any static host, including a subpath (see `docs/BACKLOG.md` deployment story).
- **Blueprint/technical art direction, decided up front.** Documented in
  [`docs/DESIGN.md`](DESIGN.md) before any UI code, so the look is a deliberate choice, not
  whatever came out of the first component.
- **Poster export is a first-class feature, not a stretch goal.** It's named in the wow moment
  and gets its own epic in the backlog rather than being bolted on at the end.

## What "v1 done" looks like

- Dragging the canvas pans a genuinely infinite, substitution-generated hat/spectre tiling with
  no visible seams, no repetition, and smooth 60fps interaction on a mid-range laptop.
- At least three coloring schemes are selectable and visibly change the tiling's character.
- The current view exports as a valid, clean SVG file that opens and prints correctly outside
  the app.
- The page meets every requirement in `docs/DESIGN.md` and the design standard's ship gate: it
  looks intentionally designed at desktop and phone width, not like a functional prototype.
- CI is green (lint, tests, build) and the static bundle deploys successfully to a subpath.
