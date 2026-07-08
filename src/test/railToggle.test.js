import { describe, expect, it } from "vitest";
import { nextRailExpanded, railToggleGlyph, railToggleLabel } from "../core/railToggle.js";

describe("nextRailExpanded", () => {
  it("flips true to false", () => {
    expect(nextRailExpanded(true)).toBe(false);
  });

  it("flips false to true", () => {
    expect(nextRailExpanded(false)).toBe(true);
  });
});

describe("railToggleLabel", () => {
  it("invites collapsing when expanded", () => {
    expect(railToggleLabel(true)).toBe("Collapse controls panel");
  });

  it("invites expanding when collapsed", () => {
    expect(railToggleLabel(false)).toBe("Expand controls panel");
  });
});

describe("railToggleGlyph", () => {
  it("points right (dock) when expanded", () => {
    expect(railToggleGlyph(true)).toBe("»");
  });

  it("points left (pull out) when collapsed", () => {
    expect(railToggleGlyph(false)).toBe("«");
  });
});
