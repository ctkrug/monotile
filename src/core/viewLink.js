// Encodes/decodes the current camera + coloring scheme to and from a URL
// hash, so a specific view can be copied and shared (story 3.9). Pure and
// DOM-free — main.js is the only thing that touches `location.hash`.

const VALID_SCHEMES = new Set(["", "supertile", "generation", "orientation"]);

/** Builds a `#x=..&y=..&z=..[&scheme=..]` hash string for the given view. */
export function encodeViewHash(camera, scheme) {
  const params = new URLSearchParams({
    x: camera.offset.x.toFixed(2),
    y: camera.offset.y.toFixed(2),
    z: camera.zoom.toFixed(3),
  });
  if (scheme) params.set("scheme", scheme);
  return `#${params.toString()}`;
}

/**
 * Parses a URL hash (with or without its leading "#") into `{ camera,
 * scheme }`, or `null` if it's empty, malformed, or names an unknown scheme.
 */
export function decodeViewHash(hash) {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw) return null;

  const params = new URLSearchParams(raw);
  const x = Number(params.get("x"));
  const y = Number(params.get("y"));
  const zoom = Number(params.get("z"));
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(zoom) || zoom <= 0) {
    return null;
  }

  const scheme = params.get("scheme") ?? "";
  if (!VALID_SCHEMES.has(scheme)) return null;

  return { camera: { offset: { x, y }, zoom }, scheme };
}
