// Maps a rendered tile to a color under one of three schemes, turning the
// substitution's own structure (which supertile it descends from, how deep
// it was generated, how it's rotated) into something visibly different to
// look at. `null`/unknown scheme means "no override" — callers fall back to
// the flat palette line-art color.

// The golden angle spreads a small set of categorical hues around the wheel
// with no two adjacent values landing close together, regardless of how
// many categories exist.
const GOLDEN_ANGLE = 137.508;

const SUPERTILE_LABELS = [
  "Gamma",
  "Gamma1",
  "Gamma2",
  "Delta",
  "Theta",
  "Lambda",
  "Xi",
  "Pi",
  "Sigma",
  "Phi",
  "Psi",
];

export const COLOR_SCHEMES = ["supertile", "generation", "orientation"];

function hsl(hue, saturation, lightness) {
  return `hsl(${((hue % 360) + 360) % 360}, ${saturation}%, ${lightness}%)`;
}

function supertileColor(tile) {
  const index = SUPERTILE_LABELS.indexOf(tile.label);
  const hue = (Math.max(index, 0) * GOLDEN_ANGLE) % 360;
  return hsl(hue, 65, 62);
}

function generationColor(tile) {
  // Depth grows without bound, so wrap it into a repeating ramp rather than
  // letting deep tiles all collapse into one saturated extreme.
  const hue = (tile.depth * 24) % 360;
  return hsl(hue, 70, 55);
}

function orientationAngleDegrees(transform) {
  const [a, , , c] = transform;
  const radians = Math.atan2(c, a);
  return (radians * 180) / Math.PI;
}

function orientationColor(tile) {
  const angle = orientationAngleDegrees(tile.transform);
  const bucket = Math.round(angle / 15) * 15;
  return hsl(bucket, 60, 58);
}

/** Returns a CSS color string for `tile` under `scheme`, or null for no override. */
export function colorForTile(tile, scheme) {
  switch (scheme) {
    case "supertile":
      return supertileColor(tile);
    case "generation":
      return generationColor(tile);
    case "orientation":
      return orientationColor(tile);
    default:
      return null;
  }
}

/** Applies `alpha` to any color string this module or palette.js produces. */
export function withAlpha(color, alpha) {
  if (color.startsWith("#")) {
    const hex = Math.round(alpha * 255)
      .toString(16)
      .padStart(2, "0");
    return `${color}${hex}`;
  }
  return color.replace("hsl(", "hsla(").replace(")", `, ${alpha})`);
}
