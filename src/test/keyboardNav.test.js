import { describe, expect, it } from "vitest";
import { isResetKey, panStepForKey, zoomFactorForKey } from "../core/keyboardNav.js";

describe("panStepForKey", () => {
  it("returns a downward drag delta for ArrowUp (reveals what's above)", () => {
    expect(panStepForKey("ArrowUp")).toEqual({ x: 0, y: 40 });
  });

  it("returns opposite deltas for opposite arrow keys", () => {
    expect(panStepForKey("ArrowDown")).toEqual({ x: 0, y: -40 });
    expect(panStepForKey("ArrowLeft")).toEqual({ x: 40, y: 0 });
    expect(panStepForKey("ArrowRight")).toEqual({ x: -40, y: 0 });
  });

  it("uses a larger step when shift is held", () => {
    expect(panStepForKey("ArrowUp", { shiftKey: true })).toEqual({ x: 0, y: 160 });
  });

  it("returns null for a non-pan key", () => {
    expect(panStepForKey("a")).toBeNull();
    expect(panStepForKey("Enter")).toBeNull();
  });
});

describe("zoomFactorForKey", () => {
  it("returns a factor above 1 for the zoom-in keys", () => {
    expect(zoomFactorForKey("+")).toBeGreaterThan(1);
    expect(zoomFactorForKey("=")).toBeGreaterThan(1);
  });

  it("returns a factor below 1 for the zoom-out keys, exactly reciprocal", () => {
    expect(zoomFactorForKey("-")).toBeCloseTo(1 / zoomFactorForKey("+"));
    expect(zoomFactorForKey("_")).toBe(zoomFactorForKey("-"));
  });

  it("returns null for a non-zoom key", () => {
    expect(zoomFactorForKey("z")).toBeNull();
  });
});

describe("isResetKey", () => {
  it("is true only for Home", () => {
    expect(isResetKey("Home")).toBe(true);
    expect(isResetKey("End")).toBe(false);
    expect(isResetKey("")).toBe(false);
  });
});
