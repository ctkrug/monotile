import { describe, expect, it } from "vitest";
import { applyMatrix, IDENTITY } from "../core/matrix.js";
import {
  buildBaseSystem,
  buildHierarchy,
  buildNextGeneration,
  SPECTRE_POINTS,
  SUPER_RULES,
  TILE_TYPES,
} from "../core/spectre.js";

function countLeaves(shape) {
  if (shape.kind === "tile") return 1;
  return shape.children.reduce((sum, child) => sum + countLeaves(child.shape), 0);
}

function bboxDiagonal(shape) {
  const points = shape.quad.map((p) => applyMatrix(IDENTITY, p));
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  return Math.hypot(width, height);
}

describe("spectre substitution rules", () => {
  it("gives every tile type a documented set of eight child slots", () => {
    for (const label of TILE_TYPES) {
      expect(SUPER_RULES[label], label).toHaveLength(8);
    }
  });

  it("only Gamma has an empty child slot, at index 2", () => {
    for (const label of TILE_TYPES) {
      const nullSlots = SUPER_RULES[label].map((v, i) => (v === null ? i : -1)).filter((i) => i >= 0);
      if (label === "Gamma") {
        expect(nullSlots).toEqual([2]);
      } else {
        expect(nullSlots).toEqual([]);
      }
    }
  });

  it("only references documented tile types as children", () => {
    for (const label of TILE_TYPES) {
      for (const child of SUPER_RULES[label]) {
        if (child !== null) expect(TILE_TYPES).toContain(child);
      }
    }
  });

  it("builds a generation-0 system where every non-Gamma label is a bare tile", () => {
    const base = buildBaseSystem();
    for (const label of TILE_TYPES) {
      if (label === "Gamma") continue;
      expect(base[label]).toEqual({ kind: "tile", label, quad: base[label].quad });
    }
  });

  it("builds Gamma's generation-0 mystic pair from two spectres", () => {
    const base = buildBaseSystem();
    expect(base.Gamma.kind).toBe("composite");
    expect(base.Gamma.children).toHaveLength(2);
    expect(base.Gamma.children.map((c) => c.shape.label)).toEqual(["Gamma1", "Gamma2"]);
  });

  it("subdivides each type into exactly the child count its rule documents", () => {
    const base = buildBaseSystem();
    const next = buildNextGeneration(base);
    for (const label of TILE_TYPES) {
      const expectedCount = SUPER_RULES[label].filter((c) => c !== null).length;
      expect(next[label].children, label).toHaveLength(expectedCount);
      expect(next[label].children.map((c) => c.shape.label)).toEqual(
        SUPER_RULES[label].filter((c) => c !== null),
      );
    }
  });

  it("produces a tile count per generation matching the documented substitution", () => {
    // Regression values for the Delta root, generations 0-4 — exact counts,
    // not estimates, so any change to the substitution data is caught.
    const expected = [1, 9, 71, 559, 4401];
    const counts = expected.map((_, g) => countLeaves(buildHierarchy(g).Delta));
    expect(counts).toEqual(expected);
  });

  it("converges to a stable growth ratio across generations", () => {
    const counts = [2, 3, 4].map((g) => countLeaves(buildHierarchy(g).Delta));
    const ratioA = counts[1] / counts[0];
    const ratioB = counts[2] / counts[1];
    expect(Math.abs(ratioA - ratioB)).toBeLessThan(0.2);
  });

  it("grows the covered area by roughly the same factor every generation", () => {
    const diagonals = [6, 7, 8, 9].map((g) => bboxDiagonal(buildHierarchy(g).Delta));
    const ratioA = diagonals[1] / diagonals[0];
    const ratioB = diagonals[2] / diagonals[1];
    const ratioC = diagonals[3] / diagonals[2];
    expect(Math.abs(ratioA - ratioB)).toBeLessThan(0.3);
    expect(Math.abs(ratioB - ratioC)).toBeLessThan(0.3);
  });

  it("keeps every base spectre a closed 14-vertex polygon", () => {
    expect(SPECTRE_POINTS).toHaveLength(14);
    const first = SPECTRE_POINTS[0];
    expect(first).toEqual({ x: 0, y: 0 });
  });
});
