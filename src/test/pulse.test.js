import { describe, expect, it } from "vitest";
import { isPulseComplete, PULSE_TOTAL_MS, pulseIntensity } from "../core/pulse.js";

describe("pulseIntensity", () => {
  it("starts at the settled baseline", () => {
    expect(pulseIntensity(0)).toBeCloseTo(0.35);
  });

  it("peaks near the middle of the first repeat", () => {
    expect(pulseIntensity(35)).toBeGreaterThan(pulseIntensity(0));
    expect(pulseIntensity(70)).toBeCloseTo(1, 1);
  });

  it("returns to baseline between repeats", () => {
    expect(pulseIntensity(140)).toBeCloseTo(0.35, 1);
  });

  it("peaks again during the second repeat", () => {
    expect(pulseIntensity(210)).toBeCloseTo(1, 1);
  });

  it("settles at the baseline once the total duration elapses", () => {
    expect(pulseIntensity(PULSE_TOTAL_MS)).toBeCloseTo(0.35);
    expect(pulseIntensity(PULSE_TOTAL_MS + 5000)).toBeCloseTo(0.35);
  });

  it("clamps negative elapsed time to the baseline", () => {
    expect(pulseIntensity(-10)).toBeCloseTo(0.35);
  });
});

describe("isPulseComplete", () => {
  it("is false during the animated window and true at/after it", () => {
    expect(isPulseComplete(0)).toBe(false);
    expect(isPulseComplete(PULSE_TOTAL_MS - 1)).toBe(false);
    expect(isPulseComplete(PULSE_TOTAL_MS)).toBe(true);
  });
});
