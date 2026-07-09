# Monotile

**▶ Live demo: [apps.charliekrug.com/monotile](https://apps.charliekrug.com/monotile/)**

[![CI](https://github.com/ctkrug/monotile/actions/workflows/ci.yml/badge.svg)](https://github.com/ctkrug/monotile/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-5ec8ff.svg)](LICENSE)

Pan an infinite tiling, export it as art.

Monotile is an interactive studio for the 2023 **einstein** discovery: the "hat" and the
"spectre", the first single shapes ever found that tile the whole plane without their pattern
ever repeating. Drag around inside a live spectre tiling, watch new tiles keep appearing in
every direction, recolor the whole field, then export the view you like as a clean SVG poster.

![A recolored spectre tiling exported by Monotile](docs/sample-tiling.svg)

*A real SVG straight out of the app's export button, colored by supertile.*

## Who it's for

For the people who bookmark Numberphile videos and keep a Penrose poster on the wall. The
hat/spectre tiles settled a 50-year-old question in 2023, but almost everyone who's heard of them
has only seen a still image in a news article. Monotile is the place to actually grab the pattern
and move it, and to take a piece of it home as vector art.

## What it does

- **Genuinely infinite, genuinely non-repeating.** Tiles come from the spectre substitution
  system (recursively inflating and subdividing metatiles), not a large image that loops at the
  edges. Pan as far as you like and you're still inside honest substitution output.
- **Smooth pan and cursor-anchored zoom.** Drag to explore and scroll to zoom into the world
  point under your cursor. Only the tiles inside (and just outside) the viewport are computed and
  drawn, so it stays fast at any pan distance.
- **Four coloring schemes with a ripple recolor.** View the flat line art, or color every tile by
  orientation, substitution generation, or supertile membership. The recolor cross-fades outward
  from wherever you click.
- **Poster-quality SVG export.** Export the current view as a standalone vector file with no
  external references or fonts, ready to open and print anywhere.
- **A live tile inspector.** A crosshair and a monospace readout track your cursor with world
  coordinates, generation, and tile type. Click any tile to pin its type, generation,
  orientation, and full supertile lineage.
- **Shareable views.** Copy Link encodes the current pan, zoom, and coloring into the URL, so a
  specific view reopens exactly as you left it.

## Try it

Open the [live demo](https://apps.charliekrug.com/monotile/) and drag the canvas. Scroll to zoom,
click a tile to inspect it, pick a coloring scheme, then hit **Export SVG**.

Prefer keyboard or touch? With the canvas focused, arrow keys pan (hold Shift for a bigger step),
`+`/`-` zoom, and `Home` resets the view. On a phone, single-finger drag pans and two fingers
pinch to zoom.

## Run it locally

```bash
git clone https://github.com/ctkrug/monotile.git
cd monotile
npm install
npm run dev      # local dev server with hot reload
```

Other scripts:

```bash
npm test         # run the Vitest suite
npm run build    # produce the static site/ bundle
npm run preview  # serve the production build
```

## How it's built

Vanilla JavaScript and an HTML5 canvas, bundled with [Vite](https://vitejs.dev/); no UI
framework, because the whole surface is one canvas and a slim control panel. The tiling geometry
and the substitution system are pure functions covered by [Vitest](https://vitest.dev/) (every
core module is at 100% line coverage). The output is a static bundle with no backend, so it hosts
from any static host, including a subpath.

- [`docs/VISION.md`](docs/VISION.md): the problem, the audience, and the key decisions.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): how the substitution and culling work.
- [`docs/DESIGN.md`](docs/DESIGN.md): the blueprint art direction and design tokens.

## License

MIT, see [`LICENSE`](LICENSE).

---

More of Charlie's projects → [apps.charliekrug.com](https://apps.charliekrug.com)
