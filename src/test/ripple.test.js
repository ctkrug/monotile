import { describe, expect, it } from "vitest";
import { colorForTile } from "../core/coloring.js";
import { IDENTITY } from "../core/matrix.js";
import { createRipple, isRippleComplete, RIPPLE_TOTAL_MS, rippleColor } from "../core/ripple.js";

function squareTile(center, label = "Delta") {
  const [x, y] = center;
  return {
    label,
    depth: 1,
    transform: IDENTITY,
    points: [
      { x: x - 1, y: y - 1 },
      { x: x + 1, y: y - 1 },
      { x: x + 1, y: y + 1 },
      { x: x - 1, y: y + 1 },
    ],
  };
}

describe("createRipple", () => {
  it("finds the farthest tile's distance from the click point", () => {
    const tiles = [squareTile([0, 0]), squareTile([100, 0]), squareTile([30, 0])];
    const ripple = createRipple({
      tiles,
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: "#5ec8ff",
    });
    expect(ripple.maxDistance).toBe(100);
  });

  it("has zero maxDistance for an empty tile list", () => {
    const ripple = createRipple({
      tiles: [],
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: "#5ec8ff",
    });
    expect(ripple.maxDistance).toBe(0);
  });
});

describe("rippleColor", () => {
  const fallback = "#5ec8ff";

  it("starts at the fromScheme color at elapsed=0 regardless of distance", () => {
    const tiles = [squareTile([0, 0]), squareTile([500, 0])];
    const ripple = createRipple({
      tiles,
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: fallback,
    });
    for (const tile of tiles) {
      expect(rippleColor(ripple, tile, 0)).toBe(fallback);
    }
  });

  it("ends at the toScheme color for every tile once the ripple completes", () => {
    const tiles = [squareTile([0, 0]), squareTile([500, 0]), squareTile([250, 0])];
    const ripple = createRipple({
      tiles,
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: fallback,
    });
    for (const tile of tiles) {
      expect(rippleColor(ripple, tile, RIPPLE_TOTAL_MS)).toBe(colorForTile(tile, "supertile"));
    }
  });

  it("fades the tile at the click point before a tile far away", () => {
    const near = squareTile([0, 0]);
    const far = squareTile([500, 0]);
    const ripple = createRipple({
      tiles: [near, far],
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: fallback,
    });
    const midway = RIPPLE_TOTAL_MS / 2;
    expect(rippleColor(ripple, near, midway)).toBe(colorForTile(near, "supertile"));
    expect(rippleColor(ripple, far, midway)).not.toBe(colorForTile(far, "supertile"));
  });

  it("returns a mid-fade blend for a tile strictly between its delay and delay+FADE_MS", () => {
    const near = squareTile([0, 0]);
    const far = squareTile([100, 0]);
    const ripple = createRipple({
      tiles: [near, far],
      fromScheme: "",
      toScheme: "supertile",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: fallback,
    });
    // far's delay is 130ms (maxDistance reached); 180ms elapsed puts it at
    // t=0.4167 — strictly inside the cross-fade, not yet at either endpoint.
    const blended = rippleColor(ripple, far, 180);
    expect(blended).not.toBe(fallback);
    expect(blended).not.toBe(colorForTile(far, "supertile"));
    expect(blended).toMatch(/^rgb\(/);
  });

  it("falls back to fallbackColor when a scheme resolves to no override", () => {
    const tile = squareTile([0, 0]);
    const ripple = createRipple({
      tiles: [tile],
      fromScheme: "",
      toScheme: "",
      clickPoint: { x: 0, y: 0 },
      fallbackColor: fallback,
    });
    expect(rippleColor(ripple, tile, 0)).toBe(fallback);
    expect(rippleColor(ripple, tile, RIPPLE_TOTAL_MS)).toBe(fallback);
  });
});

describe("isRippleComplete", () => {
  it("is false before the total duration and true at/after it", () => {
    expect(isRippleComplete(0)).toBe(false);
    expect(isRippleComplete(RIPPLE_TOTAL_MS - 1)).toBe(false);
    expect(isRippleComplete(RIPPLE_TOTAL_MS)).toBe(true);
    expect(isRippleComplete(RIPPLE_TOTAL_MS + 1000)).toBe(true);
  });
});
