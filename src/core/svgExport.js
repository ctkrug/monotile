// Renders the current tile set to a standalone SVG string for the poster
// export (docs/BACKLOG.md story 2.3). Every element is a plain vector
// shape — no <image>, no external stylesheet or font reference, no @import
// — so the file opens and prints correctly outside the app, per the AC.

import { colorForTile } from "./coloring.js";

function polygonPoints(tile) {
  return tile.points.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
}

function polygonMarkup(tile, palette, scheme) {
  const color = colorForTile(tile, scheme) ?? palette.tile;
  return (
    `<polygon points="${polygonPoints(tile)}" fill="${color}" fill-opacity="0.12" ` +
    `stroke="${color}" stroke-width="1.5" stroke-linejoin="round" />`
  );
}

/**
 * Builds a self-contained SVG document string for `tiles` (as returned by
 * `TileField#update()`), colored per `scheme` (see coloring.js), cropped to
 * `bounds` ([minX, minY, maxX, maxY] in world space).
 */
export function buildSvg(tiles, palette, scheme, bounds) {
  const [minX, minY, maxX, maxY] = bounds;
  const width = maxX - minX;
  const height = maxY - minY;
  const background = `<rect x="${minX.toFixed(2)}" y="${minY.toFixed(2)}" width="${width.toFixed(2)}" height="${height.toFixed(2)}" fill="${palette.background}" />`;
  const polygons = tiles.map((tile) => polygonMarkup(tile, palette, scheme)).join("\n  ");

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX.toFixed(2)} ${minY.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)}" ` +
    `width="${Math.round(width)}" height="${Math.round(height)}">\n` +
    `  ${background}\n` +
    (polygons ? `  ${polygons}\n` : "") +
    `</svg>\n`
  );
}
