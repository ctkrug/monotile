// Drives the "recolor ripple" from docs/DESIGN.md §5: clicking a palette
// swatch cross-fades every tile's color from the old scheme to the new one,
// staggered outward from the click point so the change visibly radiates
// across the canvas instead of snapping everywhere at once.
//
// Pure and time-injected (elapsed milliseconds is a parameter, never read
// from a clock in here) so the whole animation curve is unit-testable
// without a real rAF loop or fake timers.

import { colorForTile, lerpColor } from "./coloring.js";

// Total wall-clock budget for the ripple, matching docs/DESIGN.md's "~250ms".
export const RIPPLE_TOTAL_MS = 250;
// Each tile's own cross-fade once its stagger delay elapses.
const FADE_MS = 120;

function tileCenter(tile) {
  let x = 0;
  let y = 0;
  for (const p of tile.points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / tile.points.length, y: y / tile.points.length };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Builds a ripple descriptor from the tiles visible when the swatch was
 * clicked. `clickPoint` is in the same world space as `tile.points`.
 */
export function createRipple({ tiles, fromScheme, toScheme, clickPoint, fallbackColor }) {
  const maxDistance = tiles.reduce(
    (max, tile) => Math.max(max, distance(tileCenter(tile), clickPoint)),
    0,
  );
  return { fromScheme, toScheme, clickPoint, maxDistance, fallbackColor };
}

/**
 * The color `tile` should render as `elapsedMs` after the ripple started.
 * Tiles farther from the click point start fading later, so the whole
 * effect still finishes by RIPPLE_TOTAL_MS regardless of tile count.
 */
export function rippleColor(ripple, tile, elapsedMs) {
  const dist = distance(tileCenter(tile), ripple.clickPoint);
  const delay =
    ripple.maxDistance > 0 ? (dist / ripple.maxDistance) * (RIPPLE_TOTAL_MS - FADE_MS) : 0;
  const t = (elapsedMs - delay) / FADE_MS;
  const from = colorForTile(tile, ripple.fromScheme) ?? ripple.fallbackColor;
  const to = colorForTile(tile, ripple.toScheme) ?? ripple.fallbackColor;
  // Return the exact scheme string at the endpoints rather than lerpColor's
  // always-rgb() output, so a completed ripple leaves colors indistinguishable
  // from a plain (non-animated) scheme switch.
  if (t <= 0) return from;
  if (t >= 1) return to;
  return lerpColor(from, to, t);
}

/** Whether every tile has finished fading and the ripple can be discarded. */
export function isRippleComplete(elapsedMs) {
  return elapsedMs >= RIPPLE_TOTAL_MS;
}
