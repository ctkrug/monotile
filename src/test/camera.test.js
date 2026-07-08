import { describe, expect, it } from "vitest";
import { createCamera, panBy, screenToWorld, worldToScreen, zoomAt } from "../core/camera.js";

describe("camera", () => {
  it("pans the offset opposite to the drag delta, scaled by zoom", () => {
    const camera = createCamera({ offset: { x: 0, y: 0 }, zoom: 2 });
    const panned = panBy(camera, { x: 10, y: -20 });
    expect(panned.offset).toEqual({ x: -5, y: 10 });
  });

  it("round-trips screen and world coordinates", () => {
    const camera = createCamera({ offset: { x: 100, y: -50 }, zoom: 1.5 });
    const world = { x: 42, y: 17 };
    const screen = worldToScreen(camera, world);
    const roundTripped = screenToWorld(camera, screen);
    expect(roundTripped.x).toBeCloseTo(world.x);
    expect(roundTripped.y).toBeCloseTo(world.y);
  });

  it("keeps the point under the cursor fixed when zooming", () => {
    const camera = createCamera({ offset: { x: 0, y: 0 }, zoom: 1 });
    const cursor = { x: 200, y: 150 };
    const worldUnderCursorBefore = screenToWorld(camera, cursor);

    const zoomed = zoomAt(camera, cursor, 2);
    const worldUnderCursorAfter = screenToWorld(zoomed, cursor);

    expect(worldUnderCursorAfter.x).toBeCloseTo(worldUnderCursorBefore.x);
    expect(worldUnderCursorAfter.y).toBeCloseTo(worldUnderCursorBefore.y);
    expect(zoomed.zoom).toBe(2);
  });

  it("clamps zoom to a sane range", () => {
    const camera = createCamera({ zoom: 1 });
    const zoomedOut = zoomAt(camera, { x: 0, y: 0 }, 0.0001);
    const zoomedIn = zoomAt(camera, { x: 0, y: 0 }, 10000);
    expect(zoomedOut.zoom).toBeGreaterThan(0);
    expect(zoomedIn.zoom).toBeLessThanOrEqual(8);
  });
});
