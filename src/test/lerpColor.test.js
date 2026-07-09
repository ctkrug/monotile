import { describe, expect, it } from "vitest";
import { lerpColor } from "../core/coloring.js";

describe("lerpColor", () => {
  it("returns the start color at t=0", () => {
    expect(lerpColor("#5ec8ff", "#ffb454", 0)).toBe("rgb(94, 200, 255)");
  });

  it("returns the end color at t=1", () => {
    expect(lerpColor("#5ec8ff", "#ffb454", 1)).toBe("rgb(255, 180, 84)");
  });

  it("interpolates linearly at the midpoint", () => {
    expect(lerpColor("rgb(0, 0, 0)", "rgb(100, 100, 100)", 0.5)).toBe("rgb(50, 50, 50)");
  });

  it("clamps t outside [0, 1]", () => {
    expect(lerpColor("#000000", "#ffffff", -1)).toBe("rgb(0, 0, 0)");
    expect(lerpColor("#000000", "#ffffff", 2)).toBe("rgb(255, 255, 255)");
  });

  it("accepts hsl() colors", () => {
    expect(lerpColor("hsl(0, 0%, 0%)", "hsl(0, 0%, 100%)", 0.5)).toBe("rgb(128, 128, 128)");
  });

  it("interpolates between mismatched color formats", () => {
    expect(lerpColor("#000000", "hsl(0, 0%, 100%)", 0.5)).toBe("rgb(128, 128, 128)");
  });

  it("is a no-op when both colors are identical", () => {
    expect(lerpColor("#5ec8ff", "#5ec8ff", 0.5)).toBe("rgb(94, 200, 255)");
  });

  it("expands 3-digit shorthand hex the same as its 6-digit equivalent", () => {
    expect(lerpColor("#f00", "#0f0", 0)).toBe("rgb(255, 0, 0)");
    expect(lerpColor("#f00", "#0f0", 1)).toBe("rgb(0, 255, 0)");
  });

  it("falls back to black for an unrecognized color format instead of throwing", () => {
    expect(() => lerpColor("not-a-color", "#ffffff", 0.5)).not.toThrow();
    expect(lerpColor("not-a-color", "#ffffff", 0.5)).toBe("rgb(128, 128, 128)");
    expect(lerpColor("", "", 1)).toBe("rgb(0, 0, 0)");
  });
});
