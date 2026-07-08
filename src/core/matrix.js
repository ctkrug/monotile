// Affine 2D transforms as [a, b, tx, c, d, ty], mapping a point (x, y) to
// (a*x + b*y + tx, c*x + d*y + ty). Used to place spectre tiles and the
// supertiles that combine them without any floating-point rescaling of the
// underlying shapes — every transform here is a rotation/reflection plus a
// translation, matching the substitution system's own placement rules.

export const IDENTITY = [1, 0, 0, 0, 1, 0];

/** Compose two transforms: applies `b` first, then `a`. */
export function multiply(a, b) {
  return [
    a[0] * b[0] + a[1] * b[3],
    a[0] * b[1] + a[1] * b[4],
    a[0] * b[2] + a[1] * b[5] + a[2],

    a[3] * b[0] + a[4] * b[3],
    a[3] * b[1] + a[4] * b[4],
    a[3] * b[2] + a[4] * b[5] + a[5],
  ];
}

export function rotation(radians) {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return [cos, -sin, 0, sin, cos, 0];
}

export function translation(tx, ty) {
  return [1, 0, tx, 0, 1, ty];
}

export function scaleUniform(factor) {
  return [factor, 0, 0, 0, factor, 0];
}

/** The translation that carries point `from` onto point `to`. */
export function translationBetween(from, to) {
  return translation(to.x - from.x, to.y - from.y);
}

export function applyMatrix(m, point) {
  return {
    x: m[0] * point.x + m[1] * point.y + m[2],
    y: m[3] * point.x + m[4] * point.y + m[5],
  };
}
