// Persisted dismissal for the first-visit pan hint (story 3.8). Same
// localStorage-with-safe-fallback pattern as audio.js's mute flag, so a
// visitor only ever sees the hint once, but nothing throws in a private
// window or a test environment without localStorage.

const HINT_SEEN_KEY = "monotile:hint-seen";

/** Whether the visitor has already dismissed the pan hint. */
export function hasSeenHint() {
  if (typeof localStorage === "undefined") return false;
  try {
    return localStorage.getItem(HINT_SEEN_KEY) === "true";
  } catch {
    return false;
  }
}

/** Records that the hint has been dismissed, so it never reappears. */
export function markHintSeen() {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(HINT_SEEN_KEY, "true");
  } catch {
    // Storage unavailable (e.g. private mode quota) — the hint just won't
    // stay dismissed across reloads this session.
  }
}
