import { describe, expect, it } from "vitest";
import { createCamera } from "../core/camera.js";
import { IDENTITY } from "../core/matrix.js";
import { PALETTES } from "../core/palette.js";
import { draw } from "../core/renderer.js";

// A canvas 2D context stub that records the calls the renderer makes, so we
// can assert on what was drawn without a real canvas.
function recordingContext() {
  const calls = [];
  const record =
    (name) =>
    (...args) =>
      calls.push({ name, args });
  return {
    calls,
    set fillStyle(v) {
      calls.push({ name: "fillStyle", args: [v] });
    },
    set strokeStyle(v) {
      calls.push({ name: "strokeStyle", args: [v] });
    },
    set lineWidth(v) {
      calls.push({ name: "lineWidth", args: [v] });
    },
    set lineJoin(v) {
      calls.push({ name: "lineJoin", args: [v] });
    },
    fillRect: record("fillRect"),
    beginPath: record("beginPath"),
    moveTo: record("moveTo"),
    lineTo: record("lineTo"),
    closePath: record("closePath"),
    fill: record("fill"),
    stroke: record("stroke"),
    save: record("save"),
    restore: record("restore"),
  };
}

function triangleTile(label = "hat") {
  return {
    label,
    depth: 2,
    transform: IDENTITY,
    points: [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 10 },
    ],
  };
}

const palette = PALETTES.blueprint;
const size = { width: 200, height: 120 };

function strokeStyles(ctx) {
  return ctx.calls.filter((c) => c.name === "strokeStyle").map((c) => c.args[0]);
}

describe("draw", () => {
  it("paints the background before anything else", () => {
    const ctx = recordingContext();
    draw(ctx, createCamera(), size, palette, []);

    const first = ctx.calls[0];
    expect(first).toEqual({ name: "fillStyle", args: [palette.background] });
    expect(ctx.calls[1]).toEqual({ name: "fillRect", args: [0, 0, 200, 120] });
  });

  it("draws the graph-paper grid at a normal zoom", () => {
    const ctx = recordingContext();
    draw(ctx, createCamera({ zoom: 1 }), size, palette, []);

    // The grid strokes once with the palette's grid color.
    expect(strokeStyles(ctx)).toContain(palette.grid);
    expect(ctx.calls.some((c) => c.name === "stroke")).toBe(true);
  });

  it("skips the grid when zoomed out past the spacing floor", () => {
    const ctx = recordingContext();
    // 48 world units × 0.05 zoom = 2.4px spacing, below the 4px floor.
    draw(ctx, createCamera({ zoom: 0.05 }), size, palette, []);

    expect(strokeStyles(ctx)).not.toContain(palette.grid);
  });

  it("traces and fills each tile with the flat palette color by default", () => {
    const ctx = recordingContext();
    draw(ctx, createCamera(), size, palette, [triangleTile(), triangleTile()]);

    // No scheme and no colorFor override → falls back to palette.tile.
    expect(strokeStyles(ctx)).toContain(palette.tile);
    const moveTos = ctx.calls.filter((c) => c.name === "moveTo").length;
    const lineTos = ctx.calls.filter((c) => c.name === "lineTo").length;
    // One moveTo per tile polygon (plus the grid's), two lineTos per triangle.
    expect(moveTos).toBeGreaterThanOrEqual(2);
    expect(lineTos).toBeGreaterThanOrEqual(4);
  });

  it("colors tiles by scheme when one is given", () => {
    const ctx = recordingContext();
    draw(ctx, createCamera(), size, palette, [triangleTile()], "generation");

    // The generation scheme resolves to an hsl() color, not the flat tile hex.
    expect(strokeStyles(ctx).some((s) => s.startsWith("hsl("))).toBe(true);
    expect(strokeStyles(ctx)).not.toContain(palette.tile);
  });

  it("lets a colorFor override drive every tile's color", () => {
    const ctx = recordingContext();
    const override = () => "#123456";
    draw(ctx, createCamera(), size, palette, [triangleTile()], "generation", override);

    expect(strokeStyles(ctx)).toContain("#123456");
  });

  it("draws a pulsing highlight outline around a pinned tile", () => {
    const ctx = recordingContext();
    const highlight = { tile: triangleTile(), intensity: 0.5 };
    draw(ctx, createCamera(), size, palette, [triangleTile()], null, null, highlight);

    // The highlight brackets its own trace in save()/restore().
    expect(ctx.calls.some((c) => c.name === "save")).toBe(true);
    expect(ctx.calls.some((c) => c.name === "restore")).toBe(true);
    // Amber support color (--accent-support) with the intensity as alpha.
    expect(strokeStyles(ctx).some((s) => s.startsWith("#ffb454"))).toBe(true);
  });

  it("clamps the highlight alpha at full intensity", () => {
    const ctx = recordingContext();
    const highlight = { tile: triangleTile(), intensity: 2 };
    draw(ctx, createCamera(), size, palette, [], null, null, highlight);

    // intensity > 1 must not produce an out-of-range alpha hex — a clamped
    // alpha of 1 renders as the bare 6-digit color with an "ff" suffix.
    expect(strokeStyles(ctx)).toContain("#ffb454ff");
  });
});
