// Coloring schemes for the tiling. Each scheme maps a tile's substitution
// metadata to a fill color; the real per-tile mapping logic (by orientation,
// by generation, by supertile membership) lands with the substitution
// system in BUILD — for now every scheme resolves to its base color so the
// render pipeline has something real to draw.

export const PALETTES = {
  blueprint: {
    label: "Blueprint",
    background: "#0b1220",
    grid: "#16223c",
    tile: "#5ec8ff",
  },
  amber: {
    label: "Amber survey",
    background: "#0b1220",
    grid: "#16223c",
    tile: "#ffb454",
  },
  mono: {
    label: "Mono line",
    background: "#0b1220",
    grid: "#16223c",
    tile: "#e8f1ff",
  },
};

export const DEFAULT_PALETTE = "blueprint";
