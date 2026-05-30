export function isIntersectingAABB(a, b) {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

export function resolvePlayerMovement({ from, to, solids, bounds }) {
  // Axis-separated sweep against solid rectangles; deterministic and stable.
  let xRect = { ...from, x: to.x };
  xRect = clampToBounds(xRect, bounds);

  for (const s of solids) {
    if (!isIntersectingAABB(xRect, s)) continue;
    if (to.x > from.x) xRect.x = s.x - xRect.w;
    else if (to.x < from.x) xRect.x = s.x + s.w;
  }

  let yRect = { ...xRect, y: to.y };
  yRect = clampToBounds(yRect, bounds);

  for (const s of solids) {
    if (!isIntersectingAABB(yRect, s)) continue;
    if (to.y > from.y) yRect.y = s.y - yRect.h;
    else if (to.y < from.y) yRect.y = s.y + s.h;
  }

  return yRect;
}

function clampToBounds(r, b) {
  return {
    ...r,
    x: clamp(r.x, b.x, b.x + b.w - r.w),
    y: clamp(r.y, b.y, b.y + b.h - r.h)
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}
