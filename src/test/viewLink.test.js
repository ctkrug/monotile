import { describe, expect, it } from "vitest";
import { decodeViewHash, encodeViewHash } from "../core/viewLink.js";

describe("encodeViewHash", () => {
  it("encodes offset and zoom, omitting scheme for the default", () => {
    const hash = encodeViewHash({ offset: { x: 12.345, y: -6.7 }, zoom: 2 }, "");
    expect(hash).toBe("#x=12.35&y=-6.70&z=2.000");
  });

  it("includes a non-default scheme", () => {
    const hash = encodeViewHash({ offset: { x: 0, y: 0 }, zoom: 1 }, "orientation");
    expect(hash).toContain("scheme=orientation");
  });
});

describe("decodeViewHash", () => {
  it("round-trips a value encodeViewHash produced", () => {
    const camera = { offset: { x: 100, y: -50 }, zoom: 1.5 };
    const hash = encodeViewHash(camera, "generation");
    expect(decodeViewHash(hash)).toEqual({
      camera: { offset: { x: 100, y: -50 }, zoom: 1.5 },
      scheme: "generation",
    });
  });

  it("accepts a hash without its leading #", () => {
    expect(decodeViewHash("x=1&y=2&z=1")).toEqual({
      camera: { offset: { x: 1, y: 2 }, zoom: 1 },
      scheme: "",
    });
  });

  it("returns null for an empty hash", () => {
    expect(decodeViewHash("")).toBeNull();
    expect(decodeViewHash("#")).toBeNull();
  });

  it("returns null when a coordinate is missing or non-numeric", () => {
    expect(decodeViewHash("#x=1&y=2")).toBeNull();
    expect(decodeViewHash("#x=abc&y=2&z=1")).toBeNull();
  });

  it("returns null for a zero or negative zoom", () => {
    expect(decodeViewHash("#x=0&y=0&z=0")).toBeNull();
    expect(decodeViewHash("#x=0&y=0&z=-1")).toBeNull();
  });

  it("returns null for an unrecognized scheme", () => {
    expect(decodeViewHash("#x=0&y=0&z=1&scheme=nonsense")).toBeNull();
  });
});
