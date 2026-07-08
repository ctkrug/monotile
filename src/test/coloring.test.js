import { describe, expect, it } from "vitest";
import { colorForTile, orientationDegrees, withAlpha } from "../core/coloring.js";
import { IDENTITY, rotation } from "../core/matrix.js";

function tile(overrides = {}) {
  return { label: "Delta", depth: 3, transform: IDENTITY, ...overrides };
}

describe("colorForTile", () => {
  it("returns null for an unknown or empty scheme, so callers fall back", () => {
    expect(colorForTile(tile(), undefined)).toBeNull();
    expect(colorForTile(tile(), "")).toBeNull();
    expect(colorForTile(tile(), "not-a-scheme")).toBeNull();
  });

  it("is deterministic for the same tile and scheme", () => {
    const t = tile();
    expect(colorForTile(t, "supertile")).toBe(colorForTile(t, "supertile"));
    expect(colorForTile(t, "generation")).toBe(colorForTile(t, "generation"));
    expect(colorForTile(t, "orientation")).toBe(colorForTile(t, "orientation"));
  });

  it("gives different supertile labels different colors", () => {
    const colors = new Set(
      ["Gamma", "Delta", "Theta", "Xi", "Pi", "Sigma", "Phi", "Psi"].map((label) =>
        colorForTile(tile({ label }), "supertile"),
      ),
    );
    expect(colors.size).toBe(8);
  });

  it("gives different generation depths visibly different colors", () => {
    const a = colorForTile(tile({ depth: 1 }), "generation");
    const b = colorForTile(tile({ depth: 2 }), "generation");
    expect(a).not.toBe(b);
  });

  it("gives different orientations different colors", () => {
    const upright = colorForTile(tile({ transform: IDENTITY }), "orientation");
    const rotated = colorForTile(tile({ transform: rotation(Math.PI / 2) }), "orientation");
    expect(upright).not.toBe(rotated);
  });

  it("produces valid CSS hsl() strings", () => {
    for (const scheme of ["supertile", "generation", "orientation"]) {
      expect(colorForTile(tile(), scheme)).toMatch(/^hsl\(\d+(\.\d+)?, \d+%, \d+%\)$/);
    }
  });
});

describe("orientationDegrees", () => {
  it("is 0 for an untransformed tile", () => {
    expect(orientationDegrees(IDENTITY)).toBeCloseTo(0);
  });

  it("reports a quarter turn as 90 degrees", () => {
    expect(orientationDegrees(rotation(Math.PI / 2))).toBeCloseTo(90);
  });

  it("reports a negative rotation as a negative angle", () => {
    expect(orientationDegrees(rotation(-Math.PI / 2))).toBeCloseTo(-90);
  });
});

describe("withAlpha", () => {
  it("appends an alpha channel to a hex color", () => {
    expect(withAlpha("#5ec8ff", 1)).toBe("#5ec8ffff");
    expect(withAlpha("#5ec8ff", 0)).toBe("#5ec8ff00");
  });

  it("converts an hsl() color to hsla() with the given alpha", () => {
    expect(withAlpha("hsl(120, 50%, 60%)", 0.25)).toBe("hsla(120, 50%, 60%, 0.25)");
  });
});
