// Pure state transitions for the desktop control-rail toggle, so the
// expand/collapse decision, its label, and its glyph are unit-testable
// without the DOM.

/** The next expanded state after a toggle click. */
export function nextRailExpanded(expanded) {
  return !expanded;
}

/** Accessible label for the toggle button in a given state. */
export function railToggleLabel(expanded) {
  return expanded ? "Collapse controls panel" : "Expand controls panel";
}

/** Directional glyph for the toggle button in a given state. */
export function railToggleGlyph(expanded) {
  return expanded ? "»" : "«";
}
