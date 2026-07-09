// Turns the (conceptually unbounded) spectre substitution hierarchy into the
// bounded set of tiles actually worth drawing for a given viewport. Walks
// the hierarchy from its root, pruning whole subtrees whose bounding box
// doesn't reach the visible region (plus a prefetch margin), so cost stays
// proportional to what's on screen rather than to how far the camera has
// panned. A tile once computed is cached by a stable path key and reused
// across calls — panning only adds newly-revealed tiles and drops ones that
// scrolled out, never recomputing tiles still in view.

import { applyMatrix, multiply, scaleUniform, translation } from "./matrix.js";
import { boundsIntersect, boundsOf, expandBounds } from "./geometry.js";
import { buildHierarchy, SPECTRE_POINTS } from "./spectre.js";

// High enough that the covered region's diagonal (~10^5-10^6 world units)
// vastly exceeds any realistic pan session, while costing under 2ms to
// build (see docs/ARCHITECTURE.md) since the hierarchy is a ~9-node-per-
// generation DAG, not an eagerly expanded tree.
const DEFAULT_GENERATION = 12;
const DEFAULT_ROOT_LABEL = "Delta";
// World units per spectre unit edge, chosen to feel similar in scale to the
// scaffold's previous 48-world-unit grid spacing.
export const DEFAULT_TILE_SCALE = 40;

function boxCorners([minX, minY, maxX, maxY]) {
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

function transformedBounds(shape, transform) {
  return boundsOf(boxCorners(shape.bbox).map((p) => applyMatrix(transform, p)));
}

export function createTileField({
  generation = DEFAULT_GENERATION,
  rootLabel = DEFAULT_ROOT_LABEL,
  tileScale = DEFAULT_TILE_SCALE,
} = {}) {
  const root = buildHierarchy(generation)[rootLabel];
  // The substitution assembly doesn't keep the root centered on its own
  // local origin — each generation's placement math can drift the whole
  // supertile arbitrarily far away. Recenter so a camera starting at world
  // (0, 0) actually lands inside the tiling instead of empty space.
  const scaled = scaleUniform(tileScale);
  const [minX, minY, maxX, maxY] = transformedBounds(root, scaled);
  const rootTransform = multiply(translation(-(minX + maxX) / 2, -(minY + maxY) / 2), scaled);
  const cache = new Map();

  /**
   * Recomputes the visible tile set for `viewportBounds` ([minX, minY,
   * maxX, maxY] in world space) expanded by `margin` world units, and
   * returns the cache diffed against the previous call.
   */
  function update(viewportBounds, margin = 0) {
    const searchBounds = expandBounds(viewportBounds, margin);
    const visited = new Set();
    const added = [];

    (function walk(shape, transform, path) {
      const bounds = transformedBounds(shape, transform);
      if (!boundsIntersect(bounds, searchBounds)) return;

      if (shape.kind === "tile") {
        visited.add(path);
        if (!cache.has(path)) {
          cache.set(path, {
            id: path,
            label: shape.label,
            depth: path.split(".").length,
            transform,
            points: SPECTRE_POINTS.map((p) => applyMatrix(transform, p)),
          });
          added.push(path);
        }
        return;
      }

      shape.children.forEach((child, i) => {
        walk(child.shape, multiply(transform, child.transform), path ? `${path}.${i}` : `${i}`);
      });
    })(root, rootTransform, "");

    const removed = [];
    for (const key of cache.keys()) {
      if (!visited.has(key)) removed.push(key);
    }
    for (const key of removed) cache.delete(key);

    return { tiles: [...cache.values()], added, removed };
  }

  return { update };
}
