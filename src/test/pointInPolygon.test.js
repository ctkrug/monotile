import { describe, expect, it } from "vitest";
import { pointInPolygon } from "../core/geometry.js";

const SQUARE = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 10 },
  { x: 0, y: 10 },
];

describe("pointInPolygon", () => {
  it("is true for a point well inside the polygon", () => {
    expect(pointInPolygon({ x: 5, y: 5 }, SQUARE)).toBe(true);
  });

  it("is false for a point well outside the polygon", () => {
    expect(pointInPolygon({ x: 50, y: 50 }, SQUARE)).toBe(false);
  });

  it("is false for a point outside but on the same axis as the polygon", () => {
    expect(pointInPolygon({ x: -5, y: 5 }, SQUARE)).toBe(false);
  });

  it("handles a concave (non-convex) polygon", () => {
    const chevron = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 5, y: 5 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ];
    expect(pointInPolygon({ x: 1, y: 5 }, chevron)).toBe(true);
    expect(pointInPolygon({ x: 8, y: 5 }, chevron)).toBe(false);
  });

  it("returns false for an empty polygon without crashing", () => {
    expect(pointInPolygon({ x: 0, y: 0 }, [])).toBe(false);
  });
});
