import { afterEach, describe, expect, it } from "vitest";
import { hasSeenHint, markHintSeen } from "../core/hint.js";

describe("hint", () => {
  afterEach(() => {
    delete globalThis.localStorage;
  });

  it("defaults to not-seen with no persisted preference", () => {
    expect(hasSeenHint()).toBe(false);
  });

  it("reports seen after markHintSeen persists it", () => {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
    };

    expect(hasSeenHint()).toBe(false);
    markHintSeen();
    expect(hasSeenHint()).toBe(true);
  });

  it("does not throw when localStorage is unavailable", () => {
    expect(() => markHintSeen()).not.toThrow();
    expect(hasSeenHint()).toBe(false);
  });

  it("does not throw when localStorage.setItem throws (e.g. private-mode quota)", () => {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota exceeded");
      },
      removeItem: () => {},
    };
    expect(() => markHintSeen()).not.toThrow();
  });

  it("treats a hand-corrupted stored value as not-seen rather than throwing", () => {
    globalThis.localStorage = {
      getItem: () => "yes-please",
      setItem: () => {},
      removeItem: () => {},
    };
    expect(hasSeenHint()).toBe(false);
  });

  it("does not throw when localStorage.getItem throws", () => {
    globalThis.localStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {},
      removeItem: () => {},
    };
    expect(hasSeenHint()).toBe(false);
  });

  it("does not throw when merely accessing the localStorage global throws", () => {
    // Some sandboxed/restricted environments (a locked-down iframe, storage
    // fully disabled by policy) throw a SecurityError on *accessing* the
    // global, not just on calling its methods — which `typeof localStorage`
    // itself would also trigger.
    Object.defineProperty(globalThis, "localStorage", {
      get() {
        throw new Error("SecurityError: storage disabled");
      },
      configurable: true,
    });
    expect(() => hasSeenHint()).not.toThrow();
    expect(hasSeenHint()).toBe(false);
    expect(() => markHintSeen()).not.toThrow();
  });
});
