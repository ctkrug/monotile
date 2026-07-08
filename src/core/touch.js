// Pure math for two-pointer touch gestures (pinch-to-zoom). Kept separate
// from main.js's pointer-event wiring so the gesture math is unit-testable
// without a DOM.
import { length, lerp, subtract } from "./geometry.js";

/**
 * Distance and midpoint between two active touch points, in whatever
 * coordinate space the caller passes (main.js uses canvas-relative screen
 * coordinates). A pinch gesture tracks this once per finger, then compares
 * the latest state's distance to the previous one to derive a zoom factor.
 */
export function pinchState(pointA, pointB) {
  return {
    distance: length(subtract(pointA, pointB)),
    midpoint: lerp(pointA, pointB, 0.5),
  };
}
