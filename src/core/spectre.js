// The "spectre" aperiodic monotile substitution system (Smith, Myers, Kaplan
// & Goodman-Strauss, 2023). Unlike the "hat" tile's metatiles, which distort
// slightly at every inflation level, the spectre's nine hexagon-derived
// supertile types combine via a single fixed set of rigid transforms — so
// one substitution rule, applied repeatedly, builds every generation exactly.
//
// Every base tile is one copy of the same 14-vertex polygon; only its
// placement (rotation/reflection + translation) ever changes.

import { applyMatrix, IDENTITY, multiply, rotation, translation, translationBetween } from "./matrix.js";
import { boundsOf } from "./geometry.js";

const SQRT3 = Math.sqrt(3);

/** The spectre tile outline, unit edge length, in its own local frame. */
export const SPECTRE_POINTS = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1.5, y: -SQRT3 / 2 },
  { x: 1.5 + SQRT3 / 2, y: 0.5 - SQRT3 / 2 },
  { x: 1.5 + SQRT3 / 2, y: 1.5 - SQRT3 / 2 },
  { x: 2.5 + SQRT3 / 2, y: 1.5 - SQRT3 / 2 },
  { x: 3 + SQRT3 / 2, y: 1.5 },
  { x: 3, y: 2 },
  { x: 3 - SQRT3 / 2, y: 1.5 },
  { x: 2.5 - SQRT3 / 2, y: 1.5 + SQRT3 / 2 },
  { x: 1.5 - SQRT3 / 2, y: 1.5 + SQRT3 / 2 },
  { x: 0.5 - SQRT3 / 2, y: 1.5 + SQRT3 / 2 },
  { x: -SQRT3 / 2, y: 1.5 },
  { x: 0, y: 1 },
];

// The four points every tile/supertile exposes for assembly into the next
// generation's supertiles.
const QUAD_INDICES = [3, 5, 7, 11];
const BASE_QUAD = QUAD_INDICES.map((i) => SPECTRE_POINTS[i]);

// The quad is only 4 alignment points, not a hull of the tile's silhouette —
// it under/overshoots the real outline, and that error compounds every
// generation. Every node instead carries an axis-aligned `bbox` in its own
// local frame, built bottom-up from real tile geometry, for safe viewport
// culling (see tileField.js).
const BASE_TILE_BBOX = boundsOf(SPECTRE_POINTS);

function boxCorners([minX, minY, maxX, maxY]) {
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
}

function unionBounds(a, b) {
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])];
}

function boundsOfChildren(children) {
  return children.reduce((acc, { shape, transform }) => {
    const box = boundsOf(boxCorners(shape.bbox).map((p) => applyMatrix(transform, p)));
    return acc ? unionBounds(acc, box) : box;
  }, null);
}

export const TILE_TYPES = [
  "Gamma",
  "Delta",
  "Theta",
  "Lambda",
  "Xi",
  "Pi",
  "Sigma",
  "Phi",
  "Psi",
];

// For each supertile label, the eight (or seven, for Gamma) child types it
// is built from. `null` marks the one slot Gamma has no child in.
export const SUPER_RULES = {
  Gamma: ["Pi", "Delta", null, "Theta", "Sigma", "Xi", "Phi", "Gamma"],
  Delta: ["Xi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
  Theta: ["Psi", "Delta", "Pi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
  Lambda: ["Psi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
  Xi: ["Psi", "Delta", "Pi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
  Pi: ["Psi", "Delta", "Xi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
  Sigma: ["Xi", "Delta", "Xi", "Phi", "Sigma", "Pi", "Lambda", "Gamma"],
  Phi: ["Psi", "Delta", "Psi", "Phi", "Sigma", "Pi", "Phi", "Gamma"],
  Psi: ["Psi", "Delta", "Psi", "Phi", "Sigma", "Psi", "Phi", "Gamma"],
};

// [rotation delta in degrees, quad index to align from, quad index to align to],
// applied cumulatively to build the 8 placement transforms shared by every
// supertile label at a given generation.
const TRANSFORM_RULES = [
  [60, 3, 1],
  [0, 2, 0],
  [60, 3, 1],
  [60, 3, 1],
  [0, 2, 0],
  [60, 3, 1],
  [-120, 3, 3],
];

// The whole system is mirrored once per generation; the nine base tiles
// themselves are never reflected (the spectre, unlike the hat, needs no
// mirrored copies of its one shape).
const REFLECT_X = [-1, 0, 0, 0, 1, 0];

function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Generation-0 system: every label maps to a bare tile, except Gamma, which
 * is the "mystic" pair of two spectres glued along one edge.
 */
export function buildBaseSystem() {
  const system = {};
  for (const label of TILE_TYPES) {
    if (label === "Gamma") continue;
    system[label] = { kind: "tile", label, quad: BASE_QUAD, bbox: BASE_TILE_BBOX };
  }
  const children = [
    { shape: { kind: "tile", label: "Gamma1", quad: BASE_QUAD, bbox: BASE_TILE_BBOX }, transform: IDENTITY },
    {
      shape: { kind: "tile", label: "Gamma2", quad: BASE_QUAD, bbox: BASE_TILE_BBOX },
      transform: multiply(translation(SPECTRE_POINTS[8].x, SPECTRE_POINTS[8].y), rotation(Math.PI / 6)),
    },
  ];
  system.Gamma = {
    kind: "composite",
    label: "Gamma",
    quad: BASE_QUAD,
    bbox: boundsOfChildren(children),
    children,
  };
  return system;
}

/** Builds the placement transforms shared by every supertile in one generation. */
function buildPlacementTransforms(quad) {
  const transforms = [IDENTITY];
  let totalAngleDeg = 0;
  let rotationMatrix = IDENTITY;
  let rotatedQuad = quad;

  for (const [angleDeg, fromIndex, toIndex] of TRANSFORM_RULES) {
    if (angleDeg !== 0) {
      totalAngleDeg += angleDeg;
      rotationMatrix = rotation(degToRad(totalAngleDeg));
      rotatedQuad = quad.map((p) => applyMatrix(rotationMatrix, p));
    }
    const alignTo = applyMatrix(transforms[transforms.length - 1], quad[fromIndex]);
    const align = translationBetween(rotatedQuad[toIndex], alignTo);
    transforms.push(multiply(align, rotationMatrix));
  }

  return transforms.map((t) => multiply(REFLECT_X, t));
}

/** Builds the next generation's nine supertiles from the current system. */
export function buildNextGeneration(system) {
  const quad = system.Delta.quad;
  const transforms = buildPlacementTransforms(quad);

  const superQuad = [
    applyMatrix(transforms[6], quad[2]),
    applyMatrix(transforms[5], quad[1]),
    applyMatrix(transforms[3], quad[2]),
    applyMatrix(transforms[0], quad[1]),
  ];

  const next = {};
  for (const label of TILE_TYPES) {
    const substitutions = SUPER_RULES[label];
    const children = substitutions
      .map((childLabel, i) => (childLabel ? { shape: system[childLabel], transform: transforms[i] } : null))
      .filter(Boolean);
    next[label] = { kind: "composite", label, quad: superQuad, bbox: boundsOfChildren(children), children };
  }
  return next;
}

/** Builds the system at the given generation depth (0 = bare base tiles). */
export function buildHierarchy(generation) {
  let system = buildBaseSystem();
  for (let g = 0; g < generation; g++) {
    system = buildNextGeneration(system);
  }
  return system;
}
