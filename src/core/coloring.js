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

function hexToRgb(hex) {
  const digits = hex.slice(1);
  const full = digits.length === 3
    ? digits.split("").map((c) => c + c).join("")
    : digits;
  const value = parseInt(full.slice(0, 6), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function hslToRgb(h, s, l) {
  const sat = s / 100;
  const light = l / 100;
  const k = (n) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255) };
}

/** Parses any color string this module or palette.js produces into {r, g, b}. */
function parseColor(color) {
  if (color.startsWith("#")) return hexToRgb(color);
  const hsl = color.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/);
  if (hsl) return hslToRgb(Number(hsl[1]), Number(hsl[2]), Number(hsl[3]));
  const rgb = color.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  if (rgb) return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
  return { r: 0, g: 0, b: 0 };
}

/**
 * Linearly interpolates between two colors (hex, hsl()/hsla(), or
 * rgb()/rgba() strings, in any combination) and returns an `rgb()` string.
 * `t` is clamped to [0, 1].
 */
export function lerpColor(colorA, colorB, t) {
  const clamped = Math.max(0, Math.min(1, t));
  const a = parseColor(colorA);
  const b = parseColor(colorB);
  const r = Math.round(a.r + (b.r - a.r) * clamped);
  const g = Math.round(a.g + (b.g - a.g) * clamped);
  const bl = Math.round(a.b + (b.b - a.b) * clamped);
  return `rgb(${r}, ${g}, ${bl})`;
}
