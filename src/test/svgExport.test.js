import { describe, expect, it } from "vitest";
import { PALETTES } from "../core/palette.js";
import { IDENTITY } from "../core/matrix.js";
import { buildSvg } from "../core/svgExport.js";

const palette = PALETTES.blueprint;
const BOUNDS = [-100, -50, 100, 50];

function squareTile(center, label = "Delta") {
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

describe("buildSvg", () => {
  it("starts with a valid XML/SVG header", () => {
    const svg = buildSvg([squareTile([0, 0])], palette, "", BOUNDS);
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg.trim().endsWith("</svg>")).toBe(true);
  });

  it("emits exactly one <polygon> per tile", () => {
    const tiles = [squareTile([0, 0]), squareTile([20, 0]), squareTile([-20, 10])];
    const svg = buildSvg(tiles, palette, "", BOUNDS);
    expect(svg.match(/<polygon /g)).toHaveLength(3);
  });

  it("produces a valid, non-crashing document for zero tiles", () => {
    const svg = buildSvg([], palette, "", BOUNDS);
    expect(svg).not.toContain("<polygon");
    expect(svg).toContain("<svg");
    expect(svg).toContain("</svg>");
  });

  it("sets the viewBox and dimensions from the given bounds", () => {
    const svg = buildSvg([], palette, "", [-100, -50, 100, 50]);
    expect(svg).toContain('viewBox="-100.00 -50.00 200.00 100.00"');
    expect(svg).toContain('width="200" height="100"');
  });

  it("colors polygons per the active scheme", () => {
    const tile = squareTile([0, 0]);
    const svg = buildSvg([tile], palette, "supertile", BOUNDS);
    expect(svg).toContain("hsl(");
  });

  it("falls back to the palette's flat tile color with no scheme", () => {
    const tile = squareTile([0, 0]);
    const svg = buildSvg([tile], palette, "", BOUNDS);
    expect(svg).toContain(`stroke="${palette.tile}"`);
  });

  it("contains no external asset references", () => {
    const svg = buildSvg([squareTile([0, 0])], palette, "supertile", BOUNDS);
    expect(svg).not.toMatch(/<image/i);
    expect(svg).not.toMatch(/xlink:href/i);
    expect(svg).not.toMatch(/@import/i);
    expect(svg).not.toMatch(/<link/i);
    expect(svg).not.toMatch(/url\(/i);
    expect(svg).not.toMatch(/font-family/i);
  });
});
