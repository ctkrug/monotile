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
});
