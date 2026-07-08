// The pinned-tile outline pulse from docs/DESIGN.md §5: "2 repeats, 140ms
// each" when a tile is first pinned, settling into a steady low-opacity
// outline afterward so the pin stays visible without staying loud. Pure and
// time-injected like ripple.js, for the same testability reason.

const PULSE_MS = 140;
const PULSE_REPEATS = 2;
export const PULSE_TOTAL_MS = PULSE_MS * PULSE_REPEATS;

const SETTLED_INTENSITY = 0.35;
const PULSE_RANGE = 1 - SETTLED_INTENSITY;

/**
 * Outline intensity (0-1, used as both opacity and a line-width multiplier)
 * for a pinned tile at `elapsedMs` since it was pinned. Oscillates through
 * PULSE_REPEATS bright pulses, then settles at a steady low intensity so
 * the pin remains visible indefinitely.
 */
export function pulseIntensity(elapsedMs) {
  if (elapsedMs < 0 || elapsedMs >= PULSE_TOTAL_MS) return SETTLED_INTENSITY;
  const phase = (elapsedMs % PULSE_MS) / PULSE_MS;
  return SETTLED_INTENSITY + PULSE_RANGE * Math.sin(phase * Math.PI);
}

/** Whether the animated part of the pulse is done (the caller can stop its rAF loop). */
export function isPulseComplete(elapsedMs) {
  return elapsedMs >= PULSE_TOTAL_MS;
}
