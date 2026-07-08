import { add, scale, subtract } from "./geometry.js";

const MIN_ZOOM = 0.15;
const MAX_ZOOM = 8;

/**
 * Pan/zoom state for an infinite canvas. `offset` is the world-space point
 * currently rendered at the screen's top-left corner; `zoom` maps world
 * units to screen pixels.
 */
export function createCamera({ offset = { x: 0, y: 0 }, zoom = 1 } = {}) {
  return { offset, zoom };
}

export function panBy(camera, screenDelta) {
  return {
    ...camera,
    offset: subtract(camera.offset, scale(screenDelta, 1 / camera.zoom)),
  };
}

export function zoomAt(camera, screenPoint, factor) {
  const nextZoom = clamp(camera.zoom * factor, MIN_ZOOM, MAX_ZOOM);
  const worldBefore = screenToWorld(camera, screenPoint);
  const zoomed = { ...camera, zoom: nextZoom };
  const worldAfter = screenToWorld(zoomed, screenPoint);
  return { ...zoomed, offset: add(zoomed.offset, subtract(worldBefore, worldAfter)) };
}

export function screenToWorld(camera, screenPoint) {
  return add(camera.offset, scale(screenPoint, 1 / camera.zoom));
}

export function worldToScreen(camera, worldPoint) {
  return scale(subtract(worldPoint, camera.offset), camera.zoom);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
