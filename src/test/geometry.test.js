import { describe, expect, it } from "vitest";
import {
  add,
  boundsIntersect,
  boundsOf,
  expandBounds,
  length,
  rotate,
  scale,
  subtract,
} from "../core/geometry.js";

describe("geometry", () => {
  it("adds and subtracts points", () => {
    expect(add({ x: 1, y: 2 }, { x: 3, y: -1 })).toEqual({ x: 4, y: 1 });
    expect(subtract({ x: 4, y: 1 }, { x: 3, y: -1 })).toEqual({ x: 1, y: 2 });
  });

  it("scales a point", () => {
    expect(scale({ x: 2, y: -3 }, 2)).toEqual({ x: 4, y: -6 });
  });

  it("computes vector length", () => {
    expect(length({ x: 3, y: 4 })).toBe(5);
  });

  it("rotates a point by a right angle", () => {
    const rotated = rotate({ x: 1, y: 0 }, Math.PI / 2);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBeCloseTo(1);
  });

  it("computes the bounding box of a polygon", () => {
    const bounds = boundsOf([
      { x: 0, y: 0 },
      { x: 5, y: 2 },
      { x: -1, y: 4 },
    ]);
    expect(bounds).toEqual([-1, 0, 5, 4]);
  });

  it("expands a bounding box by a margin on every side", () => {
    expect(expandBounds([0, 0, 5, 4], 2)).toEqual([-2, -2, 7, 6]);
  });

  it("shrinks a bounding box with a negative margin", () => {
    expect(expandBounds([0, 0, 5, 4], -1)).toEqual([1, 1, 4, 3]);
  });

  it("detects overlapping bounding boxes, including edge-touching", () => {
    expect(boundsIntersect([0, 0, 5, 5], [4, 4, 10, 10])).toBe(true);
    expect(boundsIntersect([0, 0, 5, 5], [5, 5, 10, 10])).toBe(true);
  });

  it("detects non-overlapping bounding boxes", () => {
    expect(boundsIntersect([0, 0, 5, 5], [6, 6, 10, 10])).toBe(false);
  });
});
