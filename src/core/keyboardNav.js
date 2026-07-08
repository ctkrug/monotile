// Pure key -> intent mapping for keyboard-driven pan/zoom, so the canvas is
// operable without a pointer. Kept separate from main.js's keydown wiring so
// the mapping itself is unit-testable without a DOM.

const PAN_STEP = 40;
const PAN_STEP_FAST = 160;
const ZOOM_STEP_FACTOR = 1.2;

/**
 * Screen-space pan delta for a keydown, in the same {x, y} shape panBy()
 * expects, or null if `key` isn't a pan key. Arrow keys pan in the visual
 * direction pressed (Up reveals what's above, etc.) — panBy() itself takes
 * the delta as a drag would produce it, so this returns the drag-equivalent
 * delta (opposite of the direction revealed).
 */
export function panStepForKey(key, { shiftKey = false } = {}) {
  const step = shiftKey ? PAN_STEP_FAST : PAN_STEP;
  switch (key) {
    case "ArrowUp":
      return { x: 0, y: step };
    case "ArrowDown":
      return { x: 0, y: -step };
    case "ArrowLeft":
      return { x: step, y: 0 };
    case "ArrowRight":
      return { x: -step, y: 0 };
    default:
      return null;
  }
}

/** Zoom factor for a keydown (centered on the viewport), or null. */
export function zoomFactorForKey(key) {
  if (key === "+" || key === "=") return ZOOM_STEP_FACTOR;
  if (key === "-" || key === "_") return 1 / ZOOM_STEP_FACTOR;
  return null;
}

/** Whether `key` resets the camera to its initial pan/zoom. */
export function isResetKey(key) {
  return key === "Home";
}
