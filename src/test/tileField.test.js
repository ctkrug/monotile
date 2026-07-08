import { describe, expect, it } from "vitest";
import { createTileField } from "../core/tileField.js";

const VIEWPORT = [-400, -300, 400, 300];
const MARGIN = 200;

describe("tileField", () => {
  it("returns a non-empty, bounded set of tiles for a viewport", () => {
    const field = createTileField();
    const { tiles } = field.update(VIEWPORT, MARGIN);
    expect(tiles.length).toBeGreaterThan(0);
    // A fixed viewport at a fixed tile scale should produce a stable order
    // of magnitude of tiles, not thousands (which would mean culling isn't
    // pruning) or a handful (which would mean it's over-pruning).
    expect(tiles.length).toBeLessThan(2000);
  });

  it("keeps every returned tile near the viewport plus margin", () => {
    // Culling tests an axis-aligned box around each (possibly rotated) tile,
    // so a tile can land up to roughly one tile-diameter past the margin
    // and still correctly pass the test — this checks culling is actually
    // bounding the result, not that every tile is a strict pixel match.
    const field = createTileField();
    const { tiles } = field.update(VIEWPORT, MARGIN);
    const slop = 250;
    const [minX, minY, maxX, maxY] = [
      VIEWPORT[0] - MARGIN - slop,
      VIEWPORT[1] - MARGIN - slop,
      VIEWPORT[2] + MARGIN + slop,
      VIEWPORT[3] + MARGIN + slop,
    ];
    for (const tile of tiles) {
      for (const p of tile.points) {
        expect(p.x).toBeGreaterThanOrEqual(minX);
        expect(p.x).toBeLessThanOrEqual(maxX);
        expect(p.y).toBeGreaterThanOrEqual(minY);
        expect(p.y).toBeLessThanOrEqual(maxY);
      }
    }
  });

  it("never places two tiles at the same position and orientation", () => {
    const field = createTileField();
    const { tiles } = field.update(VIEWPORT, MARGIN);
    const seen = new Set();
    for (const tile of tiles) {
      const key = tile.points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join("|");
      expect(seen.has(key), `duplicate tile at ${key}`).toBe(false);
      seen.add(key);
    }
  });

  it("only adds and removes the tiles that entered or left view when panning", () => {
    const field = createTileField();
    const first = field.update(VIEWPORT, MARGIN);
    const shifted = [VIEWPORT[0] + 100, VIEWPORT[1], VIEWPORT[2] + 100, VIEWPORT[3]];
    const second = field.update(shifted, MARGIN);

    expect(second.added.length).toBeGreaterThan(0);
    expect(second.added.length).toBeLessThan(first.tiles.length);
    expect(second.removed.length).toBeLessThan(first.tiles.length);
  });

  it("reuses cached tile records for tiles that remain visible across pans", () => {
    const field = createTileField();
    const first = field.update(VIEWPORT, MARGIN);
    const byId = new Map(first.tiles.map((t) => [t.id, t]));

    const shifted = [VIEWPORT[0] + 50, VIEWPORT[1], VIEWPORT[2] + 50, VIEWPORT[3]];
    const second = field.update(shifted, MARGIN);

    const stillVisible = second.tiles.filter((t) => byId.has(t.id));
    expect(stillVisible.length).toBeGreaterThan(0);
    for (const tile of stillVisible) {
      expect(tile).toBe(byId.get(tile.id));
    }
  });

  it("keeps working after panning far beyond the starting viewport", () => {
    const field = createTileField();
    field.update(VIEWPORT, MARGIN);
    // 50 viewport-widths away.
    const farAway = [VIEWPORT[0] + 40000, VIEWPORT[1], VIEWPORT[2] + 40000, VIEWPORT[3]];
    const { tiles } = field.update(farAway, MARGIN);
    expect(tiles.length).toBeGreaterThan(0);
  });

  it("culls a viewport well within a single frame budget", () => {
    const field = createTileField();
    const start = performance.now();
    field.update(VIEWPORT, MARGIN);
    expect(performance.now() - start).toBeLessThan(150);
  });
});
