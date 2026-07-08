import { describe, expect, it } from "vitest";
import { findTileAt } from "../core/inspector.js";
import { IDENTITY } from "../core/matrix.js";

function squareTile(center, label) {
  const [x, y] = center;
  return {
    label,
    depth: 1,
    transform: IDENTITY,
    points: [
      { x: x - 5, y: y - 5 },
      { x: x + 5, y: y - 5 },
      { x: x + 5, y: y + 5 },
      { x: x - 5, y: y + 5 },
    ],
  };
}

describe("findTileAt", () => {
  it("finds the tile containing the point", () => {
    const tiles = [squareTile([0, 0], "A"), squareTile([20, 0], "B")];
    expect(findTileAt(tiles, { x: 21, y: 1 })?.label).toBe("B");
  });

  it("returns null when no tile contains the point", () => {
    const tiles = [squareTile([0, 0], "A")];
    expect(findTileAt(tiles, { x: 500, y: 500 })).toBeNull();
  });

  it("returns null for an empty tile list", () => {
    expect(findTileAt([], { x: 0, y: 0 })).toBeNull();
  });

  it("prefers the last (topmost-drawn) tile when overlapping", () => {
    const tiles = [squareTile([0, 0], "under"), squareTile([0, 0], "over")];
    expect(findTileAt(tiles, { x: 0, y: 0 })?.label).toBe("over");
  });
});
