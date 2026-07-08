import { describe, expect, it } from "vitest";
import { DEFAULT_PALETTE, PALETTES } from "../core/palette.js";

describe("palette", () => {
  it("has a default that points at a defined palette", () => {
    expect(PALETTES[DEFAULT_PALETTE]).toBeDefined();
  });

  it("gives every palette a label, background, grid, and tile color", () => {
    for (const [key, palette] of Object.entries(PALETTES)) {
      expect(palette.label, `${key}.label`).toBeTruthy();
      expect(palette.background, `${key}.background`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(palette.grid, `${key}.grid`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(palette.tile, `${key}.tile`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });
});
