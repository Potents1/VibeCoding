export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function sign(n) {
  if (n < 0) return -1;
  if (n > 0) return 1;
  return 0;
}

export function approxEqual(a, b, eps = 1e-9) {
  return Math.abs(a - b) <= eps;
}

export function vecAdd(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function vecScale(v, s) {
  return { x: v.x * s, y: v.y * s };
}

