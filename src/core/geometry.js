// Small 2D vector/point-transform helpers shared by the camera and the
// (upcoming) substitution renderer. Points are plain {x, y} objects.

export function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function scale(point, factor) {
  return { x: point.x * factor, y: point.y * factor };
}

export function length(point) {
  return Math.hypot(point.x, point.y);
}

export function rotate(point, radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return {
    x: point.x * cos - point.y * sin,
    y: point.x * sin + point.y * cos,
  };
}

export function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Axis-aligned bounding box of a polygon, as [minX, minY, maxX, maxY]. */
export function boundsOf(points) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return [minX, minY, maxX, maxY];
}

/** Grows a [minX, minY, maxX, maxY] box by `margin` on every side. */
export function expandBounds([minX, minY, maxX, maxY], margin) {
  return [minX - margin, minY - margin, maxX + margin, maxY + margin];
}

/** Whether two [minX, minY, maxX, maxY] boxes overlap (touching counts). */
export function boundsIntersect(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}
