import { isWallAt } from '../map.js';

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v));
}

// Circle vs tile AABB collision against any overlapping wall tiles.
// Returns true if the circle centered at (x,y) with radius r is NOT intersecting any wall.
export function canMoveTo(map, x, y, r) {
  const minTx = Math.floor(x - r);
  const maxTx = Math.floor(x + r);
  const minTy = Math.floor(y - r);
  const maxTy = Math.floor(y + r);

  const rr = r * r;

  for (let ty = minTy; ty <= maxTy; ty += 1) {
    for (let tx = minTx; tx <= maxTx; tx += 1) {
      // treat out of bounds as solid via isWallAt
      if (!isWallAt(map, tx + 0.5, ty + 0.5)) continue;

      // tile AABB is [tx, tx+1] x [ty, ty+1]
      const cx = clamp(x, tx, tx + 1);
      const cy = clamp(y, ty, ty + 1);
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy < rr) return false;
    }
  }

  return true;
}

// Axis-separated motion with substeps for stability (supports wall sliding).
export function moveWithCollisions(map, body, dx, dy) {
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 0.15));
  const sx = dx / steps;
  const sy = dy / steps;
  for (let i = 0; i < steps; i += 1) {
    const nx = body.x + sx;
    if (canMoveTo(map, nx, body.y, body.r)) body.x = nx;
    const ny = body.y + sy;
    if (canMoveTo(map, body.x, ny, body.r)) body.y = ny;
  }
}
