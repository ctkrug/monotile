import { describe, expect, it } from "vitest";
import { pinchState } from "../core/touch.js";

describe("pinchState", () => {
  it("computes zero distance and the shared point as midpoint when both pointers coincide", () => {
    const state = pinchState({ x: 10, y: 10 }, { x: 10, y: 10 });
    expect(state.distance).toBe(0);
    expect(state.midpoint).toEqual({ x: 10, y: 10 });
  });

  it("computes the straight-line distance between two horizontally separated pointers", () => {
    const state = pinchState({ x: 0, y: 0 }, { x: 100, y: 0 });
    expect(state.distance).toBe(100);
    expect(state.midpoint).toEqual({ x: 50, y: 0 });
  });

  it("computes distance and midpoint for a diagonal pinch", () => {
    const state = pinchState({ x: 0, y: 0 }, { x: 3, y: 4 });
    expect(state.distance).toBe(5);
    expect(state.midpoint).toEqual({ x: 1.5, y: 2 });
  });

  it("is order-independent: distance and midpoint match regardless of argument order", () => {
    const a = { x: -20, y: 5 };
    const b = { x: 40, y: -15 };
    const forward = pinchState(a, b);
    const backward = pinchState(b, a);
    expect(backward.distance).toBeCloseTo(forward.distance);
    expect(backward.midpoint).toEqual(forward.midpoint);
  });
});
