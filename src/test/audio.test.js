import { afterEach, describe, expect, it, vi } from "vitest";

describe("audio", () => {
  afterEach(() => {
    delete globalThis.localStorage;
    delete globalThis.AudioContext;
    vi.resetModules();
  });

  it("defaults to unmuted with no persisted preference", async () => {
    const audio = await import("../core/audio.js");
    expect(audio.isMuted()).toBe(false);
  });

  it("setMuted updates isMuted immediately", async () => {
    const audio = await import("../core/audio.js");
    audio.setMuted(true);
    expect(audio.isMuted()).toBe(true);
    audio.setMuted(false);
    expect(audio.isMuted()).toBe(false);
  });

  it("persists mute state via localStorage across a simulated reload", async () => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    };

    const first = await import("../core/audio.js");
    expect(first.isMuted()).toBe(false);
    first.setMuted(true);

    vi.resetModules();
    const second = await import("../core/audio.js");
    expect(second.isMuted()).toBe(true);
  });

  it("does not throw when localStorage.setItem throws (e.g. private-mode quota)", async () => {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    };
    const audio = await import("../core/audio.js");
    expect(() => audio.setMuted(true)).not.toThrow();
    expect(audio.isMuted()).toBe(true);
  });

  it("playRecolorChime and playExportShutter do not throw when AudioContext is unavailable", async () => {
    const audio = await import("../core/audio.js");
    expect(() => audio.playRecolorChime()).not.toThrow();
    expect(() => audio.playExportShutter()).not.toThrow();
  });

  it("skips playback entirely while muted, without touching AudioContext", async () => {
    const create = vi.fn();
    globalThis.AudioContext = function AudioContext() {
      create();
      return {};
    };
    const audio = await import("../core/audio.js");
    audio.setMuted(true);
    audio.playRecolorChime();
    audio.playExportShutter();
    expect(create).not.toHaveBeenCalled();
  });

  it("does not throw when merely accessing the localStorage global throws", async () => {
    // A sandboxed/restricted environment can throw a SecurityError on
    // *accessing* the global, not just calling its methods — which
    // `typeof localStorage` itself would also trigger during module load.
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("SecurityError: storage disabled");
      },
      configurable: true,
    });
    const audio = await import("../core/audio.js");
    expect(audio.isMuted()).toBe(false);
    expect(() => audio.setMuted(true)).not.toThrow();
  });

  it("does not throw when localStorage.getItem throws while reading persisted mute state", async () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked by privacy setting");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    const audio = await import("../core/audio.js");
    expect(audio.isMuted()).toBe(false);
  });

  it("drives real oscillator/gain and buffer/filter graphs when AudioContext is available", async () => {
    function fakeParam() {
      return { value: 0, setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
    }
    function fakeNode(extra = {}) {
      const node = { connect: vi.fn((next) => next), ...extra };
      return node;
    }
    const oscillators = [];
    const buffers = [];
    globalThis.AudioContext = function AudioContext() {
      this.currentTime = 0;
      this.sampleRate = 44100;
      this.destination = fakeNode();
      this.createOscillator = () => {
        const osc = fakeNode({
          frequency: fakeParam(),
          type: "sine",
          start: vi.fn(),
          stop: vi.fn(),
        });
        oscillators.push(osc);
        return osc;
      };
      this.createGain = () => fakeNode({ gain: fakeParam() });
      this.createBuffer = (channels, length, sampleRate) => {
        const data = new Float32Array(length);
        buffers.push({ length, sampleRate });
        return { getChannelData: () => data };
      };
      this.createBufferSource = () => fakeNode({ buffer: null, start: vi.fn() });
      this.createBiquadFilter = () => fakeNode({ type: "lowpass", frequency: fakeParam() });
    };

    const audio = await import("../core/audio.js");
    expect(() => audio.playRecolorChime()).not.toThrow();
    expect(oscillators).toHaveLength(2);
    expect(oscillators[0].start).toHaveBeenCalled();
    expect(oscillators[0].frequency.value).toBe(440);
    expect(oscillators[1].frequency.value).toBe(660);

    expect(() => audio.playExportShutter()).not.toThrow();
    expect(buffers).toHaveLength(1);
    expect(buffers[0].length).toBeGreaterThan(0);
  });
});
