import { describe, expect, it } from "vitest";
import {
  applyMatrix,
  IDENTITY,
  multiply,
  rotation,
  scaleUniform,
  translation,
  translationBetween,
} from "../core/matrix.js";

describe("matrix", () => {
  it("leaves points unchanged under the identity", () => {
    expect(applyMatrix(IDENTITY, { x: 3, y: -7 })).toEqual({ x: 3, y: -7 });
  });

  it("translates a point by (tx, ty)", () => {
    const m = translation(2, -5);
    expect(applyMatrix(m, { x: 1, y: 1 })).toEqual({ x: 3, y: -4 });
  });

  it("rotates a point 90 degrees counter-clockwise", () => {
    const m = rotation(Math.PI / 2);
    const p = applyMatrix(m, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(0);
    expect(p.y).toBeCloseTo(1);
  });

  it("scales a point uniformly about the origin", () => {
    const m = scaleUniform(2.5);
    expect(applyMatrix(m, { x: 4, y: -2 })).toEqual({ x: 10, y: -5 });
  });

  it("composes transforms so the right-hand one applies first", () => {
    const rotateThenTranslate = multiply(translation(10, 0), rotation(Math.PI / 2));
    const p = applyMatrix(rotateThenTranslate, { x: 1, y: 0 });
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(1);
  });

  it("finds the translation carrying one point onto another", () => {
    const m = translationBetween({ x: 5, y: 5 }, { x: 8, y: 1 });
    expect(applyMatrix(m, { x: 5, y: 5 })).toEqual({ x: 8, y: 1 });
  });
});
