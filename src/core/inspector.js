// Tile hit-testing for the live survey readout and the click-to-pin
// inspector (docs/BACKLOG.md story 3.1). Pure — takes the already-computed
// visible tile list and a world-space point, so it's independent of the
// canvas and easy to unit test.

import { pointInPolygon } from "./geometry.js";

/**
 * The topmost tile (last drawn, so last in the array) whose outline
 * contains `point` (world space), or null if none does.
 */
export function findTileAt(tiles, point) {
  for (let i = tiles.length - 1; i >= 0; i--) {
    if (pointInPolygon(point, tiles[i].points)) return tiles[i];
  }
  return null;
}
